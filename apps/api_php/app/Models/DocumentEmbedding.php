<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class DocumentEmbedding extends Model
{
    protected $fillable = [
        'embeddable_type',
        'embeddable_id',
        'content',
        'embedding',
        'metadata',
    ];

    protected $casts = [
        'embedding' => 'array',
        'metadata' => 'array',
    ];

    /**
     * Get the embeddable model (GeneratedDocument or Transcription)
     */
    public function embeddable(): MorphTo
    {
        return $this->morphTo();
    }
}
