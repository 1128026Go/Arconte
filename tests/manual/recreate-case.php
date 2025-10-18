<?php
require __DIR__ . '/apps/api_php/vendor/autoload.php';

$app = require_once __DIR__ . '/apps/api_php/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;
use App\Jobs\FetchCaseData;

echo "Eliminando caso 13...\n";
DB::table('case_acts')->where('case_model_id', 13)->delete();
DB::table('case_parties')->where('case_model_id', 13)->delete();
DB::table('case_models')->where('id', 13)->delete();

echo "Creando nuevo caso...\n";
$caseId = DB::table('case_models')->insertGetId([
    'user_id' => 10,
    'radicado' => "73001310300120210026700",
    'estado_actual' => 'Buscando información...',
    'estado_checked' => false,
    'has_unread' => false,
    'created_at' => now(),
    'updated_at' => now(),
]);

echo "Caso creado: ID {$caseId}\n";
echo "Disparando job...\n";
FetchCaseData::dispatch($caseId);
echo "✅ Job encolado. Espera 10 segundos.\n";
