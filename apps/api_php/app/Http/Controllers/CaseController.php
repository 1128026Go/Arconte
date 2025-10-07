<?php

namespace App\Http\Controllers;

use App\Models\CaseAct;
use App\Models\CaseModel;
use App\Models\CaseParty;
use App\Services\IngestClient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class CaseController extends Controller
{
    public function index(Request $request)
    {
        $userId = $request->user()->id;

        return Cache::remember("cases.user.{$userId}", 300, function () use ($userId) {
            $cases = CaseModel::where('user_id', $userId)
                ->with(['parties', 'acts' => function($query) {
                    $query->orderByDesc('fecha')->limit(5);
                }])
                ->orderByDesc('updated_at')
                ->get();

            return $cases->map(function($case) {
                return [
                    'id' => $case->id,
                    'radicado' => $case->radicado,
                    'estado_actual' => $case->estado_actual,
                    'tipo_proceso' => $case->tipo_proceso,
                    'despacho' => $case->despacho,
                    'last_checked_at' => $case->last_checked_at,
                    'last_seen_at' => $case->last_seen_at,
                    'has_unread' => $case->has_unread,
                    'estado_checked' => $case->estado_checked,
                    'updated_at' => $case->updated_at,
                    'parties' => $case->parties->map(fn($p) => [
                        'id' => $p->id,
                        'role' => $p->rol,
                        'name' => $p->nombre,
                        'documento' => $p->documento,
                    ]),
                    'acts' => $case->acts->map(fn($a) => [
                        'id' => $a->id,
                        'date' => optional($a->fecha)->toDateString(),
                        'type' => $a->tipo,
                        'title' => $a->descripcion,
                    ]),
                ];
            });
        });
    }

    public function store(Request $request, IngestClient $ingest): JsonResponse
    {
        $data = $request->validate([
            'radicado' => 'required|string',
        ]);

        $model = CaseModel::firstOrCreate(
            [
                'user_id' => $request->user()->id,
                'radicado' => $data['radicado'],
            ],
            [
                'estado_actual' => 'Buscando...',
                'estado_checked' => false,
                'has_unread' => false,
            ]
        );

        // Si es un caso nuevo, buscar información automáticamente
        if ($model->wasRecentlyCreated || !$model->estado_checked) {
            try {
                $payload = $ingest->normalized($model->radicado);

                DB::transaction(function () use ($model, $payload) {
                    $model->parties()->delete();
                    foreach ((array) ($payload['parties'] ?? []) as $party) {
                        CaseParty::create([
                            'case_model_id' => $model->id,
                            'rol' => $party['role'] ?? $party['rol'] ?? null,
                            'nombre' => $party['name'] ?? $party['nombre'] ?? null,
                            'documento' => $party['documento'] ?? null,
                        ]);
                    }

                    foreach ((array) ($payload['acts'] ?? []) as $act) {
                        $uniq = $act['uniq_key'] ?? $act['hash'] ?? md5(json_encode($act));
                        CaseAct::updateOrCreate(
                            ['case_model_id' => $model->id, 'uniq_key' => $uniq],
                            [
                                'fecha' => $act['date'] ?? $act['fecha'] ?? null,
                                'tipo' => $act['type'] ?? $act['tipo'] ?? null,
                                'descripcion' => $act['title'] ?? $act['descripcion'] ?? $act['description'] ?? null,
                                'documento_url' => $act['documento_url'] ?? null,
                                'origen' => $act['origen'] ?? null,
                            ]
                        );
                    }

                    $model->estado_actual = data_get($payload, 'case.status', $model->estado_actual) ?? 'Activo';
                    $model->tipo_proceso = data_get($payload, 'case.tipo_proceso', $model->tipo_proceso);
                    $model->despacho = data_get($payload, 'case.despacho', data_get($payload, 'case.court', $model->despacho));
                    $model->last_checked_at = now();
                    $model->has_unread = true;
                    $model->estado_checked = true;
                    $model->save();
                });
            } catch (\Exception $e) {
                // Si falla la búsqueda, marcar como no encontrado
                $model->estado_actual = 'No encontrado';
                $model->estado_checked = true;
                $model->save();
            }
        }

        Cache::forget("cases.user.{$request->user()->id}");

        return response()->json($model, 201);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $userId = $request->user()->id;

        $model = Cache::remember("case.detail.{$id}", 180, function () use ($userId, $id) {
            return CaseModel::where('user_id', $userId)
                ->with(['parties', 'acts'])
                ->findOrFail($id);
        });

        return response()->json([
            'id' => $model->id,
            'radicado' => $model->radicado,
            'estado_actual' => $model->estado_actual,
            'tipo_proceso' => $model->tipo_proceso,
            'despacho' => $model->despacho,
            'last_checked_at' => optional($model->last_checked_at)->toISOString(),
            'last_seen_at' => optional($model->last_seen_at)->toISOString(),
            'has_unread' => $model->has_unread,
            'estado_checked' => $model->estado_checked,
            'parties' => $model->parties->map(fn ($party) => [
                'id' => $party->id,
                'role' => $party->rol,
                'name' => $party->nombre,
                'documento' => $party->documento,
            ]),
            'acts' => $model->acts->map(fn ($act) => [
                'id' => $act->id,
                'date' => optional($act->fecha)->toDateString(),
                'type' => $act->tipo,
                'title' => $act->descripcion,
                'uniq_key' => $act->uniq_key,
            ]),
        ]);
    }

    public function refresh(Request $request, int $id, IngestClient $ingest): JsonResponse
    {
        $model = CaseModel::where('user_id', $request->user()->id)->findOrFail($id);
        $payload = $ingest->normalized($model->radicado);

        DB::transaction(function () use ($model, $payload) {
            $model->parties()->delete();
            foreach ((array) ($payload['parties'] ?? []) as $party) {
                CaseParty::create([
                    'case_model_id' => $model->id,
                    'rol' => $party['role'] ?? $party['rol'] ?? null,
                    'nombre' => $party['name'] ?? $party['nombre'] ?? null,
                    'documento' => $party['documento'] ?? null,
                ]);
            }

            foreach ((array) ($payload['acts'] ?? []) as $act) {
                $uniq = $act['uniq_key'] ?? $act['hash'] ?? md5(json_encode($act));
                CaseAct::updateOrCreate(
                    ['case_model_id' => $model->id, 'uniq_key' => $uniq],
                    [
                        'fecha' => $act['date'] ?? $act['fecha'] ?? null,
                        'tipo' => $act['type'] ?? $act['tipo'] ?? null,
                        'descripcion' => $act['title'] ?? $act['descripcion'] ?? $act['description'] ?? null,
                        'documento_url' => $act['documento_url'] ?? null,
                        'origen' => $act['origen'] ?? null,
                    ]
                );
            }

            $model->estado_actual = data_get($payload, 'case.status', $model->estado_actual) ?? 'No verificado';
            $model->tipo_proceso = data_get($payload, 'case.tipo_proceso', $model->tipo_proceso);
            $model->despacho = data_get($payload, 'case.despacho', data_get($payload, 'case.court', $model->despacho));
            $model->last_checked_at = now();
            $model->has_unread = true;
            $model->estado_checked = false;
            $model->save();
        });

        Cache::forget("case.detail.{$id}");
        Cache::forget("cases.user.{$request->user()->id}");

        return $this->show($request, $model->id);
    }

    public function markRead(Request $request, int $id): array
    {
        $model = CaseModel::where('user_id', $request->user()->id)->findOrFail($id);
        $model->has_unread = false;
        $model->estado_checked = true;
        $model->last_seen_at = now();
        $model->save();

        Cache::forget("case.detail.{$id}");
        Cache::forget("cases.user.{$request->user()->id}");

        return [
            'ok' => true,
            'last_seen_at' => optional($model->last_seen_at)->toISOString(),
            'estado_checked' => $model->estado_checked,
        ];
    }

    public function unreadCount(Request $request): array
    {
        $userId = $request->user()->id;

        $count = Cache::remember("cases.unread.{$userId}", 60, function () use ($userId) {
            return CaseModel::where('user_id', $userId)
                ->where(function ($query) {
                    $query->where('has_unread', true)
                        ->orWhere('estado_checked', false);
                })
                ->count();
        });

        return ['count' => $count];
    }
}
