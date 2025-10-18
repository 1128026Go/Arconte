<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\RequestException;

class IngestClient
{
    protected string $base;
    protected string $apiKey;
    protected int $timeout;
    protected int $retries;

    public function __construct()
    {
        $this->base = rtrim(env("INGEST_BASE_URL", "http://127.0.0.1:8001"), "/");
        $this->apiKey = env("INGEST_API_KEY", "");
        $this->timeout = (int) env("INGEST_TIMEOUT", 45); // Timeout reducido para fallback rapido
        $this->retries = (int) env("INGEST_RETRIES", 2);  // Reintentos con backoff
    }

    /**
     * Obtiene datos normalizados de un radicado desde el servicio de ingest.
     *
     * @param string $radicado Numero de radicado (23 digitos)
     * @return array Datos normalizados con case, parties y acts
     * @throws \RuntimeException Si el servicio no esta disponible o falla
     */
    public function normalized(string $radicado): array
    {
        Log::info('ingest_client.request', [
            'radicado' => $radicado,
            'endpoint' => '/ingest/ramajud-normalized'
        ]);

        try {
            $response = Http::timeout($this->timeout)
                ->retry($this->retries, 500, function ($exception, $request) {
                    // Solo retry en errores de conexion o 5xx
                    if ($exception instanceof ConnectionException) {
                        return true;
                    }
                    if ($exception instanceof RequestException) {
                        return $exception->response->status() >= 500;
                    }
                    return false;
                })
                ->withHeaders([
                    'X-API-Key' => $this->apiKey,
                    'Accept' => 'application/json',
                ])
                ->get($this->base . '/ingest/ramajud-normalized/' . urlencode($radicado));

            // Manejar diferentes codigos de error con mensajes especificos
            if (!$response->successful()) {
                $status = $response->status();
                $body = $response->body();

                Log::error('ingest_client.error', [
                    'radicado' => $radicado,
                    'status' => $status,
                    'body' => substr($body, 0, 500), // Primeros 500 caracteres
                ]);

                // Errores de autenticacion
                if ($status === 401 || $status === 403) {
                    throw new \RuntimeException(
                        "Error de autenticacion con servicio de ingest (HTTP {$status}). Verifique INGEST_API_KEY."
                    );
                }

                // Error de radicado no encontrado
                if ($status === 404) {
                    throw new \RuntimeException(
                        "Radicado {$radicado} no encontrado en la Rama Judicial."
                    );
                }

                // Errores del servidor externo (Rama Judicial)
                if ($status === 502 || $status === 503) {
                    throw new \RuntimeException(
                        "El servicio de Rama Judicial no esta disponible temporalmente. Por favor intente mas tarde."
                    );
                }

                // Otros errores
                throw new \RuntimeException(
                    "Error al consultar servicio de ingest (HTTP {$status}): {$body}"
                );
            }

            $data = $response->json();

            Log::info('ingest_client.success', [
                'radicado' => $radicado,
                'has_case' => isset($data['case']),
                'parties_count' => count($data['parties'] ?? []),
                'acts_count' => count($data['acts'] ?? []),
            ]);

            return $data;

        } catch (ConnectionException $e) {
            Log::error('ingest_client.connection_failed', [
                'radicado' => $radicado,
                'error' => $e->getMessage(),
                'base_url' => $this->base,
            ]);

            throw new \RuntimeException(
                "No se pudo conectar al servicio de ingest en {$this->base}. Verifique que el servicio esta corriendo."
            );

        } catch (\RuntimeException $e) {
            // Re-lanzar RuntimeExceptions que ya tienen mensajes especificos
            throw $e;

        } catch (\Exception $e) {
            Log::error('ingest_client.unexpected_error', [
                'radicado' => $radicado,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            throw new \RuntimeException(
                "Error inesperado al consultar servicio de ingest: {$e->getMessage()}"
            );
        }
    }

    /**
     * Verifica si el servicio de ingest esta disponible.
     *
     * @return bool
     */
    public function health(): bool
    {
        try {
            $response = Http::timeout(5)->get($this->base . '/healthz');
            return $response->successful();
        } catch (\Exception $e) {
            return false;
        }
    }
}


