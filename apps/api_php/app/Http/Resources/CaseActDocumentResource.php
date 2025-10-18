<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\URL;

class CaseActDocumentResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'filename' => $this->filename,
            'mimetype' => $this->mimetype,
            'has_text' => filled($this->text_content),
            'download_url' => URL::temporarySignedRoute(
                'documents.download',
                now()->addMinutes(10),
                ['doc' => $this->id]
            ),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
