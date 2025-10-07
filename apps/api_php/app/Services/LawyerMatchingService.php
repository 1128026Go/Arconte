<?php

namespace App\Services;

use App\Models\Lawyer;
use App\Models\MarketplaceCase;
use Illuminate\Support\Collection;

class LawyerMatchingService
{
    /**
     * Match abogados con un caso usando algoritmo ML
     */
    public function matchLawyers(MarketplaceCase $case, int $limit = 10): Collection
    {
        $query = Lawyer::with('profile')
            ->where('verificado', true)
            ->where('activo', true)
            ->where('disponible', true)
            ->where('estado_cuenta', 'active');

        // 1. Filtrar por especialidad
        if ($case->tipo_caso) {
            $query->whereHas('profile', function ($q) use ($case) {
                $q->whereJsonContains('especialidades', $case->tipo_caso)
                    ->orWhereJsonContains('areas_practica', $case->tipo_caso);
            });
        }

        // 2. Filtrar por ubicación y cobertura
        $query->whereHas('profile', function ($q) use ($case) {
            $q->where('ciudad', $case->ciudad)
                ->orWhere('departamento', $case->departamento)
                ->orWhereJsonContains('cobertura_geografica', $case->ciudad);
        });

        // 3. Filtrar por presupuesto
        if ($case->presupuesto_max) {
            $query->where(function ($q) use ($case) {
                $q->where('tarifa_caso', '<=', $case->presupuesto_max)
                    ->orWhere(function ($q) use ($case) {
                        // Calcular tarifa estimada si es por hora (asumiendo 10 horas)
                        $q->whereNotNull('tarifa_hora')
                            ->whereRaw('tarifa_hora * 10 <= ?', [$case->presupuesto_max]);
                    });
            });
        }

        // Obtener candidatos
        $lawyers = $query->get();

        // 4. Scoring con ML (simulado - en producción usar modelo real)
        $scored = $lawyers->map(function ($lawyer) use ($case) {
            $score = 0;

            // Score base por rating (30%)
            $score += $lawyer->rating_promedio * 6; // 0-30 puntos

            // Score por experiencia (20%)
            $experienciaScore = min($lawyer->profile->anos_experiencia / 10 * 20, 20);
            $score += $experienciaScore;

            // Score por casos completados (20%)
            $casosScore = min($lawyer->casos_completados / 50 * 20, 20);
            $score += $casosScore;

            // Score por urgencia y disponibilidad (15%)
            if ($case->urgencia === 'critica' || $case->urgencia === 'alta') {
                if ($lawyer->disponible) {
                    $score += 15;
                }
            } else {
                $score += 10;
            }

            // Score por precio competitivo (15%)
            if ($case->presupuesto_max && $lawyer->tarifa_caso) {
                $precioRatio = $lawyer->tarifa_caso / $case->presupuesto_max;
                if ($precioRatio <= 0.7) {
                    $score += 15; // 30% más barato
                } elseif ($precioRatio <= 0.9) {
                    $score += 10; // 10% más barato
                } else {
                    $score += 5;
                }
            } else {
                $score += 5;
            }

            $lawyer->match_score = round($score, 2);
            return $lawyer;
        });

        // Ordenar por score descendente
        return $scored->sortByDesc('match_score')->take($limit)->values();
    }

    /**
     * Calcular compatibilidad entre abogado y tipo de caso
     */
    public function calculateCompatibility(Lawyer $lawyer, string $tipoCaso): float
    {
        $profile = $lawyer->profile;

        if (!$profile) {
            return 0.0;
        }

        $score = 0;

        // Especialidad exacta
        if (in_array($tipoCaso, $profile->especialidades ?? [])) {
            $score += 50;
        }

        // Área de práctica relacionada
        if (in_array($tipoCaso, $profile->areas_practica ?? [])) {
            $score += 30;
        }

        // Experiencia general
        $score += min($profile->anos_experiencia / 10 * 20, 20);

        return min($score, 100);
    }

    /**
     * Obtener abogados recomendados para un usuario basado en historial
     */
    public function getRecommendedLawyers(int $userId, int $limit = 5): Collection
    {
        // Obtener casos previos del usuario
        $prevCases = MarketplaceCase::where('user_id', $userId)
            ->with('lawyer')
            ->whereNotNull('lawyer_id')
            ->get();

        if ($prevCases->isEmpty()) {
            // Si no hay historial, retornar top rated
            return Lawyer::with('profile')
                ->where('verificado', true)
                ->where('activo', true)
                ->orderByDesc('rating_promedio')
                ->limit($limit)
                ->get();
        }

        // Obtener tipos de caso más frecuentes
        $tiposCaso = $prevCases->pluck('tipo_caso')->countBy()->sortDesc()->keys();

        // Buscar abogados especializados en esos tipos
        return Lawyer::with('profile')
            ->where('verificado', true)
            ->where('activo', true)
            ->whereHas('profile', function ($q) use ($tiposCaso) {
                foreach ($tiposCaso as $tipo) {
                    $q->orWhereJsonContains('especialidades', $tipo);
                }
            })
            ->orderByDesc('rating_promedio')
            ->limit($limit)
            ->get();
    }
}
