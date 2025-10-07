<?php

use App\Models\User;
use Illuminate\Support\Facades\Hash;

require_once __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$credentials = [
    ['email' => 'test@juridica.com', 'name' => 'Usuario Frontend', 'password' => 'password123'],
    ['email' => 'admin@test.com', 'name' => 'Admin Test', 'password' => '123456'],
    ['email' => 'demo@test.com', 'name' => 'Demo Test', 'password' => '123456'],
];

echo "=== Creando usuarios esperados por el frontend ===" . PHP_EOL;

foreach ($credentials as $entry) {
    $user = User::firstOrNew(['email' => $entry['email']]);

    if (! $user->exists) {
        $user->name = $entry['name'];
        $user->password = Hash::make($entry['password']);
        $user->email_verified_at = now();
        $user->save();
        echo "[CREADO] {$entry['email']}" . PHP_EOL;
    } else {
        $user->name = $entry['name'];
        if (! Hash::check($entry['password'], $user->password)) {
            $user->password = Hash::make($entry['password']);
        }
        $user->email_verified_at = $user->email_verified_at ?? now();
        $user->save();
        echo "[ACTUALIZADO] {$entry['email']}" . PHP_EOL;
    }
}

echo PHP_EOL;
echo "=== Usuarios en base de datos ===" . PHP_EOL;

User::orderBy('id')->get(['id', 'name', 'email', 'created_at'])->each(function ($user) {
    echo sprintf('ID: %d | %s <%s> | creado: %s', $user->id, $user->name, $user->email, optional($user->created_at)->format('Y-m-d H:i')) . PHP_EOL;
});

echo PHP_EOL;
echo "Listo. Puedes iniciar sesion con test@juridica.com / password123" . PHP_EOL;
