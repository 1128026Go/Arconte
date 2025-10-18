<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\CaseModel;
use App\Models\CaseAct;

// Buscar el caso
$radicado = '73001310300120210026700';
$case = CaseModel::where('radicado', $radicado)->first();

if (!$case) {
    echo "❌ Caso $radicado no encontrado\n";
    exit(1);
}

echo "✓ Caso encontrado: ID {$case->id}\n";
echo "  Actuaciones actuales: " . $case->acts()->count() . "\n\n";

// Eliminar TODAS las actuaciones de este caso
$deleted = $case->acts()->delete();
echo "✓ Eliminadas $deleted actuaciones\n";

// Limpiar cache
\Illuminate\Support\Facades\Cache::forget("case_{$case->id}");
echo "✓ Cache limpiado\n\n";

echo "Ahora refresca el caso desde la interfaz para traer los datos reales de la Rama Judicial.\n";
