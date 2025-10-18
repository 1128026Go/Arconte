<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

// Actualizar o crear el usuario admin
$user = \App\Models\User::where('email', 'admin@juridica.com')->first();

if (!$user) {
    $user = new \App\Models\User();
    $user->email = 'admin@juridica.com';
}

$user->name = 'Administrador';
$user->password = bcrypt('admin123');
$user->save();

echo "✓ Usuario admin actualizado:\n";
echo "Email: admin@juridica.com\n";
echo "Password: admin123\n";
