<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Plan extends Model
{
    protected $fillable = [
        'name',
        'display_name',
        'description',
        'price',
        'billing_cycle',
        'max_cases',
        'max_daily_queries',
        'max_jurisprudencia_searches',
        'features',
        'is_active'
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'features' => 'array',
        'is_active' => 'boolean',
        'max_cases' => 'integer',
        'max_daily_queries' => 'integer',
        'max_jurisprudencia_searches' => 'integer'
    ];

    public function subscriptions()
    {
        return $this->hasMany(Subscription::class);
    }

    public function hasFeature(string $feature): bool
    {
        return in_array($feature, $this->features ?? []);
    }

    public function isFree(): bool
    {
        return $this->name === 'free';
    }

    public function isPremium(): bool
    {
        return $this->name === 'premium';
    }
}
