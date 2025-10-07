<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class OpenAIService
{
    private string $apiKey;
    private string $model = 'gemini-pro';

    public function __construct()
    {
        $this->apiKey = env('GEMINI_API_KEY', '');
    }

    public function chat(array $messages, array $options = []): array
    {
        if (empty($this->apiKey)) {
            return ['error' => 'Gemini API key not configured'];
        }

        try {
            // Convertir mensajes de formato OpenAI a formato Gemini
            $geminiContents = $this->convertToGeminiFormat($messages);

            $response = Http::timeout(60)->post(
                "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key={$this->apiKey}",
                [
                    'contents' => $geminiContents,
                    'generationConfig' => [
                        'temperature' => $options['temperature'] ?? 0.7,
                        'maxOutputTokens' => $options['max_tokens'] ?? 2000,
                    ]
                ]
            );

            if ($response->successful()) {
                $data = $response->json();

                // Convertir respuesta de Gemini a formato compatible con OpenAI
                return [
                    'choices' => [
                        [
                            'message' => [
                                'content' => $data['candidates'][0]['content']['parts'][0]['text'] ?? '',
                                'role' => 'assistant'
                            ]
                        ]
                    ],
                    'usage' => [
                        'total_tokens' => strlen($data['candidates'][0]['content']['parts'][0]['text'] ?? '') / 4
                    ]
                ];
            }

            Log::error('Gemini API error', ['response' => $response->body()]);
            return ['error' => 'Gemini API request failed'];

        } catch (\Exception $e) {
            Log::error('Gemini exception', ['message' => $e->getMessage()]);
            return ['error' => $e->getMessage()];
        }
    }

    private function convertToGeminiFormat(array $messages): array
    {
        $geminiMessages = [];
        $systemPrompt = '';

        foreach ($messages as $msg) {
            if ($msg['role'] === 'system') {
                $systemPrompt = $msg['content'];
                continue;
            }

            $geminiMessages[] = [
                'role' => $msg['role'] === 'assistant' ? 'model' : 'user',
                'parts' => [['text' => $msg['content']]]
            ];
        }

        // Agregar system prompt al primer mensaje del usuario
        if (!empty($systemPrompt) && !empty($geminiMessages)) {
            $geminiMessages[0]['parts'][0]['text'] = $systemPrompt . "\n\n" . $geminiMessages[0]['parts'][0]['text'];
        }

        return $geminiMessages;
    }

    public function generateDocument(string $type, array $params): string
    {
        $prompt = $this->buildDocumentPrompt($type, $params);
        
        $messages = [
            [
                'role' => 'system',
                'content' => 'Eres un asistente legal experto en derecho colombiano. Generas documentos jurídicos profesionales, precisos y bien estructurados.'
            ],
            [
                'role' => 'user',
                'content' => $prompt
            ]
        ];

        $response = $this->chat($messages, ['temperature' => 0.3]);
        
        if (isset($response['error'])) {
            return "Error generando documento: " . $response['error'];
        }

        return $response['choices'][0]['message']['content'] ?? '';
    }

    private function buildDocumentPrompt(string $type, array $params): string
    {
        return match($type) {
            'tutela' => $this->buildTutelaPrompt($params),
            'derecho_peticion' => $this->buildDerechoPeticionPrompt($params),
            'demanda' => $this->buildDemandaPrompt($params),
            'contrato' => $this->buildContratoPrompt($params),
            default => "Genera un documento legal de tipo {$type} con los siguientes parámetros: " . json_encode($params)
        };
    }

    private function buildTutelaPrompt(array $params): string
    {
        return "Genera una acción de tutela completa con la siguiente información:\n\n" .
               "Accionante: {$params['accionante']}\n" .
               "Accionado: {$params['accionado']}\n" .
               "Derecho vulnerado: {$params['derecho']}\n" .
               "Hechos: {$params['hechos']}\n" .
               "Pretensiones: {$params['pretensiones']}\n\n" .
               "Incluye: encabezado, hechos, fundamentos de derecho, pretensiones y anexos.";
    }

    private function buildDerechoPeticionPrompt(array $params): string
    {
        return "Genera un derecho de petición con:\n\n" .
               "Peticionario: {$params['peticionario']}\n" .
               "Destinatario: {$params['destinatario']}\n" .
               "Asunto: {$params['asunto']}\n" .
               "Solicitud: {$params['solicitud']}\n\n" .
               "Sigue la estructura legal colombiana.";
    }

    private function buildDemandaPrompt(array $params): string
    {
        return "Genera una demanda civil con:\n\n" .
               "Demandante: {$params['demandante']}\n" .
               "Demandado: {$params['demandado']}\n" .
               "Tipo: {$params['tipo']}\n" .
               "Cuantía: {$params['cuantia']}\n" .
               "Hechos: {$params['hechos']}\n" .
               "Pretensiones: {$params['pretensiones']}";
    }

    private function buildContratoPrompt(array $params): string
    {
        return "Genera un contrato de {$params['tipo_contrato']} con:\n\n" .
               "Parte 1: {$params['parte1']}\n" .
               "Parte 2: {$params['parte2']}\n" .
               "Objeto: {$params['objeto']}\n" .
               "Cláusulas especiales: {$params['clausulas']}";
    }

    public function analyzeCase(array $caseData): array
    {
        $prompt = "Analiza el siguiente caso judicial y proporciona:\n" .
                  "1. Resumen ejecutivo\n" .
                  "2. Análisis de viabilidad\n" .
                  "3. Estrategia sugerida\n" .
                  "4. Riesgos potenciales\n\n" .
                  "Datos del caso:\n" . json_encode($caseData, JSON_PRETTY_PRINT);

        $messages = [
            ['role' => 'system', 'content' => 'Eres un experto en análisis de casos judiciales en Colombia.'],
            ['role' => 'user', 'content' => $prompt]
        ];

        return $this->chat($messages);
    }
}
