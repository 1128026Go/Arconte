<?php

namespace App\Console\Commands;

use App\Jobs\SendDailyNotifications;
use Illuminate\Console\Command;

class SendNotificationEmails extends Command
{
    protected $signature = 'notifications:send-emails';
    protected $description = 'Send pending notification emails to users';

    public function handle(): int
    {
        $this->info('Sending notification emails...');

        SendDailyNotifications::dispatch();

        $this->info('Notification emails queued successfully!');

        return self::SUCCESS;
    }
}
