<?php

namespace App\Http\Controllers;

use App\Models\Plan;
use App\Models\Subscription;
use App\Services\EpaycoService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class SubscriptionController extends Controller
{
    public function __construct(
        protected EpaycoService $epayco
    ) {}

    /**
     * Listar todos los planes disponibles
     */
    public function plans(): JsonResponse
    {
        $plans = Plan::where('is_active', true)
            ->orderBy('price')
            ->get();

        return response()->json([
            'plans' => $plans->map(fn($plan) => [
                'id' => $plan->id,
                'name' => $plan->name,
                'display_name' => $plan->display_name,
                'description' => $plan->description,
                'price' => $plan->price,
                'billing_cycle' => $plan->billing_cycle,
                'features' => $plan->features,
                'limits' => [
                    'max_cases' => $plan->max_cases,
                    'max_daily_queries' => $plan->max_daily_queries,
                    'max_jurisprudencia_searches' => $plan->max_jurisprudencia_searches
                ]
            ])
        ]);
    }

    /**
     * Obtener suscripción actual del usuario
     */
    public function current(Request $request): JsonResponse
    {
        $user = $request->user();
        $subscription = $user->activeSubscription();

        if (!$subscription) {
            return response()->json([
                'subscription' => null,
                'message' => 'No tienes una suscripción activa'
            ]);
        }

        return response()->json([
            'subscription' => [
                'id' => $subscription->id,
                'status' => $subscription->status,
                'starts_at' => $subscription->starts_at,
                'current_period_end' => $subscription->current_period_end,
                'cancelled_at' => $subscription->cancelled_at,
                'on_trial' => $subscription->onTrial(),
                'trial_ends_at' => $subscription->trial_ends_at,
                'plan' => [
                    'id' => $subscription->plan->id,
                    'name' => $subscription->plan->name,
                    'display_name' => $subscription->plan->display_name,
                    'price' => $subscription->plan->price,
                    'billing_cycle' => $subscription->plan->billing_cycle,
                    'features' => $subscription->plan->features
                ]
            ]
        ]);
    }

    /**
     * Crear checkout de pago con ePayco
     */
    public function checkout(Request $request): JsonResponse
    {
        $data = $request->validate([
            'plan' => 'required|string|exists:plans,name',
            'billing_cycle' => 'sometimes|string|in:monthly,yearly'
        ]);

        $user = $request->user();
        $planQuery = Plan::where('name', $data['plan']);

        if (isset($data['billing_cycle'])) {
            $planQuery->where('billing_cycle', $data['billing_cycle']);
        }

        $plan = $planQuery->firstOrFail();
        $taxBase = round($plan->price / 1.19, 2);
        $tax = round($plan->price - $taxBase, 2);
        $reference = 'SUB-' . $user->id . '-' . time();

        try {
            $checkoutData = [
                'name' => $plan->display_name,
                'description' => 'Suscripción ' . $plan->display_name . ' - Arconte',
                'invoice' => $reference,
                'currency' => 'COP',
                'amount' => (string) $plan->price,
                'tax_base' => (string) $taxBase,
                'tax' => (string) $tax,
                'country' => 'CO',
                'lang' => 'ES',
                'external' => 'false',
                'extra1' => 'user_id:' . $user->id,
                'extra2' => 'plan_id:' . $plan->id,
                'extra3' => 'plan_name:' . $plan->name,
                'confirmation' => config('services.epayco.url_confirmation'),
                'response' => config('services.epayco.url_response'),
                'method_confirmation' => 'POST',
                'email_billing' => $user->email,
                'name_billing' => $user->name,
            ];

            Log::info('Creating ePayco checkout', [
                'user_id' => $user->id,
                'plan' => $plan->name,
                'reference' => $reference
            ]);

            $response = $this->epayco->createCheckout($checkoutData);

            // Extraer URL del response de ePayco payment API
            $checkoutUrl = $response->url ?? null;

            // Si no hay URL en la raíz, buscar en data
            if (!$checkoutUrl && isset($response->data)) {
                $checkoutUrl = $response->data->url ?? $response->data->urlbanco ?? null;
            }

            Log::info('ePayco checkout URL extracted', [
                'checkout_url' => $checkoutUrl,
                'success' => $response->success ?? null,
                'response_structure' => [
                    'has_data' => isset($response->data),
                    'has_success' => isset($response->success),
                    'has_url' => isset($response->url),
                    'response_keys' => array_keys((array)$response)
                ]
            ]);

            if (!$checkoutUrl) {
                Log::error('ePayco: No URL in response', ['response' => $response]);
                return response()->json([
                    'error' => 'No se pudo generar la URL de pago',
                    'message' => $response->message ?? 'Error desconocido',
                    'details' => $response->data ?? null
                ], 500);
            }

            return response()->json([
                'success' => true,
                'checkout_url' => $checkoutUrl,
                'reference' => $reference,
                'amount' => $plan->price
            ]);
        } catch (\Exception $e) {
            Log::error('Error creating ePayco checkout', [
                'error' => $e->getMessage(),
                'user_id' => $user->id,
                'plan' => $plan->name
            ]);

            return response()->json([
                'error' => 'Error al crear el checkout de pago',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Cancelar suscripción
     */
    public function cancel(Request $request): JsonResponse
    {
        $user = $request->user();
        $subscription = $user->activeSubscription();

        if (!$subscription) {
            return response()->json([
                'error' => 'No tienes una suscripción activa para cancelar'
            ], 404);
        }

        try {
            if ($subscription->epayco_subscription_id) {
                $this->epayco->cancelSubscription($subscription->epayco_subscription_id);
            }

            $subscription->cancel();

            Log::info('Subscription cancelled', [
                'user_id' => $user->id,
                'subscription_id' => $subscription->id
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Suscripción cancelada. Tendrás acceso hasta ' . $subscription->ends_at->format('d/m/Y'),
                'ends_at' => $subscription->ends_at
            ]);
        } catch (\Exception $e) {
            Log::error('Error cancelling subscription', [
                'error' => $e->getMessage(),
                'user_id' => $user->id,
                'subscription_id' => $subscription->id
            ]);

            return response()->json([
                'error' => 'Error al cancelar la suscripción',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener uso actual del usuario
     */
    public function usage(Request $request): JsonResponse
    {
        $user = $request->user();
        $subscription = $user->activeSubscription();

        // Si no hay suscripción, usar plan free por defecto
        if (!$subscription) {
            $freePlan = Plan::where('name', 'free')->first();

            if (!$freePlan) {
                return response()->json([
                    'cases_count' => 0,
                    'max_cases' => 0,
                    'daily_queries' => 0,
                    'max_daily_queries' => 0,
                    'jurisprudencia_searches' => 0,
                    'max_jurisprudencia_searches' => 0
                ]);
            }

            $todayUsage = $user->todayUsage();
            $casesCount = $user->cases()->count();

            return response()->json([
                'cases_count' => $casesCount,
                'max_cases' => $freePlan->max_cases,
                'daily_queries' => $todayUsage->queries_made ?? 0,
                'max_daily_queries' => $freePlan->max_daily_queries,
                'jurisprudencia_searches' => $todayUsage->jurisprudencia_searches ?? 0,
                'max_jurisprudencia_searches' => $freePlan->max_jurisprudencia_searches
            ]);
        }

        $plan = $subscription->plan;
        $todayUsage = $user->todayUsage();
        $casesCount = $user->cases()->count();

        return response()->json([
            'cases_count' => $casesCount,
            'max_cases' => $plan->max_cases,
            'daily_queries' => $todayUsage->queries_made ?? 0,
            'max_daily_queries' => $plan->max_daily_queries,
            'jurisprudencia_searches' => $todayUsage->jurisprudencia_searches ?? 0,
            'max_jurisprudencia_searches' => $plan->max_jurisprudencia_searches
        ]);
    }
}
