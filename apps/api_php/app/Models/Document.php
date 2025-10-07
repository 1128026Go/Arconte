<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Document extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id', 'case_id', 'folder_id', 'title', 'mime', 'size', 'storage_path',
        'sha256', 'is_private', 'ocr_text', 'ocr_confidence', 'thumbnail_path',
    ];

    protected $casts = [
        'is_private' => 'boolean',
        'ocr_confidence' => 'float',
        'size' => 'integer',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function case()
    {
        return $this->belongsTo(\App\Models\CaseModel::class, 'case_id');
    }

    public function versions()
    {
        return $this->hasMany(DocumentVersion::class);
    }

    public function folder()
    {
        return $this->belongsTo(DocumentFolder::class);
    }

    public function shares()
    {
        return $this->hasMany(DocumentShare::class);
    }
}