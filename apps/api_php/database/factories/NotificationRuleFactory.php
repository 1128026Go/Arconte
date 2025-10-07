<?php

namespace Database\Factories;

use App\Models\NotificationRule;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class NotificationRuleFactory extends Factory
{
    protected $model = NotificationRule::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'rule_type' => $this->faker->randomElement(['keyword', 'party', 'court', 'act_type']),
            'rule_value' => ['keywords' => [$this->faker->word]],
            'priority_boost' => $this->faker->numberBetween(0, 10),
            'enabled' => true,
        ];
    }
}
