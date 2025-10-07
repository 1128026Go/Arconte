<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;

class MultimodalAIService extends OpenAIService
{
    /**
     * Procesar query multimodal (texto + voz + PDF + imágenes)
     */
    public function processMultimodal(array $input): array
    {
        $processedData = [];

        // 1. Procesar texto si existe
        if (!empty($input['text'])) {
            $processedData['text'] = $input['text'];
        }

        // 2. Procesar audio/voz si existe
        if (!empty($input['voice_file'])) {
            $transcription = $this->transcribeAudio($input['voice_file']);
            $processedData['voice_transcription'] = $transcription;
            $processedData['text'] = ($processedData['text'] ?? '') . ' ' . $transcription;
        }

        // 3. Procesar PDF si existe
        if (!empty($input['pdf_file'])) {
            $pdfText = $this->extractPDFText($input['pdf_file']);
            $processedData['pdf_content'] = $pdfText;
        }

        // 4. Procesar imágenes si existen
        if (!empty($input['images'])) {
            $imageAnalysis = $this->analyzeImages($input['images']);
            $processedData['image_analysis'] = $imageAnalysis;
        }

        // 5. Generar respuesta combinando todos los inputs
        $response = $this->generateLegalResponse($processedData, $input['context'] ?? []);

        return [
            'response' => $response,
            'processed_data' => $processedData,
            'mode' => $this->detectMode($input),
        ];
    }

    /**
     * Transcribir audio a texto usando Gemini o Whisper
     */
    protected function transcribeAudio(UploadedFile $audioFile): string
    {
        try {
            // Guardar temporalmente
            $path = $audioFile->store('temp/audio');
            $fullPath = Storage::path($path);

            // Usar Gemini para transcripción
            $audioData = base64_encode(file_get_contents($fullPath));

            $response = Http::withHeaders([
                'Content-Type' => 'application/json',
            ])->post("https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=" . env('GEMINI_API_KEY'), [
                'contents' => [
                    [
                        'parts' => [
                            [
                                'text' => 'Transcribe este audio legal en español con precisión técnica.'
                            ],
                            [
                                'inline_data' => [
                                    'mime_type' => $audioFile->getMimeType(),
                                    'data' => $audioData
                                ]
                            ]
                        ]
                    ]
                ]
            ]);

            // Limpiar archivo temporal
            Storage::delete($path);

            if ($response->successful()) {
                $result = $response->json();
                return $result['candidates'][0]['content']['parts'][0]['text'] ?? '';
            }

            return '';
        } catch (\Exception $e) {
            report($e);
            return '';
        }
    }

    /**
     * Extraer texto de PDF
     */
    protected function extractPDFText(UploadedFile $pdfFile): string
    {
        try {
            $path = $pdfFile->store('temp/pdfs');
            $fullPath = Storage::path($path);

            // Usar Gemini vision para PDFs
            $pdfData = base64_encode(file_get_contents($fullPath));

            $response = Http::withHeaders([
                'Content-Type' => 'application/json',
            ])->post("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=" . env('GEMINI_API_KEY'), [
                'contents' => [
                    [
                        'parts' => [
                            [
                                'text' => 'Extrae todo el texto de este documento legal PDF. Mantén la estructura y formato legal.'
                            ],
                            [
                                'inline_data' => [
                                    'mime_type' => 'application/pdf',
                                    'data' => $pdfData
                                ]
                            ]
                        ]
                    ]
                ]
            ]);

            Storage::delete($path);

            if ($response->successful()) {
                $result = $response->json();
                return $result['candidates'][0]['content']['parts'][0]['text'] ?? '';
            }

            return '';
        } catch (\Exception $e) {
            report($e);
            return '';
        }
    }

