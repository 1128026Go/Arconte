<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckSubscription
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @param  string|null  $feature  Feature específico a verificar
     */
    public function handle(Request $request, Closure $next, string $feature = null): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'error' => 'Unauthenticated',
                'message' => 'Debes iniciar sesión para acceder a esta función'
            ], 401);
        }

        $subscription = $user->activeSubscription();

        if (!$subscription) {
            return response()->json([
                'error' => 'No active subscription',
                'message' => 'Necesitas una suscripción activa para acceder a esta función',
                'upgrade_required' => true,
                'upgrade_url' => '/pricing'
            ], 403);
        }

        // Verificar feature específico si se proporciona
        if ($feature && !$subscription->plan->hasFeature($feature)) {
            return response()->json([
                'error' => 'Feature not available',
                'message' => 'Esta función no está disponible en tu plan actual',
                'current_plan' => $subscription->plan->display_name,
                'upgrade_required' => true,
                'upgrade_url' => '/pricing'
            ], 403);
        }

        // Agregar información de suscripción al request para uso posterior
        $request->attributes->set('subscription', $subscription);
        $request->attributes->set('plan', $subscription->plan);

        return $next($request);
    }
}
