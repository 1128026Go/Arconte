<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AutoClassificationService
{
    private string $geminiApiKey;
    private string $geminiApiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

    public function __construct()
    {
        $this->geminiApiKey = config('services.gemini.api_key');
    }

    /**
     * Clasifica un auto judicial como perentorio o de trámite
     *
     * @param string $textoAuto El texto completo del auto
     * @return array ['tipo' => 'perentorio'|'tramite', 'confianza' => float, 'razon' => string]
     */
    public function clasificarAuto(string $textoAuto): array
    {
        // Primero intentar clasificación por palabras clave
        $clasificacionBasica = $this->clasificarPorPalabrasClave($textoAuto);

        // Si la confianza es alta, usar la clasificación básica
        if ($clasificacionBasica['confianza'] >= 0.8) {
            Log::info('Auto clasificado por palabras clave', $clasificacionBasica);
            return $clasificacionBasica;
        }

        // Si no, usar IA para mayor precisión
        try {
            $clasificacionIA = $this->clasificarConIA($textoAuto);
            Log::info('Auto clasificado por IA', $clasificacionIA);
            return $clasificacionIA;
        } catch (\Exception $e) {
            Log::error('Error en clasificación por IA', [
                'error' => $e->getMessage(),
                'fallback' => $clasificacionBasica
            ]);
            // Fallback a clasificación básica
            return $clasificacionBasica;
        }
    }

    /**
     * Clasificación basada en palabras clave
     */
    private function clasificarPorPalabrasClave(string $texto): array
    {
        $textoLower = mb_strtolower($texto);

        // Palabras clave para AUTO PERENTORIO
        $keywordsPerentorios = [
            'requerir' => 10,
            'requiérase' => 10,
            'en el término de' => 10,
            'dentro de' => 8,
            'plazo de' => 10,
            'deberá presentar' => 9,
            'es obligatorio' => 9,
            'prevéngase' => 10,
            'confiérase traslado' => 10,
            'impóngase plazo' => 10,
            'resuelva en el término' => 10,
            'tendrá' => 5,
            'días para' => 7,
            'días hábiles' => 7,
            'conteste dentro de' => 10,
            'no interponer recurso' => 9,
            'ordénese' => 8,
            'comparecer' => 7,
            'presentar' => 6,
            'allegar' => 7,
            'subsanar' => 8,
        ];

        // Palabras clave para AUTO DE TRÁMITE
        $keywordsTramite = [
            'admítase' => 10,
            'tómese nota' => 10,
            'téngase por presentado' => 10,
            'téngase por' => 9,
            'infórmese' => 9,
            'remítase' => 9,
            'agregue' => 9,
            'agréguese' => 9,
            'siga el trámite' => 10,
            'trasládese' => 7,
            'inscríbase' => 9,
            'archívese' => 9,
            'córrase traslado' => 6, // Puede ser perentorio si tiene plazo
        ];

        $scorePerentorio = 0;
        $scoreTramite = 0;
        $encontradosPerentorios = [];
        $encontradosTramite = [];

        // Buscar palabras clave perentorias
        foreach ($keywordsPerentorios as $keyword => $peso) {
            if (str_contains($textoLower, $keyword)) {
                $scorePerentorio += $peso;
                $encontradosPerentorios[] = $keyword;
            }
        }

        // Buscar palabras clave de trámite
        foreach ($keywordsTramite as $keyword => $peso) {
            if (str_contains($textoLower, $keyword)) {
                $scoreTramite += $peso;
                $encontradosTramite[] = $keyword;
            }
        }

        // Detectar menciones explícitas de plazos (muy indicativo de perentorio)
        if (preg_match('/(\d+)\s*(días?|meses?)\s*(hábiles?|calendario)?/i', $texto)) {
            $scorePerentorio += 15;
            $encontradosPerentorios[] = 'mención de plazo específico';
        }

        // Determinar clasificación
        if ($scorePerentorio > $scoreTramite) {
            $confianza = min(0.9, $scorePerentorio / ($scorePerentorio + $scoreTramite + 1));
            return [
                'tipo' => 'perentorio',
                'confianza' => $confianza,
                'razon' => 'Palabras clave encontradas: ' . implode(', ', $encontradosPerentorios),
                'score_perentorio' => $scorePerentorio,
                'score_tramite' => $scoreTramite
            ];
        } elseif ($scoreTramite > $scorePerentorio) {
            $confianza = min(0.9, $scoreTramite / ($scorePerentorio + $scoreTramite + 1));
            return [
                'tipo' => 'tramite',
                'confianza' => $confianza,
                'razon' => 'Palabras clave encontradas: ' . implode(', ', $encontradosTramite),
                'score_perentorio' => $scorePerentorio,
                'score_tramite' => $scoreTramite
            ];
        } else {
            // No se encontraron palabras clave significativas
            return [
                'tipo' => 'tramite', // Por defecto, trámite es menos urgente
                'confianza' => 0.3,
                'razon' => 'No se encontraron palabras clave significativas',
                'score_perentorio' => $scorePerentorio,
                'score_tramite' => $scoreTramite
            ];
        }
    }

    /**
     * Clasificación usando IA (Gemini)
     */
    private function clasificarConIA(string $textoAuto): array
    {
        $prompt = $this->construirPrompt($textoAuto);

        $response = Http::timeout(30)
            ->withHeaders([
                'Content-Type' => 'application/json',
            ])
            ->post($this->geminiApiUrl . '?key=' . $this->geminiApiKey, [
                'contents' => [
                    [
                        'parts' => [
                            ['text' => $prompt]
                        ]
                    ]
                ],
                'generationConfig' => [
                    'temperature' => 0.2, // Baja temperatura para mayor precisión
                    'topK' => 40,
                    'topP' => 0.95,
                    'maxOutputTokens' => 500,
                ]
            ]);

        if (!$response->successful()) {
            throw new \Exception('Error en la API de Gemini: ' . $response->body());
        }

        $result = $response->json();
        $textoRespuesta = $result['candidates'][0]['content']['parts'][0]['text'] ?? '';

        return $this->parsearRespuestaIA($textoRespuesta);
    }

    /**
     * Construir prompt para la IA
     */
    private function construirPrompt(string $textoAuto): string
    {
        return <<<PROMPT
Eres un experto en derecho procesal colombiano. Tu tarea es clasificar un AUTO judicial como PERENTORIO o de TRÁMITE.

**Definiciones:**

**AUTO PERENTORIO:** Es aquel que impone un plazo o término para que una de las partes realice una actuación específica. Requiere acción urgente del abogado. Si no se cumple en el término establecido, puede haber consecuencias negativas (perder el derecho, preclusión, etc.).

Indicadores típicos:
- Contiene frases como: "requiérase", "confiérase traslado", "impóngase plazo", "en el término de X días", "deberá presentar", "ordénese"
- Menciona plazos específicos (ej: "3 días hábiles", "5 días")
- Requiere una respuesta o actuación de la parte

**AUTO DE TRÁMITE:** Es aquel que simplemente avanza el proceso sin imponer obligaciones urgentes. Generalmente es informativo o administrativo.

Indicadores típicos:
- Contiene frases como: "admítase", "téngase por presentado", "infórmese", "remítase", "archívese", "agréguese"
- No menciona plazos para actuación de las partes
- Es puramente informativo o de ordenamiento interno del juzgado

---

**AUTO A CLASIFICAR:**

{$textoAuto}

---

**INSTRUCCIONES:**
Analiza el auto anterior y responde ÚNICAMENTE en el siguiente formato JSON (sin texto adicional):

```json
{
  "tipo": "perentorio" o "tramite",
  "confianza": [número entre 0 y 1],
  "razon": "Breve explicación de tu clasificación"
}
```

PROMPT;
    }

    /**
     * Parsear la respuesta de la IA
     */
    private function parsearRespuestaIA(string $respuesta): array
    {
        // Extraer JSON de la respuesta
        if (preg_match('/```json\s*(\{.*?\})\s*```/s', $respuesta, $matches)) {
            $jsonString = $matches[1];
        } elseif (preg_match('/(\{.*?\})/s', $respuesta, $matches)) {
            $jsonString = $matches[1];
        } else {
            throw new \Exception('No se pudo extraer JSON de la respuesta de la IA');
        }

        $resultado = json_decode($jsonString, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new \Exception('Error al decodificar JSON: ' . json_last_error_msg());
        }

        // Validar que tenga los campos necesarios
        if (!isset($resultado['tipo']) || !isset($resultado['confianza'])) {
            throw new \Exception('Respuesta de IA incompleta');
        }

        // Normalizar tipo
        $tipo = strtolower($resultado['tipo']);
        if (!in_array($tipo, ['perentorio', 'tramite'])) {
            throw new \Exception('Tipo de auto no válido: ' . $tipo);
        }

        return [
            'tipo' => $tipo,
            'confianza' => (float) $resultado['confianza'],
            'razon' => $resultado['razon'] ?? 'Clasificación por IA',
            'metodo' => 'ia'
        ];
    }

    /**
     * Extraer información de plazos del texto
     */
    public function extraerPlazos(string $texto): ?array
    {
        // Buscar menciones de plazos como "3 días", "5 días hábiles", etc.
        if (preg_match('/(\d+)\s*(días?|meses?)\s*(hábiles?|calendario)?/i', $texto, $matches)) {
            return [
                'cantidad' => (int) $matches[1],
                'unidad' => strtolower($matches[2]),
                'tipo' => isset($matches[3]) ? strtolower($matches[3]) : 'calendario'
            ];
        }

        return null;
    }
}
