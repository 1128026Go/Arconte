@echo off
echo ========================================
echo  LegalTech Colombia - Iniciar Servidores
echo ========================================
echo.

echo [1/3] Verificando dependencias...
cd apps\web
if not exist node_modules (
    echo Instalando dependencias de frontend...
    call npm install
)

echo.
echo [2/3] Iniciando Backend Laravel (Puerto 8000)...
start "Backend Laravel" cmd /k "cd apps\api_php && php artisan serve"
timeout /t 3 >nul

echo.
echo [3/3] Iniciando Frontend React (Puerto 3000)...
start "Frontend React" cmd /k "cd apps\web && npm run dev"

echo.
echo ========================================
echo  Servidores iniciados!
echo ========================================
echo.
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:3000
echo.
echo Presiona cualquier tecla para cerrar esta ventana...
pause >nul
