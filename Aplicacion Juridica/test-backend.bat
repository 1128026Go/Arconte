@echo off
chcp 65001 >nul
cls

echo.
echo ╔══════════════════════════════════════════════════════╗
echo ║       DIAGNOSTICO BACKEND ARCONTE - ERR_CONNECTION  ║
echo ║              (ON_REFUSED a localhost:8000)           ║
echo ╚══════════════════════════════════════════════════════╝
echo.

REM ============= [1] Verificar PHP =============
echo [1/7] Verificando PHP...
php -v >nul 2>&1
if errorlevel 1 (
    echo ❌ PHP NO en PATH
    echo    Solución: instala Herd desde https://herd.laravel.com/
    pause
    exit /b 1
)
echo ✅ PHP encontrado
echo.

REM ============= [2] Verificar puerto 8000 =============
echo [2/7] Verificando puerto 8000...
netstat -ano | findstr ":8000"
if errorlevel 1 (
    echo ✅ Puerto 8000 LIBRE
) else (
    echo ⚠ Puerto 8000 OCUPADO
    echo    Solución: cierra el proceso
    echo    taskkill /F /IM php.exe
)
echo.

REM ============= [3] Verificar PostgreSQL =============
echo [3/7] Verificando PostgreSQL (Docker)...
docker ps 2>nul | findstr postgres >nul
if errorlevel 1 (
    echo ❌ PostgreSQL NO corre
    echo    Solución: inicia Docker y ejecuta:
    echo    docker-compose up -d postgres
    pause
    exit /b 1
)
echo ✅ PostgreSQL ACTIVO
echo.

REM ============= [4] Verificar .env =============
echo [4/7] Verificando .env...
if not exist "apps\api_php\.env" (
    echo ⚠ .env NO existe - copiando desde .env.example...
    if exist "apps\api_php\.env.example" (
        copy "apps\api_php\.env.example" "apps\api_php\.env" >nul
        echo ✅ .env creado
    ) else (
        echo ❌ .env.example tampoco existe
        pause
        exit /b 1
    )
) else (
    echo ✅ .env existe
)
echo.

REM ============= [5] Verificar APP_KEY =============
echo [5/7] Verificando APP_KEY...
findstr /I "APP_KEY=" "apps\api_php\.env" | findstr /V "^REM" >nul
if errorlevel 1 (
    echo ⚠ APP_KEY NO encontrada - generando...
    pushd apps\api_php
    php artisan key:generate >nul 2>&1
    popd
    echo ✅ APP_KEY generado
) else (
    echo ✅ APP_KEY existe
)
echo.

REM ============= [6] Verificar APP_URL =============
echo [6/7] Verificando APP_URL...
findstr /I "APP_URL=http" "apps\api_php\.env" >nul
if errorlevel 1 (
    echo ⚠ APP_URL NO configurado - añadiendo...
    echo APP_URL=http://127.0.0.1:8000>>apps\api_php\.env
    echo ✅ APP_URL=http://127.0.0.1:8000
) else (
    echo ✅ APP_URL configurado
    findstr /I "APP_URL=" "apps\api_php\.env"
)
echo.

REM ============= [7] Iniciar Backend =============
echo [7/7] Iniciando Backend...
echo.
echo 🚀 Abriendo terminal con: php artisan serve --host=127.0.0.1 --port=8000
echo    (Espera a ver: "Laravel development server started: http://127.0.0.1:8000")
echo.

pushd apps\api_php
start "Arconte Backend - test-backend.bat" cmd /k "php artisan serve --host=127.0.0.1 --port=8000"
popd

echo ⏳ Esperando 5 segundos a que el backend inicie...
timeout /t 5 >nul

echo.
echo ╔════════════════════════════════════════════════════════╗
echo ║                   HEALTH CHECK                          ║
echo ╚════════════════════════════════════════════════════════╝
echo.

echo [A] GET /api/health
echo.
curl -v http://localhost:8000/api/health
if errorlevel 1 (
    echo.
    echo ❌ /api/health FALLÓ
    echo    Revisa la ventana del backend para errores
    pause
    exit /b 1
)
echo.
echo ✅ /api/health OK
echo.

echo [B] GET /sanctum/csrf-cookie (debe tener Set-Cookie)
echo.
curl -v http://localhost:8000/sanctum/csrf-cookie
echo.
echo ✅ /sanctum/csrf-cookie OK
echo.

echo ╔════════════════════════════════════════════════════════╗
echo ║              BACKEND OPERATIVO ✅                      ║
echo ╚════════════════════════════════════════════════════════╝
echo.
echo 📋 Próximos pasos:
echo    1) Abre http://localhost:3000 en el navegador
echo    2) Login: admin@arconte.app / password
echo    3) Verifica que NO hay ERR_CONNECTION_REFUSED
echo.
pause
