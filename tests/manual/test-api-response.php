<?php
require __DIR__ . '/apps/api_php/vendor/autoload.php';

$app = require_once __DIR__ . '/apps/api_php/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

echo "========================================\n";
echo "  Verificación de datos del caso 13\n";
echo "========================================\n\n";

// Verificar caso
$case = DB::table('case_models')->where('id', 13)->first();
if (!$case) {
    echo "❌ Caso 13 no existe\n";
    exit(1);
}

echo "✅ Caso encontrado:\n";
echo "  ID: {$case->id}\n";
echo "  Radicado: {$case->radicado}\n";
echo "  Estado: {$case->estado_actual}\n";
echo "  Despacho: " . ($case->despacho ?? '—') . "\n";
echo "  Tipo proceso: " . ($case->tipo_proceso ?? '—') . "\n\n";

// Verificar partes
$parties = DB::table('case_parties')->where('case_model_id', 13)->get();
echo "👥 Partes: " . $parties->count() . "\n";
foreach ($parties as $party) {
    echo "  - {$party->role}: {$party->name}\n";
}
echo "\n";

// Verificar actuaciones
$acts = DB::table('case_acts')->where('case_model_id', 13)->get();
echo "📜 Actuaciones: " . $acts->count() . "\n";
foreach ($acts->take(3) as $act) {
    echo "  - {$act->fecha} | {$act->tipo}\n";
}

echo "\n========================================\n";
