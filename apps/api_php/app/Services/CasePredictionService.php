<?php

namespace App\Services;

use App\Models\CaseModel;
use Illuminate\Support\Facades\Http;

class CasePredictionService
{
    /**
     * Predecir el resultado de un caso usando IA
     */
    public function predictOutcome(CaseModel $case): array
    {
        // 1. Buscar casos similares
        $similarCases = $this->findSimilarCases($case);

        // 2. Analizar jurisprudencia relevante
        $jurisprudence = $this->getRelevantJurisprudence($case);

        // 3. Obtener historial del juzgado/juez
        $judgeHistory = $this->getJudgeHistory($case->juzgado ?? 'desconocido');

        // 4. Calcular probabilidad con algoritmo ML (simulado)
        $prediction = $this->calculatePrediction([
            'tipo_proceso' => $case->tipo_proceso,
            'jurisdiccion' => $case->jurisdiccion ?? 'ordinaria',
            'similar_cases' => $similarCases,
            'jurisprudence' => $jurisprudence,
            'judge_tendencies' => $judgeHistory,
        ]);

        return [
            'probabilidad_exito' => $prediction['probability'],
            'tiempo_estimado_meses' => $prediction['estimated_months'],
            'factores_clave' => $prediction['key_factors'],
            'casos_similares_count' => count($similarCases),
            'recomendaciones' => $prediction['recommendations'],
            'confianza' => $prediction['confidence'], // 0-100%
        ];
    }

    /**
     * Buscar casos similares en la base de datos
     */
    protected function findSimilarCases(CaseModel $case): array
    {
        $similar = CaseModel::where('tipo_proceso', $case->tipo_proceso)
            ->where('jurisdiccion', $case->jurisdiccion)
            ->whereNotNull('estado_actual')
            ->where('id', '!=', $case->id)
            ->limit(50)
            ->get();

        return $similar->map(function ($c) {
            return [
                'radicado' => $c->radicado,
                'tipo_proceso' => $c->tipo_proceso,
                'estado' => $c->estado_actual,
                'resultado' => $this->inferResultado($c),
            ];
        })->toArray();
    }

    /**
     * Obtener jurisprudencia relevante
     */
    protected function getRelevantJurisprudence(CaseModel $case): array
    {
        // En producción, esto buscaría en base de datos de 1.5M+ sentencias
        // Por ahora retornamos estructura de ejemplo

        return [
            'corte_constitucional' => [
                'count' => 15,
                'tendencia' => 'favorable',
            ],
            'corte_suprema' => [
                'count' => 8,
                'tendencia' => 'neutral',
            ],
            'tribunales' => [
                'count' => 23,
                'tendencia' => 'favorable',
            ],
        ];
    }

    /**
     * Obtener historial de decisiones del juez/juzgado
     */
    protected function getJudgeHistory(string $juzgado): array
    {
        // En producción, analizar decisiones previas del mismo juzgado
        return [
            'total_casos' => 120,
            'ratio_favorable' => 0.65, // 65% de casos favorables
            'duracion_promedio_meses' => 14,
            'tendencias' => [
                'prefiere_conciliacion' => true,
                'estricto_plazos' => true,
            ],
        ];
    }

    /**
     * Calcular predicción usando algoritmo ML (simulado)
     */
    protected function calculatePrediction(array $data): array
    {
        // En producción, esto llamaría a un modelo de ML (scikit-learn, TensorFlow)
        // Por ahora usamos heurísticas

        $baseProbability = 0.50; // 50% base

        // Ajustar por casos similares
        $successfulSimilar = collect($data['similar_cases'])
            ->filter(fn($c) => $c['resultado'] === 'favorable')
            ->count();

        $totalSimilar = count($data['similar_cases']);
        if ($totalSimilar > 0) {
            $similarityBoost = ($successfulSimilar / $totalSimilar - 0.5) * 0.3;
            $baseProbability += $similarityBoost;
        }

        // Ajustar por jurisprudencia
        $jurisprudenceFavorable = collect($data['jurisprudence'])
            ->filter(fn($j) => $j['tendencia'] === 'favorable')
            ->count();

        if ($jurisprudenceFavorable >= 2) {
            $baseProbability += 0.15;
        }

        // Ajustar por historial del juez
        $judgeRatio = $data['judge_tendencies']['ratio_favorable'] ?? 0.5;
        $baseProbability = ($baseProbability + $judgeRatio) / 2;

        // Calcular tiempo estimado
        $estimatedMonths = $data['judge_tendencies']['duracion_promedio_meses'] ?? 12;

        // Factores clave
        $keyFactors = [
            'Jurisprudencia mayormente favorable',
            'Casos similares con buenos resultados',
            'Juzgado con tendencia conciliatoria',
        ];

        // Recomendaciones
        $recommendations = [
            'Presentar jurisprudencia de Corte Constitucional',
            'Proponer conciliación temprana',
            'Fortalecer pruebas documentales',
        ];

        // Confianza basada en cantidad de datos
        $confidence = min(($totalSimilar / 10) * 50 + 50, 95);

        return [
            'probability' => round(min(max($baseProbability, 0.1), 0.95), 2),
            'estimated_months' => $estimatedMonths,
            'key_factors' => $keyFactors,
            'recommendations' => $recommendations,
            'confidence' => round($confidence),
        ];
    }

    /**
     * Inferir resultado de un caso basado en su estado
     */
    protected function inferResultado(CaseModel $case): string
    {
        $estado = strtolower($case->estado_actual ?? '');

        if (str_contains($estado, 'terminado') || str_contains($estado, 'ejecutoriado')) {
            // Análisis simple - en producción sería más sofisticado
            return str_contains($estado, 'favorable') ? 'favorable' : 'desfavorable';
        }

        return 'desconocido';
    }

    /**
     * Generar reporte predictivo completo
     */
    public function generatePredictiveReport(CaseModel $case): array
    {
        $prediction = $this->predictOutcome($case);

        return [
            'case_id' => $case->id,
            'radicado' => $case->radicado,
            'prediction' => $prediction,
            'risk_assessment' => $this->assessRisk($prediction['probabilidad_exito']),
            'strategy_suggestions' => $this->suggestStrategy($case, $prediction),
            'generated_at' => now()->toIso8601String(),
        ];
    }

    /**
     * Evaluar nivel de riesgo
     */
    protected function assessRisk(float $probability): string
    {
        if ($probability >= 0.75) return 'bajo';
        if ($probability >= 0.50) return 'medio';
        if ($probability >= 0.30) return 'alto';
        return 'muy_alto';
    }

    /**
     * Sugerir estrategia basada en predicción
     */
    protected function suggestStrategy(CaseModel $case, array $prediction): array
    {
        $strategies = [];

        if ($prediction['probabilidad_exito'] < 0.4) {
            $strategies[] = 'Considerar negociación o conciliación';
            $strategies[] = 'Revisar viabilidad de recursos extraordinarios';
        } else {
            $strategies[] = 'Mantener estrategia litigiosa';
            $strategies[] = 'Fortalecer argumentos jurídicos principales';
        }

        if ($prediction['tiempo_estimado_meses'] > 18) {
            $strategies[] = 'Evaluar vías procesales más expeditas';
            $strategies[] = 'Considerar tutelas o acciones de urgencia';
        }

        return $strategies;
    }
}
