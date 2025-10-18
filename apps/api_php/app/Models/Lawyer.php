<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Lawyer extends Model
{
    protected $fillable = [
        'user_id',
        'name',
        'email',
        'phone',
        'specialty',
        'city',
        'bio',
        'rating',
        'total_reviews',
        'cases_won',
        'cases_total',
        'experience_years',
        'hourly_rate',
        'verified',
        'available',
        'specialties',
        'languages',
        'education',
        'license_number',
        'certifications',
        'profile_picture',
    ];

    protected $casts = [
        'rating' => 'decimal:2',
        'hourly_rate' => 'decimal:2',
        'verified' => 'boolean',
        'available' => 'boolean',
        'specialties' => 'array',
        'languages' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Calculate match score based on case requirements
     */
    public function calculateMatchScore(array $requirements): int
    {
        $score = 0;

        // Specialty match (40 points)
        if (isset($requirements['specialty']) && $this->specialty === $requirements['specialty']) {
            $score += 40;
        }

        // City match (20 points)
        if (isset($requirements['city']) && $this->city === $requirements['city']) {
            $score += 20;
        }

        // Rating score (20 points)
        $score += ($this->rating / 5) * 20;

        // Experience score (10 points)
        $experienceScore = min($this->experience_years / 15, 1) * 10;
        $score += $experienceScore;

        // Success rate (10 points)
        if ($this->cases_total > 0) {
            $successRate = $this->cases_won / $this->cases_total;
            $score += $successRate * 10;
        }

        return (int) round($score);
    }

    /**
     * Get success rate percentage
     */
    public function getSuccessRateAttribute(): float
    {
        if ($this->cases_total === 0) {
            return 0;
        }
        return round(($this->cases_won / $this->cases_total) * 100, 2);
    }
}
