<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "Removing migration record...\n";
DB::table('migrations')->where('migration', '2025_10_09_151051_add_soft_deletes_to_invoices_and_reminders_tables')->delete();

echo "Adding deleted_at columns...\n";

// Add deleted_at to invoices
DB::statement('ALTER TABLE invoices ADD COLUMN deleted_at TIMESTAMP NULL');
echo "  - Added deleted_at to invoices\n";

// Add deleted_at to reminders
DB::statement('ALTER TABLE reminders ADD COLUMN deleted_at TIMESTAMP NULL');
echo "  - Added deleted_at to reminders\n";

// Add deleted_at to time_entries
DB::statement('ALTER TABLE time_entries ADD COLUMN deleted_at TIMESTAMP NULL');
echo "  - Added deleted_at to time_entries\n";

// Re-add the migration record
DB::table('migrations')->insert([
    'migration' => '2025_10_09_151051_add_soft_deletes_to_invoices_and_reminders_tables',
    'batch' => 2,
]);

echo "\n✓ Soft delete columns added successfully!\n";
