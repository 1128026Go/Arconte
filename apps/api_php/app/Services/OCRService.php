<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Symfony\Component\Process\Process;

class OCRService
{
    private const LANGUAGES = [
        'spa' => 'Spanish',
        'eng' => 'English',
    ];

    public function processDocument(string $filePath, string $language = 'spa'): array
    {
        if (!$this->isEnabled()) {
            return $this->failure('OCR disabled by config');
        }

        if (!file_exists($filePath)) {
            return $this->failure('Document not found');
        }

        $language = array_key_exists($language, self::LANGUAGES) ? $language : 'spa';

        $extension = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));

        if ($extension === 'pdf') {
            return $this->processPdf($filePath, $language);
        }

        return $this->processImage($filePath, $language);
    }

    public function getSupportedLanguages(): array
    {
        return self::LANGUAGES;
    }

    public function getSystemInfo(): array
    {
        $tesseract = $this->binaryExists('tesseract');
        $convert = $this->binaryExists('convert');

        return [
            'enabled' => $this->isEnabled(),
            'tesseract_available' => $tesseract,
            'convert_available' => $convert,
            'dependencies_met' => $tesseract && $convert,
            'supported_languages' => self::LANGUAGES,
        ];
    }

    private function processImage(string $imagePath, string $language): array
    {
        if (!$this->binaryExists('tesseract')) {
            return $this->dependencyFailure(['tesseract']);
        }

        $outputBase = tempnam(sys_get_temp_dir(), 'ocr_out_');
        if ($outputBase === false) {
            return $this->failure('Unable to create temporary file for OCR output');
        }
        @unlink($outputBase);

        $process = $this->runProcess([
            'tesseract',
            $imagePath,
            $outputBase,
            '-l',
            $language,
            '--psm',
            '3',
        ], 120);

        $textFile = $outputBase . '.txt';

        if (!$process['success'] || !file_exists($textFile)) {
            $this->cleanupFiles([$textFile]);

            Log::warning('OCR command failed', [
                'exit_code' => $process['exit_code'],
                'stderr' => $process['error_output'],
            ]);

            return $this->failure('Failed to run tesseract', [
                'exit_code' => $process['exit_code'],
                'stderr' => $process['error_output'],
            ]);
        }

        $rawText = (string) file_get_contents($textFile);
        $this->cleanupFiles([$textFile]);

        $cleanText = trim(preg_replace('/\s+/', ' ', $rawText));
        $confidence = $this->estimateConfidence($cleanText);
        $wordCount = str_word_count($cleanText);

        Log::info('OCR extraction completed', [
            'source' => basename($imagePath),
            'language' => $language,
            'text_length' => mb_strlen($cleanText),
            'confidence' => $confidence,
        ]);

        return [
            'success' => true,
            'text' => $cleanText,
            'confidence' => $confidence,
            'language' => $language,
            'word_count' => $wordCount,
            'pages' => 1,
        ];
    }

    private function processPdf(string $pdfPath, string $language): array
    {
        if (!$this->binaryExists('tesseract')) {
            return $this->dependencyFailure(['tesseract']);
        }

        if (!$this->binaryExists('convert')) {
            return $this->dependencyFailure(['convert']);
        }

        $imageBase = tempnam(sys_get_temp_dir(), 'ocr_pdf_');
        if ($imageBase === false) {
            return $this->failure('Unable to create temporary file for PDF conversion');
        }
        @unlink($imageBase);
        $imagePath = $imageBase . '.png';

        $convert = $this->runProcess([
            'convert',
            '-density',
            '300',
            $pdfPath . '[0]',
            '-quality',
            '100',
            $imagePath,
        ], 120);

        if (!$convert['success'] || !file_exists($imagePath)) {
            $this->cleanupFiles([$imagePath]);

            Log::warning('PDF to image conversion failed', [
                'exit_code' => $convert['exit_code'],
                'stderr' => $convert['error_output'],
            ]);

            return $this->failure('Failed to convert PDF to image', [
                'exit_code' => $convert['exit_code'],
                'stderr' => $convert['error_output'],
            ]);
        }

        $result = $this->processImage($imagePath, $language);
        $this->cleanupFiles([$imagePath]);

        if ($result['success']) {
            $result['pages'] = 1;
        }

        return $result;
    }

    private function runProcess(array $command, int $timeout): array
    {
        $process = new Process($command);
        $process->setTimeout($timeout);
        $process->run();

        return [
            'success' => $process->isSuccessful(),
            'exit_code' => $process->getExitCode(),
            'output' => trim($process->getOutput()),
            'error_output' => trim($process->getErrorOutput()),
        ];
    }

    private function binaryExists(string $binary): bool
    {
        $command = PHP_OS_FAMILY === 'Windows'
            ? ['where', $binary]
            : ['which', $binary];

        try {
            $result = $this->runProcess($command, 5);
        } catch (\Throwable $exception) {
            Log::warning('Failed to probe OCR binary', [
                'binary' => $binary,
                'message' => $exception->getMessage(),
            ]);

            return false;
        }

        return $result['success'] && $result['output'] !== '';
    }

    private function cleanupFiles(array $paths): void
    {
        foreach ($paths as $path) {
            if ($path && file_exists($path)) {
                @unlink($path);
            }
        }
    }

    private function failure(string $message, array $extra = []): array
    {
        return array_merge([
            'success' => false,
            'text' => '',
            'confidence' => 0,
            'pages' => 0,
            'error' => $message,
        ], $extra);
    }

    private function dependencyFailure(array $missing): array
    {
        return $this->failure('OCR dependencies not installed', [
            'missing_dependencies' => $missing,
        ]);
    }

    private function estimateConfidence(string $text): float
    {
        $length = mb_strlen($text);
        if ($length === 0) {
            return 0.0;
        }

        $alphanumeric = preg_replace('/[^\p{L}\p{N}]+/u', '', $text);
        $ratio = $length > 0 ? mb_strlen($alphanumeric) / $length : 0;

        return round(min(100, $ratio * 100), 2);
    }

    private function isEnabled(): bool
    {
        $value = env('OCR_ENABLED', true);

        if (is_bool($value)) {
            return $value;
        }

        return in_array(strtolower((string) $value), ['1', 'true', 'on', 'yes'], true);
    }
}
