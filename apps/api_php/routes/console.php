<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;
use App\Jobs\MonitorCaseChanges;
use App\Jobs\SendDailyNotifications;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Job de monitoreo cada hora (24/7)
Schedule::job(new MonitorCaseChanges())
    ->hourly()
    ->onOneServer()
    ->withoutOverlapping()
    ->name('monitor-case-changes');

// Envío de notificaciones diarias a las 8 AM
Schedule::job(new SendDailyNotifications())
    ->dailyAt('08:00')
    ->onOneServer()
    ->withoutOverlapping()
    ->name('send-daily-notifications');

// Digest de casos (ya existente)
Schedule::command('cases:digest')
    ->dailyAt('06:00')
    ->onOneServer()
    ->withoutOverlapping();
