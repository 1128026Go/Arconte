<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;
use Illuminate\Support\Facades\Hash;

echo "=== SINCRONIZANDO CREDENCIALES CON FRONTEND ===" . PHP_EOL;

// Crear el usuario que coincida exactamente con el frontend
$frontendUser = User::updateOrCreate(
    ['email' => 'test@juridica.com'],
    [
        'name' => 'Usuario Test Frontend',
        'email' => 'test@juridica.com',
        'password' => Hash::make('password123'),
        'email_verified_at' => now()
    ]
);

echo "✅ Usuario frontend creado: test@juridica.com | Password: password123" . PHP_EOL;

// Verificar que funciona
$testUser = User::where('email', 'test@juridica.com')->first();
if ($testUser && Hash::check('password123', $testUser->password)) {
    $token = $testUser->createToken('frontend-test')->plainTextToken;
    echo "✅ Login verificado exitosamente!" . PHP_EOL;
    echo "✅ Token generado: " . substr($token, 0, 30) . "..." . PHP_EOL;
} else {
    echo "❌ Error verificando credenciales" . PHP_EOL;
}

echo PHP_EOL;
echo "=== CREDENCIALES FINALES DISPONIBLES ===" . PHP_EOL;
$users = User::select('id', 'name', 'email')->get();
foreach ($users as $user) {
    echo "- {$user->email} (ID: {$user->id}) - {$user->name}" . PHP_EOL;
}

echo PHP_EOL;
echo "🎯 USAR EN EL FRONTEND:" . PHP_EOL;
echo "Email: test@juridica.com" . PHP_EOL;
echo "Password: password123" . PHP_EOL;