    /**
     * Analizar imágenes (documentos escaneados, evidencias)
     */
    protected function analyzeImages(array $images): array
    {
        $analyses = [];

        foreach ($images as $image) {
            try {
                $path = $image->store('temp/images');
                $fullPath = Storage::path($path);
                $imageData = base64_encode(file_get_contents($fullPath));

                $response = Http::withHeaders([
                    'Content-Type' => 'application/json',
                ])->post("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-vision:generateContent?key=" . env('GEMINI_API_KEY'), [
                    'contents' => [
                        [
                            'parts' => [
                                [
                                    'text' => 'Analiza esta imagen legal. Describe el contenido, extrae texto visible y proporciona análisis relevante.'
                                ],
                                [
                                    'inline_data' => [
                                        'mime_type' => $image->getMimeType(),
                                        'data' => $imageData
                                    ]
                                ]
                            ]
                        ]
                    ]
                ]);

                Storage::delete($path);

                if ($response->successful()) {
                    $result = $response->json();
                    $analyses[] = $result['candidates'][0]['content']['parts'][0]['text'] ?? '';
                }
            } catch (\Exception $e) {
                report($e);
            }
        }

        return $analyses;
    }

    /**
     * Generar respuesta legal combinando todos los datos
     */
    protected function generateLegalResponse(array $processedData, array $context): string
    {
        $prompt = "Eres un asistente legal experto colombiano. Analiza la siguiente información:\n\n";

        if (!empty($processedData['text'])) {
            $prompt .= "**Consulta del usuario:**\n" . $processedData['text'] . "\n\n";
        }

        if (!empty($processedData['voice_transcription'])) {
            $prompt .= "**Transcripción de voz:**\n" . $processedData['voice_transcription'] . "\n\n";
        }

        if (!empty($processedData['pdf_content'])) {
            $prompt .= "**Contenido del PDF:**\n" . substr($processedData['pdf_content'], 0, 3000) . "...\n\n";
        }

        if (!empty($processedData['image_analysis'])) {
            $prompt .= "**Análisis de imágenes:**\n" . implode("\n", $processedData['image_analysis']) . "\n\n";
        }

        if (!empty($context)) {
            $prompt .= "**Contexto adicional:**\n" . json_encode($context) . "\n\n";
        }

        $prompt .= "Proporciona una respuesta legal precisa, citando artículos relevantes del derecho colombiano cuando sea apropiado.";

        return $this->chat($prompt);
    }

    /**
     * Detectar modo de entrada predominante
     */
    protected function detectMode(array $input): string
    {
        if (!empty($input['voice_file'])) return 'voice';
        if (!empty($input['pdf_file'])) return 'document';
        if (!empty($input['images'])) return 'image';
        return 'text';
    }

    /**
     * Generar respuesta de voz (Text-to-Speech)
     */
    public function generateVoiceResponse(string $text): string
    {
        // Usar Google Cloud Text-to-Speech o similar
        // Por ahora retornamos path simulado

        try {
            $response = Http::withHeaders([
                'Content-Type' => 'application/json',
            ])->post("https://texttospeech.googleapis.com/v1/text:synthesize?key=" . env('GOOGLE_CLOUD_API_KEY'), [
                'input' => ['text' => $text],
                'voice' => [
                    'languageCode' => 'es-CO',
                    'name' => 'es-CO-Standard-A',
                    'ssmlGender' => 'FEMALE'
                ],
                'audioConfig' => [
                    'audioEncoding' => 'MP3'
                ]
            ]);

            if ($response->successful()) {
                $audioContent = $response->json()['audioContent'];
                $filename = 'voice_responses/' . uniqid() . '.mp3';
                Storage::put($filename, base64_decode($audioContent));
                return Storage::url($filename);
            }

            return '';
        } catch (\Exception $e) {
            report($e);
            return '';
        }
    }

    /**
     * Análisis de documento legal completo
     */
    public function analyzeLegalDocument(UploadedFile $document): array
    {
        $text = $this->extractPDFText($document);

        $prompt = "Analiza este documento legal colombiano y proporciona:\n\n"
            . "1. **Tipo de documento** (sentencia, demanda, memorial, etc.)\n"
            . "2. **Partes involucradas**\n"
            . "3. **Hechos principales**\n"
            . "4. **Fundamentos jurídicos**\n"
            . "5. **Decisión o peticiones**\n"
            . "6. **Plazos relevantes**\n"
            . "7. **Recomendaciones de acción**\n\n"
            . "Documento:\n" . $text;

        $analysis = $this->chat($prompt);

        return [
            'extracted_text' => $text,
            'analysis' => $analysis,
            'word_count' => str_word_count($text),
            'page_estimate' => ceil(strlen($text) / 2000),
        ];
    }
}
