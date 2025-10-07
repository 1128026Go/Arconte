<?php

namespace App\Http\Controllers;

use App\Models\AIConversation;
use App\Models\AIMessage;
use App\Models\GeneratedDocument;
use App\Services\OpenAIService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AIController extends Controller
{
    public function __construct(private OpenAIService $openAIService)
    {
    }

    public function chat(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'conversation_id' => 'nullable|exists:ai_conversations,id',
            'message' => 'required|string|max:5000',
            'case_id' => 'nullable|exists:cases,id',
        ]);

        $user = $request->user();

        if ($validated['conversation_id']) {
            $conversation = AIConversation::findOrFail($validated['conversation_id']);
        } else {
            $conversation = AIConversation::create([
                'user_id' => $user->id,
                'case_id' => $validated['case_id'] ?? null,
                'title' => substr($validated['message'], 0, 100),
                'type' => 'general',
            ]);
        }

        AIMessage::create([
            'conversation_id' => $conversation->id,
            'role' => 'user',
            'content' => $validated['message'],
        ]);

        $messages = $conversation->messages()
            ->orderBy('created_at')
            ->get()
            ->map(fn($msg) => ['role' => $msg->role, 'content' => $msg->content])
            ->toArray();

        $systemMessage = [
            'role' => 'system',
            'content' => 'Eres Arconte AI, el asistente legal inteligente integrado en la plataforma Arconte - Sistema de Gestión Jurídica.

TU ROL:
- Asistente legal especializado en derecho colombiano
- Experto en la plataforma Arconte y sus funcionalidades
- Guía para usuarios en el uso del sistema

CAPACIDADES DE LA PLATAFORMA ARCONTE:
1. **Casos**: Seguimiento automático de procesos judiciales consultando la Rama Judicial
2. **Documentos**: Gestión, almacenamiento y versionamiento de documentos legales
3. **Recordatorios**: Sistema de alertas para términos judiciales y plazos
4. **Tiempo y Facturación**: Control de horas trabajadas y generación de facturas
5. **Jurisprudencia**: Búsqueda y análisis de precedentes judiciales
6. **Analytics**: Estadísticas y métricas del desempeño legal
7. **Notificaciones**: Alertas automáticas de actuaciones nuevas en casos

CÓMO AYUDAR:
- Si el usuario pregunta sobre funcionalidades, explica cómo usar cada módulo
- Para consultas legales, da respuestas precisas basadas en legislación colombiana
- Si detectas que están en una sección específica (ej: [CONTEXTO: Usuario en sección de Casos]), contextualiza tu respuesta
- Sugiere funcionalidades relevantes según lo que el usuario necesite
- Sé conciso pero completo en tus respuestas

TONO: Profesional, amigable y útil. Usa lenguaje claro sin perder la precisión legal.'
        ];
        array_unshift($messages, $systemMessage);

        $response = $this->openAIService->chat($messages);

        if (isset($response['error'])) {
            return response()->json(['error' => $response['error']], 500);
        }

        $assistantMessage = $response['choices'][0]['message']['content'] ?? '';
        $tokens = $response['usage']['total_tokens'] ?? null;

        AIMessage::create([
            'conversation_id' => $conversation->id,
            'role' => 'assistant',
            'content' => $assistantMessage,
            'tokens' => $tokens,
        ]);

        return response()->json([
            'conversation_id' => $conversation->id,
            'message' => $assistantMessage,
            'tokens' => $tokens,
        ]);
    }

    public function generateDocument(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'template_type' => 'required|in:tutela,derecho_peticion,demanda,contrato',
            'title' => 'required|string',
            'parameters' => 'required|array',
            'case_id' => 'nullable|exists:cases,id',
        ]);

        $user = $request->user();

        $content = $this->openAIService->generateDocument(
            $validated['template_type'],
            $validated['parameters']
        );

        if (str_starts_with($content, 'Error')) {
            return response()->json(['error' => $content], 500);
        }

        $document = GeneratedDocument::create([
            'user_id' => $user->id,
            'case_id' => $validated['case_id'] ?? null,
            'template_type' => $validated['template_type'],
            'title' => $validated['title'],
            'content' => $content,
            'parameters' => $validated['parameters'],
            'status' => 'draft',
        ]);

        return response()->json($document, 201);
    }

    public function listConversations(Request $request): JsonResponse
    {
        $conversations = AIConversation::where('user_id', $request->user()->id)
            ->with(['messages' => fn($q) => $q->latest()->limit(1)])
            ->orderBy('updated_at', 'desc')
            ->paginate(20);

        return response()->json($conversations);
    }

    public function getConversation(Request $request, $id): JsonResponse
    {
        $conversation = AIConversation::where('user_id', $request->user()->id)
            ->with('messages')
            ->findOrFail($id);

        return response()->json($conversation);
    }

    public function listGeneratedDocuments(Request $request): JsonResponse
    {
        $documents = GeneratedDocument::where('user_id', $request->user()->id)
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json($documents);
    }

    public function getGeneratedDocument(Request $request, $id): JsonResponse
    {
        $document = GeneratedDocument::where('user_id', $request->user()->id)
            ->findOrFail($id);

        return response()->json($document);
    }

    public function updateGeneratedDocument(Request $request, $id): JsonResponse
    {
        $validated = $request->validate([
            'content' => 'sometimes|string',
            'status' => 'sometimes|in:draft,reviewed,finalized',
        ]);

        $document = GeneratedDocument::where('user_id', $request->user()->id)
            ->findOrFail($id);

        $document->update($validated);

        return response()->json($document);
    }
}
