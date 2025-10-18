<?php
// Test de autenticación rápido
require_once __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;
use Illuminate\Support\Facades\Hash;

echo "🔍 Verificando autenticación...\n\n";

// Verificar usuario
$user = User::where('email', 'admin@arconte.com')->first();

if (!$user) {
    echo "❌ Usuario no encontrado\n";
    exit(1);
}

echo "✅ Usuario encontrado:\n";
echo "   ID: {$user->id}\n";
echo "   Nombre: {$user->name}\n";
echo "   Email: {$user->email}\n";
echo "   Rol: {$user->role}\n";

// Verificar contraseña
$passwordCheck = Hash::check('123456', $user->password);
echo "\n🔐 Verificación de contraseña: " . ($passwordCheck ? "✅ CORRECTA" : "❌ INCORRECTA") . "\n";

// Verificar configuración de Sanctum
echo "\n⚙️ Configuración:\n";
echo "   APP_URL: " . config('app.url') . "\n";
echo "   SANCTUM_STATEFUL_DOMAINS: " . config('sanctum.stateful') . "\n";

echo "\n" . str_repeat("=", 50) . "\n";
echo "🔑 CREDENCIALES PARA LOGIN:\n";
echo "   Email: admin@arconte.com\n";
echo "   Password: 123456\n";
echo str_repeat("=", 50) . "\n";