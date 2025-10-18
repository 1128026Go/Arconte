<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\Http;

echo "Listing available Gemini models...\n\n";

$apiKey = env('GEMINI_API_KEY');

$response = Http::timeout(30)->get(
    "https://generativelanguage.googleapis.com/v1beta/models?key={$apiKey}"
);

if ($response->successful()) {
    $data = $response->json();
    echo "Available models:\n\n";
    foreach ($data['models'] ?? [] as $model) {
        if (str_contains($model['name'], 'gemini')) {
            echo "- " . $model['name'] . "\n";
            echo "  Display Name: " . ($model['displayName'] ?? 'N/A') . "\n";
            echo "  Description: " . ($model['description'] ?? 'N/A') . "\n";
            echo "  Supported Methods: " . implode(', ', $model['supportedGenerationMethods'] ?? []) . "\n\n";
        }
    }
} else {
    echo "Error listing models:\n";
    echo $response->body() . "\n";
}
