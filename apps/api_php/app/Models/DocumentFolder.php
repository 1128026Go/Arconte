<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DocumentFolder extends Model
{
    protected $fillable = [
        'user_id', 'case_id', 'name',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function case()
    {
        return $this->belongsTo(\App\Models\CaseModel::class, 'case_id');
    }

    public function documents()
    {
        return $this->hasMany(Document::class, 'folder_id');
    }
}