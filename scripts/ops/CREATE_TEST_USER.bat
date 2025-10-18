@echo off
echo ========================================
echo  Crear Usuarios de Prueba
echo ========================================
echo.
cd apps\api_php

echo Creando usuarios de prueba...
echo.
echo [1/2] Usuario basico de testing...
php artisan tinker --execute="App\Models\User::firstOrCreate(['email' => 'admin@test.com'], ['name' => 'Admin Test', 'password' => bcrypt('password')]); echo 'Usuario 1 creado: admin@test.com / password';"

echo.
echo [2/2] Usuario principal juridica...
php artisan tinker --execute="App\Models\User::firstOrCreate(['email' => 'admin@juridica.com'], ['name' => 'Admin Juridica', 'password' => bcrypt('admin123')]); echo 'Usuario 2 creado: admin@juridica.com / admin123';"

echo.
echo ========================================
echo  Usuarios de prueba listos!
echo ========================================
echo.
echo OPCION 1:
echo Email:    admin@test.com
echo Password: password
echo.
echo OPCION 2:
echo Email:    admin@juridica.com
echo Password: admin123
echo.
echo Presiona cualquier tecla para continuar...
pause >nul
