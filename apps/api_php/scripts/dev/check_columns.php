<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "Checking invoices table columns:\n";
$columns = DB::select("SELECT column_name FROM information_schema.columns WHERE table_name = 'invoices' ORDER BY ordinal_position");
foreach ($columns as $col) {
    echo "  - {$col->column_name}\n";
}

echo "\nChecking reminders table columns:\n";
$columns = DB::select("SELECT column_name FROM information_schema.columns WHERE table_name = 'reminders' ORDER BY ordinal_position");
foreach ($columns as $col) {
    echo "  - {$col->column_name}\n";
}

echo "\nChecking time_entries table columns:\n";
$columns = DB::select("SELECT column_name FROM information_schema.columns WHERE table_name = 'time_entries' ORDER BY ordinal_position");
foreach ($columns as $col) {
    echo "  - {$col->column_name}\n";
}
