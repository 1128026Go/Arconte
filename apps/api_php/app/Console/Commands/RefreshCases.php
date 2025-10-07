<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\CaseModel;
use App\Services\IngestClient;
use Illuminate\Support\Facades\Mail;
use App\Mail\CaseUpdatesMail;

class RefreshCases extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'cases:refresh {--notify}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Refresca todos los casos del sistema y opcionalmente notifica por correo';

    /**
     * Execute the console command.
     */
    public function handle(IngestClient $ingest)
    {
        $this->info("Iniciando refresh de casos...");
        $updates = [];
        $cases = CaseModel::query()->get();
        foreach ($cases as $case) {
            $this->line("-> {$case->radicado}");
            $data = $ingest->normalized($case->radicado);
            // Persistencia mínima: marca verificación y guarda campos si existen
            $case->last_checked_at = now();
            if (!isset($data["error"])) {
                if (isset($data["case"]["status"])) {
                    $case->estado_actual = $data["case"]["status"];
                }
                $case->save();
                $updates[] = [
                    "radicado" => $case->radicado,
                    "mensaje"  => $data["case"]["status"] ?? "Verificado",
                    "fecha"    => now()->toDateTimeString(),
                ];
            } else {
                $this->warn("   fallo ingest: ".$data["error"]);
                $case->save();
            }
        }

        if ($this->option("notify") && count($updates)) {
            // NOTA: define destinatarios; por simplicidad, envía al primer usuario
            $user = \App\Models\User::query()->first();
            if ($user && $user->email) {
                Mail::to($user->email)->send(new CaseUpdatesMail($updates));
                $this->info("Notificación enviada a {$user->email}");
            } else {
                $this->warn("No hay usuario con email para notificar.");
            }
        }

        $this->info("Refresh completado. Casos: ".count($cases));
        return Command::SUCCESS;
    }
}
