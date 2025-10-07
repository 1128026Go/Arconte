<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\NotificationRule;
use App\Models\User;
use App\Models\CaseModel;

class NotificationService
{
    public function createNotification(
        User $user,
        ?CaseModel $case,
        string $type,
        string $title,
        string $message,
        int $priority = 3,
        array $metadata = []
    ): Notification {
        return Notification::create([
            'user_id' => $user->id,
            'case_id' => $case?->id,
            'type' => $type,
            'priority' => $priority,
            'title' => $title,
            'message' => $message,
            'metadata' => $metadata,
        ]);
    }

    public function calculatePriority(CaseModel $case, array $change, User $user): int
    {
        $basePriority = $this->getBasePriority($change);
        $ruleBoost = $this->applyUserRules($case, $change, $user);
        
        return min(10, $basePriority + $ruleBoost);
    }

    private function getBasePriority(array $change): int
    {
        $urgentKeywords = [
            'sentencia', 'fallo', 'termino', 'plazo', 'audiencia',
            'citacion', 'notificacion personal', 'medida cautelar'
        ];

        $content = json_encode($change);
        foreach ($urgentKeywords as $keyword) {
            if (stripos($content, $keyword) !== false) {
                return 8;
            }
        }

        return match($change['type']) {
            'new_act' => 5,
            'status_change' => 7,
            'party_change' => 4,
            default => 3,
        };
    }

    private function applyUserRules(CaseModel $case, array $change, User $user): int
    {
        $rules = NotificationRule::where('user_id', $user->id)
            ->active()
            ->get();

        $totalBoost = 0;
        foreach ($rules as $rule) {
            if ($rule->matches($case, $change)) {
                $totalBoost += $rule->priority_boost;
            }
        }

        return $totalBoost;
    }

    public function getUnreadCount(User $user): int
    {
        return Notification::where('user_id', $user->id)
            ->unread()
            ->count();
    }

    public function getHighPriorityCount(User $user, int $threshold = 7): int
    {
        return Notification::where('user_id', $user->id)
            ->unread()
            ->highPriority($threshold)
            ->count();
    }

    public function markAllAsRead(User $user): int
    {
        return Notification::where('user_id', $user->id)
            ->unread()
            ->update(['read_at' => now()]);
    }

    public function deleteOldNotifications(int $daysToKeep = 90): int
    {
        return Notification::where('created_at', '<', now()->subDays($daysToKeep))
            ->whereNotNull('read_at')
            ->delete();
    }

    public function sendEmailNotification(Notification $notification): void
    {
        try {
            $user = User::find($notification->user_id);
            $case = CaseModel::find($notification->case_id);

            if (!$user || !$case) {
                \Log::warning('User or case not found for notification', [
                    'notification_id' => $notification->id
                ]);
                return;
            }

            \Mail::to($user->email)->send(
                new \App\Mail\CaseNotificationMail($notification, $case)
            );

            \Log::info('Email notification sent', [
                'notification_id' => $notification->id,
                'user_id' => $user->id,
                'email' => $user->email
            ]);

        } catch (\Exception $e) {
            \Log::error('Failed to send email notification', [
                'notification_id' => $notification->id,
                'error' => $e->getMessage()
            ]);
        }
    }
}
