<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ForceLocalhost
{
    /**
     * Forzar redirección de 127.0.0.1 a localhost
     *
     * Esto previene problemas de cookies donde 127.0.0.1 y localhost
     * son tratados como dominios diferentes por el navegador.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // En entornos de desarrollo / local no forzar redirecciones
        if (app()->environment('local', 'development', 'testing')) {
            return $next($request);
        }

        // Si la request viene de 127.0.0.1 o ::1, redirigir a localhost
        if ($request->getHost() === '127.0.0.1' || $request->getHost() === '::1') {
            $url = str_replace('127.0.0.1', 'localhost', $request->fullUrl());
            $url = str_replace('::1', 'localhost', $url);
            return redirect()->to($url, 301);
        }

        return $next($request);
    }
}
