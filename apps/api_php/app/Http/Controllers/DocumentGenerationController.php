<?php

namespace App\Http\Controllers;

use App\Models\GeneratedDocument;
use App\Models\DocumentTemplate;
use App\Models\CaseModel;
use App\Services\GeminiService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;

class DocumentGenerationController extends Controller
{
    protected $geminiService;

    public function __construct(GeminiService $geminiService)
    {
        $this->geminiService = $geminiService;
    }

    /**
     * Generar documento con IA
     */
    public function generate(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'template_type' => 'required|string|max:100',
            'title' => 'required|string|max:255',
            'parameters' => 'required|array',
            'case_id' => 'nullable|exists:case_models,id',
            'format' => 'nullable|in:docx,pdf,txt',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'Validación fallida',
                'details' => $validator->errors()
            ], 422);
        }

        $user = Auth::user();

        try {
            // Crear registro del documento
            $document = GeneratedDocument::create([
                'user_id' => $user->id,
                'case_id' => $request->case_id,
                'template_type' => $request->template_type,
                'title' => $request->title,
                'parameters' => $request->parameters,
                'status' => 'generating',
                'format' => $request->format ?? 'docx',
            ]);

            // Construir contexto del caso si existe
            $caseContext = '';
            if ($request->case_id) {
                $caseContext = $this->buildCaseContext($request->case_id);
            }

            // Generar contenido con IA
            $result = $this->geminiService->generateDocument(
                $request->template_type,
                $request->parameters,
                $caseContext
            );

            // Actualizar documento con contenido generado
            $document->update([
                'content' => $result['content'],
                'status' => 'completed'
            ]);

            return response()->json([
                'success' => true,
                'document' => $document,
                'tokens_used' => $result['tokens']
            ]);

        } catch (\Exception $e) {
            if (isset($document)) {
                $document->markAsFailed();
            }

            Log::error('DocumentGenerationController generate error', [
                'message' => $e->getMessage(),
                'user_id' => $user->id
            ]);

            return response()->json([
                'error' => 'Error al generar el documento',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Listar documentos generados del usuario
     */
    public function index(Request $request)
    {
        $user = Auth::user();

        $query = GeneratedDocument::where('user_id', $user->id)
            ->with('caseModel:id,radicado');

        if ($request->has('status')) {
            $query->byStatus($request->status);
        }

        if ($request->has('template_type')) {
            $query->byTemplateType($request->template_type);
        }

        if ($request->has('case_id')) {
            $query->where('case_id', $request->case_id);
        }

        $documents = $query->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json($documents);
    }

    /**
     * Obtener un documento generado
     */
    public function show($id)
    {
        $user = Auth::user();

        $document = GeneratedDocument::where('id', $id)
            ->where('user_id', $user->id)
            ->with('caseModel:id,radicado')
            ->firstOrFail();

        return response()->json($document);
    }

    /**
     * Actualizar documento generado
     */
    public function update(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'sometimes|string|max:255',
            'content' => 'sometimes|string',
            'status' => 'sometimes|in:draft,completed,failed',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'Validación fallida',
                'details' => $validator->errors()
            ], 422);
        }

        $user = Auth::user();

        $document = GeneratedDocument::where('id', $id)
            ->where('user_id', $user->id)
            ->firstOrFail();

        $document->update($request->only(['title', 'content', 'status']));

        return response()->json($document);
    }

    /**
     * Eliminar documento generado
     */
    public function destroy($id)
    {
        $user = Auth::user();

        $document = GeneratedDocument::where('id', $id)
            ->where('user_id', $user->id)
            ->firstOrFail();

        // Eliminar archivo si existe
        if ($document->file_path) {
            Storage::delete($document->file_path);
        }

        $document->delete();

        return response()->json(['message' => 'Documento eliminado']);
    }

    /**
     * Exportar documento a DOCX/PDF
     */
    public function export($id, Request $request)
    {
        $validator = Validator::make($request->all(), [
            'format' => 'required|in:docx,pdf,txt'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'Formato inválido',
                'details' => $validator->errors()
            ], 422);
        }

        $user = Auth::user();

        $document = GeneratedDocument::where('id', $id)
            ->where('user_id', $user->id)
            ->firstOrFail();

        try {
            $format = $request->format;
            $fileName = $this->sanitizeFileName($document->title) . '.' . $format;

            // Por ahora solo exportamos TXT, DOCX y PDF requieren librerías adicionales
            if ($format === 'txt') {
                $content = $document->content;

                return response($content)
                    ->header('Content-Type', 'text/plain')
                    ->header('Content-Disposition', 'attachment; filename="' . $fileName . '"');
            }

            // TODO: Implementar exportación a DOCX y PDF con librerías como PhpWord o DomPDF
            return response()->json([
                'error' => 'Formato no implementado aún',
                'message' => 'La exportación a ' . strtoupper($format) . ' se implementará próximamente'
            ], 501);

        } catch (\Exception $e) {
            Log::error('Document export error', [
                'document_id' => $id,
                'format' => $format ?? 'unknown',
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'error' => 'Error al exportar documento',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Listar plantillas disponibles
     */
    public function listTemplates()
    {
        $user = Auth::user();

        $templates = DocumentTemplate::where(function($query) use ($user) {
            $query->where('is_public', true)
                  ->orWhere('user_id', $user->id);
        })->orderBy('category')
          ->orderBy('name')
          ->get();

        return response()->json($templates);
    }

    /**
     * Crear plantilla personalizada
     */
    public function createTemplate(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'category' => 'required|string|max:100',
            'description' => 'nullable|string',
            'content' => 'required|string',
            'variables' => 'nullable|array',
            'is_public' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'Validación fallida',
                'details' => $validator->errors()
            ], 422);
        }

        $user = Auth::user();

        $template = DocumentTemplate::create([
            'user_id' => $user->id,
            'name' => $request->name,
            'category' => $request->category,
            'description' => $request->description,
            'content' => $request->content,
            'variables' => $request->variables ?? [],
            'is_public' => $request->is_public ?? false,
        ]);

        return response()->json($template, 201);
    }

    /**
     * Construir contexto del caso
     */
    protected function buildCaseContext($caseId): string
    {
        $case = CaseModel::find($caseId);

        if (!$case) {
            return '';
        }

        $context = "INFORMACIÓN DEL CASO:\n";
        $context .= "Radicado: {$case->radicado}\n";
        $context .= "Estado: {$case->estado_actual}\n";

        if ($case->tipo_proceso) {
            $context .= "Tipo de proceso: {$case->tipo_proceso}\n";
        }

        if ($case->despacho) {
            $context .= "Despacho: {$case->despacho}\n";
        }

        return $context;
    }

    /**
     * Sanitizar nombre de archivo
     */
    protected function sanitizeFileName($fileName): string
    {
        $fileName = preg_replace('/[^a-zA-Z0-9_\-]/', '_', $fileName);
        return substr($fileName, 0, 200);
    }
}
