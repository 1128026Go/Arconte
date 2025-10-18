<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SecurityHeaders
{
    /**
     * Handle an incoming request.
     *
     * Agrega headers de seguridad para proteger contra vulnerabilidades comunes:
     * - CSP (Content Security Policy)
     * - X-Content-Type-Options
     * - X-Frame-Options
     * - X-XSS-Protection
     * - Referrer-Policy
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Content Security Policy
        $response->headers->set(
            'Content-Security-Policy',
            "default-src 'self'; " .
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " .
            "style-src 'self' 'unsafe-inline'; " .
            "img-src 'self' data: https:; " .
            "font-src 'self' data:; " .
            "connect-src 'self' https://generativelanguage.googleapis.com https://consultaprocesos.ramajudicial.gov.co; " .
            "frame-ancestors 'none'"
        );

        // Previene MIME type sniffing
        $response->headers->set('X-Content-Type-Options', 'nosniff');

        // Previene clickjacking
        $response->headers->set('X-Frame-Options', 'DENY');

        // Habilita protección XSS del navegador
        $response->headers->set('X-XSS-Protection', '1; mode=block');

        // Controla el header Referer
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');

        // HSTS (Strict-Transport-Security) - Solo en producción con HTTPS
        if (config('app.env') === 'production') {
            $response->headers->set(
                'Strict-Transport-Security',
                'max-age=31536000; includeSubDomains; preload'
            );
        }

        // Permissions Policy (antigua Feature-Policy)
        $response->headers->set(
            'Permissions-Policy',
            'camera=(), microphone=(), geolocation=()'
        );

        return $response;
    }
}
