<?php
// Crear usuario de prueba para acceso inmediato
require_once __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;
use Illuminate\Support\Facades\Hash;

echo "🔐 Creando usuario de acceso...\n";

// Crear o actualizar usuario admin
$user = User::updateOrCreate(
    ['email' => 'admin@arconte.com'],
    [
        'name' => 'Administrador Arconte',
        'email' => 'admin@arconte.com',
        'password' => Hash::make('123456'),
        'role' => 'admin',
        'email_verified_at' => now(),
    ]
);

echo "✅ Usuario creado exitosamente!\n\n";
echo "📋 CREDENCIALES DE ACCESO:\n";
echo "══════════════════════════\n";
echo "Email: admin@arconte.com\n";
echo "Password: 123456\n";
echo "══════════════════════════\n";
echo "\n";
echo "🌐 Accede en: http://localhost:3000\n";
echo "🔗 API Backend: http://public.test/api\n";
echo "\n";
echo "🔧 Para cambiar la contraseña más tarde:\n";
echo "   php artisan tinker\n";
echo "   \$user = App\\Models\\User::where('email', 'admin@arconte.com')->first();\n";
echo "   \$user->password = Hash::make('nueva_password');\n";
echo "   \$user->save();\n";