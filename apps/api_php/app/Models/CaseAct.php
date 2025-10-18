<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CaseAct extends Model
{
    protected $table = "case_acts";
    public $timestamps = false;

    protected $fillable = [
        "case_model_id",
        "fecha",
        "tipo",
        "anotacion",
        "descripcion",
        "documento_url",
        "origen",
        "uniq_key",
        "clasificacion",
        "confianza_clasificacion",
        "razon_clasificacion",
        "plazo_info",
        "clasificado_at",
        "notificado",
        // Campos adicionales de Rama Judicial
        "id_reg_actuacion",
        "cons_actuacion",
        "fecha_inicial",
        "fecha_final",
        "fecha_registro",
        "cod_regla",
    ];

    protected $casts = [
        "fecha" => "datetime",
        "clasificado_at" => "datetime",
        "plazo_info" => "array",
        "notificado" => "boolean",
        "confianza_clasificacion" => "float",
        "fecha_inicial" => "date",
        "fecha_final" => "date",
        "fecha_registro" => "date",
    ];

    public function caseModel(): BelongsTo
    {
        return $this->belongsTo(CaseModel::class, 'case_model_id');
    }

    /**
     * Documentos adjuntos a esta actuación
     */
    public function documents()
    {
        return $this->hasMany(CaseActDocument::class);
    }

    /**
     * Scope para autos perentorios
     */
    public function scopePerentorios($query)
    {
        return $query->where('clasificacion', 'perentorio');
    }

    /**
     * Scope para autos no notificados
     */
    public function scopeNoNotificados($query)
    {
        return $query->where('notificado', false);
    }

    /**
     * Scope para autos pendientes de clasificación
     */
    public function scopePendientesClasificacion($query)
    {
        return $query->where('clasificacion', 'pendiente');
    }

    /**
     * Verificar si es un AUTO (no otro tipo de acto)
     */
    public function esAuto(): bool
    {
        $tipoLower = strtolower($this->tipo ?? '');
        $descripcionLower = strtolower($this->descripcion ?? '');

        return str_contains($tipoLower, 'auto') ||
               str_contains($descripcionLower, 'auto') ||
               str_contains($descripcionLower, 'providencia');
    }

    /**
     * Marcar como notificado
     */
    public function marcarComoNotificado(): void
    {
        $this->update(['notificado' => true]);
    }
}

