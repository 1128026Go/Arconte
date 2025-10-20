<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DocumentTemplate extends Model
{
    protected $fillable = [
        'user_id',
        'name',
        'category',
        'description',
        'content',
        'variables',
        'is_public',
        'usage_count',
    ];

    protected $casts = [
        'variables' => 'array',
        'is_public' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Incrementar contador de uso
     */
    public function incrementUsage()
    {
        $this->increment('usage_count');
    }

    /**
     * Scope para plantillas públicas
     */
    public function scopePublic($query)
    {
        return $query->where('is_public', true);
    }

    /**
     * Scope para plantillas por categoría
     */
    public function scopeByCategory($query, $category)
    {
        return $query->where('category', $category);
    }
}
