<?php

// Script para crear usuarios de prueba
require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;
use Illuminate\Support\Facades\Hash;

echo "=== CREANDO USUARIOS DE PRUEBA ===" . PHP_EOL;

// Usuario de prueba básico
$testUser = User::firstOrCreate(
    ['email' => 'test@example.com'],
    [
        'name' => 'Usuario Test',
        'email' => 'test@example.com',
        'password' => Hash::make('password'),
        'email_verified_at' => now()
    ]
);

// Usuario administrador
$adminUser = User::firstOrCreate(
    ['email' => 'admin@juridica.test'],
    [
        'name' => 'Administrador',
        'email' => 'admin@juridica.test',
        'password' => Hash::make('admin123'),
        'email_verified_at' => now()
    ]
);

// Usuario demo
$demoUser = User::firstOrCreate(
    ['email' => 'demo@juridica.test'],
    [
        'name' => 'Usuario Demo',
        'email' => 'demo@juridica.test',
        'password' => Hash::make('demo123'),
        'email_verified_at' => now()
    ]
);

echo "✅ Usuarios creados/verificados:" . PHP_EOL;
echo "1. Email: test@example.com    | Password: password" . PHP_EOL;
echo "2. Email: admin@juridica.test | Password: admin123" . PHP_EOL;
echo "3. Email: demo@juridica.test  | Password: demo123" . PHP_EOL;
echo PHP_EOL;

echo "=== INSTRUCCIONES DE USO ===" . PHP_EOL;
echo "1. Para hacer login, envía POST a /api/auth/login con:" . PHP_EOL;
echo "   {" . PHP_EOL;
echo "     \"email\": \"admin@juridica.test\"," . PHP_EOL;
echo "     \"password\": \"admin123\"" . PHP_EOL;
echo "   }" . PHP_EOL;
echo PHP_EOL;
echo "2. El endpoint devuelve un token que debes usar en el header:" . PHP_EOL;
echo "   Authorization: Bearer {tu_token_aqui}" . PHP_EOL;
echo PHP_EOL;
echo "3. Endpoints disponibles:" . PHP_EOL;
echo "   - POST /api/auth/register (registrar nuevo usuario)" . PHP_EOL;
echo "   - POST /api/auth/login (iniciar sesión)" . PHP_EOL;
echo "   - GET  /api/auth/me (información del usuario autenticado)" . PHP_EOL;
echo "   - POST /api/auth/logout (cerrar sesión)" . PHP_EOL;
echo "   - GET  /api/cases (listar casos)" . PHP_EOL;
echo "   - POST /api/cases (crear caso)" . PHP_EOL;
echo PHP_EOL;

// Mostrar todos los usuarios existentes
echo "=== USUARIOS EN LA BASE DE DATOS ===" . PHP_EOL;
$users = User::select('id', 'name', 'email', 'created_at')->get();
foreach ($users as $user) {
    echo "ID: {$user->id} | {$user->name} ({$user->email}) | Creado: {$user->created_at}" . PHP_EOL;
}