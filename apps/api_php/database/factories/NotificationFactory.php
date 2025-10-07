<?php

namespace Database\Factories;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class NotificationFactory extends Factory
{
    protected $model = Notification::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'case_id' => null,
            'type' => $this->faker->randomElement(['update', 'deadline', 'hearing']),
            'priority' => $this->faker->numberBetween(0, 10),
            'title' => $this->faker->sentence(6),
            'message' => $this->faker->paragraph(),
            'metadata' => ['source' => 'factory'],
            'read_at' => null,
            'sent_at' => null,
        ];
    }
}
