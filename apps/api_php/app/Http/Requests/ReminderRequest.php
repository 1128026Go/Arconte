<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ReminderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'notes' => 'nullable|string',
            'due_date' => 'required|date',
            'type' => 'required|string|in:audiencia,plazo,reunion,pago,otro',
            'priority' => 'required|string|in:alta,media,baja',
            'case_id' => 'nullable|exists:case_models,id',
            'channel' => 'sometimes|in:inapp,email,sms',
        ];
    }

    protected function prepareForValidation()
    {
        // Convert due_date to due_at for compatibility with backend
        if ($this->has('due_date')) {
            $this->merge([
                'due_at' => $this->due_date
            ]);
        }
    }

    /**
     * Get the validated data from the request.
     * Convert due_date to due_at for database storage.
     */
    public function validated($key = null, $default = null)
    {
        $validated = parent::validated($key, $default);
        
        // Convert due_date to due_at for database compatibility
        if (isset($validated['due_date'])) {
            $validated['due_at'] = $validated['due_date'];
            unset($validated['due_date']);
        }
        
        return $validated;
    }
}