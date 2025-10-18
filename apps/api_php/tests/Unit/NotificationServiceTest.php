<?php

namespace Tests\Unit;

use App\Models\CaseModel;
use App\Models\Notification;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class NotificationServiceTest extends TestCase
{
    use RefreshDatabase;

    protected NotificationService $service;
    protected User $user;
    protected CaseModel $case;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = app(NotificationService::class);
        $this->user = User::factory()->create();
        $this->case = CaseModel::factory()->create(['user_id' => $this->user->id]);
    }

    // ==========================================
    // createNotification Tests
    // ==========================================

    public function test_can_create_notification(): void
    {
        $notification = $this->service->createNotification(
            user: $this->user,
            case: $this->case,
            type: 'new_act',
            title: 'Test Notification',
            message: 'This is a test notification',
            priority: 5,
            metadata: ['test' => 'value']
        );

        $this->assertInstanceOf(Notification::class, $notification);
        $this->assertEquals($this->user->id, $notification->user_id);
        $this->assertEquals($this->case->id, $notification->case_id);
        $this->assertEquals('new_act', $notification->type);
        $this->assertEquals(5, $notification->priority);
        $this->assertEquals(['test' => 'value'], $notification->metadata);
    }

    public function test_can_create_notification_without_case(): void
    {
        $notification = $this->service->createNotification(
            user: $this->user,
            case: null,
            type: 'system',
            title: 'System Notification',
            message: 'System message',
            priority: 3
        );

        $this->assertNull($notification->case_id);
        $this->assertEquals('system', $notification->type);
    }

    public function test_notification_is_unread_by_default(): void
    {
        $notification = $this->service->createNotification(
            user: $this->user,
            case: $this->case,
            type: 'new_act',
            title: 'Test',
            message: 'Test',
            priority: 5
        );

        $this->assertNull($notification->read_at);
    }

    // ==========================================
    // Priority Calculation Tests
    // ==========================================

    public function test_priority_defaults_to_3_when_not_specified(): void
    {
        $notification = $this->service->createNotification(
            user: $this->user,
            case: $this->case,
            type: 'update',
            title: 'Test',
            message: 'Test'
        );

        $this->assertEquals(3, $notification->priority);
    }

    public function test_priority_is_capped_at_10(): void
    {
        $notification = $this->service->createNotification(
            user: $this->user,
            case: $this->case,
            type: 'urgent',
            title: 'Test',
            message: 'Test',
            priority: 15 // Intentar prioridad > 10
        );

        // La lógica de negocio debería limitar a 10 si aplica
        $this->assertLessThanOrEqual(10, $notification->priority);
    }

    // ==========================================
    // Count & Stats Tests
    // ==========================================

    public function test_can_get_unread_count(): void
    {
        // Crear 3 no leídas
        Notification::factory()->count(3)->create([
            'user_id' => $this->user->id,
            'read_at' => null
        ]);

        // Crear 2 leídas
        Notification::factory()->count(2)->create([
            'user_id' => $this->user->id,
            'read_at' => now()
        ]);

        $count = $this->service->getUnreadCount($this->user);

        $this->assertEquals(3, $count);
    }

    public function test_unread_count_only_includes_user_notifications(): void
    {
        $otherUser = User::factory()->create();

        // 5 notificaciones del usuario actual
        Notification::factory()->count(5)->create([
            'user_id' => $this->user->id,
            'read_at' => null
        ]);

        // 3 notificaciones de otro usuario
        Notification::factory()->count(3)->create([
            'user_id' => $otherUser->id,
            'read_at' => null
        ]);

        $count = $this->service->getUnreadCount($this->user);

        $this->assertEquals(5, $count);
    }

    public function test_can_get_high_priority_count(): void
    {
        // 2 high priority (>=7)
        Notification::factory()->count(2)->create([
            'user_id' => $this->user->id,
            'priority' => 8,
            'read_at' => null
        ]);

        // 3 normal priority
        Notification::factory()->count(3)->create([
            'user_id' => $this->user->id,
            'priority' => 5,
            'read_at' => null
        ]);

        $count = $this->service->getHighPriorityCount($this->user);

        $this->assertEquals(2, $count);
    }

    // ==========================================
    // Mark as Read Tests
    // ==========================================

    public function test_can_mark_all_as_read(): void
    {
        // Crear 5 no leídas
        Notification::factory()->count(5)->create([
            'user_id' => $this->user->id,
            'read_at' => null
        ]);

        $updatedCount = $this->service->markAllAsRead($this->user);

        $this->assertEquals(5, $updatedCount);

        $remainingUnread = Notification::where('user_id', $this->user->id)
            ->whereNull('read_at')
            ->count();

        $this->assertEquals(0, $remainingUnread);
    }

    public function test_mark_all_as_read_only_affects_user_notifications(): void
    {
        $otherUser = User::factory()->create();

        // 3 notificaciones del usuario actual
        Notification::factory()->count(3)->create([
            'user_id' => $this->user->id,
            'read_at' => null
        ]);

        // 2 notificaciones de otro usuario
        Notification::factory()->count(2)->create([
            'user_id' => $otherUser->id,
            'read_at' => null
        ]);

        $this->service->markAllAsRead($this->user);

        $otherUserUnread = Notification::where('user_id', $otherUser->id)
            ->whereNull('read_at')
            ->count();

        $this->assertEquals(2, $otherUserUnread);
    }

    // ==========================================
    // Cleanup Tests
    // ==========================================

    public function test_can_delete_old_read_notifications(): void
    {
        // Notificación antigua leída (91 días)
        $oldRead = Notification::factory()->create([
            'user_id' => $this->user->id,
            'created_at' => now()->subDays(91),
            'read_at' => now()->subDays(90)
        ]);

        // Notificación reciente leída
        $recentRead = Notification::factory()->create([
            'user_id' => $this->user->id,
            'created_at' => now()->subDays(30),
            'read_at' => now()->subDays(29)
        ]);

        // Notificación antigua no leída
        $oldUnread = Notification::factory()->create([
            'user_id' => $this->user->id,
            'created_at' => now()->subDays(91),
            'read_at' => null
        ]);

        $deletedCount = $this->service->deleteOldNotifications(90);

        $this->assertEquals(1, $deletedCount);
        $this->assertDatabaseMissing('notifications', ['id' => $oldRead->id]);
        $this->assertDatabaseHas('notifications', ['id' => $recentRead->id]);
        $this->assertDatabaseHas('notifications', ['id' => $oldUnread->id]);
    }

    // ==========================================
    // Edge Cases
    // ==========================================

    public function test_returns_zero_for_user_with_no_notifications(): void
    {
        $newUser = User::factory()->create();

        $count = $this->service->getUnreadCount($newUser);

        $this->assertEquals(0, $count);
    }

    public function test_metadata_can_store_complex_data(): void
    {
        $complexMetadata = [
            'act_type' => 'auto',
            'deadline_days' => 10,
            'parties' => ['John Doe', 'Jane Smith'],
            'nested' => [
                'key' => 'value',
                'number' => 42
            ]
        ];

        $notification = $this->service->createNotification(
            user: $this->user,
            case: $this->case,
            type: 'new_act',
            title: 'Test',
            message: 'Test',
            priority: 5,
            metadata: $complexMetadata
        );

        $this->assertEquals($complexMetadata, $notification->metadata);
        $this->assertEquals('auto', $notification->metadata['act_type']);
        $this->assertEquals(42, $notification->metadata['nested']['number']);
    }
}
