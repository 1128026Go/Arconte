<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class IngestClient
{
    protected string $base;
    protected string $apiKey;

    public function __construct()
    {
        $this->base = rtrim(env("INGEST_BASE_URL", "http://127.0.0.1:8001"), "/");
        $this->apiKey = env("INGEST_API_KEY", "");
    }

    public function normalized(string $radicado)
    {
        $response = Http::timeout(15)
            ->retry(2, 500)
            ->withHeaders([
                'X-API-Key' => $this->apiKey,
            ])
            ->get($this->base . '/normalized/' . urlencode($radicado));

        if (!$response->ok()) {
            throw new \RuntimeException('ingest_unreachable');
        }

        return $response->json();
    }
}
