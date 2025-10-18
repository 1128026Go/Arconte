@echo off
chcp 65001 >nul
cls

REM ========================================
REM ARCONTE - Script de Inicio de Desarrollo
REM Inicia todos los servicios en modo desarrollo
REM ========================================

setlocal enabledelayedexpansion

echo ========================================
echo   ARCONTE - Iniciando Servicios
echo ========================================
echo.

REM Cambiar al directorio raíz del proyecto
cd /d "%~dp0"
cd ..\..

REM Verificar directorio correcto
if not exist "apps\api_php" (
    echo ❌ ERROR: No se encuentra el directorio apps\api_php
    echo Por favor ejecuta este script desde la raiz del proyecto
    pause
    exit /b 1
)

REM Verificar que exista docker-compose.yml
if not exist "docker-compose.yml" (
    echo ❌ ERROR: No se encuentra docker-compose.yml
    pause
    exit /b 1
)

echo 🔍 Verificando prerequisitos...
echo.

REM Verificar Docker
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker no está instalado o no está en el PATH
    echo    Instala Docker Desktop: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
) else (
    echo ✓ Docker instalado
)

REM Verificar PHP (Herd o global)
set PHP_PATH=C:\Users\David\.config\herd\bin\php84\php.exe
if not exist "%PHP_PATH%" (
    REM Buscar PHP global
    php --version >nul 2>&1
    if errorlevel 1 (
        echo ⚠ PHP no encontrado en Herd ni en PATH
        echo   Usando Docker para backend
        set USE_DOCKER_BACKEND=1
    ) else (
        set PHP_PATH=php
        echo ✓ PHP encontrado (global)
    )
) else (
    echo ✓ PHP encontrado (Herd)
)

REM Verificar Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js no está instalado
    echo    Instala Node.js: https://nodejs.org
    pause
    exit /b 1
) else (
    echo ✓ Node.js instalado
)

echo.
echo 🧹 Limpiando puertos...

REM Limpiar puertos si están ocupados
set PORTS=3000 8000 8001 5432 6379

for %%p in (%PORTS%) do (
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%%p" ^| findstr "LISTENING"') do (
        taskkill /F /PID %%a 2>nul >nul
    )
)

timeout /t 2 >nul

echo ✓ Puertos liberados
echo.

echo ========================================
echo   Iniciando Servicios
echo ========================================
echo.

REM [1/5] Base de Datos
echo [1/5] 🗄️  Base de Datos...
docker-compose up -d postgres redis

echo       ⏳ Esperando PostgreSQL...
timeout /t 8 >nul

docker-compose ps postgres | findstr "Up" >nul
if errorlevel 1 (
    echo       ⚠ PostgreSQL no inició correctamente
    docker-compose logs postgres
    pause
    exit /b 1
) else (
    echo       ✓ PostgreSQL: http://localhost:5432
    echo       ✓ Redis: http://localhost:6379
)

echo.

REM [2/5] Backend Laravel
echo [2/5] 🔧 Backend Laravel...

cd apps\api_php

REM Verificar .env
if not exist ".env" (
    if exist ".env.example" (
        echo       Copiando .env.example...
        copy .env.example .env >nul
    ) else (
        echo       ❌ No se encontró .env ni .env.example
        cd ..\..
        pause
        exit /b 1
    )
)

REM Limpiar cache de Laravel
echo       Limpiando cache...
"%PHP_PATH%" artisan config:clear >nul 2>&1
"%PHP_PATH%" artisan cache:clear >nul 2>&1
"%PHP_PATH%" artisan route:clear >nul 2>&1

REM Iniciar servidor Laravel
echo       Iniciando servidor en http://localhost:8000...
start "Arconte - Backend API" cmd /k ""%PHP_PATH%" artisan serve --host=0.0.0.0 --port=8000"

cd ..\..
timeout /t 3 >nul
echo       ✓ Backend: http://localhost:8000

echo.

REM [3/5] Queue Worker
echo [3/5] ⚙️  Queue Worker...
start "Arconte - Queue Worker" cmd /k "cd apps\api_php && "%PHP_PATH%" artisan queue:work --tries=3 --timeout=90"
timeout /t 2 >nul
echo       ✓ Queue Worker iniciado

echo.

REM [4/5] Frontend React
echo [4/5] 🌐 Frontend React...

cd apps\web

REM Verificar node_modules
if not exist "node_modules" (
    echo       Instalando dependencias...
    call npm install --silent
)

REM Iniciar Vite dev server
echo       Iniciando Vite en http://localhost:3000...
start "Arconte - Frontend" cmd /k "npm run dev"

cd ..\..
timeout /t 3 >nul
echo       ✓ Frontend: http://localhost:3000

echo.

REM [5/5] Python Ingest Service (opcional)
echo [5/5] 📥 Python Ingest Service...

if exist "apps\ingest_py" (
    cd apps\ingest_py

    REM Verificar Python
    python --version >nul 2>&1
    if errorlevel 1 (
        echo       ⚠ Python no instalado - Saltando
    ) else (
        REM Verificar entorno virtual
        if not exist ".venv" (
            echo       Creando entorno virtual...
            python -m venv .venv
            call .venv\Scripts\activate
            pip install -r requirements.txt --quiet
        )

        echo       Iniciando FastAPI en http://localhost:8001...
        start "Arconte - Ingest Service" cmd /k "cd apps\ingest_py && .venv\Scripts\activate && python -m uvicorn src.main:app --reload --host 0.0.0.0 --port 8001"
        echo       ✓ Ingest: http://localhost:8001/docs
    )

    cd ..\..
) else (
    echo       ⚠ apps\ingest_py no existe - Saltando
)

echo.
timeout /t 3 >nul

echo.
echo ========================================
echo   ✅ SERVICIOS INICIADOS
echo ========================================
echo.
echo 📍 ENLACES DE ACCESO:
echo.
echo 🔧 Backend API (Laravel):
echo    └─ http://localhost:8000
echo    └─ http://localhost:8000/api/health
echo.
echo 🌐 Frontend (React + Vite):
echo    └─ http://localhost:3000
echo    └─ http://localhost:3000/login
echo.
echo 📥 Ingest Service (FastAPI):
echo    └─ http://localhost:8001
echo    └─ http://localhost:8001/docs (Swagger UI)
echo.
echo 🗄️ Base de Datos:
echo    └─ PostgreSQL: localhost:5432
echo    └─ Redis: localhost:6379
echo    └─ Adminer: http://localhost:8080
echo.
echo ========================================
echo.
echo 💡 COMANDOS ÚTILES:
echo.
echo    npm run stop      - Detener todos los servicios
echo    npm run dev:clean - Limpiar y reiniciar
echo.
echo ========================================
echo.
echo Presiona cualquier tecla para abrir en el navegador...
pause >nul

REM Abrir URLs en el navegador
start http://localhost:8000/api/health
timeout /t 1 >nul
start http://localhost:3000

echo.
echo ✓ Navegador abierto
echo.
echo 🛑 Para detener:
echo    1. Cierra las ventanas de cada servicio
echo    2. O ejecuta: npm run stop
echo ========================================
echo.
pause
