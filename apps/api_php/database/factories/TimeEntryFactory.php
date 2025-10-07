<?php

namespace Database\Factories;

use App\Models\TimeEntry;
use App\Models\User;
use App\Models\CaseModel;
use Illuminate\Database\Eloquent\Factories\Factory;

class TimeEntryFactory extends Factory
{
    protected $model = TimeEntry::class;

    public function definition(): array
    {
        $hours = $this->faker->randomFloat(2, 0.25, 8);
        $hourlyRate = $this->faker->randomElement([30000, 40000, 50000, 75000, 100000]);

        return [
            'user_id' => User::factory(),
            'case_id' => CaseModel::factory(),
            'description' => $this->faker->sentence,
            'hours' => $hours,
            'hourly_rate' => $hourlyRate,
            'total' => $hours * $hourlyRate,
            'date' => $this->faker->dateTimeBetween('-30 days', 'now'),
            'billable' => $this->faker->boolean(80), // 80% billable
            'invoiced' => false,
        ];
    }

    public function billable(): static
    {
        return $this->state(fn (array $attributes) => [
            'billable' => true,
        ]);
    }

    public function invoiced(): static
    {
        return $this->state(fn (array $attributes) => [
            'billable' => true,
            'invoiced' => true,
        ]);
    }

    public function uninvoiced(): static
    {
        return $this->state(fn (array $attributes) => [
            'billable' => true,
            'invoiced' => false,
        ]);
    }
}
