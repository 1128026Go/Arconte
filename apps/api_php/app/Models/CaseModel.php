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
        'has_unread',
        'estado_checked',
    ];

    protected $casts = [
        'last_checked_at' => 'datetime',
        'last_seen_at' => 'datetime',
        'has_unread' => 'boolean',
        'estado_checked' => 'boolean',
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
}
