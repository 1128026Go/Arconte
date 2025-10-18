<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CaseModel extends Model
{
    use HasFactory;

    protected $table = 'case_models';

    protected $fillable = [
        'user_id',
        'radicado',
        'jurisdiccion',
        'juzgado',
        'tipo_proceso',
        'despacho',
        'estado_actual',
        'fuente',
        'ultimo_hash',
        'last_checked_at',
        'last_seen_at',
        'last_viewed_at',
        'has_unread',
        'estado_checked',
        // Campos adicionales de Rama Judicial
        'id_proceso_rama',
        'fecha_radicacion',
        'fecha_ultima_actuacion',
        'es_privado',
        'ponente',
        'clase_proceso',
        'subclase_proceso',
        'ubicacion_expediente',
        'recurso',
        'contenido_radicacion',
    ];

    protected $casts = [
        'last_checked_at' => 'datetime',
        'last_seen_at' => 'datetime',
        'last_viewed_at' => 'datetime',
        'has_unread' => 'boolean',
        'estado_checked' => 'boolean',
        'fecha_radicacion' => 'date',
        'fecha_ultima_actuacion' => 'date',
        'es_privado' => 'boolean',
    ];

    protected $attributes = [
        'has_unread' => false,
        'estado_checked' => false,
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function parties(): HasMany
    {
        return $this->hasMany(CaseParty::class, 'case_model_id');
    }

    public function acts(): HasMany
    {
        return $this->hasMany(CaseAct::class, 'case_model_id')->orderByDesc('fecha');
    }

    public function attachments(): HasMany
    {
        return $this->hasMany(Attachment::class, 'case_id');
    }
}
