<?php

namespace App\Http\Controllers;

use App\Models\Transcription;
use App\Services\TranscriptionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Exception;

class TranscriptionController extends Controller
{
    protected $transcriptionService;

    public function __construct(TranscriptionService $transcriptionService)
    {
        $this->transcriptionService = $transcriptionService;
    }

    /**
     * Subir archivo de audio/video y crear transcripción
     */
    public function upload(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'file' => 'required|file|mimes:mp3,mp4,m4a,wav,webm,mpeg|max:51200', // max 50MB
            'title' => 'required|string|max:255',
            'case_id' => 'nullable|exists:case_models,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Error de validación',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $user = Auth::user();
            $file = $request->file('file');

            // Validar tipo de archivo
            $mimeType = $file->getMimeType();
            if (!$this->transcriptionService->validateAudioFile($mimeType)) {
                return response()->json([
                    'message' => 'Tipo de archivo no permitido',
                ], 422);
            }

            // Generar nombre único para el archivo
            $originalName = $file->getClientOriginalName();
            $extension = $file->getClientOriginalExtension();
            $filename = Str::uuid() . '.' . $extension;

            // Guardar archivo
            $path = $file->storeAs('transcriptions', $filename, 'public');

            // Determinar tipo de archivo
            $fileType = str_starts_with($mimeType, 'video/') ? 'video' : 'audio';

            // Obtener información del archivo
            $audioInfo = $this->transcriptionService->getAudioInfo($path);

            // Crear registro de transcripción
            $transcription = Transcription::create([
                'user_id' => $user->id,
                'case_id' => $request->case_id,
                'title' => $request->title,
                'file_path' => $path,
                'file_type' => $fileType,
                'original_filename' => $originalName,
                'file_size' => $audioInfo['file_size'],
                'duration' => $audioInfo['duration'],
                'status' => 'pending',
                'metadata' => [
                    'mime_type' => $mimeType,
                    'uploaded_at' => now()->toIso8601String(),
                ],
            ]);

            // Procesar transcripción en background
            // Nota: En producción esto debería ir a una cola (queue)
            try {
                $this->transcriptionService->processTranscription($transcription);
            } catch (Exception $e) {
                // Si falla, el estado ya se actualizó en el servicio
            }

            return response()->json([
                'message' => 'Archivo subido exitosamente',
                'data' => $transcription->fresh()->load(['user', 'caseModel']),
            ], 201);

        } catch (Exception $e) {
            return response()->json([
                'message' => 'Error al subir el archivo',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Listar transcripciones del usuario
     */
    public function index(Request $request)
    {
        $user = Auth::user();

        $query = Transcription::byUser($user->id)
            ->with(['caseModel'])
            ->orderBy('created_at', 'desc');

        // Filtrar por caso
        if ($request->has('case_id')) {
            $query->where('case_id', $request->case_id);
        }

        // Filtrar por estado
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Paginación
        $perPage = $request->input('per_page', 15);
        $transcriptions = $query->paginate($perPage);

        return response()->json([
            'data' => $transcriptions->items(),
            'meta' => [
                'current_page' => $transcriptions->currentPage(),
                'last_page' => $transcriptions->lastPage(),
                'per_page' => $transcriptions->perPage(),
                'total' => $transcriptions->total(),
            ]
        ]);
    }

    /**
     * Obtener una transcripción específica
     */
    public function show($id)
    {
        $user = Auth::user();

        $transcription = Transcription::byUser($user->id)
            ->with(['user', 'caseModel'])
            ->findOrFail($id);

        return response()->json([
            'data' => $transcription
        ]);
    }

    /**
     * Actualizar una transcripción (título, caso asociado)
     */
    public function update(Request $request, $id)
    {
        $user = Auth::user();

        $transcription = Transcription::byUser($user->id)->findOrFail($id);

        $validator = Validator::make($request->all(), [
            'title' => 'sometimes|string|max:255',
            'case_id' => 'nullable|exists:case_models,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Error de validación',
                'errors' => $validator->errors()
            ], 422);
        }

        $transcription->update($request->only(['title', 'case_id']));

        return response()->json([
            'message' => 'Transcripción actualizada',
            'data' => $transcription->fresh()->load(['user', 'caseModel']),
        ]);
    }

    /**
     * Eliminar una transcripción
     */
    public function destroy($id)
    {
        $user = Auth::user();

        $transcription = Transcription::byUser($user->id)->findOrFail($id);

        try {
            // Eliminar archivo físico
            $this->transcriptionService->deleteTranscriptionFile($transcription);

            // Eliminar registro
            $transcription->delete();

            return response()->json([
                'message' => 'Transcripción eliminada exitosamente'
            ]);

        } catch (Exception $e) {
            return response()->json([
                'message' => 'Error al eliminar la transcripción',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Reprocesar una transcripción fallida
     */
    public function retry($id)
    {
        $user = Auth::user();

        $transcription = Transcription::byUser($user->id)->findOrFail($id);

        if ($transcription->status !== 'failed') {
            return response()->json([
                'message' => 'Solo se pueden reprocesar transcripciones fallidas'
            ], 422);
        }

        try {
            $this->transcriptionService->processTranscription($transcription);

            return response()->json([
                'message' => 'Reprocesamiento iniciado',
                'data' => $transcription->fresh(),
            ]);

        } catch (Exception $e) {
            return response()->json([
                'message' => 'Error al reprocesar',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Exportar transcripción como archivo de texto
     */
    public function export($id)
    {
        $user = Auth::user();

        $transcription = Transcription::byUser($user->id)
            ->completed()
            ->findOrFail($id);

        $content = "TRANSCRIPCIÓN: {$transcription->title}\n";
        $content .= "Fecha: " . $transcription->created_at->format('d/m/Y H:i') . "\n";
        $content .= str_repeat("=", 80) . "\n\n";
        $content .= $transcription->transcription . "\n\n";

        if ($transcription->summary) {
            $content .= str_repeat("=", 80) . "\n";
            $content .= "RESUMEN\n";
            $content .= str_repeat("=", 80) . "\n\n";
            $content .= $transcription->summary . "\n";
        }

        $filename = Str::slug($transcription->title) . '.txt';

        return response($content)
            ->header('Content-Type', 'text/plain')
            ->header('Content-Disposition', 'attachment; filename="' . $filename . '"');
    }

    /**
     * Obtener estadísticas de transcripciones del usuario
     */
    public function stats()
    {
        $user = Auth::user();

        $total = Transcription::byUser($user->id)->count();
        $completed = Transcription::byUser($user->id)->completed()->count();
        $pending = Transcription::byUser($user->id)->pending()->count();
        $processing = Transcription::byUser($user->id)->where('status', 'processing')->count();
        $failed = Transcription::byUser($user->id)->where('status', 'failed')->count();

        $totalDuration = Transcription::byUser($user->id)
            ->whereNotNull('duration')
            ->sum('duration');

        $totalSize = Transcription::byUser($user->id)
            ->whereNotNull('file_size')
            ->sum('file_size');

        return response()->json([
            'data' => [
                'total' => $total,
                'completed' => $completed,
                'pending' => $pending,
                'processing' => $processing,
                'failed' => $failed,
                'total_duration_seconds' => $totalDuration,
                'total_size_bytes' => $totalSize,
                'total_size_mb' => round($totalSize / 1024 / 1024, 2),
            ]
        ]);
    }
}
