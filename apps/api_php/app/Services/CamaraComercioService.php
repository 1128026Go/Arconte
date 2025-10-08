<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;

class CamaraComercioService
{
    protected string $ruesApiUrl;
    protected string $certificadoApiUrl;

    public function __construct()
    {
        $this->ruesApiUrl = env('RUES_API_URL', 'https://www.rues.org.co/RM');
        $this->certificadoApiUrl = env('CERTIFICADO_API_URL', 'https://www.rues.org.co/Certificados');
    }

    /**
     * Verificar empresa en RUES (Registro Único Empresarial y Social)
     */
    public function verificarEmpresa(string $nit): array
    {
        $cacheKey = 'empresa_rues_' . $nit;

        return Cache::remember($cacheKey, now()->addDays(7), function () use ($nit) {
            try {
                $response = Http::timeout(15)
                    ->get($this->ruesApiUrl . '/RUES_Web_Consulta_Criterio', [
                        'Nit' => $nit,
                    ]);

                if ($response->successful()) {
                    $html = $response->body();

                    // Parser HTML para extraer datos
                    $data = $this->parseRUESResponse($html);

                    return [
                        'success' => true,
                        'nit' => $nit,
                        'razon_social' => $data['razon_social'] ?? null,
                        'estado' => $data['estado'] ?? null,
                        'fecha_matricula' => $data['fecha_matricula'] ?? null,
                        'camara' => $data['camara'] ?? null,
                        'categoria' => $data['categoria'] ?? null, // Micro, Pequeña, Mediana, Grande
                        'actividad_economica' => $data['actividad'] ?? null,
                    ];
                }

                return [
                    'success' => false,
                    'error' => 'No se pudo consultar RUES',
                ];
            } catch (\Exception $e) {
                report($e);
                return [
                    'success' => false,
                    'error' => $e->getMessage(),
                ];
            }
        });
    }

