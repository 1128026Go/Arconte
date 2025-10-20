<?php

namespace App\Services;

use App\Models\DocumentEmbedding;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class SemanticSearchService
{
    private EmbeddingService $embeddingService;
    private GeminiService $geminiService;

    public function __construct(
        EmbeddingService $embeddingService,
        GeminiService $geminiService
    ) {
        $this->embeddingService = $embeddingService;
        $this->geminiService = $geminiService;
    }

    /**
     * Perform semantic search on documents
     *
     * @param string $query User search query
     * @param int $limit Number of results to return
     * @param float $threshold Minimum similarity score (0-1)
     * @return array Search results with similarity scores
     */
    public function search(string $query, int $limit = 10, float $threshold = 0.7): array
    {
        // Generate embedding for the search query
        $queryEmbedding = $this->embeddingService->generateEmbedding($query);

        if (!$queryEmbedding) {
            Log::error('Failed to generate query embedding');
            return [];
        }

        // Convert embedding to PostgreSQL vector format
        $vectorString = '[' . implode(',', $queryEmbedding) . ']';

        // Perform cosine similarity search using pgvector
        // Formula: 1 - (embedding <=> query_vector) gives similarity score (0-1)
        $results = DB::select("
            SELECT
                id,
                embeddable_type,
                embeddable_id,
                content,
                metadata,
                1 - (embedding <=> ?::vector) as similarity
            FROM document_embeddings
            WHERE 1 - (embedding <=> ?::vector) > ?
            ORDER BY embedding <=> ?::vector
            LIMIT ?
        ", [$vectorString, $vectorString, $threshold, $vectorString, $limit]);

        return array_map(function ($result) {
            return [
                'id' => $result->id,
                'type' => $result->embeddable_type,
                'document_id' => $result->embeddable_id,
                'content' => $result->content,
                'metadata' => json_decode($result->metadata, true),
                'similarity' => round($result->similarity, 4),
            ];
        }, $results);
    }

    /**
     * RAG (Retrieval Augmented Generation): Search + AI Answer
     *
     * @param string $question User question
     * @param int $contextLimit Number of documents to use as context
     * @return array Contains answer and source documents
     */
    public function ragQuery(string $question, int $contextLimit = 5): array
    {
        // Step 1: Retrieve relevant documents
        $relevantDocs = $this->search($question, $contextLimit, 0.6);

        if (empty($relevantDocs)) {
            return [
                'answer' => 'No encontré documentos relevantes para responder tu pregunta.',
                'sources' => [],
                'tokens' => 0,
            ];
        }

        // Step 2: Build context from retrieved documents
        $context = $this->buildContext($relevantDocs);

        // Step 3: Generate answer using Gemini with context
        $prompt = $this->buildRagPrompt($question, $context);

        $response = $this->geminiService->chat([
            ['role' => 'user', 'content' => $prompt]
        ]);

        return [
            'answer' => $response['content'] ?? 'No pude generar una respuesta.',
            'sources' => $this->formatSources($relevantDocs),
            'tokens' => $response['tokens'] ?? 0,
        ];
    }

    /**
     * RAG with streaming for real-time answers
     */
    public function ragQueryStream(string $question, int $contextLimit = 5, callable $onChunk): array
    {
        // Retrieve relevant documents
        $relevantDocs = $this->search($question, $contextLimit, 0.6);

        if (empty($relevantDocs)) {
            $errorMsg = 'No encontré documentos relevantes para responder tu pregunta.';
            $onChunk($errorMsg);
            return [
                'answer' => $errorMsg,
                'sources' => [],
            ];
        }

        // Build context and prompt
        $context = $this->buildContext($relevantDocs);
        $prompt = $this->buildRagPrompt($question, $context);

        // Stream the answer
        $fullAnswer = $this->geminiService->chatStream(
            [['role' => 'user', 'content' => $prompt]],
            '',
            $onChunk
        );

        return [
            'answer' => $fullAnswer,
            'sources' => $this->formatSources($relevantDocs),
        ];
    }

    /**
     * Build context string from retrieved documents
     */
    private function buildContext(array $documents): string
    {
        $contextParts = [];

        foreach ($documents as $index => $doc) {
            $metadata = $doc['metadata'];
            $type = $this->getDocumentTypeName($doc['type']);

            $contextParts[] = "--- Documento " . ($index + 1) . " ({$type}) ---\n" .
                            $this->truncateContent($doc['content'], 1000) . "\n" .
                            "Relevancia: " . ($doc['similarity'] * 100) . "%\n";
        }

        return implode("\n", $contextParts);
    }

    /**
     * Build RAG prompt with question and context
     */
    private function buildRagPrompt(string $question, string $context): string
    {
        return <<<PROMPT
Eres un asistente legal experto en derecho colombiano. Responde la siguiente pregunta basándote ÚNICAMENTE en el contexto proporcionado de documentos legales reales.

CONTEXTO DE DOCUMENTOS RELEVANTES:
{$context}

PREGUNTA DEL USUARIO:
{$question}

INSTRUCCIONES:
1. Responde de forma precisa y profesional basándote en los documentos del contexto
2. Si la respuesta no está en el contexto, indícalo claramente
3. Cita el número de documento cuando sea relevante (ej: "Según el Documento 1...")
4. Usa lenguaje legal apropiado pero comprensible
5. Si hay contradicciones entre documentos, menciónalas

RESPUESTA:
PROMPT;
    }

    /**
     * Format sources for response
     */
    private function formatSources(array $documents): array
    {
        return array_map(function ($doc, $index) {
            return [
                'id' => $doc['document_id'],
                'type' => $this->getDocumentTypeName($doc['type']),
                'preview' => $this->truncateContent($doc['content'], 200),
                'similarity' => $doc['similarity'],
                'metadata' => $doc['metadata'],
            ];
        }, $documents, array_keys($documents));
    }

    /**
     * Get human-readable document type name
     */
    private function getDocumentTypeName(string $type): string
    {
        return match ($type) {
            'App\Models\GeneratedDocument' => 'Documento Generado',
            'App\Models\Transcription' => 'Transcripción',
            default => 'Documento',
        };
    }

    /**
     * Truncate content to specified length
     */
    private function truncateContent(string $content, int $maxLength): string
    {
        if (strlen($content) <= $maxLength) {
            return $content;
        }

        return substr($content, 0, $maxLength) . '...';
    }

    /**
     * Find similar documents to a given document
     */
    public function findSimilar(int $embeddingId, int $limit = 5): array
    {
        $embedding = DocumentEmbedding::find($embeddingId);

        if (!$embedding) {
            return [];
        }

        $vectorString = '[' . implode(',', $embedding->embedding) . ']';

        $results = DB::select("
            SELECT
                id,
                embeddable_type,
                embeddable_id,
                content,
                metadata,
                1 - (embedding <=> ?::vector) as similarity
            FROM document_embeddings
            WHERE id != ?
            ORDER BY embedding <=> ?::vector
            LIMIT ?
        ", [$vectorString, $embeddingId, $vectorString, $limit]);

        return array_map(function ($result) {
            return [
                'id' => $result->id,
                'type' => $result->embeddable_type,
                'document_id' => $result->embeddable_id,
                'content' => $this->truncateContent($result->content, 300),
                'metadata' => json_decode($result->metadata, true),
                'similarity' => round($result->similarity, 4),
            ];
        }, $results);
    }
}
