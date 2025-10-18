<?php

namespace App\Services;

use Epayco\Epayco;
use Illuminate\Support\Facades\Log;

class EpaycoService
{
    protected $epayco;

    public function __construct()
    {
        $this->epayco = new Epayco([
            'apiKey' => config('services.epayco.public_key'),
            'privateKey' => config('services.epayco.private_key'),
            'lenguage' => 'ES',
            'test' => config('services.epayco.test_mode')
        ]);
    }

    /**
     * Crear un checkout de pago
     */
    public function createCheckout(array $data)
    {
        try {
            Log::info('ePayco: Creating checkout', ['data' => $data]);

            $publicKey = config('services.epayco.public_key');
            $testMode = config('services.epayco.test_mode') ? 'true' : 'false';

            // Detectar si usar simulación (credenciales de prueba o no configuradas)
            $useSimulation = config('app.env') === 'local' ||
                            empty($publicKey) ||
                            $publicKey === '492839313953e25211ddec234f00cb0b'; // Credenciales de prueba default

            if ($useSimulation) {
                // Modo de simulación para desarrollo
                $frontendUrl = config('app.frontend_url', 'http://localhost:3000');
                $checkoutUrl = $frontendUrl . '/checkout/simulation?' . http_build_query([
                    'name' => $data['name'],
                    'description' => $data['description'],
                    'invoice' => $data['invoice'],
                    'amount' => $data['amount'],
                    'response' => $data['response']
                ]);

                Log::info('ePayco: Using simulation mode', [
                    'url' => $checkoutUrl,
                    'reason' => 'Development environment or test credentials'
                ]);
            } else {
                // Construir la URL de pago real de ePayco
                $checkoutUrl = 'https://checkout.epayco.co/checkout?' . http_build_query([
                    'public-key' => $publicKey,
                    'name' => $data['name'],
                    'description' => $data['description'],
                    'invoice' => $data['invoice'],
                    'currency' => $data['currency'],
                    'amount' => $data['amount'],
                    'tax_base' => $data['tax_base'],
                    'tax' => $data['tax'],
                    'country' => $data['country'],
                    'lang' => $data['lang'],
                    'external' => $data['external'],
                    'extra1' => $data['extra1'],
                    'extra2' => $data['extra2'],
                    'extra3' => $data['extra3'],
                    'confirmation' => $data['confirmation'],
                    'response' => $data['response'],
                    'email_billing' => $data['email_billing'],
                    'name_billing' => $data['name_billing'],
                    'test' => $testMode
                ]);

                Log::info('ePayco: Using real payment gateway', [
                    'url' => $checkoutUrl
                ]);
            }

            $response = (object) [
                'success' => true,
                'url' => $checkoutUrl,
                'invoice' => $data['invoice'],
                'simulation' => $useSimulation
            ];

            return $response;
        } catch (\Exception $e) {
            Log::error('ePayco Checkout Error', [
                'message' => $e->getMessage(),
                'data' => $data,
                'trace' => $e->getTraceAsString()
            ]);
            throw $e;
        }
    }

    /**
     * Crear un cliente en ePayco
     */
    public function createCustomer(array $data)
    {
        try {
            Log::info('ePayco: Creating customer', ['data' => $data]);

            $response = $this->epayco->customer->create($data);

            Log::info('ePayco: Customer created successfully', [
                'customer_id' => $response->data->customerId ?? null
            ]);

            return $response;
        } catch (\Exception $e) {
            Log::error('ePayco Customer Creation Error', [
                'message' => $e->getMessage(),
                'data' => $data,
                'trace' => $e->getTraceAsString()
            ]);
            throw $e;
        }
    }

    /**
     * Crear una suscripción recurrente
     */
    public function createSubscription(array $data)
    {
        try {
            Log::info('ePayco: Creating subscription', ['data' => $data]);

            $response = $this->epayco->subscription->create($data);

            Log::info('ePayco: Subscription created successfully', [
                'subscription_id' => $response->subscription->id ?? null
            ]);

            return $response;
        } catch (\Exception $e) {
            Log::error('ePayco Subscription Error', [
                'message' => $e->getMessage(),
                'data' => $data,
                'trace' => $e->getTraceAsString()
            ]);
            throw $e;
        }
    }

    /**
     * Cancelar una suscripción
     */
    public function cancelSubscription(string $subscriptionId)
    {
        try {
            Log::info('ePayco: Cancelling subscription', [
                'subscription_id' => $subscriptionId
            ]);

            $response = $this->epayco->subscription->cancel($subscriptionId);

            Log::info('ePayco: Subscription cancelled successfully', [
                'subscription_id' => $subscriptionId
            ]);

            return $response;
        } catch (\Exception $e) {
            Log::error('ePayco Cancel Subscription Error', [
                'message' => $e->getMessage(),
                'subscription_id' => $subscriptionId,
                'trace' => $e->getTraceAsString()
            ]);
            throw $e;
        }
    }

    /**
     * Obtener información de una transacción
     */
    public function getTransaction(string $transactionId)
    {
        try {
            Log::info('ePayco: Getting transaction', [
                'transaction_id' => $transactionId
            ]);

            $response = $this->epayco->charge->get($transactionId);

            Log::info('ePayco: Transaction retrieved successfully', [
                'transaction_id' => $transactionId,
                'status' => $response->data->x_response ?? null
            ]);

            return $response;
        } catch (\Exception $e) {
            Log::error('ePayco Get Transaction Error', [
                'message' => $e->getMessage(),
                'transaction_id' => $transactionId,
                'trace' => $e->getTraceAsString()
            ]);
            throw $e;
        }
    }

    /**
     * Crear un plan de suscripción en ePayco
     */
    public function createPlan(array $data)
    {
        try {
            Log::info('ePayco: Creating plan', ['data' => $data]);

            $response = $this->epayco->plan->create($data);

            Log::info('ePayco: Plan created successfully', [
                'plan_id' => $response->id ?? null
            ]);

            return $response;
        } catch (\Exception $e) {
            Log::error('ePayco Create Plan Error', [
                'message' => $e->getMessage(),
                'data' => $data,
                'trace' => $e->getTraceAsString()
            ]);
            throw $e;
        }
    }

    /**
     * Validar firma de webhook
     */
    public function validateSignature(string $signature, array $data): bool
    {
        try {
            $privateKey = config('services.epayco.private_key');

            // Concatenar los datos según documentación de ePayco
            $stringToHash = implode('^', [
                $privateKey,
                $data['x_cust_id_cliente'] ?? '',
                $data['x_ref_payco'] ?? '',
                $data['x_transaction_id'] ?? '',
                $data['x_amount'] ?? '',
                $data['x_currency_code'] ?? ''
            ]);

            $calculatedSignature = hash('sha256', $stringToHash);

            $isValid = hash_equals($calculatedSignature, $signature);

            Log::info('ePayco: Signature validation', [
                'is_valid' => $isValid,
                'received_signature' => $signature,
                'calculated_signature' => $calculatedSignature
            ]);

            return $isValid;
        } catch (\Exception $e) {
            Log::error('ePayco Signature Validation Error', [
                'message' => $e->getMessage(),
                'signature' => $signature
            ]);
            return false;
        }
    }
}
