<?php

namespace App\Services;

use App\Models\PaymentEscrow;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class ColombianPaymentGatewayService
{
    protected string $pseApiUrl;
    protected string $nequiApiUrl;
    protected string $daviplataApiUrl;

    public function __construct()
    {
        $this->pseApiUrl = env('PSE_API_URL', 'https://checkout.paymentez.com/api/v2');
        $this->nequiApiUrl = env('NEQUI_API_URL', 'https://api.nequi.com.co');
        $this->daviplataApiUrl = env('DAVIPLATA_API_URL', 'https://api.daviplata.com');
    }

    /**
     * Procesar pago PSE (Pagos Seguros en Línea)
     */
    public function processPSEPayment(PaymentEscrow $escrow, array $paymentData): array
    {
        try {
            $response = Http::timeout(30)
                ->withHeaders([
                    'Content-Type' => 'application/json',
                    'Auth-Token' => env('PSE_AUTH_TOKEN'),
                ])
                ->post($this->pseApiUrl . '/transaction/debit', [
                    'carrier' => [
                        'id' => 'pse',
                        'extra_params' => [
                            'bank_code' => $paymentData['bank_code'],
                            'response_url' => route('payment.pse.callback'),
                            'user' => [
                                'name' => $paymentData['user_name'],
                                'fiscal_number' => $paymentData['document_number'],
                                'type' => $paymentData['document_type'] ?? 'CC', // CC, CE, NIT
                                'ip_address' => request()->ip(),
                            ],
                        ],
                    ],
                    'user' => [
                        'id' => $escrow->payer_id,
                        'email' => $paymentData['email'],
                    ],
                    'order' => [
                        'amount' => $escrow->monto,
                        'description' => 'Pago caso legal - Escrow ID: ' . $escrow->id,
                        'dev_reference' => 'ESCROW-' . $escrow->id,
                        'vat' => 0,
                    ],
                ]);

            if ($response->successful()) {
                $data = $response->json();

                // Actualizar escrow
                $escrow->update([
                    'payment_method' => 'pse',
                    'transaction_id' => $data['transaction']['id'] ?? null,
                    'payment_reference' => $data['transaction']['carrier_code'] ?? null,
                    'estado' => 'pending',
                ]);

                return [
                    'success' => true,
                    'redirect_url' => $data['transaction']['carrier_redirect_url'] ?? null,
                    'transaction_id' => $data['transaction']['id'] ?? null,
                ];
            }

            return [
                'success' => false,
                'error' => $response->json()['error']['description'] ?? 'Error en PSE',
            ];
        } catch (\Exception $e) {
            report($e);
            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Obtener lista de bancos PSE
     */
    public function getPSEBanks(): array
    {
        try {
            $response = Http::timeout(10)
                ->withHeaders([
                    'Auth-Token' => env('PSE_AUTH_TOKEN'),
                ])
                ->get($this->pseApiUrl . '/pse/banks');

            if ($response->successful()) {
                return $response->json()['banks'] ?? [];
            }

            return [];
        } catch (\Exception $e) {
            report($e);
            return [];
        }
    }

    /**
     * Procesar pago Nequi (Push Notification)
     */
    public function processNequiPayment(PaymentEscrow $escrow, array $paymentData): array
    {
        try {
            $messageCode = $this->generateNequiMessageCode();

            $response = Http::timeout(30)
                ->withHeaders([
                    'Content-Type' => 'application/json',
                    'Authorization' => 'Bearer ' . $this->getNequiAccessToken(),
                    'x-api-key' => env('NEQUI_API_KEY'),
                ])
                ->post($this->nequiApiUrl . '/payments/v2/-services-paymentservice-unregisteredpayment', [
                    'RequestMessage' => [
                        'RequestHeader' => [
                            'Channel' => 'PNP04-C001',
                            'RequestDate' => now()->format('Y-m-d H:i:s'),
                            'MessageID' => $messageCode,
                            'ClientID' => env('NEQUI_CLIENT_ID'),
                            'Destination' => [
                                'ServiceName' => 'PaymentsService',
                                'ServiceOperation' => 'unregisteredPayment',
                                'ServiceRegion' => 'C001',
                                'ServiceVersion' => '1.0.0',
                            ],
                        ],
                        'RequestBody' => [
                            'any' => [
                                'unregisteredPaymentRQ' => [
                                    'phoneNumber' => $paymentData['phone_number'],
                                    'code' => $messageCode,
                                    'value' => $escrow->monto,
                                    'reference1' => 'Escrow ID: ' . $escrow->id,
                                ],
                            ],
                        ],
                    ],
                ]);

            if ($response->successful()) {
                $data = $response->json();

                $escrow->update([
                    'payment_method' => 'nequi',
                    'transaction_id' => $data['ResponseMessage']['ResponseBody']['any']['unregisteredPaymentRS']['transactionId'] ?? null,
                    'payment_reference' => $messageCode,
                    'estado' => 'pending',
                ]);

                return [
                    'success' => true,
                    'message' => 'Notificación push enviada a Nequi del usuario',
                    'transaction_id' => $data['ResponseMessage']['ResponseBody']['any']['unregisteredPaymentRS']['transactionId'] ?? null,
                ];
            }

            return [
                'success' => false,
                'error' => 'Error al procesar pago Nequi',
            ];
        } catch (\Exception $e) {
            report($e);
            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Procesar pago Daviplata
     */
    public function processDaviplataPayment(PaymentEscrow $escrow, array $paymentData): array
    {
        try {
            $response = Http::timeout(30)
                ->withHeaders([
                    'Content-Type' => 'application/json',
                    'Authorization' => 'Bearer ' . $this->getDaviplataAccessToken(),
                ])
                ->post($this->daviplataApiUrl . '/v1/payments/collect', [
                    'phone' => $paymentData['phone_number'],
                    'amount' => $escrow->monto,
                    'reference' => 'ESCROW-' . $escrow->id,
                    'description' => 'Pago caso legal',
                    'merchant_id' => env('DAVIPLATA_MERCHANT_ID'),
                ]);

            if ($response->successful()) {
                $data = $response->json();

                $escrow->update([
                    'payment_method' => 'daviplata',
                    'transaction_id' => $data['transaction_id'] ?? null,
                    'payment_reference' => $data['reference'] ?? null,
                    'estado' => 'pending',
                ]);

                return [
                    'success' => true,
                    'message' => 'Notificación enviada a Daviplata del usuario',
                    'transaction_id' => $data['transaction_id'] ?? null,
                ];
            }

            return [
                'success' => false,
                'error' => 'Error al procesar pago Daviplata',
            ];
        } catch (\Exception $e) {
            report($e);
            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Procesar pago con tarjeta (Bancolombia QR, Visa, Mastercard)
     */
    public function processCardPayment(PaymentEscrow $escrow, array $cardData): array
    {
        try {
            $response = Http::timeout(30)
                ->withHeaders([
                    'Content-Type' => 'application/json',
                    'Auth-Token' => env('CARD_PAYMENT_AUTH_TOKEN'),
                ])
                ->post($this->pseApiUrl . '/transaction/debit', [
                    'carrier' => [
                        'id' => 'card',
                        'extra_params' => [
                            'installments' => $cardData['installments'] ?? 1,
                        ],
                    ],
                    'user' => [
                        'id' => $escrow->payer_id,
                        'email' => $cardData['email'],
                    ],
                    'card' => [
                        'number' => $cardData['card_number'],
                        'holder_name' => $cardData['holder_name'],
                        'expiry_month' => $cardData['expiry_month'],
                        'expiry_year' => $cardData['expiry_year'],
                        'cvc' => $cardData['cvc'],
                    ],
                    'order' => [
                        'amount' => $escrow->monto,
                        'description' => 'Pago caso legal - Escrow ID: ' . $escrow->id,
                        'dev_reference' => 'ESCROW-' . $escrow->id,
                        'vat' => 0,
                    ],
                ]);

            if ($response->successful()) {
                $data = $response->json();

                $escrow->update([
                    'payment_method' => 'card',
                    'transaction_id' => $data['transaction']['id'] ?? null,
                    'payment_reference' => $data['transaction']['authorization_code'] ?? null,
                    'estado' => $data['transaction']['status'] === 'success' ? 'funded' : 'pending',
                    'funded_at' => $data['transaction']['status'] === 'success' ? now() : null,
                ]);

                return [
                    'success' => $data['transaction']['status'] === 'success',
                    'transaction_id' => $data['transaction']['id'] ?? null,
                    'status' => $data['transaction']['status'] ?? 'unknown',
                ];
            }

            return [
                'success' => false,
                'error' => $response->json()['error']['description'] ?? 'Error en pago con tarjeta',
            ];
        } catch (\Exception $e) {
            report($e);
            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Verificar estado de transacción
     */
    public function verifyTransaction(string $transactionId, string $method): array
    {
        try {
            $url = match ($method) {
                'pse', 'card' => $this->pseApiUrl . '/transaction/' . $transactionId,
                'nequi' => $this->nequiApiUrl . '/payments/v2/-services-paymentservice-gettransactiondata',
                'daviplata' => $this->daviplataApiUrl . '/v1/payments/status/' . $transactionId,
                default => null,
            };

            if (!$url) {
                return ['error' => 'Método de pago no soportado'];
            }

            $response = Http::timeout(10)->get($url);

            if ($response->successful()) {
                return $response->json();
            }

            return ['error' => 'Error al verificar transacción'];
        } catch (\Exception $e) {
            report($e);
            return ['error' => $e->getMessage()];
        }
    }

    /**
     * Generar código de mensaje Nequi
     */
    protected function generateNequiMessageCode(): string
    {
        return strtoupper(Str::random(10));
    }

    /**
     * Obtener access token de Nequi
     */
    protected function getNequiAccessToken(): string
    {
        $cached = cache('nequi_access_token');
        if ($cached) {
            return $cached;
        }

        try {
            $response = Http::asForm()->post($this->nequiApiUrl . '/oauth/token', [
                'grant_type' => 'client_credentials',
                'client_id' => env('NEQUI_CLIENT_ID'),
                'client_secret' => env('NEQUI_CLIENT_SECRET'),
            ]);

            if ($response->successful()) {
                $token = $response->json()['access_token'];
                cache(['nequi_access_token' => $token], now()->addHours(1));
                return $token;
            }
        } catch (\Exception $e) {
            report($e);
        }

        return '';
    }

    /**
     * Obtener access token de Daviplata
     */
    protected function getDaviplataAccessToken(): string
    {
        $cached = cache('daviplata_access_token');
        if ($cached) {
            return $cached;
        }

        try {
            $response = Http::asForm()->post($this->daviplataApiUrl . '/oauth/token', [
                'grant_type' => 'client_credentials',
                'client_id' => env('DAVIPLATA_CLIENT_ID'),
                'client_secret' => env('DAVIPLATA_CLIENT_SECRET'),
            ]);

            if ($response->successful()) {
                $token = $response->json()['access_token'];
                cache(['daviplata_access_token' => $token], now()->addHours(1));
                return $token;
            }
        } catch (\Exception $e) {
            report($e);
        }

        return '';
    }

    /**
     * Webhook para confirmación de pagos
     */
    public function handlePaymentWebhook(array $data): void
    {
        $transactionId = $data['transaction']['id'] ?? $data['transactionId'] ?? null;

        if (!$transactionId) {
            return;
        }

        $escrow = PaymentEscrow::where('transaction_id', $transactionId)->first();

        if (!$escrow) {
            return;
        }

        $status = $data['transaction']['status'] ?? $data['status'] ?? 'unknown';

        if ($status === 'success' || $status === 'approved') {
            $escrow->update([
                'estado' => 'funded',
                'funded_at' => now(),
            ]);

            // Actualizar marketplace case
            $escrow->marketplaceCase?->update([
                'estado_pago' => 'en_escrow',
                'monto_escrow' => $escrow->monto,
            ]);
        } elseif ($status === 'failed' || $status === 'rejected') {
            $escrow->update([
                'estado' => 'refunded',
                'refunded_at' => now(),
            ]);
        }
    }
}
