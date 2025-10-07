<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Symfony\Component\HttpFoundation\Response;

class RateLimitByPlan
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        // Sin autenticación: límite estricto
        if (!$user) {
            $limit = 60; // 60 requests/minuto
            $key = 'guest:' . $request->ip();
        } else {
            // Determinar límite según plan de usuario
            // TODO: Implementar lógica de planes cuando exista tabla subscriptions
            $userPlan = $user->subscription_plan ?? 'basic';

            $limits = [
                'basic' => 120,        // 120 req/min
                'professional' => 300, // 300 req/min
                'enterprise' => 1000,  // 1000 req/min
            ];

            $limit = $limits[$userPlan] ?? 120;
            $key = 'user:' . $user->id;
        }

        $executed = RateLimiter::attempt(
            $key,
            $limit,
            function () {},
            60 // 60 segundos
        );

        if (!$executed) {
            return response()->json([
                'message' => 'Too many requests. Please try again later.',
                'retry_after' => RateLimiter::availableIn($key)
            ], 429);
        }

        return $next($request);
    }
}
