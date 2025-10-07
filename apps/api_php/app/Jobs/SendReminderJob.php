<?php

namespace App\Jobs;

use App\Models\Reminder;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class SendReminderJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public Reminder $reminder
    ) {}

    public function handle(): void
    {
        // Skip if reminder is already completed
        if ($this->reminder->completed_at) {
            return;
        }

        // Skip if already notified
        if ($this->reminder->notified_at) {
            return;
        }

        try {
            // For now, just mark as notified - in production you'd send actual notifications
            // This could be email, SMS, push notifications, etc.
            $this->reminder->update(['notified_at' => now()]);
            
            logger()->info('Reminder notification sent', [
                'reminder_id' => $this->reminder->id,
                'user_id' => $this->reminder->user_id,
                'title' => $this->reminder->title,
            ]);
        } catch (\Exception $e) {
            // Log error but don't fail the job
            logger()->error('Failed to send reminder notification', [
                'reminder_id' => $this->reminder->id,
                'error' => $e->getMessage(),
            ]);
        }
    }
}