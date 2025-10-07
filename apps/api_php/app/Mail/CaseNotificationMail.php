<?php

namespace App\Mail;

use App\Models\CaseModel;
use App\Models\Notification;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class CaseNotificationMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Notification $notification,
        public CaseModel $case
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: $this->notification->title,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.case-notification',
            with: [
                'notification' => $this->notification,
                'case' => $this->case,
                'priority' => $this->getPriorityLabel(),
                'priorityColor' => $this->getPriorityColor(),
            ]
        );
    }

    private function getPriorityLabel(): string
    {
        return match(true) {
            $this->notification->priority >= 8 => 'Alta',
            $this->notification->priority >= 5 => 'Media',
            default => 'Baja'
        };
    }

    private function getPriorityColor(): string
    {
        return match(true) {
            $this->notification->priority >= 8 => '#ef4444',
            $this->notification->priority >= 5 => '#f59e0b',
            default => '#3b82f6'
        };
    }
}
