<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Models\CaseModel;
use App\Services\NotificationService;
use Illuminate\Console\Command;

class TestNotifications extends Command
{
    protected $signature = 'notifications:test {user_id}';
    protected $description = 'Create test notifications for a user';

    public function handle(NotificationService $notificationService): int
    {
        $userId = $this->argument('user_id');
        $user = User::find($userId);

        if (!$user) {
            $this->error("User not found");
            return 1;
        }

        $case = $user->cases()->first();

        $this->info("Creating test notifications for user: {$user->email}");

        $notificationService->createNotification(
            $user,
            $case,
            'new_act',
            'Test - Nueva Actuación',
            'Esta es una notificación de prueba de tipo nueva actuación',
            8,
            ['test' => true]
        );

        $notificationService->createNotification(
            $user,
            $case,
            'status_change',
            'Test - Cambio de Estado',
            'Esta es una notificación de prueba de cambio de estado',
            7,
            ['test' => true]
        );

        $notificationService->createNotification(
            $user,
            $case,
            'urgent',
            'Test - Urgente',
            'Esta es una notificación de prueba urgente',
            10,
            ['test' => true]
        );

        $this->info("Created 3 test notifications successfully");
        return 0;
    }
}
