<?php

namespace App\Http\Controllers;

use App\Http\Resources\CaseActDocumentResource;
use App\Models\CaseAct;
use App\Models\CaseActDocument;
use App\Services\DocumentStore;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;

class ActDocumentController extends Controller
{
    /**
     * Lista todos los documentos de una actuación
     */
    public function index(CaseAct $act)
    {
        Gate::authorize('view', $act->caseModel);

        return CaseActDocumentResource::collection(
            $act->documents()->latest()->get()
        );
    }

    /**
     * Adjunta un documento desde una URL
     */
    public function attachByUrl(Request $request, CaseAct $act)
    {
        Gate::authorize('update', $act->caseModel);

        $request->validate(['url' => 'required|url']);

        try {
            $meta = DocumentStore::storeFromUrl($request->string('url')->toString());

            $document = CaseActDocument::firstOrCreate(
                ['sha256' => $meta['sha256']],
                array_merge($meta, [
                    'case_act_id' => $act->id,
                    'disk' => 'documents',
                    'is_primary' => true,
                ])
            );

            return new CaseActDocumentResource($document);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'No se pudo descargar el documento',
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Sube un documento
     */
    public function upload(Request $request, CaseAct $act)
    {
        Gate::authorize('update', $act->caseModel);

        $request->validate(['file' => 'required|file|max:20480']); // 20MB

        try {
            $meta = DocumentStore::storeFromUpload($request->file('file'));

            $document = CaseActDocument::firstOrCreate(
                ['sha256' => $meta['sha256']],
                array_merge($meta, [
                    'case_act_id' => $act->id,
                    'disk' => 'documents',
                    'is_primary' => true,
                ])
            );

            return new CaseActDocumentResource($document);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'No se pudo subir el documento',
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Descarga un documento
     */
    public function download(CaseActDocument $doc)
    {
        Gate::authorize('view', $doc->act->caseModel);

        return Storage::disk($doc->disk)->download($doc->path, $doc->filename);
    }

    /**
     * Obtiene el texto extraído del documento
     */
    public function text(CaseActDocument $doc)
    {
        Gate::authorize('view', $doc->act->caseModel);

        return response()->json([
            'id' => $doc->id,
            'text_preview' => str($doc->text_content)->limit(5000),
        ]);
    }
}
