<?php

namespace App\Http\Controllers;

use App\Models\Attachment;
use App\Models\CaseModel;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class AttachmentController extends Controller
{
    /**
     * List all attachments for a specific case
     */
    public function index(Request $request, int $caseId): JsonResponse
    {
        // Verify case belongs to user
        $case = CaseModel::where('user_id', $request->user()->id)
            ->findOrFail($caseId);

        $attachments = Attachment::where('case_id', $caseId)
            ->orderByDesc('created_at')
            ->get();

        return response()->json($attachments);
    }

    /**
     * Upload a new attachment
     */
    public function store(Request $request, int $caseId): JsonResponse
    {
        // Verify case belongs to user
        $case = CaseModel::where('user_id', $request->user()->id)
            ->findOrFail($caseId);

        $validator = Validator::make($request->all(), [
            'file' => 'required|file|max:10240', // Max 10MB
            'category' => 'nullable|string|max:255',
            'description' => 'nullable|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'errors' => $validator->errors()
            ], 422);
        }

        $file = $request->file('file');

        // Generate unique filename
        $originalName = $file->getClientOriginalName();
        $extension = $file->getClientOriginalExtension();
        $filename = pathinfo($originalName, PATHINFO_FILENAME);
        $uniqueFilename = $filename . '_' . time() . '.' . $extension;

        // Store file in storage/app/attachments/{case_id}
        $filePath = $file->storeAs(
            'attachments/' . $caseId,
            $uniqueFilename,
            'local'
        );

        // Create attachment record
        $attachment = Attachment::create([
            'case_id' => $caseId,
            'user_id' => $request->user()->id,
            'name' => $originalName,
            'file_path' => $filePath,
            'file_type' => $file->getMimeType(),
            'file_size' => $file->getSize(),
            'category' => $request->input('category'),
            'description' => $request->input('description'),
        ]);

        return response()->json($attachment, 201);
    }

    /**
     * Download an attachment
     */
    public function download(Request $request, int $caseId, int $id): JsonResponse|\Symfony\Component\HttpFoundation\StreamedResponse
    {
        // Verify case belongs to user
        $case = CaseModel::where('user_id', $request->user()->id)
            ->findOrFail($caseId);

        $attachment = Attachment::where('case_id', $caseId)
            ->findOrFail($id);

        if (!Storage::disk('local')->exists($attachment->file_path)) {
            return response()->json([
                'error' => 'File not found'
            ], 404);
        }

        return Storage::disk('local')->download(
            $attachment->file_path,
            $attachment->name
        );
    }

    /**
     * Update attachment metadata (category, description)
     */
    public function update(Request $request, int $caseId, int $id): JsonResponse
    {
        // Verify case belongs to user
        $case = CaseModel::where('user_id', $request->user()->id)
            ->findOrFail($caseId);

        $attachment = Attachment::where('case_id', $caseId)
            ->findOrFail($id);

        $validator = Validator::make($request->all(), [
            'category' => 'nullable|string|max:255',
            'description' => 'nullable|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'errors' => $validator->errors()
            ], 422);
        }

        $attachment->update($request->only(['category', 'description']));

        return response()->json($attachment);
    }

    /**
     * Delete an attachment
     */
    public function destroy(Request $request, int $caseId, int $id): JsonResponse
    {
        // Verify case belongs to user
        $case = CaseModel::where('user_id', $request->user()->id)
            ->findOrFail($caseId);

        $attachment = Attachment::where('case_id', $caseId)
            ->findOrFail($id);

        // Delete file from storage
        if (Storage::disk('local')->exists($attachment->file_path)) {
            Storage::disk('local')->delete($attachment->file_path);
        }

        // Soft delete record
        $attachment->delete();

        return response()->json(['success' => true]);
    }
}
