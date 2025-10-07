<?php

namespace App\Providers;

use App\Models\Document;
use App\Models\Reminder;
use App\Policies\DocumentPolicy;
use App\Policies\ReminderPolicy;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;

class AuthServiceProvider extends ServiceProvider
{
    protected $policies = [
        Document::class => DocumentPolicy::class,
        Reminder::class => ReminderPolicy::class,
    ];

    public function boot(): void
    {
        // Policies are automatically registered via the $policies array.
    }
}