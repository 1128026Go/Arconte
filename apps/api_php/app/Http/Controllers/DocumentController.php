<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreDocumentRequest;
use App\Http\Resources\DocumentResource;
use App\Models\AuditLog;
use App\Models\Document;
use App\Models\DocumentShare;
use App\Models\DocumentVersion;
use App\Services\OCRService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Intervention\Image\ImageManager;

class DocumentController extends Controller
{
    public function __construct(private OCRService $ocrService)
    {
    }

    /**
     * List documents with filters (type, case_id, date)
     */
    public function index(Request $request)
    {
        $query = Document::where('user_id', $request->user()->id)
            ->with(['folder', 'versions']);

        // Filter by type (mime)
        if ($request->filled('type')) {
            $query->where('mime', 'like', '%' . $request->input('type') . '%');
        }

        // Filter by case_id
        if ($request->filled('case_id')) {
            $query->where('case_id', $request->input('case_id'));
        }

        // Filter by date range
        if ($request->filled('from_date')) {
            $query->whereDate('created_at', '>=', $request->input('from_date'));
        }

        if ($request->filled('to_date')) {
            $query->whereDate('created_at', '<=', $request->input('to_date'));
        }

        // Search by title
        if ($request->filled('search')) {
            $query->where('title', 'like', '%' . $request->input('search') . '%');
        }

        $documents = $query->latest()->paginate(20);

        return DocumentResource::collection($documents);
    }

    /**
     * Upload document, process with OCR if enabled, generate thumbnail
     */
    public function store(StoreDocumentRequest $request)
    {
        return DB::transaction(function () use ($request) {
            $user = $request->user();
            $file = $request->file('file');
            $path = $file->store('documents');

            $document = Document::create([
                'user_id' => $user->id,
                'case_id' => $request->integer('case_id') ?: null,
                'folder_id' => $request->integer('folder_id') ?: null,
                'title' => $request->string('title'),
                'mime' => $file->getClientMimeType(),
                'size' => $file->getSize(),
                'storage_path' => $path,
                'sha256' => hash_file('sha256', Storage::path($path)),
                'is_private' => $request->boolean('is_private', true),
            ]);

            // Process OCR if enabled and file is PDF or image
            if ($this->shouldProcessOCR($document->mime)) {
                $ocrResult = $this->ocrService->processDocument(Storage::path($path));
                if ($ocrResult['success']) {
                    $document->ocr_text = $ocrResult['text'];
                    $document->ocr_confidence = $ocrResult['confidence'];
                    $document->save();
                }
            }

            // Generate thumbnail for images
            if (str_starts_with($document->mime, 'image/')) {
                $this->generateThumbnail($document);
            }

            // Create initial version
            DocumentVersion::create([
                'document_id' => $document->id,
                'version' => 1,
                'storage_path' => $path,
                'sha256' => $document->sha256,
                'size' => $document->size,
            ]);

            // Audit log
            AuditLog::create([
                'user_id' => $user->id,
                'action' => 'document.created',
                'auditable_type' => Document::class,
                'auditable_id' => $document->id,
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);

            return new DocumentResource($document->load(['folder', 'versions']));
        });
    }

    /**
     * Get document with metadata
     */
    public function show(Document $document)
    {
        $this->authorize('view', $document);

        return new DocumentResource($document->load(['folder', 'versions']));
    }

    /**
     * Update document metadata
     */
    public function update(Request $request, Document $document)
    {
        $this->authorize('update', $document);

        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'case_id' => 'nullable|exists:case_models,id',
            'folder_id' => 'nullable|exists:document_folders,id',
            'is_private' => 'sometimes|boolean',
        ]);

        $oldData = $document->toArray();
        $document->update($validated);

