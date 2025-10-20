<?php

namespace App\Services;

use App\Models\Transcription;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Exception;

class TranscriptionService
{
    protected $geminiService;
    protected $openaiApiKey;

    public function __construct(GeminiService $geminiService)
    {
        $this->geminiService = $geminiService;
        $this->openaiApiKey = env('OPENAI_API_KEY');
    }

    /**
     * Procesa un archivo de audio/video y genera la transcripción
     */
    public function processTranscription(Transcription $transcription): void
    {
        try {
            $transcription->markAsProcessing();

            // Verificar que el archivo existe
            if (!Storage::disk('public')->exists($transcription->file_path)) {
                throw new Exception('El archivo de audio no existe');
            }

            $filePath = Storage::disk('public')->path($transcription->file_path);

            // Obtener la transcripción usando Whisper API
            $transcriptionText = $this->transcribeAudio($filePath);

            // Generar resumen usando Gemini
            $summary = $this->generateSummary($transcriptionText);

            // Guardar resultados
            $transcription->markAsCompleted($transcriptionText, $summary);

            Log::info("Transcription completed successfully", ['id' => $transcription->id]);

        } catch (Exception $e) {
            $transcription->markAsFailed($e->getMessage());
            Log::error("Transcription failed", [
                'id' => $transcription->id,
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }

    /**
     * Transcribe audio usando OpenAI Whisper API
     */
    protected function transcribeAudio(string $filePath): string
    {
        if (!$this->openaiApiKey) {
            throw new Exception('OPENAI_API_KEY no configurada. Agrega OPENAI_API_KEY=tu_clave en .env');
        }

        $ch = curl_init('https://api.openai.com/v1/audio/transcriptions');

        $cfile = new \CURLFile($filePath);
        $postData = [
            'file' => $cfile,
            'model' => 'whisper-1',
            'language' => 'es', // español
            'response_format' => 'json',
        ];

        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $postData,
            CURLOPT_HTTPHEADER => [
                'Authorization: Bearer ' . $this->openaiApiKey,
            ],
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode !== 200) {
            $error = json_decode($response, true);
            throw new Exception('Error en Whisper API: ' . ($error['error']['message'] ?? 'Unknown error'));
        }

        $result = json_decode($response, true);

        if (!isset($result['text'])) {
            throw new Exception('Respuesta inválida de Whisper API');
        }

        return $result['text'];
    }

    /**
     * Genera un resumen de la transcripción usando Gemini
     */
    protected function generateSummary(string $transcriptionText): string
    {
        $prompt = "Analiza la siguiente transcripción de audio legal y genera un resumen estructurado que incluya:\n\n"
            . "1. **Tema principal**: Breve descripción del asunto tratado\n"
            . "2. **Puntos clave**: Lista de los aspectos más importantes mencionados\n"
            . "3. **Acciones o compromisos**: Tareas pendientes o acuerdos mencionados\n"
            . "4. **Partes involucradas**: Personas o entidades mencionadas\n\n"
            . "Transcripción:\n{$transcriptionText}";

        try {
            $result = $this->geminiService->chat(
                [['role' => 'user', 'content' => $prompt]],
                'Eres un asistente legal especializado en resumir transcripciones de audio.'
            );

            return $result['content'];
        } catch (Exception $e) {
            Log::warning("Failed to generate summary", ['error' => $e->getMessage()]);
            return 'No se pudo generar el resumen automáticamente.';
        }
    }

    /**
     * Obtiene información del archivo de audio
     */
    public function getAudioInfo(string $filePath): array
    {
        $fullPath = Storage::disk('public')->path($filePath);

        if (!file_exists($fullPath)) {
            throw new Exception('Archivo no encontrado');
        }

        $fileSize = filesize($fullPath);
        $mimeType = mime_content_type($fullPath);

        // Intentar obtener duración usando getID3 si está disponible
        $duration = null;
        if (class_exists('\getID3')) {
            try {
                $getID3 = new \getID3();
                $fileInfo = $getID3->analyze($fullPath);
                $duration = $fileInfo['playtime_seconds'] ?? null;
            } catch (Exception $e) {
                Log::debug('getID3 not available or failed', ['error' => $e->getMessage()]);
            }
        }

        return [
            'file_size' => $fileSize,
            'mime_type' => $mimeType,
            'duration' => $duration ? (int) $duration : null,
        ];
    }

    /**
     * Valida que el archivo sea de un tipo permitido
     */
    public function validateAudioFile(string $mimeType): bool
    {
        $allowedTypes = [
            'audio/mpeg',      // mp3
            'audio/mp4',       // m4a
            'audio/wav',       // wav
            'audio/webm',      // webm
            'video/mp4',       // mp4
            'video/mpeg',      // mpeg
            'video/webm',      // webm
        ];

        return in_array($mimeType, $allowedTypes);
    }

    /**
     * Elimina el archivo físico de una transcripción
     */
    public function deleteTranscriptionFile(Transcription $transcription): void
    {
        if ($transcription->file_path && Storage::disk('public')->exists($transcription->file_path)) {
            Storage::disk('public')->delete($transcription->file_path);
        }
    }
}
