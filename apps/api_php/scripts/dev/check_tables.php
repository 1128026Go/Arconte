<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "Checking AI-related tables:\n";
$tables = DB::select("SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE '%ai%' OR tablename LIKE '%conversation%' ORDER BY tablename");

if (empty($tables)) {
    echo "  No AI tables found!\n";
} else {
    foreach ($tables as $table) {
        echo "  - {$table->tablename}\n";
    }
}

echo "\nChecking all tables:\n";
$tables = DB::select("SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename");
foreach ($tables as $table) {
    echo "  - {$table->tablename}\n";
}
