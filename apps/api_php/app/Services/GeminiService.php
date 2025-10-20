<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GeminiService
{
    protected $apiKey;
    protected $model = 'gemini-2.0-flash-exp';
    protected $lastTokenCount = 0;

    public function __construct()
    {
        $this->apiKey = env('GEMINI_API_KEY');
    }

    /**
     * Chat conversacional con historial
     */
    public function chat(array $history, string $context = ''): array
    {
        try {
            $contents = $this->buildContents($history, $context);

            $response = Http::timeout(60)->withHeaders([
                'Content-Type' => 'application/json',
            ])->post("https://generativelanguage.googleapis.com/v1beta/models/{$this->model}:generateContent?key={$this->apiKey}", [
                'contents' => $contents,
                'generationConfig' => [
                    'temperature' => 0.7,
                    'topK' => 40,
                    'topP' => 0.95,
                    'maxOutputTokens' => 2048,
                ],
                'safetySettings' => [
                    [
                        'category' => 'HARM_CATEGORY_HARASSMENT',
                        'threshold' => 'BLOCK_MEDIUM_AND_ABOVE'
                    ],
                    [
                        'category' => 'HARM_CATEGORY_HATE_SPEECH',
                        'threshold' => 'BLOCK_MEDIUM_AND_ABOVE'
                    ]
                ]
            ]);

            if (!$response->successful()) {
                Log::error('Gemini API Error', [
                    'status' => $response->status(),
                    'body' => $response->body()
                ]);
                throw new \Exception('Error al comunicarse con Gemini API');
            }

            $result = $response->json();

            $content = $result['candidates'][0]['content']['parts'][0]['text'] ?? 'Lo siento, no pude generar una respuesta.';
            $this->lastTokenCount = $result['usageMetadata']['totalTokenCount'] ?? 0;

            return [
                'content' => $content,
                'tokens' => $this->lastTokenCount
            ];

        } catch (\Exception $e) {
            Log::error('GeminiService chat error', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return [
                'content' => 'Lo siento, ocurrió un error al procesar tu consulta. Por favor intenta de nuevo.',
                'tokens' => 0
            ];
        }
    }

    /**
     * Chat con streaming para respuestas en tiempo real
     */
    public function chatStream(array $history, string $context, callable $onChunk): string
    {
        try {
            $contents = $this->buildContents($history, $context);

            $url = "https://generativelanguage.googleapis.com/v1beta/models/{$this->model}:streamGenerateContent?alt=sse&key={$this->apiKey}";

            $ch = curl_init($url);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'Content-Type: application/json',
            ]);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
                'contents' => $contents,
                'generationConfig' => [
                    'temperature' => 0.7,
                    'topK' => 40,
                    'topP' => 0.95,
                    'maxOutputTokens' => 2048,
                ],
            ]));
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, false);
            curl_setopt($ch, CURLOPT_TIMEOUT, 120);

            $fullResponse = '';

            curl_setopt($ch, CURLOPT_WRITEFUNCTION, function($ch, $data) use (&$fullResponse, $onChunk) {
                // Procesar streaming SSE de Gemini
                $lines = explode("\n", $data);

                foreach ($lines as $line) {
                    if (strpos($line, 'data: ') === 0) {
                        $jsonStr = substr($line, 6);
                        try {
                            $chunk = json_decode($jsonStr, true);
                            if (isset($chunk['candidates'][0]['content']['parts'][0]['text'])) {
                                $text = $chunk['candidates'][0]['content']['parts'][0]['text'];
                                $fullResponse .= $text;
                                $onChunk($text);
                            }
                        } catch (\Exception $e) {
                            Log::warning('Error parsing SSE chunk', ['line' => $line]);
                        }
                    }
                }

                return strlen($data);
            });

            curl_exec($ch);

            if (curl_errno($ch)) {
                Log::error('Curl error in chatStream', ['error' => curl_error($ch)]);
            }

            curl_close($ch);

            return $fullResponse;

        } catch (\Exception $e) {
            Log::error('GeminiService chatStream error', [
                'message' => $e->getMessage()
            ]);

            $errorMsg = 'Lo siento, ocurrió un error al procesar tu consulta.';
            $onChunk($errorMsg);
            return $errorMsg;
        }
    }

    /**
     * Construir el array de contenidos para Gemini
     */
    protected function buildContents(array $history, string $context): array
    {
        $contents = [];

        // Sistema de instrucciones como primer mensaje del usuario si hay contexto
        if (!empty($context)) {
            $contents[] = [
                'role' => 'user',
                'parts' => [[
                    'text' => "Contexto del caso jurídico:\n\n{$context}\n\nPor favor, responde las siguientes preguntas teniendo en cuenta este contexto."
                ]]
            ];
            $contents[] = [
                'role' => 'model',
                'parts' => [[
                    'text' => 'Entendido. He analizado el contexto del caso y estoy listo para asistirte con consultas jurídicas relacionadas.'
                ]]
            ];
        }

        // Agregar historial de mensajes
        foreach ($history as $message) {
            $role = $message['role'] === 'user' ? 'user' : 'model';
            $contents[] = [
                'role' => $role,
                'parts' => [[
                    'text' => $message['content']
                ]]
            ];
        }

        return $contents;
    }

    /**
     * Obtener el conteo de tokens del último request
     */
    public function getLastTokenCount(): int
    {
        return $this->lastTokenCount;
    }

    /**
     * Generar documento legal con IA
     */
    public function generateDocument(string $templateType, array $parameters, string $caseContext = ''): array
    {
        try {
            $prompt = $this->buildDocumentPrompt($templateType, $parameters, $caseContext);

            $response = Http::timeout(90)->withHeaders([
                'Content-Type' => 'application/json',
            ])->post("https://generativelanguage.googleapis.com/v1beta/models/{$this->model}:generateContent?key={$this->apiKey}", [
                'contents' => [[
                    'role' => 'user',
                    'parts' => [['text' => $prompt]]
                ]],
                'generationConfig' => [
                    'temperature' => 0.4, // Más determinístico para documentos legales
                    'topK' => 20,
                    'topP' => 0.8,
                    'maxOutputTokens' => 4096, // Más tokens para documentos largos
                ],
            ]);

            if (!$response->successful()) {
                Log::error('Gemini API Error - Document Generation', [
                    'status' => $response->status(),
                    'body' => $response->body()
                ]);
                throw new \Exception('Error al generar documento con Gemini API');
            }

            $result = $response->json();
            $content = $result['candidates'][0]['content']['parts'][0]['text'] ?? '';
            $this->lastTokenCount = $result['usageMetadata']['totalTokenCount'] ?? 0;

            return [
                'content' => $content,
                'tokens' => $this->lastTokenCount
            ];

        } catch (\Exception $e) {
            Log::error('GeminiService generateDocument error', [
                'message' => $e->getMessage(),
                'template_type' => $templateType
            ]);

            throw $e;
        }
    }

    /**
     * Construir prompt para generación de documentos
     */
    protected function buildDocumentPrompt(string $templateType, array $parameters, string $caseContext): string
    {
        $prompts = [
            'tutela' => "Genera una acción de tutela profesional y completa para el caso colombiano con los siguientes datos:\n\n" .
                        "Accionante: {$parameters['accionante']}\n" .
                        "Documento: {$parameters['documento']}\n" .
                        "Accionado: {$parameters['accionado']}\n" .
                        "Derecho vulnerado: {$parameters['derecho_vulnerado']}\n" .
                        "Hechos: {$parameters['hechos']}\n\n" .
                        "Genera el documento completo con encabezado, identificación de partes, hechos, fundamentos de derecho, pretensiones y juramento.",

            'derecho_peticion' => "Genera un derecho de petición formal para Colombia con los siguientes datos:\n\n" .
                                 "Peticionario: {$parameters['peticionario']}\n" .
                                 "Documento: {$parameters['documento']}\n" .
                                 "Destinatario: {$parameters['destinatario']}\n" .
                                 "Asunto: {$parameters['asunto']}\n" .
                                 "Solicitud: {$parameters['solicitud']}\n\n" .
                                 "Incluye encabezado, identificación, hechos, petición y firma.",

            'demanda' => "Genera una demanda civil/laboral profesional para Colombia con:\n\n" .
                        "Demandante: {$parameters['demandante']}\n" .
                        "Demandado: {$parameters['demandado']}\n" .
                        "Tipo de proceso: {$parameters['tipo_proceso']}\n" .
                        "Hechos: {$parameters['hechos']}\n" .
                        "Pretensiones: {$parameters['pretensiones']}\n\n" .
                        "Genera documento completo con todas las secciones legales necesarias.",

            'contrato' => "Genera un contrato legal para Colombia con:\n\n" .
                         "Tipo de contrato: {$parameters['tipo_contrato']}\n" .
                         "Parte 1: {$parameters['parte_1']}\n" .
                         "Parte 2: {$parameters['parte_2']}\n" .
                         "Objeto: {$parameters['objeto']}\n" .
                         "Valor: {$parameters['valor']}\n" .
                         "Plazo: {$parameters['plazo']}\n\n" .
                         "Incluye todas las cláusulas legales necesarias.",
        ];

        $basePrompt = $prompts[$templateType] ?? "Genera un documento legal tipo {$templateType} con los parámetros proporcionados: " . json_encode($parameters);

        if (!empty($caseContext)) {
            $basePrompt .= "\n\nCONTEXTO DEL CASO:\n{$caseContext}\n\nTen en cuenta este contexto al generar el documento.";
        }

        $basePrompt .= "\n\nIMPORTANTE: Genera SOLO el contenido del documento legal, sin explicaciones adicionales. Usa formato profesional adecuado para Colombia.";

        return $basePrompt;
    }
}
