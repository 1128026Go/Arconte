<?php

namespace Tests\Feature;

use App\Models\Reminder;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReminderTest extends TestCase
{
    use RefreshDatabase;

    public function test_reminder_placeholder(): void
    {
        $this->markTestSkipped('Reminder scaffold.');
    }

    public function test_user_can_create_reminder(): void
    {
        $user = User::factory()->create();

        $payload = [
            'title' => 'Vencer demanda',
            'due_date' => now()->addDay()->toIso8601String(),
            'type' => 'plazo',
            'priority' => 'alta',
            'channel' => 'inapp',
        ];

        $response = $this->actingAs($user)->postJson('/api/reminders', $payload);

        $response->assertStatus(201);

        $this->assertDatabaseHas('reminders', [
            'title' => 'Vencer demanda',
            'user_id' => $user->id,
        ]);
    }
}