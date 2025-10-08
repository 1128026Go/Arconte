@echo off
echo ====================================
echo Reiniciando todos los servicios
echo ====================================
echo.

echo [1/5] Deteniendo procesos en puerto 8000 (Laravel)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8000 ^| findstr LISTENING') do (
    taskkill /PID %%a /F >nul 2>&1
)
timeout /t 2 /nobreak >nul

echo [2/5] Deteniendo procesos en puerto 3000 (React)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do (
    taskkill /PID %%a /F >nul 2>&1
)
timeout /t 2 /nobreak >nul

echo [3/5] Iniciando Backend Laravel (puerto 8000)...
cd apps\api_php
start /B cmd /c "php artisan serve --host=127.0.0.1 --port=8000 > nul 2>&1"
cd ..\..
timeout /t 3 /nobreak >nul

echo [4/5] Iniciando Frontend React (puerto 3000)...
cd apps\web
start /B cmd /c "npm run dev > nul 2>&1"
cd ..\..
timeout /t 3 /nobreak >nul

echo [5/5] Verificando servicios...
echo.
echo Backend Laravel:
curl -s http://localhost:8000/api/ 2>nul
echo.
echo.
echo Frontend React:
curl -s http://localhost:3000 2>nul | findstr "Arconte" | head -1
echo.
echo.
echo Python Ingest:
curl -s http://localhost:8001/healthz 2>nul
echo.
echo.
echo ====================================
echo Servicios reiniciados!
echo ====================================
echo.
echo URLs:
echo - Backend: http://localhost:8000/api/
echo - Frontend: http://localhost:3000
echo - Python: http://localhost:8001
echo.
pause
