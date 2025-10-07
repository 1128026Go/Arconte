<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CaseMonitoring extends Model
{
    protected $table = 'case_monitoring';

    protected $fillable = [
        'case_id',
        'last_check',
        'check_frequency',
        'status',
        'sources',
        'last_data_hash',
    ];

    protected $casts = [
        'last_check' => 'datetime',
        'sources' => 'array',
        'last_data_hash' => 'array',
    ];

    public function case(): BelongsTo
    {
        return $this->belongsTo(CaseModel::class, 'case_id');
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeDueForCheck($query)
    {
        return $query->where(function($q) {
            $q->whereNull('last_check')
              ->orWhereRaw('TIMESTAMPDIFF(SECOND, last_check, NOW()) >= check_frequency');
        });
    }

    public function needsCheck(): bool
    {
        if (!$this->last_check) {
            return true;
        }

        $secondsSinceLastCheck = now()->diffInSeconds($this->last_check);
        return $secondsSinceLastCheck >= $this->check_frequency;
    }

    public function updateCheck(): void
    {
        $this->update(['last_check' => now()]);
    }

    public function hasDataChanged($newData): bool
    {
        $newHash = $this->hashData($newData);
        $lastHash = $this->last_data_hash ?? [];

        return json_encode($newHash) !== json_encode($lastHash);
    }

    public function updateDataHash($newData): void
    {
        $this->update(['last_data_hash' => $this->hashData($newData)]);
    }

    private function hashData($data): array
    {
        return [
            'acts_count' => count($data['acts'] ?? []),
            'parties_count' => count($data['parties'] ?? []),
            'last_act_hash' => md5(json_encode($data['acts'][0] ?? '')),
            'status' => $data['estado'] ?? '',
        ];
    }
}
