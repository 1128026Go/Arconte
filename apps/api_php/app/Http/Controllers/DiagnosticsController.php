<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;

class DiagnosticsController extends Controller
{
    /**
     * Limpiar todos los cachés de Laravel
     * Ejecuta config:clear, cache:clear, route:clear, view:clear
     */
    public function clearCaches(Request $request)
    {
        $results = [];

        try {
            Artisan::call('config:clear');
            $results['config'] = 'cleared';
        } catch (\Exception $e) {
            $results['config'] = 'error: ' . $e->getMessage();
        }

        try {
            Artisan::call('cache:clear');
            $results['cache'] = 'cleared';
        } catch (\Exception $e) {
            $results['cache'] = 'error: ' . $e->getMessage();
        }

        try {
            Artisan::call('route:clear');
            $results['route'] = 'cleared';
        } catch (\Exception $e) {
            $results['route'] = 'error: ' . $e->getMessage();
        }

        try {
            Artisan::call('view:clear');
            $results['view'] = 'cleared';
        } catch (\Exception $e) {
            $results['view'] = 'error: ' . $e->getMessage();
        }

        return response()->json([
            'ok' => true,
            'message' => 'Cachés limpiados exitosamente',
            'results' => $results,
        ]);
    }

    /**
     * Probar endpoint /auth/me con headers no-cache
     * Simula una petición como la que hace el frontend
     */
    public function testAuthMe(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'ok' => false,
                'message' => 'Usuario no autenticado',
            ], 401);
        }

        // Verificar headers de la request actual
        $requestHeaders = [
            'Cache-Control' => $request->header('Cache-Control'),
            'Pragma' => $request->header('Pragma'),
        ];

        // Simular respuesta como la que da /auth/me
        $responseData = [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ],
        ];

        return response()->json([
            'ok' => true,
            'message' => 'Endpoint /auth/me funcionando correctamente',
            'request_headers' => $requestHeaders,
            'response_data' => $responseData,
            'session_id' => $request->session()->getId(),
            'expected_response_headers' => [
                'Cache-Control' => 'no-store, no-cache, must-revalidate',
                'Pragma' => 'no-cache',
                'Expires' => '0',
            ],
        ])
            ->header('Cache-Control', 'no-store, no-cache, must-revalidate')
            ->header('Pragma', 'no-cache')
            ->header('Expires', '0');
    }

    /**
     * Probar funcionamiento de CSRF token
     * Verifica que el token esté presente y sea válido
     */
    public function testCsrf(Request $request)
    {
        $csrfToken = $request->session()->token();
        $headerToken = $request->header('X-XSRF-TOKEN');
        $cookieToken = $request->cookie('XSRF-TOKEN');

        return response()->json([
            'ok' => true,
            'message' => 'CSRF funcionando correctamente',
            'session_token' => $csrfToken,
            'header_token' => $headerToken,
            'cookie_token' => $cookieToken,
            'tokens_match' => $csrfToken === $headerToken || $csrfToken === urldecode($cookieToken ?? ''),
            'session' => [
                'id' => $request->session()->getId(),
                'driver' => config('session.driver'),
                'same_site' => config('session.same_site'),
                'domain' => config('session.domain'),
            ],
            'sanctum_stateful_domains' => config('sanctum.stateful'),
        ]);
    }

    /**
     * Ver métricas del servicio Ingest (Python)
     * Proxy a /metrics del servicio ingest_py
     */
    public function viewMetrics()
    {
        $ingestUrl = rtrim(env('INGEST_BASE_URL', 'http://127.0.0.1:8001'), '/');

        try {
            $response = Http::timeout(5)->get($ingestUrl . '/metrics');

            if (!$response->successful()) {
                return response()->json([
                    'ok' => false,
                    'message' => 'Error al obtener métricas del servicio Ingest',
                    'status' => $response->status(),
                    'ingest_url' => $ingestUrl,
                ], $response->status());
            }

            $metrics = $response->json();

            return response()->json([
                'ok' => true,
                'message' => 'Métricas obtenidas exitosamente',
                'metrics' => $metrics,
                'ingest_url' => $ingestUrl,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'ok' => false,
                'message' => 'Error al conectar con servicio Ingest',
                'error' => $e->getMessage(),
                'ingest_url' => $ingestUrl,
            ], 503);
        }
    }

    /**
     * Vista general de diagnósticos del sistema
     * Recopila información de todos los componentes críticos
     */
    public function overview()
    {
        // Database
        $dbStatus = false;
        $dbInfo = [];
        try {
            DB::connection()->getPdo();
            $dbStatus = true;
            $dbInfo = [
                'connection' => config('database.default'),
                'host' => config('database.connections.' . config('database.default') . '.host'),
                'database' => config('database.connections.' . config('database.default') . '.database'),
            ];
        } catch (\Exception $e) {
            $dbInfo['error'] = $e->getMessage();
        }

        // Queue
        $queueSize = Queue::size('default');
        $queueStatus = $queueSize < 100;

        // Session
        $sessionInfo = [
            'driver' => config('session.driver'),
            'lifetime' => config('session.lifetime'),
            'same_site' => config('session.same_site'),
            'domain' => config('session.domain'),
        ];

        // Sanctum
        $sanctumInfo = [
            'stateful_domains' => config('sanctum.stateful'),
            'expiration' => config('sanctum.expiration'),
        ];

        // Ingest Service
        $ingestStatus = false;
        $ingestInfo = [];
        try {
            $ingestUrl = rtrim(env('INGEST_BASE_URL'), '/');
            $response = Http::timeout(3)->get($ingestUrl . '/healthz');
            $ingestStatus = $response->successful();
            $ingestInfo['url'] = $ingestUrl;
            if ($ingestStatus) {
                $metricsResponse = Http::timeout(3)->get($ingestUrl . '/metrics');
                if ($metricsResponse->successful()) {
                    $ingestInfo['metrics'] = $metricsResponse->json();
                }
            }
        } catch (\Exception $e) {
            $ingestInfo['error'] = $e->getMessage();
        }

        // Cache
        $cacheInfo = [
            'driver' => config('cache.default'),
        ];

        return response()->json([
            'ok' => $dbStatus && $queueStatus && $ingestStatus,
            'timestamp' => now()->toIso8601String(),
            'components' => [
                'database' => [
                    'status' => $dbStatus ? 'ok' : 'error',
                    'info' => $dbInfo,
                ],
                'queue' => [
                    'status' => $queueStatus ? 'ok' : 'warning',
                    'size' => $queueSize,
                ],
                'session' => [
                    'info' => $sessionInfo,
                ],
                'sanctum' => [
                    'info' => $sanctumInfo,
                ],
                'ingest_service' => [
                    'status' => $ingestStatus ? 'ok' : 'error',
                    'info' => $ingestInfo,
                ],
                'cache' => [
                    'info' => $cacheInfo,
                ],
            ],
            'environment' => [
                'app_env' => config('app.env'),
                'app_debug' => config('app.debug'),
                'app_url' => config('app.url'),
            ],
        ]);
    }

    /**
     * Probar conectividad con Rama Judicial
     * Via servicio Ingest con circuit breaker
     */
    public function testRamaJudicial(Request $request)
    {
        $radicado = $request->input('radicado', '11001400300120230000100'); // Radicado de prueba por defecto

        try {
            $ingestUrl = rtrim(env('INGEST_BASE_URL'), '/');
            $response = Http::withHeaders([
                'X-API-Key' => env('INGEST_API_KEY'),
            ])->timeout(30)->get($ingestUrl . '/ingest/ramajud-normalized/' . urlencode($radicado));

            if ($response->successful()) {
                return response()->json([
                    'ok' => true,
                    'message' => 'Rama Judicial responde correctamente',
                    'radicado' => $radicado,
                    'data' => $response->json(),
                ]);
            } else {
                return response()->json([
                    'ok' => false,
                    'message' => 'Error en respuesta de Rama Judicial',
                    'radicado' => $radicado,
                    'status' => $response->status(),
                    'error' => $response->body(),
                ], $response->status());
            }
        } catch (\Exception $e) {
            return response()->json([
                'ok' => false,
                'message' => 'Error al conectar con Rama Judicial',
                'radicado' => $radicado,
                'error' => $e->getMessage(),
            ], 503);
        }
    }
}
