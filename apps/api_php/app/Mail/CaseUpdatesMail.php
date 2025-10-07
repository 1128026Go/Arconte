<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Collection;

class CaseUpdatesMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Collection $notifications
    ) {}

    public function envelope(): Envelope
    {
        $count = $this->notifications->count();
        return new Envelope(
            subject: "Tienes {$count} " . ($count === 1 ? 'actualización' : 'actualizaciones') . " de casos judiciales",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.case-updates',
            with: [
                'notifications' => $this->notifications,
                'totalCount' => $this->notifications->count(),
                'highPriority' => $this->notifications->where('priority', '>=', 8)->count(),
            ]
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
