<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DocumentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'mime' => $this->mime,
            'size' => $this->size,
            'storage_path' => $this->storage_path,
            'sha256' => $this->sha256,
            'is_private' => $this->is_private,
            'ocr_text' => $this->ocr_text,
            'ocr_confidence' => $this->ocr_confidence,
            'thumbnail_path' => $this->thumbnail_path,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'case_id' => $this->case_id,
            'folder_id' => $this->folder_id,
            'folder' => $this->whenLoaded('folder'),
            'case' => $this->whenLoaded('case'),
            'versions' => $this->whenLoaded('versions'),
        ];
    }
}