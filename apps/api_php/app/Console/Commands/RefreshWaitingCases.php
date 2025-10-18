<?php

namespace App\Console\Commands;

use App\Jobs\FetchCaseData;
use App\Models\CaseModel;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class RefreshWaitingCases extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'cases:refresh-waiting';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Reintentar consulta de casos en espera por falla de Rama Judicial';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('🔄 Buscando casos en espera...');

        // Buscar casos en espera (aquellos con estado_actual que empieza con "En espera")
        $waitingCases = CaseModel::where('estado_actual', 'like', 'En espera%')->get();

        if ($waitingCases->isEmpty()) {
            $this->info('✓ No hay casos en espera.');
            return Command::SUCCESS;
        }

        $this->info("📋 Encontrados {$waitingCases->count()} casos en espera");

        $dispatched = 0;
        foreach ($waitingCases as $case) {
            try {
                // Dispatch job para reintentar
                FetchCaseData::dispatch($case->id);
                $dispatched++;

                $this->line("  → Caso {$case->radicado} (ID: {$case->id}) agregado a la cola");

                Log::info('refresh_waiting_cases.dispatched', [
                    'case_id' => $case->id,
                    'radicado' => $case->radicado,
                ]);
            } catch (\Exception $e) {
                $this->error("  ✗ Error al procesar caso {$case->id}: {$e->getMessage()}");

                Log::error('refresh_waiting_cases.error', [
                    'case_id' => $case->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        $this->info("✓ {$dispatched} jobs agregados a la cola para reintento");

        return Command::SUCCESS;
    }
}
