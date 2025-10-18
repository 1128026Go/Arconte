<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Configurar rate limiting para API
        RateLimiter::for('api', function (Request $request) {
            $plan = $request->user()?->subscription_plan ?? 'basic';

            $limit = match ($plan) {
                'professional' => 300,
                'enterprise' => 1000,
                default => 120,
            };

            return Limit::perMinute($limit)->by($request->user()?->getAuthIdentifier() ?? $request->ip());
        });
    }
}
