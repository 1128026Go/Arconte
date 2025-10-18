<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\Http;

echo "Testing Gemini API...\n\n";

$apiKey = env('GEMINI_API_KEY');
echo "API Key: " . substr($apiKey, 0, 10) . "...\n\n";

$geminiContents = [
    [
        'role' => 'user',
        'parts' => [['text' => 'Eres un asistente útil.

Hola, ¿cómo estás?']]
    ]
];

echo "Sending request to Gemini API...\n";
$response = Http::timeout(60)->post(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={$apiKey}",
    [
        'contents' => $geminiContents,
        'generationConfig' => [
            'temperature' => 0.7,
            'maxOutputTokens' => 2000,
        ]
    ]
);

echo "\nStatus Code: " . $response->status() . "\n";
echo "\nResponse Body:\n";
echo $response->body() . "\n";

if ($response->successful()) {
    echo "\n✓ Success!\n";
    $data = $response->json();
    echo "Message: " . ($data['candidates'][0]['content']['parts'][0]['text'] ?? 'No content') . "\n";
} else {
    echo "\n❌ API call failed\n";
}
