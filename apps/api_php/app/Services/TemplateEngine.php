<?php

namespace App\Services;

class TemplateEngine
{
    public function render(string $template, array $data): string
    {
        return preg_replace_callback('/\{\{\s*(\w+)\s*\}\}/', fn ($match) => $data[$match[1]] ?? '', $template);
    }
}