@echo off
REM Script para iniciar el Queue Worker de Laravel en Windows
REM Este script mantiene el worker corriendo continuamente

echo Iniciando Queue Worker de Arconte...
echo.
echo IMPORTANTE: Esta ventana debe permanecer abierta para que los jobs se procesen.
echo             Para detener el worker, presiona Ctrl+C
echo.

cd /d "%~dp0"

:start
echo [%date% %time%] Iniciando queue worker...
"C:\Users\David\.config\herd\bin\php84\php.exe" artisan queue:work --verbose --tries=3 --timeout=120 --sleep=3

REM Si el worker se detiene inesperadamente, se reinicia automáticamente
echo.
echo [%date% %time%] Worker detenido. Reiniciando en 5 segundos...
echo.
timeout /t 5 /nobreak

goto start
