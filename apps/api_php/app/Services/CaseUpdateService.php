<?php

namespace App\Services;

use App\Models\CaseModel;
use App\Models\CaseParty;
use App\Models\CaseAct;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

/**
 * Servicio para actualizar casos con datos del servicio de ingest.
 *
 * Consolida la lógica de actualización que estaba duplicada en:
 * - CaseController::refresh()
 * - FetchCaseData::handle()
 */
class CaseUpdateService
{
    private function normalizeDate($value)
    {
        if (empty($value)) return null;
        if ($value instanceof \DateTimeInterface) return $value;
        if (is_string($value) && preg_match('/^\d{2}\/\d{2}\/\d{4}$/', $value)) {
            [$d, $m, $y] = explode('/', $value);
            return sprintf('%04d-%02d-%02d', (int)$y, (int)$m, (int)$d);
        }
        if (is_string($value) && preg_match('/^\d{4}\/\d{2}\/\d{2}$/', $value)) {
            return str_replace('/', '-', $value);
        }
        return $value;
    }
    /**
     * Actualiza un caso con los datos normalizados del payload.
     *
     * @param CaseModel $case El caso a actualizar
     * @param array $payload Datos normalizados del servicio de ingest
     * @return CaseModel El caso actualizado
     */
    public function updateFromPayload(CaseModel $case, array $payload): CaseModel
    {
        Log::info('case_update_service.start', [
            'case_id' => $case->id,
            'radicado' => $case->radicado,
            'has_parties' => isset($payload['parties']),
            'has_acts' => isset($payload['acts']),
        ]);

        DB::transaction(function () use ($case, $payload) {
            // 1. Actualizar partes del proceso
            $this->updateParties($case, $payload['parties'] ?? []);

            // 2. Actualizar actuaciones
            $this->updateActs($case, $payload['acts'] ?? []);

            // 3. Actualizar información del caso
            $this->updateCaseInfo($case, $payload['case'] ?? []);

            // 4. Marcar como verificado y sin novedades pendientes
            $case->estado_checked = true;
            $case->last_checked_at = now();

            $case->save();
        });

        // Invalidar caché
        Cache::forget("case.detail.{$case->id}");
        Cache::forget("cases.user.{$case->user_id}");

        Log::info('case_update_service.completed', [
            'case_id' => $case->id,
            'radicado' => $case->radicado,
            'parties_count' => $case->parties()->count(),
            'acts_count' => $case->acts()->count(),
        ]);

        return $case->fresh(['parties', 'acts']);
    }

    /**
     * Actualiza las partes del proceso.
     *
     * @param CaseModel $case
     * @param array $parties
     */
    protected function updateParties(CaseModel $case, array $parties): void
    {
        // Eliminar partes existentes (estrategia: full replace)
        $case->parties()->delete();

        // Crear nuevas partes
        foreach ($parties as $party) {
            CaseParty::create([
                'case_model_id' => $case->id,
                'rol' => $party['role'] ?? $party['rol'] ?? null,
                'nombre' => $party['name'] ?? $party['nombre'] ?? null,
                'documento' => $party['documento'] ?? null,
            ]);
        }

        Log::debug('case_update_service.parties_updated', [
            'case_id' => $case->id,
            'count' => count($parties),
        ]);
    }

    /**
     * Actualiza las actuaciones del caso.
     *
     * @param CaseModel $case
     * @param array $acts
     */
    protected function updateActs(CaseModel $case, array $acts): void
    {
        foreach ($acts as $act) {
            // Generar clave única para evitar duplicados
            $uniq = $act['uniq_key'] ?? $act['hash'] ?? md5(json_encode($act));

            // Preparar datos de clasificación de AUTOS
            $clasificacion = null;
            $confianza = null;

            if (isset($act['is_auto']) && $act['is_auto']) {
                $clasificacion = $act['auto_type'] ?? 'pendiente';
                $confianza = $act['classification_confidence'] ?? 0.0;
            }

            // Actualizar o crear actuación
            CaseAct::updateOrCreate(
                ['case_model_id' => $case->id, 'uniq_key' => $uniq],
                [
                    'fecha' => $this->normalizeDate($act['date'] ?? $act['fecha'] ?? null),
                    'tipo' => $act['type'] ?? $act['tipo'] ?? null,
                    'descripcion' => $act['title'] ?? $act['descripcion'] ?? $act['description'] ?? null,
                    'documento_url' => $act['documento_url'] ?? null,
                    'origen' => $act['origen'] ?? null,
                    'clasificacion' => $clasificacion,
                    'confianza_clasificacion' => $confianza,
                    'clasificado_at' => $clasificacion ? now() : null,
                    'notificado' => false,
                    // Campos adicionales de Rama Judicial (plazos)
                    'id_reg_actuacion' => $act['id_reg_actuacion'] ?? null,
                    'cons_actuacion' => $act['cons_actuacion'] ?? null,
                    'fecha_inicial' => $this->normalizeDate($act['fecha_inicial'] ?? null),
                    'fecha_final' => $this->normalizeDate($act['fecha_final'] ?? null),
                    'fecha_registro' => $this->normalizeDate($act['fecha_registro'] ?? null),
                    'cod_regla' => $act['cod_regla'] ?? null,
                ]
            );
        }

        Log::debug('case_update_service.acts_updated', [
            'case_id' => $case->id,
            'count' => count($acts),
        ]);
    }

    /**
     * Actualiza la información general del caso.
     *
     * @param CaseModel $case
     * @param array $caseData
     */
    protected function updateCaseInfo(CaseModel $case, array $caseData): void
    {
        // Actualizar campos del caso
        $case->estado_actual = $caseData['status'] ?? $caseData['estado_actual'] ?? $case->estado_actual ?? 'No verificado';
        $case->tipo_proceso = $caseData['tipo_proceso'] ?? $case->tipo_proceso;
        $case->despacho = $caseData['court'] ?? $caseData['despacho'] ?? $caseData['juzgado'] ?? $case->despacho;
        $case->juzgado = $caseData['juzgado'] ?? $caseData['court'] ?? $case->juzgado;
        $case->jurisdiccion = $caseData['city'] ?? $caseData['jurisdiccion'] ?? $case->jurisdiccion;

        // Campos adicionales de Rama Judicial
        $case->id_proceso_rama = $caseData['id_proceso'] ?? $case->id_proceso_rama;
        $case->fecha_radicacion = $this->normalizeDate($caseData['fecha_radicacion'] ?? $case->fecha_radicacion);
        $case->fecha_ultima_actuacion = $this->normalizeDate($caseData['fecha_ultima_actuacion'] ?? $case->fecha_ultima_actuacion);
        $case->ponente = $caseData['ponente'] ?? $case->ponente;
        $case->clase_proceso = $caseData['clase_proceso'] ?? $case->clase_proceso;
        $case->subclase_proceso = $caseData['subclase_proceso'] ?? $case->subclase_proceso;
        $case->ubicacion_expediente = $caseData['ubicacion_expediente'] ?? $case->ubicacion_expediente;
        $case->recurso = $caseData['recurso'] ?? $case->recurso;
        $case->contenido_radicacion = $caseData['contenido_radicacion'] ?? $case->contenido_radicacion;

        Log::debug('case_update_service.case_info_updated', [
            'case_id' => $case->id,
            'estado_actual' => $case->estado_actual,
            'tipo_proceso' => $case->tipo_proceso,
        ]);
    }
}
