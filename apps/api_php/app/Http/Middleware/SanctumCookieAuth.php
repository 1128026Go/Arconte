<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SanctumCookieAuth
{
    /**
     * Handle an incoming request.
     *
     * Este middleware extrae el token de la cookie httpOnly y lo coloca
     * en el header Authorization para que Sanctum pueda validarlo.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Si ya tiene Authorization header, dejar pasar
        if ($request->bearerToken()) {
            return $next($request);
        }

        // Extraer token de cookie
        $token = $request->cookie('arconte_token');

        if ($token) {
            // Agregar el token al header Authorization
            $request->headers->set('Authorization', 'Bearer ' . $token);
        }

        return $next($request);
    }
}
