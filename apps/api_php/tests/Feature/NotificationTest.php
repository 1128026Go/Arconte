<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Notification;
use App\Models\NotificationRule;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class NotificationTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
    }

    public function test_user_can_list_their_notifications(): void
    {
        Notification::factory()->count(5)->create(['user_id' => $this->user->id]);
        Notification::factory()->count(3)->create(); // De otros usuarios

        $response = $this->actingAs($this->user)
            ->getJson('/api/notifications');

        $response->assertStatus(200);
        $this->assertCount(5, $response->json('data'));
    }

    public function test_user_can_get_unread_notifications(): void
    {
        Notification::factory()->count(3)->create([
            'user_id' => $this->user->id,
            'read_at' => null
        ]);
        Notification::factory()->count(2)->create([
            'user_id' => $this->user->id,
            'read_at' => now()
        ]);

        $response = $this->actingAs($this->user)
            ->getJson('/api/notifications/unread');

        $response->assertStatus(200)
            ->assertJsonPath('count', 3);
    }

    public function test_user_can_mark_notification_as_read(): void
    {
        $notification = Notification::factory()->create([
            'user_id' => $this->user->id,
            'read_at' => null
        ]);

        $response = $this->actingAs($this->user)
            ->postJson("/api/notifications/{$notification->id}/read");

        $response->assertStatus(200);

        $this->assertDatabaseHas('notifications', [
            'id' => $notification->id,
        ]);
        $this->assertNotNull(Notification::find($notification->id)->read_at);
    }

    public function test_user_can_mark_all_notifications_as_read(): void
    {
        Notification::factory()->count(5)->create([
            'user_id' => $this->user->id,
            'read_at' => null
        ]);

        $response = $this->actingAs($this->user)
            ->postJson('/api/notifications/mark-all-read');

        $response->assertStatus(200);

        $unreadCount = Notification::where('user_id', $this->user->id)
            ->whereNull('read_at')
            ->count();

        $this->assertEquals(0, $unreadCount);
    }

    public function test_user_can_get_notification_stats(): void
    {
        Notification::factory()->count(10)->create(['user_id' => $this->user->id]);
        Notification::factory()->count(5)->create([
            'user_id' => $this->user->id,
            'priority' => 8,
            'read_at' => null
        ]);

        $response = $this->actingAs($this->user)
            ->getJson('/api/notifications/stats');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'total',
                'unread',
                'high_priority',
                'today'
            ]);
    }

    public function test_user_can_create_notification_rule(): void
    {
        $response = $this->actingAs($this->user)
            ->postJson('/api/notifications/rules', [
                'rule_type' => 'keyword',
                'rule_value' => ['tutela', 'audiencia'],
                'priority_boost' => 5,
                'enabled' => true
            ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'id',
                'rule_type',
                'rule_value',
                'priority_boost'
            ]);

        $this->assertDatabaseHas('notification_rules', [
            'user_id' => $this->user->id,
            'rule_type' => 'keyword'
        ]);
    }

    public function test_user_can_update_notification_rule(): void
    {
        $rule = NotificationRule::factory()->create(['user_id' => $this->user->id]);

        $response = $this->actingAs($this->user)
            ->putJson("/api/notifications/rules/{$rule->id}", [
                'priority_boost' => 8,
                'enabled' => false
            ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('notification_rules', [
            'id' => $rule->id,
            'priority_boost' => 8,
            'enabled' => false
        ]);
    }

    public function test_user_can_delete_notification_rule(): void
    {
        $rule = NotificationRule::factory()->create(['user_id' => $this->user->id]);

        $response = $this->actingAs($this->user)
            ->deleteJson("/api/notifications/rules/{$rule->id}");

        $response->assertStatus(200);

        $this->assertDatabaseMissing('notification_rules', [
            'id' => $rule->id
        ]);
    }

    public function test_user_cannot_access_other_users_notifications(): void
    {
        $otherUser = User::factory()->create();
        $notification = Notification::factory()->create(['user_id' => $otherUser->id]);

        $response = $this->actingAs($this->user)
            ->postJson("/api/notifications/{$notification->id}/read");

        $response->assertStatus(404);
    }
}
