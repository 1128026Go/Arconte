<?php

namespace App\Http\Controllers;

use App\Services\EmbeddingService;
use App\Services\SemanticSearchService;
use App\Models\GeneratedDocument;
use App\Models\Transcription;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class SemanticSearchController extends Controller
{
    private SemanticSearchService $searchService;
    private EmbeddingService $embeddingService;

    public function __construct(
        SemanticSearchService $searchService,
        EmbeddingService $embeddingService
    ) {
        $this->searchService = $searchService;
        $this->embeddingService = $embeddingService;
    }

    /**
     * Semantic search endpoint
     */
    public function search(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'query' => 'required|string|max:1000',
            'limit' => 'nullable|integer|min:1|max:50',
            'threshold' => 'nullable|numeric|min:0|max:1',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'Validación fallida',
                'details' => $validator->errors()
            ], 422);
        }

        try {
            $results = $this->searchService->search(
                $request->query,
                $request->limit ?? 10,
                $request->threshold ?? 0.7
            );

            return response()->json([
                'query' => $request->query,
                'results' => $results,
                'count' => count($results),
            ]);

        } catch (\Exception $e) {
            Log::error('Semantic search error', [
                'query' => $request->query,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'error' => 'Error al realizar la búsqueda',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * RAG Query endpoint - Get AI answer with context
     */
    public function ragQuery(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'question' => 'required|string|max:2000',
            'context_limit' => 'nullable|integer|min:1|max:10',
            'stream' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'Validación fallida',
                'details' => $validator->errors()
            ], 422);
        }

        try {
            // Streaming response
            if ($request->stream) {
                return response()->stream(function () use ($request) {
                    $this->searchService->ragQueryStream(
                        $request->question,
                        $request->context_limit ?? 5,
                        function ($chunk) {
                            echo "data: " . json_encode(['chunk' => $chunk]) . "\n\n";
                            ob_flush();
                            flush();
                        }
                    );

                    echo "data: " . json_encode(['done' => true]) . "\n\n";
                    ob_flush();
                    flush();

                }, 200, [
                    'Content-Type' => 'text/event-stream',
                    'Cache-Control' => 'no-cache',
                    'X-Accel-Buffering' => 'no',
                    'Connection' => 'keep-alive',
                ]);
            }

            // Normal response
            $result = $this->searchService->ragQuery(
                $request->question,
                $request->context_limit ?? 5
            );

            return response()->json($result);

        } catch (\Exception $e) {
            Log::error('RAG query error', [
                'question' => $request->question,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'error' => 'Error al procesar la pregunta',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Find similar documents
     */
    public function findSimilar($embeddingId, Request $request)
    {
        $validator = Validator::make($request->all(), [
            'limit' => 'nullable|integer|min:1|max:20',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'Validación fallida',
                'details' => $validator->errors()
            ], 422);
        }

        try {
            $results = $this->searchService->findSimilar(
                $embeddingId,
                $request->limit ?? 5
            );

            return response()->json([
                'similar_documents' => $results,
                'count' => count($results),
            ]);

        } catch (\Exception $e) {
            Log::error('Find similar error', [
                'embedding_id' => $embeddingId,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'error' => 'Error al buscar documentos similares',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Embed a specific document
     */
    public function embedDocument(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'type' => 'required|in:document,transcription',
            'id' => 'required|integer',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'Validación fallida',
                'details' => $validator->errors()
            ], 422);
        }

        try {
            $embedding = null;

            if ($request->type === 'document') {
                $document = GeneratedDocument::findOrFail($request->id);
                $embedding = $this->embeddingService->embedGeneratedDocument($document);
            } else {
                $transcription = Transcription::findOrFail($request->id);
                $embedding = $this->embeddingService->embedTranscription($transcription);
            }

            if (!$embedding) {
                return response()->json([
                    'error' => 'No se pudo generar el embedding'
                ], 500);
            }

            return response()->json([
                'message' => 'Embedding creado exitosamente',
                'embedding_id' => $embedding->id,
            ]);

        } catch (\Exception $e) {
            Log::error('Embed document error', [
                'type' => $request->type,
                'id' => $request->id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'error' => 'Error al crear embedding',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Batch embed all documents without embeddings
     */
    public function embedAll()
    {
        try {
            $results = $this->embeddingService->embedAllDocuments();

            return response()->json([
                'message' => 'Proceso de embedding completado',
                'results' => $results,
            ]);

        } catch (\Exception $e) {
            Log::error('Embed all error', [
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'error' => 'Error al procesar embeddings',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get embedding statistics
     */
    public function stats()
    {
        try {
            $stats = [
                'total_embeddings' => \App\Models\DocumentEmbedding::count(),
                'documents_embedded' => \App\Models\DocumentEmbedding::where('embeddable_type', GeneratedDocument::class)->count(),
                'transcriptions_embedded' => \App\Models\DocumentEmbedding::where('embeddable_type', Transcription::class)->count(),
                'total_documents' => GeneratedDocument::count(),
                'total_transcriptions' => Transcription::count(),
            ];

            $stats['documents_pending'] = $stats['total_documents'] - $stats['documents_embedded'];
            $stats['transcriptions_pending'] = $stats['total_transcriptions'] - $stats['transcriptions_embedded'];

            return response()->json($stats);

        } catch (\Exception $e) {
            Log::error('Embedding stats error', [
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'error' => 'Error al obtener estadísticas',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
