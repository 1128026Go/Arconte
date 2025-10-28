@echo off
chcp 65001 >nul
cls

echo ════════════════════════════════════════════════════════════════
echo   ARCONTE - Iniciando Backend Laravel
echo ════════════════════════════════════════════════════════════════
echo.

cd /d "%~dp0Aplicacion Juridica\apps\api_php"

echo 🔍 Verificando base de datos...
"%USERPROFILE%\.config\herd\bin\php" artisan migrate --force 2>&1

echo.
echo 👤 Creando usuarios de prueba...
"%USERPROFILE%\.config\herd\bin\php" artisan user:create-test 2>&1

echo.
echo 🚀 Iniciando servidor Laravel en puerto 8000...
echo   Accede a: http://localhost:8000/api/health
echo.
"%USERPROFILE%\.config\herd\bin\php" artisan serve --host=0.0.0.0 --port=8000
