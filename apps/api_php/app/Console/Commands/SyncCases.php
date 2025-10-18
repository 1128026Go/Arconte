<?php

namespace App\Console\Commands;

use App\Models\CaseModel;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class SyncCases extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'sync:cases {--user_id= : Sync cases for specific user only}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Sincroniza todos los casos con la Rama Judicial y notifica sobre cambios';

    private $stats = [
        'total' => 0,
        'updated' => 0,
        'failed' => 0,
        'unchanged' => 0,
    ];

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('🚀 Iniciando sincronización de casos...');
        $this->newLine();

        $query = CaseModel::query()->with('user');

        // Filter by user if specified
        if ($userId = $this->option('user_id')) {
            $query->where('user_id', $userId);
        }

        $cases = $query->get();
        $this->stats['total'] = $cases->count();

        if ($this->stats['total'] === 0) {
            $this->warn('No hay casos para sincronizar.');
            return 0;
        }

        $this->info("📊 Total de casos a sincronizar: {$this->stats['total']}");
        $this->newLine();

        $progressBar = $this->output->createProgressBar($this->stats['total']);
        $progressBar->start();

        foreach ($cases as $case) {
            $this->syncCase($case);
            $progressBar->advance();

            // Delay between requests to avoid overwhelming the server
            sleep(2);
        }

        $progressBar->finish();
        $this->newLine(2);

        // Show results
        $this->showResults();

        return 0;
    }

    private function syncCase(CaseModel $case)
    {
        try {
            // Call FastAPI to get fresh data
            $response = Http::timeout(30)
                ->withHeaders([
                    'X-API-Key' => config('services.ingest_api.key'),
                ])
                ->get(config('services.ingest_api.url') . "/normalized/{$case->radicado}");

            if (!$response->successful()) {
                Log::warning("Failed to sync case {$case->radicado}: HTTP {$response->status()}");
                $this->stats['failed']++;
                return;
            }

            $data = $response->json();

            // Check if there are changes by comparing hash
            $newHash = md5(json_encode($data));
            $oldHash = $case->ultimo_hash;

            if ($newHash === $oldHash) {
                // No changes detected
                $case->update([
                    'last_checked_at' => now(),
                ]);
                $this->stats['unchanged']++;
                return;
            }

            // Update case with new data
            $case->update([
                'juzgado' => $data['juzgado'] ?? $case->juzgado,
                'tipo_proceso' => $data['tipo_proceso'] ?? $case->tipo_proceso,
                'despacho' => $data['despacho'] ?? $case->despacho,
                'estado_actual' => $data['estado_actual'] ?? $case->estado_actual,
                'ultimo_hash' => $newHash,
                'last_checked_at' => now(),
                'has_unread' => true,  // Mark as unread for user
            ]);

            // Update acts if provided
            if (isset($data['acts']) && is_array($data['acts'])) {
                // Delete old acts
                $case->acts()->delete();

                // Insert new acts
                foreach ($data['acts'] as $act) {
                    $case->acts()->create([
                        'type' => $act['type'] ?? null,
                        'title' => $act['title'] ?? null,
                        'descripcion' => $act['descripcion'] ?? null,
                        'date' => $act['date'] ?? null,
                        'fecha' => $act['fecha'] ?? $act['date'] ?? null,
                        'anotacion' => $act['anotacion'] ?? null,
                        'archivo' => $act['archivo'] ?? null,
                    ]);
                }
            }

            // Update parties if provided
            if (isset($data['parties']) && is_array($data['parties'])) {
                // Delete old parties
                $case->parties()->delete();

                // Insert new parties
                foreach ($data['parties'] as $party) {
                    $case->parties()->create([
                        'name' => $party['name'] ?? null,
                        'role' => $party['role'] ?? null,
                        'documento' => $party['documento'] ?? null,
                    ]);
                }
            }

            $this->stats['updated']++;

            // Send email notification to user
            $this->sendNotificationEmail($case);

        } catch (\Exception $e) {
            Log::error("Error syncing case {$case->radicado}: " . $e->getMessage());
            $this->stats['failed']++;
        }
    }

    private function sendNotificationEmail(CaseModel $case)
    {
        try {
            $user = $case->user;

            if (!$user || !$user->email) {
                return;
            }

            // Check if user wants email notifications
            $notificationSettings = $user->notification_settings ?? [];
            if (isset($notificationSettings['email']) && !$notificationSettings['email']) {
                return;
            }

            // Send email (simplified - you can create a proper Mailable class)
            Mail::raw(
                "Se ha detectado una actualización en el caso {$case->radicado}.\n\n" .
                "Estado actual: {$case->estado_actual}\n" .
                "Despacho: {$case->despacho}\n\n" .
                "Ingresa a Arconte para ver los detalles completos:\n" .
                config('app.url') . "/cases/{$case->id}",
                function ($message) use ($user, $case) {
                    $message->to($user->email)
                        ->subject("📬 Actualización en caso {$case->radicado}");
                }
            );

        } catch (\Exception $e) {
            Log::error("Failed to send notification email for case {$case->radicado}: " . $e->getMessage());
        }
    }

    private function showResults()
    {
        $this->table(
            ['Métrica', 'Cantidad'],
            [
                ['Total de casos', $this->stats['total']],
                ['✅ Actualizados', $this->stats['updated']],
                ['🔄 Sin cambios', $this->stats['unchanged']],
                ['❌ Fallidos', $this->stats['failed']],
            ]
        );

        if ($this->stats['updated'] > 0) {
            $this->info("✨ Se sincronizaron exitosamente {$this->stats['updated']} casos con actualizaciones.");
        }

        if ($this->stats['failed'] > 0) {
            $this->warn("⚠️  Hubo {$this->stats['failed']} casos que fallaron. Revisa los logs para más detalles.");
        }
    }
}
