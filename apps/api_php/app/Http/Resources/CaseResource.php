<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CaseResource extends JsonResource
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
            'radicado' => $this->radicado,
            'estado_actual' => $this->estado_actual,

            // Fechas formateadas
            'ultima_verificacion' => $this->last_checked_at?->toIso8601String(),
            'ultima_verificacion_fmt' => $this->last_checked_at?->translatedFormat('d M Y, H:i'),
            'ultima_vista' => $this->last_viewed_at?->toIso8601String(),
            'ultima_vista_fmt' => $this->last_viewed_at?->translatedFormat('d M Y, H:i'),
            'ultima_actualizacion' => $this->updated_at?->toIso8601String(),

            // Datos del proceso (paridad con Rama Judicial)
            'fecha_radicacion' => $this->fecha_radicacion?->toDateString(),
            'fecha_radicacion_fmt' => $this->fecha_radicacion?->translatedFormat('d M Y'),
            'fecha_ultima_actuacion' => $this->fecha_ultima_actuacion?->toDateString(),
            'fecha_ultima_actuacion_fmt' => $this->fecha_ultima_actuacion?->translatedFormat('d M Y'),
            'despacho' => $this->despacho,
            'ponente' => $this->ponente,
            'tipo_proceso' => $this->tipo_proceso,
            'clase_proceso' => $this->clase_proceso,
            'subclase_proceso' => $this->subclase_proceso,
            'recurso' => $this->recurso,
            'ubicacion_expediente' => $this->ubicacion_expediente,
            'contenido_radicacion' => $this->contenido_radicacion,

            // Flags
            'has_unread' => $this->has_unread,
            'estado_checked' => $this->estado_checked,

            // Relaciones
            'parties' => CasePartyResource::collection($this->whenLoaded('parties')),
            'acts' => CaseActResource::collection($this->whenLoaded('acts')),
        ];
    }
}
