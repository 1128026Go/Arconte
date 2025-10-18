<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\User;
use App\Services\EpaycoService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class WebhookController extends Controller
{
    public function __construct(
        protected EpaycoService $epayco
    ) {}

    /**
     * Webhook de confirmación de ePayco
     * Este endpoint recibe las notificaciones de pago de ePayco
     */
    public function epaycoConfirmation(Request $request): JsonResponse
    {
        Log::info('ePayco Webhook Received', $request->all());

        // Validar firma de seguridad (opcional pero recomendado)
        $signature = $request->header('x-signature');
        if ($signature && !$this->epayco->validateSignature($signature, $request->all())) {
            Log::warning('ePayco webhook with invalid signature', [
                'signature' => $signature,
                'ip' => $request->ip()
            ]);
            // En producción podrías rechazar esto, pero en desarrollo es mejor permitirlo
            // return response()->json(['error' => 'Invalid signature'], 403);
        }

        try {
            // Extraer datos del webhook
            $status = $request->input('x_response'); // 'Aceptada', 'Rechazada', 'Pendiente'
            $reference = $request->input('x_id_invoice');
            $transactionId = $request->input('x_transaction_id');
            $amount = $request->input('x_amount');
            $currency = $request->input('x_currency_code', 'COP');
            $paymentMethod = $request->input('x_franchise', 'unknown');

            // Extraer user_id y plan_id de extra1 y extra2
            preg_match('/user_id:(\d+)/', $request->input('x_extra1', ''), $userMatch);
            preg_match('/plan_id:(\d+)/', $request->input('x_extra2', ''), $planMatch);

            $userId = $userMatch[1] ?? null;
            $planId = $planMatch[1] ?? null;

            if (!$userId || !$planId) {
                Log::error('ePayco webhook missing user or plan data', [
                    'extra1' => $request->input('x_extra1'),
                    'extra2' => $request->input('x_extra2')
                ]);
                return response()->json(['error' => 'Invalid data'], 400);
            }

            $user = User::find($userId);
            $plan = Plan::find($planId);

            if (!$user || !$plan) {
                Log::error('ePayco webhook user or plan not found', [
                    'user_id' => $userId,
                    'plan_id' => $planId
                ]);
                return response()->json(['error' => 'User or plan not found'], 404);
            }

            // Procesar según el estado del pago
            if ($status === 'Aceptada') {
                DB::transaction(function () use ($user, $plan, $reference, $transactionId, $amount, $currency, $paymentMethod, $request) {
                    // Crear o actualizar suscripción
                    $subscription = Subscription::updateOrCreate(
                        [
                            'user_id' => $user->id,
                            'status' => 'active'
                        ],
                        [
                            'plan_id' => $plan->id,
                            'status' => 'active',
                            'epayco_subscription_id' => $reference,
                            'payment_method' => $paymentMethod,
                            'starts_at' => now(),
                            'current_period_start' => now(),
                            'current_period_end' => $plan->billing_cycle === 'yearly'
                                ? now()->addYear()
                                : now()->addMonth(),
                            'last_payment_at' => now(),
                            'next_payment_at' => $plan->billing_cycle === 'yearly'
                                ? now()->addYear()
                                : now()->addMonth()
                        ]
                    );

                    // Registrar pago
                    Payment::create([
                        'subscription_id' => $subscription->id,
                        'user_id' => $user->id,
                        'epayco_reference' => $reference,
                        'epayco_transaction_id' => $transactionId,
                        'epayco_response' => json_encode($request->all()),
                        'amount' => $amount,
                        'currency' => $currency,
                        'status' => 'approved',
                        'payment_method' => $paymentMethod,
                        'description' => 'Pago de suscripción ' . $plan->display_name,
                        'paid_at' => now()
                    ]);

                    Log::info('Subscription activated successfully', [
                        'user_id' => $user->id,
                        'subscription_id' => $subscription->id,
                        'plan' => $plan->name,
                        'reference' => $reference
                    ]);
                });

                // Aquí podrías enviar email de confirmación
                // Mail::to($user->email)->send(new SubscriptionActivated($subscription));

            } elseif ($status === 'Rechazada') {
                // Registrar pago rechazado
                $subscription = $user->activeSubscription();

                if ($subscription) {
                    Payment::create([
                        'subscription_id' => $subscription->id,
                        'user_id' => $user->id,
                        'epayco_reference' => $reference,
                        'epayco_transaction_id' => $transactionId,
                        'epayco_response' => json_encode($request->all()),
                        'amount' => $amount,
                        'currency' => $currency,
                        'status' => 'rejected',
                        'payment_method' => $paymentMethod,
                        'description' => 'Pago rechazado - ' . $plan->display_name,
                    ]);
                }

                Log::warning('Payment rejected', [
                    'user_id' => $user->id,
                    'reference' => $reference,
                    'reason' => $request->input('x_response_reason_text')
                ]);

            } elseif ($status === 'Pendiente') {
                // Registrar pago pendiente
                $subscription = $user->activeSubscription();

                if ($subscription) {
                    Payment::create([
                        'subscription_id' => $subscription->id,
                        'user_id' => $user->id,
                        'epayco_reference' => $reference,
                        'epayco_transaction_id' => $transactionId,
                        'epayco_response' => json_encode($request->all()),
                        'amount' => $amount,
                        'currency' => $currency,
                        'status' => 'pending',
                        'payment_method' => $paymentMethod,
                        'description' => 'Pago pendiente - ' . $plan->display_name,
                    ]);
                }

                Log::info('Payment pending', [
                    'user_id' => $user->id,
                    'reference' => $reference
                ]);
            }

            return response()->json(['success' => true]);

        } catch (\Exception $e) {
            Log::error('Error processing ePayco webhook', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'data' => $request->all()
            ]);

            return response()->json([
                'error' => 'Error processing webhook',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Página de respuesta después del pago (donde redirige ePayco)
     * Este no es un webhook, es donde el usuario es redirigido después del pago
     */
    public function epaycoResponse(Request $request)
    {
        // Esta página generalmente redirige al frontend con los parámetros
        $status = $request->input('ref_payco') ? 'success' : 'error';
        $reference = $request->input('ref_payco');

        // Redirigir al frontend con los parámetros
        $frontendUrl = config('app.frontend_url', 'http://localhost:3000');

        return redirect()->to(
            $frontendUrl . '/checkout/response?' . http_build_query([
                'status' => $status,
                'reference' => $reference,
                'transaction_id' => $request->input('x_transaction_id')
            ])
        );
    }
}