    /**
     * Validar representante legal
     */
    public function validarRepresentanteLegal(string $nit, string $cedulaRepresentante): array
    {
        try {
            $empresaData = $this->verificarEmpresa($nit);

            if (!$empresaData['success']) {
                return [
                    'success' => false,
                    'error' => 'Empresa no encontrada',
                ];
            }

            // Consultar representante legal actual
            $response = Http::timeout(15)
                ->get($this->ruesApiUrl . '/RUES_Web_Consulta_Persona', [
                    'Nit' => $nit,
                    'TipoDocumento' => 'CC',
                    'NumeroDocumento' => $cedulaRepresentante,
                ]);

            if ($response->successful()) {
                $html = $response->body();
                $isValid = str_contains($html, 'REPRESENTANTE LEGAL');

                return [
                    'success' => true,
                    'is_valid' => $isValid,
                    'empresa' => $empresaData['razon_social'] ?? null,
                    'representante_valido' => $isValid,
                ];
            }

            return [
                'success' => false,
                'error' => 'No se pudo verificar representante',
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
     * Verificar estado corporativo
     */
    public function verificarEstadoCorporativo(string $nit): array
    {
        $empresaData = $this->verificarEmpresa($nit);

        if (!$empresaData['success']) {
            return $empresaData;
        }

        $estado = strtolower($empresaData['estado'] ?? '');

        return [
            'success' => true,
            'nit' => $nit,
            'razon_social' => $empresaData['razon_social'],
            'estado_legal' => $estado,
            'activa' => str_contains($estado, 'activa') || str_contains($estado, 'matriculada'),
            'en_liquidacion' => str_contains($estado, 'liquidacion'),
            'cancelada' => str_contains($estado, 'cancelada') || str_contains($estado, 'inactiva'),
            'warnings' => $this->generateWarnings($estado),
        ];
    }

    /**
     * Solicitar certificado de existencia y representación legal
     */
    public function solicitarCertificado(string $nit, array $options = []): array
    {
        try {
            // Consultar cuál cámara corresponde
            $empresaData = $this->verificarEmpresa($nit);

            if (!$empresaData['success']) {
                return [
                    'success' => false,
                    'error' => 'Empresa no encontrada para solicitar certificado',
                ];
            }

            $camara = $empresaData['camara'] ?? 'Bogotá';

            return [
                'success' => true,
                'camara' => $camara,
                'url_solicitud' => $this->getCertificadoURL($camara),
                'instrucciones' => [
                    '1. Ingresar al portal de la Cámara de Comercio',
                    '2. Solicitar certificado de existencia y representación legal',
                    '3. Descargar PDF cuando esté listo (1-2 días hábiles)',
                ],
                'costo_aproximado' => '$10,000 - $50,000 COP',
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
     * Parser de respuesta HTML de RUES
     */
    protected function parseRUESResponse(string $html): array
    {
        $data = [];

        // Extraer razón social
        if (preg_match('/<td[^>]*>Razón Social<\/td>\s*<td[^>]*>(.*?)<\/td>/is', $html, $matches)) {
            $data['razon_social'] = trim(strip_tags($matches[1]));
        }

        // Extraer estado
        if (preg_match('/<td[^>]*>Estado<\/td>\s*<td[^>]*>(.*?)<\/td>/is', $html, $matches)) {
            $data['estado'] = trim(strip_tags($matches[1]));
        }

        // Extraer fecha de matrícula
        if (preg_match('/<td[^>]*>Fecha Matrícula<\/td>\s*<td[^>]*>(.*?)<\/td>/is', $html, $matches)) {
            $data['fecha_matricula'] = trim(strip_tags($matches[1]));
        }

        // Extraer cámara
        if (preg_match('/<td[^>]*>Cámara de Comercio<\/td>\s*<td[^>]*>(.*?)<\/td>/is', $html, $matches)) {
            $data['camara'] = trim(strip_tags($matches[1]));
        }

        // Extraer categoría
        if (preg_match('/<td[^>]*>Categoría Empresa<\/td>\s*<td[^>]*>(.*?)<\/td>/is', $html, $matches)) {
            $data['categoria'] = trim(strip_tags($matches[1]));
        }

        // Extraer actividad
        if (preg_match('/<td[^>]*>Actividad Principal<\/td>\s*<td[^>]*>(.*?)<\/td>/is', $html, $matches)) {
            $data['actividad'] = trim(strip_tags($matches[1]));
        }

        return $data;
    }

    /**
     * Generar warnings basados en estado
     */
    protected function generateWarnings(string $estado): array
    {
        $warnings = [];

        if (str_contains($estado, 'liquidacion')) {
            $warnings[] = 'Empresa en proceso de liquidación';
        }

        if (str_contains($estado, 'cancelada') || str_contains($estado, 'inactiva')) {
            $warnings[] = 'Empresa cancelada o inactiva - verificar antes de contratar';
        }

        if (str_contains($estado, 'suspendida')) {
            $warnings[] = 'Empresa con matrícula suspendida';
        }

        return $warnings;
    }

    /**
     * Obtener URL de solicitud de certificado por cámara
     */
    protected function getCertificadoURL(string $camara): string
    {
        $urls = [
            'Bogotá' => 'https://www.ccb.org.co/Tramites-y-servicios/Certificados',
            'Medellín' => 'https://www.camaramedellin.com.co/certificados',
            'Cali' => 'https://www.ccc.org.co/servicios-empresariales/certificados/',
            'Barranquilla' => 'https://www.camarabaq.org.co/certificados/',
            'Cartagena' => 'https://www.cccartagena.org.co/servicios-empresariales/certificados/',
        ];

        return $urls[$camara] ?? 'https://www.rues.org.co/';
    }

    /**
     * Búsqueda de empresas por nombre
     */
    public function buscarEmpresas(string $nombre): array
    {
        try {
            $response = Http::timeout(15)
                ->get($this->ruesApiUrl . '/RUES_Web_Consulta_Criterio', [
                    'RazonSocial' => $nombre,
                ]);

            if ($response->successful()) {
                $html = $response->body();
                $empresas = $this->parseSearchResults($html);

                return [
                    'success' => true,
                    'empresas' => $empresas,
                    'total' => count($empresas),
                ];
            }

            return [
                'success' => false,
                'error' => 'No se pudo realizar búsqueda',
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
     * Parser de resultados de búsqueda
     */
    protected function parseSearchResults(string $html): array
    {
        $empresas = [];

        // Simplificado - en producción usar DOMDocument para parsing robusto
        if (preg_match_all('/<tr[^>]*>(.*?)<\/tr>/is', $html, $rows)) {
            foreach ($rows[1] as $row) {
                if (preg_match_all('/<td[^>]*>(.*?)<\/td>/is', $row, $cells)) {
                    if (count($cells[1]) >= 3) {
                        $empresas[] = [
                            'nit' => trim(strip_tags($cells[1][0] ?? '')),
                            'razon_social' => trim(strip_tags($cells[1][1] ?? '')),
                            'estado' => trim(strip_tags($cells[1][2] ?? '')),
                        ];
                    }
                }
            }
        }

        return array_slice($empresas, 0, 20); // Limitar a 20 resultados
    }
}