        // Audit log
        AuditLog::create([
            'user_id' => $request->user()->id,
            'action' => 'document.updated',
            'auditable_type' => Document::class,
            'auditable_id' => $document->id,
            'old_values' => $oldData,
            'new_values' => $document->toArray(),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return new DocumentResource($document->fresh(['folder', 'versions']));
    }

    /**
     * Soft delete document
     */
    public function destroy(Request $request, Document $document)
    {
        $this->authorize('delete', $document);

        // Don't physically delete file, just soft delete record
        $document->delete();

        // Audit log
        AuditLog::create([
            'user_id' => $request->user()->id,
            'action' => 'document.deleted',
            'auditable_type' => Document::class,
            'auditable_id' => $document->id,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return response()->json(['status' => 'ok']);
    }

    /**
     * Download original file
     */
    public function download(Document $document)
    {
        $this->authorize('view', $document);

        if (! Storage::exists($document->storage_path)) {
            abort(404, 'File not found');
        }

        $extension = pathinfo($document->storage_path, PATHINFO_EXTENSION);
        $filename = Str::slug($document->title) . '.' . $extension;

        return Storage::download($document->storage_path, $filename);
    }

    /**
     * Get version history
     */
    public function versions(Document $document)
    {
        $this->authorize('view', $document);

        return response()->json([
            'versions' => $document->versions()->orderByDesc('version')->get(),
        ]);
    }

    /**
     * Generate shareable link with expiration
     */
    public function share(Request $request, Document $document)
    {
        $this->authorize('view', $document);

        $validated = $request->validate([
            'expires_in_hours' => 'nullable|integer|min:1|max:168', // Max 7 days
            'shared_with_user_id' => 'nullable|exists:users,id',
        ]);

        $expiresAt = isset($validated['expires_in_hours'])
            ? now()->addHours($validated['expires_in_hours'])
            : now()->addDays(7);

        $share = DocumentShare::create([
            'document_id' => $document->id,
            'owner_id' => $request->user()->id,
            'shared_with_user_id' => $validated['shared_with_user_id'] ?? null,
            'token' => Str::random(64),
            'expires_at' => $expiresAt,
        ]);

        // Audit log
        AuditLog::create([
            'user_id' => $request->user()->id,
            'action' => 'document.shared',
            'auditable_type' => Document::class,
            'auditable_id' => $document->id,
            'new_values' => ['expires_at' => $expiresAt],
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return response()->json([
            'share_url' => route('documents.shared', ['token' => $share->token]),
            'expires_at' => $expiresAt,
            'token' => $share->token,
        ]);
    }

    /**
     * Access shared document via token
     */
    public function shared(string $token)
    {
        $share = DocumentShare::where('token', $token)
            ->where(function ($q) {
                $q->whereNull('expires_at')
                    ->orWhere('expires_at', '>', now());
            })
            ->firstOrFail();

        $document = Document::findOrFail($share->document_id);

        if (! Storage::exists($document->storage_path)) {
            abort(404, 'File not found');
        }

        $extension = pathinfo($document->storage_path, PATHINFO_EXTENSION);
        $filename = Str::slug($document->title) . '.' . $extension;

        return Storage::download($document->storage_path, $filename);
    }

    /**
     * Generate thumbnail for image documents
     */
    private function generateThumbnail(Document $document): void
    {
        try {
            if (! class_exists(ImageManager::class)) {
                return; // Skip if Intervention Image not available
            }

            $manager = new ImageManager(['driver' => 'gd']);
            $image = $manager->make(Storage::path($document->storage_path));
            $image->fit(200, 200);

            $thumbnailPath = 'thumbnails/' . basename($document->storage_path);
            Storage::put($thumbnailPath, (string) $image->encode());

            $document->thumbnail_path = $thumbnailPath;
            $document->save();
        } catch (\Exception $e) {
            // Silently fail, thumbnail is optional
            logger()->warning('Failed to generate thumbnail', [
                'document_id' => $document->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Check if document should be processed with OCR
     */
    private function shouldProcessOCR(string $mime): bool
    {
        $ocrMimes = [
            'application/pdf',
            'image/png',
            'image/jpeg',
            'image/jpg',
            'image/tiff',
        ];

        return in_array($mime, $ocrMimes);
    }
}