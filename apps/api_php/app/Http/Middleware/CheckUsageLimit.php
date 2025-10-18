<?php

namespace App\Http\Middleware;

use App\Models\UsageTracking;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckUsageLimit
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @param  string  $limitType  Tipo de límite: 'cases', 'queries', 'jurisprudencia'
     */
    public function handle(Request $request, Closure $next, string $limitType): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'error' => 'Unauthenticated',
                'message' => 'Debes iniciar sesión'
            ], 401);
        }

        $subscription = $user->activeSubscription();

        if (!$subscription) {
            return response()->json([
                'error' => 'No active subscription',
                'message' => 'Necesitas una suscripción para usar esta función',
                'upgrade_required' => true
            ], 403);
        }

        $plan = $subscription->plan;

        // Si es premium, permitir ilimitado
        if ($plan->isPremium()) {
            return $next($request);
        }

        // Obtener uso de hoy
        $usage = UsageTracking::firstOrCreate([
            'user_id' => $user->id,
            'date' => now()->toDateString()
        ]);

        // Verificar límite según tipo
        switch ($limitType) {
            case 'cases':
                $currentCount = $user->cases()->count();
                if ($currentCount >= $plan->max_cases) {
                    return response()->json([
                        'error' => 'Limit reached',
                        'message' => "Has alcanzado el límite de {$plan->max_cases} casos. Actualiza a Premium para casos ilimitados.",
                        'current_usage' => $currentCount,
                        'limit' => $plan->max_cases,
                        'upgrade_required' => true,
                        'upgrade_url' => '/pricing'
                    ], 429);
                }
                break;

            case 'queries':
                if ($usage->queries_made >= $plan->max_daily_queries) {
                    return response()->json([
                        'error' => 'Daily limit reached',
                        'message' => "Has alcanzado el límite de {$plan->max_daily_queries} consultas diarias. Actualiza a Premium para consultas ilimitadas.",
                        'current_usage' => $usage->queries_made,
                        'limit' => $plan->max_daily_queries,
                        'resets_at' => now()->endOfDay()->toISOString(),
                        'upgrade_required' => true,
                        'upgrade_url' => '/pricing'
                    ], 429);
                }
                break;

            case 'jurisprudencia':
                if ($usage->jurisprudencia_searches >= $plan->max_jurisprudencia_searches) {
                    return response()->json([
                        'error' => 'Daily limit reached',
                        'message' => "Has alcanzado el límite de {$plan->max_jurisprudencia_searches} búsquedas de jurisprudencia diarias.",
                        'current_usage' => $usage->jurisprudencia_searches,
                        'limit' => $plan->max_jurisprudencia_searches,
                        'resets_at' => now()->endOfDay()->toISOString(),
                        'upgrade_required' => true,
                        'upgrade_url' => '/pricing'
                    ], 429);
                }
                break;

            default:
                return response()->json([
                    'error' => 'Invalid limit type',
                    'message' => 'Tipo de límite no válido'
                ], 500);
        }

        // Agregar información de uso al request
        $request->attributes->set('usage', $usage);
        $request->attributes->set('limit_type', $limitType);

        return $next($request);
    }
}
