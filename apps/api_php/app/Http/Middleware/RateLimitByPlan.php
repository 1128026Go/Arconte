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
     *
     * Aplica rate limiting basado en el plan de suscripción del usuario.
     * - Usuarios sin autenticar: 60 requests/minuto por IP
     * - Usuarios autenticados: Según max_daily_queries de su plan
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        // Sin autenticación: límite estricto por IP
        if (!$user) {
            $limit = 60; // 60 requests/minuto
            $decayMinutes = 1;
            $key = 'guest:' . $request->ip();
        } else {
            // Obtener plan del usuario (activo o free por defecto)
            $subscription = $user->activeSubscription();
            $plan = $subscription?->plan ?? \App\Models\Plan::where('name', 'free')->first();

            // Límite diario basado en max_daily_queries del plan
            // Si max_daily_queries = 0, es ilimitado (9999 requests/día para evitar overflow)
            $dailyLimit = $plan->max_daily_queries > 0 ? $plan->max_daily_queries : 9999;

            // Límite por minuto: dailyLimit / 1440 minutos (con mínimo de 10)
            $limit = max(10, (int) ceil($dailyLimit / 1440));

            $decayMinutes = 1;
            $key = 'user:' . $user->id;

            // También aplicar límite diario separado
            $dailyKey = 'user:daily:' . $user->id;
            $dailyExecuted = RateLimiter::attempt(
                $dailyKey,
                $dailyLimit,
                function () {},
                1440 // 1440 minutos = 24 horas
            );

            if (!$dailyExecuted) {
                return response()->json([
                    'error' => 'daily_limit_reached',
                    'message' => "Has alcanzado tu límite diario de {$dailyLimit} consultas. El límite se reinicia en 24 horas.",
                    'retry_after_seconds' => RateLimiter::availableIn($dailyKey),
                    'plan_name' => $plan->display_name,
                    'upgrade_url' => '/subscriptions/plans'
                ], 429);
            }
        }

        // Rate limiting por minuto
        $executed = RateLimiter::attempt(
            $key,
            $limit,
            function () {},
            $decayMinutes
        );

        if (!$executed) {
            return response()->json([
                'error' => 'rate_limit_exceeded',
                'message' => 'Demasiadas solicitudes. Por favor intenta más tarde.',
                'retry_after_seconds' => RateLimiter::availableIn($key)
            ], 429);
        }

        // Agregar headers informativos
        $response = $next($request);

        if ($user && isset($plan)) {
            $response->headers->set('X-RateLimit-Limit', $dailyLimit);
            $response->headers->set('X-RateLimit-Remaining', RateLimiter::remaining($dailyKey, $dailyLimit));
        }

        return $response;
    }
}
