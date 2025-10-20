<?php

namespace App\Http\Controllers;

use App\Models\AIConversation;
use App\Models\AIMessage;
use App\Models\CaseModel;
use App\Services\GeminiService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class AIAssistantController extends Controller
{
    protected $geminiService;

    public function __construct(GeminiService $geminiService)
    {
        $this->geminiService = $geminiService;
    }

    /**
     * Chat con el asistente AI (con soporte para streaming SSE)
     */
    public function chat(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'message' => 'required|string|max:5000',
            'conversation_id' => 'nullable|exists:ai_conversations,id',
            'case_id' => 'nullable|exists:case_models,id',
            'stream' => 'nullable|boolean'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'Validación fallida',
                'details' => $validator->errors()
            ], 422);
        }

        $user = Auth::user();

        // Verificar límite diario según el plan
        if (!$this->checkDailyLimit($user)) {
            return response()->json([
                'error' => 'Has alcanzado el límite de consultas diarias de tu plan.',
                'limit_reached' => true
            ], 429);
        }

        try {
            // Obtener o crear conversación
            $conversation = $this->getOrCreateConversation(
                $user->id,
                $request->conversation_id,
                $request->case_id
            );

            // Guardar mensaje del usuario
            $userMessage = AIMessage::create([
                'conversation_id' => $conversation->id,
                'role' => 'user',
                'content' => $request->message,
                'tokens' => 0
            ]);

            // Construir historial de mensajes
            $history = $conversation->messages()
                ->orderBy('created_at', 'asc')
                ->get()
                ->map(fn($msg) => [
                    'role' => $msg->role,
                    'content' => $msg->content
                ])
                ->toArray();

            // Construir contexto del caso si existe
            $context = '';
            if ($request->case_id) {
                $context = $this->buildContext($request->case_id);
            }

            // Generar título si es el primer mensaje
            if ($conversation->messages()->count() === 1) {
                $conversation->update([
                    'title' => $this->generateTitle($request->message)
                ]);
            }

            // Responder con streaming o normal
            if ($request->stream) {
                return $this->streamResponse($conversation, $history, $context);
            } else {
                return $this->normalResponse($conversation, $history, $context);
            }

        } catch (\Exception $e) {
            Log::error('AIAssistantController chat error', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'error' => 'Error al procesar la consulta',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Respuesta con streaming SSE
     */
    protected function streamResponse($conversation, $history, $context)
    {
        return response()->stream(function () use ($conversation, $history, $context) {
            $fullResponse = '';

            $this->geminiService->chatStream($history, $context, function($chunk) use (&$fullResponse) {
                $fullResponse .= $chunk;
                echo "data: " . json_encode(['chunk' => $chunk]) . "\n\n";
                ob_flush();
                flush();
            });

            // Guardar respuesta del asistente
            $assistantMessage = AIMessage::create([
                'conversation_id' => $conversation->id,
                'role' => 'assistant',
                'content' => $fullResponse,
                'tokens' => 0
            ]);

            // Enviar evento final
            echo "data: " . json_encode([
                'done' => true,
                'conversation_id' => $conversation->id,
                'message_id' => $assistantMessage->id
            ]) . "\n\n";
            ob_flush();
            flush();

        }, 200, [
            'Content-Type' => 'text/event-stream',
            'Cache-Control' => 'no-cache',
            'X-Accel-Buffering' => 'no',
            'Connection' => 'keep-alive',
        ]);
    }

    /**
     * Respuesta normal (sin streaming)
     */
    protected function normalResponse($conversation, $history, $context)
    {
        $response = $this->geminiService->chat($history, $context);

        $assistantMessage = AIMessage::create([
            'conversation_id' => $conversation->id,
            'role' => 'assistant',
            'content' => $response['content'],
            'tokens' => $response['tokens']
        ]);

        return response()->json([
            'conversation_id' => $conversation->id,
            'message' => $response['content'],
            'message_id' => $assistantMessage->id,
            'tokens' => $response['tokens']
        ]);
    }

    /**
     * Obtener o crear conversación
     */
    protected function getOrCreateConversation($userId, $conversationId = null, $caseId = null)
    {
        if ($conversationId) {
            $conversation = AIConversation::where('id', $conversationId)
                ->where('user_id', $userId)
                ->firstOrFail();
            return $conversation;
        }

        return AIConversation::create([
            'user_id' => $userId,
            'case_id' => $caseId,
            'title' => 'Nueva conversación',
            'type' => 'general'
        ]);
    }

    /**
     * Construir contexto del caso jurídico
     */
    protected function buildContext($caseId)
    {
        $case = CaseModel::find($caseId);

        if (!$case) {
            return '';
        }

        $context = "CASO JURÍDICO:\n";
        $context .= "Radicado: {$case->radicado}\n";
        $context .= "Estado: {$case->estado_actual}\n";

        if ($case->descripcion) {
            $context .= "Descripción: {$case->descripcion}\n";
        }

        return $context;
    }

    /**
     * Verificar límite diario de consultas según el plan
     */
    protected function checkDailyLimit($user)
    {
        $subscription = $user->activeSubscription();
        $planName = $subscription ? $subscription->plan->name : 'free';

        $limits = [
            'free' => 10,
            'Básico' => 50,
            'Profesional' => 200,
            'Empresarial' => 1000
        ];

        $dailyLimit = $limits[$planName] ?? 10;

        $today = now()->startOfDay();
        $messagesCount = AIMessage::whereHas('conversation', function($query) use ($user) {
            $query->where('user_id', $user->id);
        })->where('role', 'user')
          ->where('created_at', '>=', $today)
          ->count();

        return $messagesCount < $dailyLimit;
    }

    /**
     * Generar título automático para la conversación
     */
    protected function generateTitle($firstMessage)
    {
        $title = substr($firstMessage, 0, 50);
        if (strlen($firstMessage) > 50) {
            $title .= '...';
        }
        return $title;
    }

    /**
     * Obtener historial de conversaciones del usuario
     */
    public function getConversations(Request $request)
    {
        $user = Auth::user();

        $conversations = AIConversation::where('user_id', $user->id)
            ->with('caseModel:id,file_number')
            ->orderBy('updated_at', 'desc')
            ->paginate(20);

        return response()->json($conversations);
    }

    /**
     * Obtener mensajes de una conversación
     */
    public function getMessages($conversationId)
    {
        $user = Auth::user();

        $conversation = AIConversation::where('id', $conversationId)
            ->where('user_id', $user->id)
            ->with(['messages' => function($query) {
                $query->orderBy('created_at', 'asc');
            }])
            ->firstOrFail();

        return response()->json([
            'conversation' => $conversation,
            'messages' => $conversation->messages
        ]);
    }

    /**
     * Eliminar conversación
     */
    public function deleteConversation($conversationId)
    {
        $user = Auth::user();

        $conversation = AIConversation::where('id', $conversationId)
            ->where('user_id', $user->id)
            ->firstOrFail();

        $conversation->delete();

        return response()->json(['message' => 'Conversación eliminada']);
    }

    /**
     * Actualizar título de conversación
     */
    public function updateTitle(Request $request, $conversationId)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'Validación fallida',
                'details' => $validator->errors()
            ], 422);
        }

        $user = Auth::user();

        $conversation = AIConversation::where('id', $conversationId)
            ->where('user_id', $user->id)
            ->firstOrFail();

        $conversation->update(['title' => $request->title]);

        return response()->json(['conversation' => $conversation]);
    }
}
