<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Attachment extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'case_id',
        'user_id',
        'name',
        'file_path',
        'file_type',
        'file_size',
        'category',
        'description',
    ];

    protected $casts = [
        'file_size' => 'integer',
    ];

    public function caseModel()
    {
        return $this->belongsTo(CaseModel::class, 'case_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
