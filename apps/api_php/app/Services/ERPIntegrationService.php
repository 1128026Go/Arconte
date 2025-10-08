<?php

namespace App\Services;

use App\Models\Invoice;
use App\Models\CaseModel;
use Illuminate\Support\Facades\Http;

class ERPIntegrationService
{
    /**
     * Integración con SIIGO (ERP colombiano popular)
     */
    public function syncToSIIGO(Invoice $invoice): array
    {
        try {
            $accessToken = $this->getSIIGOAccessToken();

            $response = Http::timeout(30)
                ->withHeaders([
                    'Authorization' => 'Bearer ' . $accessToken,
                    'Content-Type' => 'application/json',
                ])
                ->post(env('SIIGO_API_URL', 'https://api.siigo.com') . '/v1/invoices', [
                    'document' => [
                        'id' => 24446, // ID tipo documento factura
                    ],
                    'date' => $invoice->created_at->format('Y-m-d'),
                    'customer' => [
                        'identification' => $invoice->client_nit ?? '',
                        'branch_office' => 0,
                    ],
                    'cost_center' => 235, // Centro de costos
                    'seller' => 629, // ID vendedor
                    'observations' => $invoice->notes ?? '',
                    'items' => collect($invoice->items)->map(function ($item) {
                        return [
                            'code' => $item->sku ?? 'SERV-001',
                            'description' => $item->description,
                            'quantity' => $item->quantity,
                            'price' => $item->price,
                            'total' => $item->amount,
                        ];
                    })->toArray(),
                    'payments' => [
                        [
                            'id' => 5636, // Método de pago
                            'value' => $invoice->total,
                            'due_date' => $invoice->due_date?->format('Y-m-d'),
                        ],
                    ],
                ]);

            if ($response->successful()) {
                return [
                    'success' => true,
                    'siigo_id' => $response->json()['id'] ?? null,
                    'message' => 'Factura sincronizada con SIIGO',
                ];
            }

            return [
                'success' => false,
                'error' => $response->json()['errors'] ?? 'Error al sincronizar con SIIGO',
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
     * Integración con Contapyme
     */
    public function syncToContapyme(Invoice $invoice): array
    {
        try {
            $response = Http::timeout(30)
                ->withHeaders([
                    'Authorization' => 'Bearer ' . env('CONTAPYME_API_KEY'),
                    'Content-Type' => 'application/json',
                ])
                ->post(env('CONTAPYME_API_URL', 'https://api.contapyme.com') . '/facturas', [
                    'numero' => $invoice->invoice_number,
                    'fecha' => $invoice->created_at->format('Y-m-d'),
                    'cliente' => [
                        'nit' => $invoice->client_nit ?? '',
                        'nombre' => $invoice->client_name ?? '',
                    ],
                    'items' => collect($invoice->items)->map(function ($item) {
                        return [
                            'descripcion' => $item->description,
                            'cantidad' => $item->quantity,
                            'valor_unitario' => $item->price,
                            'valor_total' => $item->amount,
                        ];
                    })->toArray(),
                    'subtotal' => $invoice->subtotal,
                    'impuestos' => $invoice->tax ?? 0,
                    'total' => $invoice->total,
                ]);

            if ($response->successful()) {
                return [
                    'success' => true,
                    'contapyme_id' => $response->json()['id'] ?? null,
                    'message' => 'Factura sincronizada con Contapyme',
                ];
            }

            return [
                'success' => false,
                'error' => 'Error al sincronizar con Contapyme',
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
     * Integración con SAP Business One
     */
    public function syncToSAP(Invoice $invoice): array
    {
        try {
            // SAP Service Layer API
            $sessionId = $this->getSAPSessionId();

            $response = Http::timeout(30)
                ->withHeaders([
                    'Cookie' => 'B1SESSION=' . $sessionId,
                    'Content-Type' => 'application/json',
                ])
                ->post(env('SAP_API_URL', 'https://sap-server:50000/b1s/v1') . '/Invoices', [
                    'CardCode' => $invoice->client_nit ?? 'C00001',
                    'DocDate' => $invoice->created_at->format('Y-m-d'),
                    'DocDueDate' => $invoice->due_date?->format('Y-m-d'),
                    'Comments' => $invoice->notes ?? '',
                    'DocumentLines' => collect($invoice->items)->map(function ($item, $index) {
                        return [
                            'LineNum' => $index,
                            'ItemCode' => $item->sku ?? 'SERV-001',
                            'ItemDescription' => $item->description,
                            'Quantity' => $item->quantity,
                            'UnitPrice' => $item->price,
                            'LineTotal' => $item->amount,
                        ];
                    })->toArray(),
                ]);

            if ($response->successful()) {
                return [
                    'success' => true,
                    'sap_docnum' => $response->json()['DocNum'] ?? null,
                    'message' => 'Factura sincronizada con SAP',
                ];
            }

            return [
                'success' => false,
                'error' => 'Error al sincronizar con SAP',
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
     * Integración con World Office
     */
    public function syncToWorldOffice(CaseModel $case): array
    {
        try {
            $response = Http::timeout(30)
                ->withHeaders([
                    'Authorization' => 'Bearer ' . env('WORLDOFFICE_API_KEY'),
                    'Content-Type' => 'application/json',
                ])
                ->post(env('WORLDOFFICE_API_URL', 'https://api.worldoffice.com') . '/casos', [
                    'radicado' => $case->radicado,
                    'tipo' => $case->tipo_proceso,
                    'jurisdiccion' => $case->jurisdiccion,
                    'juzgado' => $case->juzgado,
                    'estado' => $case->estado_actual,
                    'demandante' => $case->demandante,
                    'demandado' => $case->demandado,
                    'cuantia' => $case->cuantia,
                ]);

            if ($response->successful()) {
                return [
                    'success' => true,
                    'worldoffice_id' => $response->json()['id'] ?? null,
                    'message' => 'Caso sincronizado con World Office',
                ];
            }

            return [
                'success' => false,
                'error' => 'Error al sincronizar con World Office',
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
     * Webhook genérico para recibir datos de ERPs
     */
    public function handleERPWebhook(string $erpName, array $data): array
    {
        try {
            switch (strtolower($erpName)) {
                case 'siigo':
                    return $this->processSIIGOWebhook($data);
                case 'contapyme':
                    return $this->processContapymeWebhook($data);
                case 'sap':
                    return $this->processSAPWebhook($data);
                case 'worldoffice':
                    return $this->processWorldOfficeWebhook($data);
                default:
                    return [
                        'success' => false,
                        'error' => 'ERP no soportado',
                    ];
            }
        } catch (\Exception $e) {
            report($e);
            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Obtener access token de SIIGO
     */
    protected function getSIIGOAccessToken(): string
    {
        $cached = cache('siigo_access_token');
        if ($cached) {
            return $cached;
        }

        try {
            $response = Http::asForm()->post(env('SIIGO_API_URL') . '/auth', [
                'username' => env('SIIGO_USERNAME'),
                'access_key' => env('SIIGO_ACCESS_KEY'),
            ]);

            if ($response->successful()) {
                $token = $response->json()['access_token'];
                cache(['siigo_access_token' => $token], now()->addMinutes(50));
                return $token;
            }
        } catch (\Exception $e) {
            report($e);
        }

        return '';
    }

    /**
     * Obtener session ID de SAP
     */
    protected function getSAPSessionId(): string
    {
        $cached = cache('sap_session_id');
        if ($cached) {
            return $cached;
        }

        try {
            $response = Http::post(env('SAP_API_URL') . '/Login', [
                'CompanyDB' => env('SAP_COMPANY_DB'),
                'UserName' => env('SAP_USERNAME'),
                'Password' => env('SAP_PASSWORD'),
            ]);

            if ($response->successful()) {
                $sessionId = $response->json()['SessionId'];
                cache(['sap_session_id' => $sessionId], now()->addMinutes(30));
                return $sessionId;
            }
        } catch (\Exception $e) {
            report($e);
        }

        return '';
    }

    /**
     * Procesar webhooks de ERPs
     */
    protected function processSIIGOWebhook(array $data): array
    {
        // Implementar lógica específica de SIIGO
        return ['success' => true, 'processed' => 'siigo'];
    }

    protected function processContapymeWebhook(array $data): array
    {
        return ['success' => true, 'processed' => 'contapyme'];
    }

    protected function processSAPWebhook(array $data): array
    {
        return ['success' => true, 'processed' => 'sap'];
    }

    protected function processWorldOfficeWebhook(array $data): array
    {
        return ['success' => true, 'processed' => 'worldoffice'];
    }
}
