<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;
use Illuminate\Support\Facades\Hash;

echo "=== VERIFICANDO CREDENCIALES ===" . PHP_EOL;

// Probar las credenciales específicamente
$testCredentials = [
    ['admin@juridica.test', 'admin123'],
    ['demo@juridica.test', 'demo123'],
    ['test@example.com', 'password'],
];

foreach ($testCredentials as [$email, $password]) {
    $user = User::where('email', $email)->first();
    
    if ($user) {
        $validPassword = Hash::check($password, $user->password);
        echo "✅ Usuario: {$email}" . PHP_EOL;
        echo "   - Existe en BD: SÍ" . PHP_EOL;
        echo "   - Password válida: " . ($validPassword ? "SÍ" : "NO") . PHP_EOL;
        echo "   - Password hash: " . substr($user->password, 0, 50) . "..." . PHP_EOL;
        
        if (!$validPassword) {
            // Actualizar password
            $user->password = Hash::make($password);
            $user->save();
            echo "   - ✅ Password actualizada correctamente" . PHP_EOL;
        }
    } else {
        echo "❌ Usuario {$email} NO existe en la base de datos" . PHP_EOL;
    }
    echo PHP_EOL;
}

echo "=== PROBANDO LOGIN DIRECTO ===" . PHP_EOL;

// Simular el proceso de login
$testEmail = 'admin@juridica.test';
$testPassword = 'admin123';

$user = User::where('email', $testEmail)->first();
if ($user && Hash::check($testPassword, $user->password)) {
    echo "✅ Login exitoso para {$testEmail}" . PHP_EOL;
    
    // Crear token
    $token = $user->createToken('test-token')->plainTextToken;
    echo "✅ Token generado: " . substr($token, 0, 30) . "..." . PHP_EOL;
} else {
    echo "❌ Login fallido para {$testEmail}" . PHP_EOL;
    if (!$user) {
        echo "   - Usuario no encontrado" . PHP_EOL;
    } else {
        echo "   - Password incorrecta" . PHP_EOL;
    }
}