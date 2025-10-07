<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DocumentVersion extends Model
{
    protected $fillable = [
        'document_id', 'version', 'storage_path', 'sha256', 'size',
    ];

    protected $casts = [
        'size' => 'integer',
        'version' => 'integer',
    ];

    public function document()
    {
        return $this->belongsTo(Document::class);
    }
}