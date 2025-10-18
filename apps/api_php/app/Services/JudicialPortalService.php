<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class JudicialPortalService
{
    private string $baseUrl = 'https://consultaprocesos.ramajudicial.gov.co';
    private string $apiUrl;

    public function __construct()
    {
        // URL del servicio de ingest configurado via .env
        $this->apiUrl = rtrim(env('INGEST_BASE_URL', 'http://127.0.0.1:8001'), '/');
    }

    /**
     * Consultar publicaciones de un radicado
     *
     * @param string $radicado
     * @return array|null
     */
    public function consultarPublicaciones(string $radicado): ?array
    {
        try {
            Log::info("Consultando publicaciones para radicado: {$radicado}");

            // Usar nuestro servicio de ingest configurado
            $response = Http::timeout(30)
                ->withHeaders([
                    'X-API-Key' => env('INGEST_API_KEY', '')
                ])
                ->get("{$this->apiUrl}/ingest/ramajud-normalized/{$radicado}");

            if (!$response->successful()) {
                Log::warning("Error al consultar radicado {$radicado}", [
                    'status' => $response->status(),
                    'body' => $response->body()
                ]);
                return null;
            }

            $data = $response->json();

            // Extraer y normalizar actuaciones (la API devuelve 'acts')
            $actuaciones = $data['acts'] ?? [];

            return [
                'radicado' => $radicado,
                'fecha_consulta' => now(),
                'total_actuaciones' => count($actuaciones),
                'actuaciones' => $actuaciones,
                'metadata' => [
                    'juzgado' => $data['case']['despacho'] ?? $data['case']['court'] ?? null,
                    'tipo_proceso' => $data['case']['tipo_proceso'] ?? null,
                    'estado' => $data['case']['estado_actual'] ?? $data['case']['status'] ?? null,
                ]
            ];
        } catch (\Exception $e) {
            Log::error("Excepcion al consultar radicado {$radicado}", [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return null;
        }
    }

    /**
     * Detectar si hay nuevas actuaciones comparando con las existentes
     *
     * @param array $actuacionesNuevas
     * @param array $actuacionesExistentes
     * @return array
     */
    public function detectarNuevasActuaciones(array $actuacionesNuevas, array $actuacionesExistentes): array
    {
        $hashesExistentes = array_map(function ($act) {
            return $this->generarHashActuacion($act);
        }, $actuacionesExistentes);

        $nuevas = [];

        foreach ($actuacionesNuevas as $actuacion) {
            $hash = $this->generarHashActuacion($actuacion);

            if (!in_array($hash, $hashesExistentes)) {
                $nuevas[] = array_merge($actuacion, ['hash' => $hash]);
            }
        }

        return $nuevas;
    }

    /**
     * Generar hash unico para una actuacion
     */
    private function generarHashActuacion(array $actuacion): string
    {
        // Crear un hash basado en fecha + tipo + descripcion
        $string = implode('|', [
            $actuacion['fecha'] ?? '',
            $actuacion['tipo'] ?? '',
            $actuacion['descripcion'] ?? '',
            $actuacion['documento_url'] ?? ''
        ]);

        return md5($string);
    }

    /**
     * Descargar contenido de un documento (si es posible)
     *
     * @param string $url
     * @return string|null
     */
    public function descargarContenidoDocumento(string $url): ?string
    {
        try {
            if (empty($url)) {
                return null;
            }

            Log::info("Descargando documento: {$url}");

            $response = Http::timeout(60)->get($url);

            if (!$response->successful()) {
                Log::warning("No se pudo descargar documento", [
                    'url' => $url,
                    'status' => $response->status()
                ]);
                return null;
            }

            $contentType = $response->header('Content-Type');

            // Si es PDF, necesitaremos OCR
            if (is_string($contentType) && stripos($contentType, 'pdf') !== false) {
                Log::info("Documento es PDF, requiere OCR", [
                    'url' => $url,
                    'ocr_enabled' => env('OCR_ENABLED', false)
                ]);

                // OCR no esta implementado actualmente (OCR_ENABLED=false en .env)
                // Para implementar, considerar: Tesseract, Google Vision API, o pdftotext
                // Retornamos null por ahora, el documento se guarda pero sin texto extraido
                return null;
            }

            // Si es texto plano o HTML, podemos extraer directamente
            if (is_string($contentType) && (stripos($contentType, 'text') !== false || stripos($contentType, 'html') !== false)) {
                $contenido = $response->body();

                // Limpiar HTML si es necesario
                if (stripos($contentType, 'html') !== false) {
                    $contenido = strip_tags($contenido);
                }

                return $contenido;
            }

            return null;
        } catch (\Exception $e) {
            Log::error("Error al descargar documento", [
                'url' => $url,
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }

    /**
     * Verificar si una actuacion parece ser un AUTO
     */
    public function esAuto(array $actuacion): bool
    {
        $tipo = strtolower($actuacion['tipo'] ?? '');
        $descripcion = strtolower($actuacion['descripcion'] ?? '');

        $keywords = ['auto', 'providencia', 'resolucion'];

        foreach ($keywords as $keyword) {
            if (str_contains($tipo, $keyword) || str_contains($descripcion, $keyword)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Extraer texto para clasificacion (de descripcion o documento)
     */
    public function extraerTextoParaClasificacion(array $actuacion): string
    {
        $textos = [];

        // Siempre incluir tipo y descripcion
        if (!empty($actuacion['tipo'])) {
            $textos[] = "TIPO: " . $actuacion['tipo'];
        }

        if (!empty($actuacion['descripcion'])) {
            $textos[] = "DESCRIPCION: " . $actuacion['descripcion'];
        }

        // Si hay URL de documento, intentar descargarlo
        if (!empty($actuacion['documento_url'])) {
            $contenidoDoc = $this->descargarContenidoDocumento($actuacion['documento_url']);
            if ($contenidoDoc) {
                $textos[] = "CONTENIDO DOCUMENTO: " . $contenidoDoc;
            }
        }

        return implode("\n\n", $textos);
    }
}

