<?php

namespace App\Jobs;

use App\Models\Notification;
use App\Models\User;
use App\Mail\CaseUpdatesMail;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class SendDailyNotifications implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle(): void
    {
        Log::info('SendDailyNotifications job started');

        $users = User::whereHas('cases')->get();

        foreach ($users as $user) {
            $this->sendUserNotifications($user);
        }

        Log::info('SendDailyNotifications job completed');
    }

    private function sendUserNotifications(User $user): void
    {
        $unsent = Notification::where('user_id', $user->id)
            ->unsent()
            ->orderBy('priority', 'desc')
            ->get();

        if ($unsent->isEmpty()) {
            return;
        }

        try {
            Mail::to($user->email)->send(new CaseUpdatesMail($unsent));

            foreach ($unsent as $notification) {
                $notification->markAsSent();
            }

            Log::info("Sent {$unsent->count()} notifications to user {$user->id}");
        } catch (\Exception $e) {
            Log::error("Error sending notifications to user {$user->id}: {$e->getMessage()}");
        }
    }
}
