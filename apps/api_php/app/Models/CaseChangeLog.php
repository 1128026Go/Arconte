<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CaseChangeLog extends Model
{
    protected $table = 'case_changes_log';

    public $timestamps = false;

    protected $fillable = [
        'case_id',
        'source',
        'change_type',
        'old_value',
        'new_value',
        'detected_at',
    ];

    protected $casts = [
        'old_value' => 'array',
        'new_value' => 'array',
        'detected_at' => 'datetime',
    ];

    public function case(): BelongsTo
    {
        return $this->belongsTo(CaseModel::class, 'case_id');
    }

    public function scopeRecent($query, $days = 7)
    {
        return $query->where('detected_at', '>=', now()->subDays($days));
    }

    public function scopeByType($query, $type)
    {
        return $query->where('change_type', $type);
    }

    public function scopeBySource($query, $source)
    {
        return $query->where('source', $source);
    }
}
