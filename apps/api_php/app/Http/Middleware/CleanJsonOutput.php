<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CleanJsonOutput
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Limpiar cualquier salida previa
        while (ob_get_level()) {
            ob_end_clean();
        }
        
        // Iniciar buffer limpio
        ob_start();
        
        $response = $next($request);
        
        // Si es una respuesta JSON, limpiar cualquier contenido problemático
        if ($response->headers->get('Content-Type') === 'application/json' || 
            str_contains($response->headers->get('Content-Type', ''), 'application/json')) {
            
            $content = $response->getContent();
            
            // Remover BOM y caracteres problemáticos
            $content = preg_replace('/^[\x00-\x1F\x7F-\x9F\uFFFD\?]*/', '', $content);
            
            // Buscar el primer '{' o '[' para JSON válido
            $jsonStart = max(strpos($content, '{') ?: 0, strpos($content, '[') ?: 0);
            if ($jsonStart > 0) {
                $content = substr($content, $jsonStart);
            }
            
            $response->setContent($content);
        }
        
        return $response;
    }
}
