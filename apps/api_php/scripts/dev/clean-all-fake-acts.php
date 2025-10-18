<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\CaseModel;
use App\Models\CaseAct;
use Illuminate\Support\Facades\Cache;

echo "🔄 Limpiando actuaciones de todos los casos...\n\n";

// Obtener todos los casos
$cases = CaseModel::all();
echo "✓ Total de casos encontrados: " . $cases->count() . "\n\n";

$totalActsDeleted = 0;

foreach ($cases as $case) {
    $actsCount = $case->acts()->count();

    if ($actsCount > 0) {
        echo "📋 Caso: {$case->radicado} (ID: {$case->id})\n";
        echo "   Actuaciones: $actsCount\n";

        // Eliminar todas las actuaciones
        $deleted = $case->acts()->delete();
        $totalActsDeleted += $deleted;

        // Limpiar cache de este caso
        Cache::forget("case_{$case->id}");

        echo "   ✓ Eliminadas $deleted actuaciones\n";
        echo "   ✓ Cache limpiado\n\n";
    }
}

// Limpiar cache general
Cache::flush();

echo "═══════════════════════════════════════════════\n";
echo "✅ PROCESO COMPLETADO\n";
echo "═══════════════════════════════════════════════\n";
echo "Total de casos procesados: " . $cases->count() . "\n";
echo "Total de actuaciones eliminadas: $totalActsDeleted\n";
echo "Cache completamente limpiado\n\n";
echo "Ahora todos los casos mostrarán solo información real de la Rama Judicial.\n";
echo "Los casos se refrescarán automáticamente o puedes usar el botón 'Reintentar ahora'.\n";
