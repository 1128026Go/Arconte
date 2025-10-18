<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "Checking case_acts table columns:\n";
$columns = DB::select("SELECT column_name FROM information_schema.columns WHERE table_name = 'case_acts' ORDER BY ordinal_position");
foreach ($columns as $col) {
    echo "  - {$col->column_name}\n";
}
