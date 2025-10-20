<?php

namespace App\Services;

use App\Models\DocumentEmbedding;
use App\Models\GeneratedDocument;
use App\Models\Transcription;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class EmbeddingService
{
    private string $apiKey;
    private string $model = 'text-embedding-3-small';

    public function __construct()
    {
        $this->apiKey = env('OPENAI_API_KEY', '');
    }

    /**
     * Generate embedding vector for text using OpenAI
     */
    public function generateEmbedding(string $text): ?array
    {
        if (empty($this->apiKey)) {
            Log::error('OpenAI API key not configured for embeddings');
            return null;
        }

        try {
            $response = Http::timeout(30)
                ->withHeaders([
                    'Authorization' => 'Bearer ' . $this->apiKey,
                    'Content-Type' => 'application/json',
                ])
                ->post('https://api.openai.com/v1/embeddings', [
                    'model' => $this->model,
                    'input' => $text,
                ]);

            if ($response->successful()) {
                $data = $response->json();
                return $data['data'][0]['embedding'] ?? null;
            }

            Log::error('OpenAI embedding API error', [
                'status' => $response->status(),
                'response' => $response->body()
            ]);
            return null;

        } catch (\Exception $e) {
            Log::error('OpenAI embedding exception', ['message' => $e->getMessage()]);
            return null;
        }
    }

    /**
     * Create or update embedding for a GeneratedDocument
     */
    public function embedGeneratedDocument(GeneratedDocument $document): ?DocumentEmbedding
    {
        $content = $this->extractDocumentContent($document);
        $embedding = $this->generateEmbedding($content);

        if (!$embedding) {
            return null;
        }

        return DocumentEmbedding::updateOrCreate(
            [
                'embeddable_type' => GeneratedDocument::class,
                'embeddable_id' => $document->id,
            ],
            [
                'content' => $content,
                'embedding' => $embedding,
                'metadata' => [
                    'template_type' => $document->template->type ?? null,
                    'template_name' => $document->template->name ?? null,
                    'created_at' => $document->created_at?->toIso8601String(),
                ],
            ]
        );
    }

    /**
     * Create or update embedding for a Transcription
     */
    public function embedTranscription(Transcription $transcription): ?DocumentEmbedding
    {
        $content = $transcription->transcript;
        $embedding = $this->generateEmbedding($content);

        if (!$embedding) {
            return null;
        }

        return DocumentEmbedding::updateOrCreate(
            [
                'embeddable_type' => Transcription::class,
                'embeddable_id' => $transcription->id,
            ],
            [
                'content' => $content,
                'embedding' => $embedding,
                'metadata' => [
                    'audio_file' => $transcription->audio_file,
                    'duration' => $transcription->duration,
                    'created_at' => $transcription->created_at?->toIso8601String(),
                ],
            ]
        );
    }

    /**
     * Batch embed all documents without embeddings
     */
    public function embedAllDocuments(): array
    {
        $results = [
            'documents' => 0,
            'transcriptions' => 0,
            'errors' => 0,
        ];

        // Embed GeneratedDocuments
        $documents = GeneratedDocument::whereDoesntHave('embeddings')->get();
        foreach ($documents as $document) {
            try {
                if ($this->embedGeneratedDocument($document)) {
                    $results['documents']++;
                } else {
                    $results['errors']++;
                }
            } catch (\Exception $e) {
                Log::error('Error embedding document', [
                    'document_id' => $document->id,
                    'error' => $e->getMessage()
                ]);
                $results['errors']++;
            }
        }

        // Embed Transcriptions
        $transcriptions = Transcription::whereDoesntHave('embeddings')->get();
        foreach ($transcriptions as $transcription) {
            try {
                if ($this->embedTranscription($transcription)) {
                    $results['transcriptions']++;
                } else {
                    $results['errors']++;
                }
            } catch (\Exception $e) {
                Log::error('Error embedding transcription', [
                    'transcription_id' => $transcription->id,
                    'error' => $e->getMessage()
                ]);
                $results['errors']++;
            }
        }

        return $results;
    }

    /**
     * Extract searchable content from document
     */
    private function extractDocumentContent(GeneratedDocument $document): string
    {
        // Extract text from document content (strip HTML if present)
        $content = strip_tags($document->content);

        // Include template information for better context
        $templateInfo = '';
        if ($document->template) {
            $templateInfo = "Tipo: {$document->template->type}\n" .
                          "Nombre: {$document->template->name}\n\n";
        }

        return $templateInfo . $content;
    }
}
