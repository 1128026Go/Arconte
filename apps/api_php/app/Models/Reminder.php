<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Reminder extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'user_id', 'case_id', 'title', 'description', 'notes', 'due_at', 'channel',
        'completed_at', 'priority', 'type', 'notified_at',
    ];

    protected $casts = [
        'due_at' => 'datetime',
        'completed_at' => 'datetime',
        'notified_at' => 'datetime',
    ];

    // Relationships
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function case()
    {
        return $this->belongsTo(\App\Models\CaseModel::class, 'case_id');
    }

    // Scopes
    public function scopeUpcoming($query, $days = 7)
    {
        return $query->whereNull('completed_at')
            ->where('due_at', '>', now())
            ->where('due_at', '<=', now()->addDays($days));
    }

    public function scopeOverdue($query)
    {
        return $query->whereNull('completed_at')
            ->where('due_at', '<', now());
    }

    public function scopePending($query)
    {
        return $query->whereNull('completed_at');
    }

    public function scopeCompleted($query)
    {
        return $query->whereNotNull('completed_at');
    }

    // Accessors
    public function getIsOverdueAttribute(): bool
    {
        return $this->completed_at === null && $this->due_at < now();
    }

    public function getIsCompletedAttribute(): bool
    {
        return $this->completed_at !== null;
    }
}