<?php

namespace App\Listeners;

use App\Events\NewCaseActDetected;
use App\Models\Notification;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class CreateNotificationForNewAct implements ShouldQueue
{
    use InteractsWithQueue;

    /**
     * Create the event listener.
     */
    public function __construct(
        private NotificationService $notificationService
    ) {}

    /**
     * Handle the event.
     */
    public function handle(NewCaseActDetected $event): void
    {
        $user = User::find($event->userId);

        if (!$user) {
            \Log::warning('User not found for notification', [
                'user_id' => $event->userId,
                'case_id' => $event->case->id
            ]);
            return;
        }

        // Calcular prioridad basada en urgencia del auto
        $priority = $this->calculatePriority($event->act->urgency_level ?? 'normal');

        // Crear título descriptivo
        $title = $this->buildTitle($event->act->act_type, $event->case->case_number);

        // Crear mensaje
        $message = $this->buildMessage($event->act, $event->case);

        // Metadata adicional
        $metadata = [
            'act_id' => $event->act->id,
            'act_type' => $event->act->act_type,
            'act_date' => $event->act->act_date?->toDateTimeString(),
            'urgency_level' => $event->act->urgency_level,
            'deadline_days' => $event->act->deadline_days,
        ];

        // Crear notificación
        $this->notificationService->createNotification(
            user: $user,
            case: $event->case,
            type: 'new_act',
            title: $title,
            message: $message,
            priority: $priority,
            metadata: $metadata
        );

        \Log::info('Notification created for new case act', [
            'user_id' => $user->id,
            'case_id' => $event->case->id,
            'act_id' => $event->act->id,
            'priority' => $priority,
        ]);
    }

    /**
     * Calcular prioridad basada en el nivel de urgencia
     */
    private function calculatePriority(string $urgencyLevel): int
    {
        return match ($urgencyLevel) {
            'critical' => 10,
            'high' => 8,
            'medium' => 5,
            'low' => 3,
            default => 4,
        };
    }

    /**
     * Construir título descriptivo
     */
    private function buildTitle(string $actType, string $caseNumber): string
    {
        $actTypeLabel = match ($actType) {
            'auto' => 'Auto',
            'sentencia' => 'Sentencia',
            'resolucion' => 'Resolución',
            'decreto' => 'Decreto',
            default => 'Actuación',
        };

        return "{$actTypeLabel} - Caso {$caseNumber}";
    }

    /**
     * Construir mensaje descriptivo
     */
    private function buildMessage($act, $case): string
    {
        $message = "Se ha detectado un nuevo auto en el caso {$case->case_number}.";

        if ($act->deadline_days && $act->deadline_days > 0) {
            $message .= " Plazo de {$act->deadline_days} días.";
        }

        if ($act->urgency_level === 'critical' || $act->urgency_level === 'high') {
            $message .= " ⚠️ Requiere atención urgente.";
        }

        if ($act->annotations) {
            $message .= " " . substr($act->annotations, 0, 100) . "...";
        }

        return $message;
    }

    /**
     * Handle a job failure.
     */
    public function failed(NewCaseActDetected $event, \Throwable $exception): void
    {
        \Log::error('Failed to create notification for new case act', [
            'case_id' => $event->case->id,
            'act_id' => $event->act->id,
            'user_id' => $event->userId,
            'error' => $exception->getMessage(),
            'trace' => $exception->getTraceAsString(),
        ]);
    }
}
