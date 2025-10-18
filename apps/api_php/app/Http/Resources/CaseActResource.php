<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CaseActResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,

            // ============================================
            // CAMPOS OFICIALES DE LA RAMA JUDICIAL
            // (orden y nombres exactos según su portal)
            // ============================================

            // 1. Fecha de actuación
            'fecha_actuacion' => $this->fecha?->toDateString(),
            'fecha_actuacion_fmt' => $this->fecha?->translatedFormat('d M Y'),

            // 2. Actuación
            'actuacion' => $this->tipo,

            // 3. Anotación
            'anotacion' => $this->anotacion,

            // 4. Fecha de registro de inicio
            'fecha_registro_inicio' => $this->fecha_inicial?->toDateString(),
            'fecha_registro_inicio_fmt' => $this->fecha_inicial?->translatedFormat('d M Y'),

            // 5. Fecha de registro de término
            'fecha_registro_termino' => $this->fecha_final?->toDateString(),
            'fecha_registro_termino_fmt' => $this->fecha_final?->translatedFormat('d M Y'),

            // ============================================
            // CAMPOS ADICIONALES PARA COMPATIBILIDAD
            // ============================================
            'fecha' => $this->fecha?->toDateString(),
            'fecha_fmt' => $this->fecha?->translatedFormat('d M Y'),
            'fecha_inicial' => $this->fecha_inicial?->toDateString(),
            'fecha_inicial_fmt' => $this->fecha_inicial?->translatedFormat('d M Y'),
            'fecha_final' => $this->fecha_final?->toDateString(),
            'fecha_final_fmt' => $this->fecha_final?->translatedFormat('d M Y'),
            'fecha_registro' => $this->fecha_registro?->toDateString(),
            'fecha_registro_fmt' => $this->fecha_registro?->translatedFormat('d M Y'),

            // Datos básicos (aliases)
            'tipo' => $this->tipo,
            'titulo' => $this->anotacion ?: $this->descripcion,
            'descripcion' => $this->descripcion,

            // IDs de Rama Judicial
            'id_reg_actuacion' => $this->id_reg_actuacion,
            'cons_actuacion' => $this->cons_actuacion,
            'cod_regla' => $this->cod_regla,

            // Clasificación de AUTOS
            'is_auto' => $this->clasificacion !== null,
            'auto_type' => $this->clasificacion,
            'clasificacion' => $this->clasificacion,
            'confianza' => $this->confianza_clasificacion,
            'notificado' => $this->notificado,
            'clasificado_at' => $this->clasificado_at?->toIso8601String(),

            // Documentos
            'con_documentos' => $this->documents->count() > 0,
            'documentos_count' => $this->documents->count(),
            'documents' => CaseActDocumentResource::collection($this->whenLoaded('documents')),

            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
