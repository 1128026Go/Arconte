<?php

namespace App\Jobs;

use App\Models\CaseAct;
use App\Models\CaseActDocument;
use App\Models\CaseModel;
use App\Models\CaseParty;
use App\Services\DocumentStore;
use App\Services\IngestClient;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class FetchCaseData implements ShouldQueue
{
    use Queueable;

    public int $tries = 1;  // Solo 1 intento: el IngestClient ya hace reintentos
    public int $timeout = 120;

    /**
     * Create a new job instance.
     */
    public function __construct(
        public int $caseId
    ) {
        //
    }

    /**
     * Execute the job.
     */
    public function handle(IngestClient $ingest, \App\Services\CaseUpdateService $updateService): void
    {
        try {
            // Buscar el caso por ID
            $case = CaseModel::find($this->caseId);

            if (!$case) {
                Log::error("Case not found with ID: {$this->caseId}");
                throw new \RuntimeException("Case not found");
            }

            Log::info("Fetching case data for radicado: {$case->radicado}");

            $payload = $ingest->normalized($case->radicado);

            if (empty($payload)) {
                throw new \RuntimeException('No se encontró información del caso');
            }

            // Usar servicio consolidado para actualizar el caso
            $case = $updateService->updateFromPayload($case, $payload);

            // TODO: Mantener lógica de documentos si es necesario
            // Por ahora, el servicio maneja case, parties y acts

            // Procesar documentos de actuaciones si existen
            foreach ((array) ($payload['acts'] ?? []) as $act) {
                $uniq = $act['uniq_key'] ?? $act['hash'] ?? md5(json_encode($act));
                $actModel = CaseAct::where('case_model_id', $case->id)
                    ->where('uniq_key', $uniq)
                    ->first();

                if ($actModel) {
                    // Guardar documentos si existen
                    $docs = $act['documentos'] ?? [];
                    foreach ($docs as $doc) {
                        try {
                            $meta = [
                                'filename' => $doc['filename'] ?? null,
                                'mimetype' => $doc['mimetype'] ?? null,
                                'source_url' => $doc['url'] ?? $doc['source_url'] ?? null,
                                'sha256' => $doc['sha256'] ?? null,
                                'text_content' => $doc['text_excerpt'] ?? null,
                            ];

                            // Si no hay hash y hay URL, descargar y calcular
                            if (!$meta['sha256'] && $meta['source_url']) {
                                $saved = DocumentStore::storeFromUrl($meta['source_url']);
                                $meta = array_merge($meta, $saved);
                            }

                            // Solo crear si tenemos hash (evita duplicados)
                            if ($meta['sha256']) {
                                CaseActDocument::firstOrCreate(
                                    ['sha256' => $meta['sha256']],
                                    array_merge($meta, [
                                        'case_act_id' => $actModel->id,
                                        'disk' => 'documents',
                                        'is_primary' => true,
                                    ])
                                );
                            }
                        } catch (\Exception $e) {
                            Log::warning("Failed to store document for act {$actModel->id}: " . $e->getMessage());
                        }
                    }
                }
            }

            // Limpiar caché del usuario (ya se hace en el servicio, pero por si acaso)
            Cache::forget("cases.user.{$case->user_id}");

            Log::info("Successfully fetched case data for radicado: {$case->radicado}");
        } catch (\Exception $e) {
            $case = CaseModel::find($this->caseId);
            $radicado = $case ? $case->radicado : 'unknown';

            $errorMsg = $e->getMessage();
            $isIngestDown = str_contains($errorMsg, 'INGEST_DOWN') ||
                            str_contains($errorMsg, 'servicio de ingest') ||
                            str_contains($errorMsg, 'Rama Judicial no está disponible');

            if ($isIngestDown) {
                // Servicio externo caído: marcar y reprogramar
                Log::warning("Ingest service down for radicado: {$radicado}. Rescheduling for 30 minutes.");

                if ($case) {
                    $case->update([
                        'estado_actual' => 'En espera: Rama Judicial fuera de servicio',
                        'estado_checked' => false,  // Permitir que se reintente
                        'has_unread' => false,      // No mostrar como "sin leer"
                        'last_checked_at' => now(),
                    ]);
                }

                // Reprogramar para 30 minutos después
                self::dispatch($this->caseId)->delay(now()->addMinutes(30));

                // NO lanzar excepción: no queremos failed jobs
                return;
            }

            // Otros errores (404, validación, etc)
            Log::error("Failed to fetch case data for radicado: {$radicado}", [
                'error' => $errorMsg,
                'trace' => $e->getTraceAsString(),
            ]);

            if ($case) {
                $case->update([
                    'estado_actual' => 'Error: ' . substr($errorMsg, 0, 200),
                    'estado_checked' => true,
                    'last_checked_at' => now(),
                ]);
            }

            // Re-lanzar excepción solo si NO es INGEST_DOWN
            throw $e;
        }
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        $case = CaseModel::find($this->caseId);

        if (!$case) {
            Log::error("Job failed permanently but case not found: {$this->caseId}");
            return;
        }

        Log::error("Job failed permanently for radicado: {$case->radicado}", [
            'error' => $exception->getMessage(),
        ]);

        $case->update([
            'estado_actual' => 'No se pudo obtener información del caso',
            'estado_checked' => true,
        ]);

        Cache::forget("cases.user.{$case->user_id}");
    }
}
