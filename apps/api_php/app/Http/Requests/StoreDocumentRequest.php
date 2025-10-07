<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreDocumentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => 'required|string|max:255',
            'file' => 'required|file',
            'folder_id' => 'nullable|integer',
            'case_id' => 'nullable|integer',
        ];
    }
}