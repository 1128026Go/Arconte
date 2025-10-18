<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class DocumentStore
{
    /**
     * Descarga un documento desde una URL y lo almacena en el storage
     */
    public static function storeFromUrl(string $url, string $disk = 'documents'): array
    {
        $response = Http::timeout(60)->get($url);

        if (!$response->ok()) {
            throw new \RuntimeException('No se pudo descargar documento');
        }

        $binary = $response->body();
        $sha256 = hash('sha256', $binary);
        $contentType = $response->header('content-type');
        $extension = self::guessExtension($contentType);
        $filename = Str::uuid() . ($extension ? ".$extension" : '');

        Storage::disk($disk)->put($filename, $binary);

        return [
            'path' => $filename,
            'mimetype' => $contentType,
            'sha256' => $sha256,
            'filename' => $filename,
        ];
    }

    /**
     * Almacena un archivo subido
     */
    public static function storeFromUpload(UploadedFile $file, string $disk = 'documents'): array
    {
        $binary = file_get_contents($file->getRealPath());
        $sha256 = hash('sha256', $binary);

        // Verificar si ya existe
        if (Storage::disk($disk)->exists($sha256)) {
            return [
                'path' => $sha256,
                'mimetype' => $file->getMimeType(),
                'sha256' => $sha256,
                'filename' => $file->getClientOriginalName(),
            ];
        }

        $path = $file->store('', $disk);

        return [
            'path' => $path,
            'mimetype' => $file->getMimeType(),
            'sha256' => $sha256,
            'filename' => $file->getClientOriginalName(),
        ];
    }

    /**
     * Intenta adivinar la extensión del archivo desde el content-type
     */
    private static function guessExtension(?string $contentType): ?string
    {
        return match (true) {
            str_contains($contentType ?? '', 'pdf') => 'pdf',
            str_contains($contentType ?? '', 'msword') => 'doc',
            str_contains($contentType ?? '', 'officedocument.wordprocessingml') => 'docx',
            default => null
        };
    }
}
