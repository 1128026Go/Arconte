<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NotificationRule extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'rule_type',
        'rule_value',
        'priority_boost',
        'enabled',
    ];

    protected $casts = [
        'rule_value' => 'array',
        'enabled' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function scopeActive($query)
    {
        return $query->where('enabled', true);
    }

    public function matches($case, $change): bool
    {
        if (! $this->enabled) {
            return false;
        }

        return match ($this->rule_type) {
            'keyword' => $this->matchesKeyword($change),
            'party' => $this->matchesParty($case),
            'court' => $this->matchesCourt($case),
            'deadline' => $this->matchesDeadline($change),
            'act_type' => $this->matchesActType($change),
            default => false,
        };
    }

    private function matchesKeyword($change): bool
    {
        $keywords = $this->rule_value['keywords'] ?? [];
        $text = json_encode($change);

        foreach ($keywords as $keyword) {
            if (str_contains(strtolower($text), strtolower($keyword))) {
                return true;
            }
        }

        return false;
    }

    private function matchesParty($case): bool
    {
        $partyNames = $this->rule_value['parties'] ?? [];

        foreach ($case->parties as $party) {
            foreach ($partyNames as $name) {
                if (str_contains(strtolower($party->nombre), strtolower($name))) {
                    return true;
                }
            }
        }

        return false;
    }

    private function matchesCourt($case): bool
    {
        $courts = $this->rule_value['courts'] ?? [];
        return in_array($case->despacho, $courts);
    }

    private function matchesDeadline($change): bool
    {
        return isset($change['deadline'])
            || str_contains(strtolower(json_encode($change)), 'termino')
            || str_contains(strtolower(json_encode($change)), 'plazo');
    }

    private function matchesActType($change): bool
    {
        $actTypes = $this->rule_value['act_types'] ?? [];
        $actuacion = $change['actuacion'] ?? '';

        foreach ($actTypes as $type) {
            if (str_contains(strtolower($actuacion), strtolower($type))) {
                return true;
            }
        }

        return false;
    }
}
