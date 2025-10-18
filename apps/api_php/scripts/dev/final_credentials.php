<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;
use Illuminate\Support\Facades\Hash;

echo "=== CREDENCIALES FINALES ACTUALIZADAS ===" . PHP_EOL;

// Crear/actualizar usuarios con passwords simples
$users = [
    [
        'name' => 'Administrador',
        'email' => 'admin@test.com',
        'password' => '123456'
    ],
    [
        'name' => 'Usuario Demo',
        'email' => 'demo@test.com', 
        'password' => '123456'
    ],
    [
        'name' => 'Usuario Test',
        'email' => 'test@test.com',
        'password' => '123456'
    ]
];

foreach ($users as $userData) {
    $user = User::updateOrCreate(
        ['email' => $userData['email']],
        [
            'name' => $userData['name'],
            'email' => $userData['email'],
            'password' => Hash::make($userData['password']),
            'email_verified_at' => now()
        ]
    );
    
    echo "✅ Usuario actualizado: {$userData['email']} | Password: {$userData['password']}" . PHP_EOL;
}

echo PHP_EOL;
echo "=== CÓMO PROBAR ===" . PHP_EOL;
echo "1. Asegúrate de que Laravel esté corriendo en algún puerto" . PHP_EOL;
echo "2. Haz POST a /api/auth/login con:" . PHP_EOL;
echo "   {" . PHP_EOL;
echo "     \"email\": \"admin@test.com\"," . PHP_EOL;
echo "     \"password\": \"123456\"" . PHP_EOL;
echo "   }" . PHP_EOL;
echo PHP_EOL;

// Probar login inmediatamente
echo "=== PROBANDO LOGIN ===" . PHP_EOL;
$testUser = User::where('email', 'admin@test.com')->first();
if ($testUser && Hash::check('123456', $testUser->password)) {
    $token = $testUser->createToken('test')->plainTextToken;
    echo "✅ Login exitoso!" . PHP_EOL;
    echo "✅ Token de prueba: " . $token . PHP_EOL;
    echo "✅ Usar en header: Authorization: Bearer {$token}" . PHP_EOL;
} else {
    echo "❌ Error en login" . PHP_EOL;
}