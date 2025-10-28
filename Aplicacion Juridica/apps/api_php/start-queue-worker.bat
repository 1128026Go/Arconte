@echo off
REM DEPRECATED: Este script es reemplazado por scripts/dev/start-all.bat
REM Usa el script principal para arrancar todos los servicios de forma coordinada
REM
REM Script para iniciar el Queue Worker de Laravel en Windows (STANDALONE)
REM Este script mantiene el worker corriendo continuamente
REM Nota: Prefiere usar scripts/dev/start-all.bat en su lugar

setlocal enabledelayedexpansion

REM Detectar PHP en PATH (portable, sin rutas Herd hardcodeadas)
set PHP_PATH=php
php --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: PHP no encontrado en PATH
    echo Asegúrate de que PHP esté en PATH o instala Herd desde https://herd.laravel.com/
    pause
    exit /b 1
)

echo Iniciando Queue Worker de Arconte...
echo.
echo IMPORTANTE: Esta ventana debe permanecer abierta para que los jobs se procesen.
echo             Para detener el worker, presiona Ctrl+C
echo.
echo Driver: database (portable, sin Redis/Beanstalkd)
echo.

cd /d "%~dp0"

:start
echo [%date% %time%] Iniciando queue worker...
%PHP_PATH% artisan queue:work --verbose --tries=3 --timeout=120 --sleep=3

REM Si el worker se detiene inesperadamente, se reinicia automáticamente
echo.
echo [%date% %time%] Worker detenido. Reiniciando en 5 segundos...
echo.
timeout /t 5 /nobreak

goto start
