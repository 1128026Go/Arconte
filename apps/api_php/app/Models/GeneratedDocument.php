<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class GeneratedDocument extends Model
{
    protected $table = 'generated_documents';

    protected $fillable = [
        'user_id',
        'case_id',
        'conversation_id',
        'template_type',
        'title',
        'content',
        'parameters',
        'status',
        'format',
        'file_path',
    ];

    protected $casts = [
        'parameters' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function caseModel(): BelongsTo
    {
        return $this->belongsTo(CaseModel::class, 'case_id');
    }

    public function conversation(): BelongsTo
    {
        return $this->belongsTo(AIConversation::class, 'conversation_id');
    }

    public function embeddings(): MorphMany
    {
        return $this->morphMany(DocumentEmbedding::class, 'embeddable');
    }

    /**
     * Scope para documentos por estado
     */
    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope para documentos por tipo de plantilla
     */
    public function scopeByTemplateType($query, $type)
    {
        return $query->where('template_type', $type);
    }

    /**
     * Marcar como completado
     */
    public function markAsCompleted($filePath = null)
    {
        $this->update([
            'status' => 'completed',
            'file_path' => $filePath
        ]);
    }

    /**
     * Marcar como fallido
     */
    public function markAsFailed()
    {
        $this->update(['status' => 'failed']);
    }
}
