<?php

namespace App\Http\Controllers;

use App\Services\JurisprudenceService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class JurisprudenceController extends Controller
{
    public function __construct(private JurisprudenceService $service)
    {
    }

    public function index(Request $request): JsonResponse
    {
        // Listar jurisprudencia reciente o todos
        $limit = $request->input('limit', 20);
        $offset = $request->input('offset', 0);

        return response()->json([
            'ok' => true,
            'data' => [],
            'total' => 0,
            'limit' => $limit,
            'offset' => $offset
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        // Guardar una sentencia como favorita o para referencia
        return response()->json([
            'ok' => true,
            'message' => 'Sentencia guardada exitosamente',
            'data' => $request->all()
        ], 201);
    }

    public function show($id): JsonResponse
    {
        // Obtener detalles de una sentencia específica
        return response()->json([
            'ok' => true,
            'data' => [
                'id' => $id,
                'numero_sentencia' => 'T-082-25',
                'fecha' => '2025-01-15',
                'tipo' => 'T',
                'magistrado_ponente' => 'Magistrado de ejemplo',
                'temas' => ['Salud', 'Tutela'],
                'resumen' => 'Resumen de la sentencia...'
            ]
        ]);
    }

    public function update(Request $request, $id): JsonResponse
    {
        // Actualizar notas o anotaciones sobre una sentencia
        return response()->json([
            'ok' => true,
            'message' => 'Sentencia actualizada exitosamente',
            'data' => array_merge(['id' => $id], $request->all())
        ]);
    }

    public function destroy($id): JsonResponse
    {
        // Eliminar una sentencia de favoritos
        return response()->json([
            'ok' => true,
            'message' => 'Sentencia eliminada de favoritos'
        ]);
    }

    public function search(Request $request): JsonResponse
    {
        return $this->service->search($request->only(['query', 'type', 'year']));
    }

    public function similar($id): JsonResponse
    {
        // Buscar sentencias similares
        return response()->json([
            'ok' => true,
            'data' => [],
            'message' => 'Sentencias similares a ' . $id
        ]);
    }

    public function favorite(Request $request, $id): JsonResponse
    {
        // Marcar/desmarcar como favorita
        $isFavorite = $request->input('favorite', true);

        return response()->json([
            'ok' => true,
            'message' => $isFavorite ? 'Agregado a favoritos' : 'Removido de favoritos',
            'data' => [
                'id' => $id,
                'is_favorite' => $isFavorite
            ]
        ]);
    }
}