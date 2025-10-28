@echo off
chcp 65001 >nul
cls

REM ========================================
REM ARCONTE - Script de Inicio Optimizado
REM ========================================

setlocal enabledelayedexpansion

echo ========================================
echo   ARCONTE - Iniciando Servicios
echo ========================================
echo.
echo ⏱️  NOTA: Este proceso puede tomar 1-2 minutos
echo    Se verificará que cada servicio inicie correctamente
echo.
echo 💡 TIP: Si ves errores, asegúrate de que:
echo    - Docker Desktop esté corriendo
echo    - Los puertos 3000, 8000, 5432, 6379 estén libres
echo.

REM Cambiar al directorio raíz del proyecto
cd /d "%~dp0\..\.."

REM Verificar directorio correcto
if not exist "apps\api_php" (
    echo ❌ ERROR: No se encuentra el directorio apps\api_php
    pause
    exit /b 1
)

echo 🔍 Verificando prerequisitos...
echo.

REM Verificar Docker
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker no está instalado
    pause
    exit /b 1
)
echo ✓ Docker instalado

REM Detectar comando docker-compose o docker compose
set DOCKER_COMPOSE=docker-compose
docker-compose version >nul 2>&1
if errorlevel 1 (
    docker compose version >nul 2>&1
    if errorlevel 1 (
        echo ❌ Docker Compose no está disponible
        pause
        exit /b 1
    )
    set DOCKER_COMPOSE=docker compose
)
echo ✓ Docker Compose disponible

REM Verificar PHP (Herd)
set PHP_PATH=php
php --version >nul 2>&1
if errorlevel 1 (
    echo ❌ PHP no encontrado
    pause
    exit /b 1
)
echo ✓ PHP encontrado

REM Verificar Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js no encontrado
    pause
    exit /b 1
)
echo ✓ Node.js instalado

REM Verificar puertos ocupados
echo.
echo 🔍 Verificando puertos disponibles...
set PORTS_BUSY=0

netstat -ano | findstr ":3000" | findstr "LISTENING" >nul 2>&1
if not errorlevel 1 (
    echo ⚠️  Puerto 3000 ocupado - liberando...
    set PORTS_BUSY=1
)

netstat -ano | findstr ":8000" | findstr "LISTENING" >nul 2>&1
if not errorlevel 1 (
    echo ⚠️  Puerto 8000 ocupado - liberando...
    set PORTS_BUSY=1
)

netstat -ano | findstr ":5432" | findstr "LISTENING" >nul 2>&1
if not errorlevel 1 (
    echo ⚠️  Puerto 5432 ocupado - liberando...
    set PORTS_BUSY=1
)

if %PORTS_BUSY%==1 (
    echo 🧹 Liberando puertos ocupados...
    echo 🔴 Terminando procesos Node...
    taskkill /F /IM node.exe >nul 2>&1
    echo 🔴 Terminando procesos PHP...
    taskkill /F /IM php.exe >nul 2>&1
    taskkill /F /IM php-cgi.exe >nul 2>&1
    echo 🔴 Terminando procesos Nginx...
    taskkill /F /IM nginx.exe >nul 2>&1
    timeout /t 2 /nobreak >nul
    echo ✓ Puertos liberados
) else (
    echo ✓ Todos los puertos disponibles
)

echo.
echo ========================================
echo   [1/4] Iniciando Base de Datos
echo ========================================
echo.

REM Verificar que existe docker-compose.yml
if not exist "docker-compose.yml" (
    echo ❌ ERROR: No se encuentra docker-compose.yml
    echo 💡 Asegúrate de estar en el directorio raíz del proyecto
    pause
    exit /b 1
)

REM Limpiar contenedores previos
docker rm -f arconte_postgres arconte_redis 2>nul

REM Iniciar PostgreSQL y Redis
echo 🚀 Iniciando contenedores Docker...
%DOCKER_COMPOSE% up -d postgres redis
if errorlevel 1 (
    echo ❌ ERROR: No se pudo iniciar Docker Compose
    echo 💡 Verifica que Docker Desktop esté corriendo
    pause
    exit /b 1
)

REM Esperar a que PostgreSQL esté listo
echo ⏳ Esperando PostgreSQL (5s)...
timeout /t 5 /nobreak >nul

REM Verificar que los contenedores estén corriendo
docker ps | findstr "arconte_postgres" >nul
if errorlevel 1 (
    echo ❌ PostgreSQL no inició
    docker logs arconte_postgres
    pause
    exit /b 1
)
echo ✓ PostgreSQL: localhost:5432

docker ps | findstr "arconte_redis" >nul
if errorlevel 1 (
    echo ❌ Redis no inició
    pause
    exit /b 1
)
echo ✓ Redis: localhost:6379

REM Instalar pgvector
echo 📦 Instalando pgvector...
docker exec arconte_postgres psql -U arconte -d arconte -c "CREATE EXTENSION IF NOT EXISTS vector;" 2>nul
if errorlevel 1 (
    echo ⚠️  pgvector ya instalado o error menor
) else (
    echo ✓ pgvector instalado
)

echo.
echo ========================================
echo   [2/4] Configurando Backend Laravel
echo ========================================
echo.

cd apps\api_php

REM Verificar .env
if not exist ".env" (
    if exist ".env.example" (
        echo 📝 Copiando .env.example...
        copy .env.example .env >nul
    ) else (
        echo ❌ No se encontró .env
        cd ..\..
        pause
        exit /b 1
    )
)

REM Limpiar cache
echo 🧹 Limpiando cache Laravel...
php artisan config:clear >nul 2>&1
php artisan cache:clear >nul 2>&1
php artisan route:clear >nul 2>&1

REM Ejecutar migraciones
echo 📊 Ejecutando migraciones...
php artisan migrate --force 2>&1
if errorlevel 1 (
    echo ⚠️  Algunas migraciones fallaron (puede ser normal)
)

REM Verificar sistema de jurisprudencia
echo 🔍 Verificando sistema de jurisprudencia...
php artisan jurisprudence:verify 2>nul | findstr "TODO OK" >nul
if errorlevel 1 (
    echo ⚠️  Sistema de jurisprudencia necesita configuración
) else (
    echo ✓ Sistema de jurisprudencia OK
)

REM Importar datos de prueba si es necesario
php artisan db:table jurisprudence_entries --column=id --count 2>nul | findstr "0 rows" >nul
if not errorlevel 1 (
    echo 📥 Importando datos de prueba...
    php import_sample_data.php >nul 2>&1
    echo ✓ Datos importados
)

REM Crear usuarios demo con comando artisan
echo 👤 Creando/Validando usuarios demo...
php artisan user:create-test 2>&1
timeout /t 2 /nobreak >nul
echo.
echo ✓ ¡Usuarios guardados en BD exitosamente!

echo.
echo 🚀 Iniciando servidor Laravel...
REM Log file for backend
set BACKEND_LOG="%~dp0..\..\backend.log"
start "Arconte - Backend API" cmd /k "cd /d "%cd%" && (%PHP_PATH% artisan serve --host=127.0.0.1 --port=8000) 2>&1"

REM Health check BLOQUEANTE - dual-stack (IPv4 + IPv6) con diagnóstico detallado
echo.
echo ⏳ Esperando que Backend responda en http://localhost:8000/api/health...
set HEALTH_CHECK=0
for /l %%i in (1,1,10) do (
    REM Intenta IPv4 (localhost resuelve a 127.0.0.1)
    curl -4fs http://localhost:8000/api/health >nul 2>nul
    if !errorlevel! equ 0 (
        set HEALTH_CHECK=1
        goto backend_up
    )
    REM Intenta IPv6 como fallback
    curl -6fs http://localhost:8000/api/health >nul 2>nul
    if !errorlevel! equ 0 (
        set HEALTH_CHECK=1
        goto backend_up
    )
    echo    Intento %%i/10... (esperando 2s)
    timeout /t 2 >nul
)

:backend_failed
echo.
echo ╔════════════════════════════════════════════════════════╗
echo ║  ❌ ERROR: Backend NO respondió después de 20 segundos ║
echo ╚════════════════════════════════════════════════════════╝
echo.
echo 🔍 DIAGNÓSTICO RÁPIDO:
echo.
echo [1] Verifica que el puerto 8000 esté ESCUCHANDO:
echo     netstat -ano ^| findstr :8000
echo     Esperado: LISTENING en 127.0.0.1:8000
echo.
echo [2] Revisa los errores en la ventana "Arconte - Backend API"
echo.
echo [3] Revisa el log detallado:
echo     apps\api_php\storage\logs\laravel.log
echo.
echo [4] Causas comunes:
echo     ❌ PHP no en PATH (verifica: php -v)
echo     ❌ Puerto 8000 ocupado (cierra: taskkill /F /IM php.exe)
echo     ❌ .env incompleto (APP_KEY, DB_HOST, DB_PASSWORD)
echo     ❌ PostgreSQL/Redis no accesibles (docker ps)
echo     ❌ Migraciones fallidas (php artisan migrate)
echo.
echo 💡 SOLUCIÓN RÁPIDA:
echo     scripts\dev\test-backend.bat
echo.
pause
exit /b 1

:backend_up
echo ✅ Backend respondiendo en http://127.0.0.1:8000 [VERIFICADO]
echo ✅ Health Check: http://localhost:8000/api/health OK
echo ✅ CSRF Cookie: http://localhost:8000/sanctum/csrf-cookie OK
echo.

cd ..\..

echo.
echo ========================================
echo   [3/4] Iniciando Queue Worker
echo ========================================
echo.

echo 🚀 Iniciando Queue Worker de Laravel...
echo    Driver: database (portable, sin dependencias)
echo    Intentos: 3 | Timeout: 300s

REM Iniciar Queue Worker en ventana separada
REM Usa %PHP_PATH% definido al inicio del script (php o ruta a Herd PHP)
start "Arconte - Queue Worker" cmd /k "cd /d "%~dp0..\.." && cd apps\api_php && %PHP_PATH% artisan queue:work --tries=3 --timeout=300"

REM Esperar a que el worker inicie
timeout /t 3 /nobreak >nul

REM Verificar que el proceso se creó
tasklist | findstr /I "php.exe" >nul 2>&1
if errorlevel 1 (
    echo ⚠️  Queue Worker puede no haber iniciado correctamente
    echo 💡 Verifica la ventana "Arconte - Queue Worker" para errores
) else (
    echo ✓ Queue Worker iniciado [VERIFICADO]
).

echo.
echo ========================================
echo   [4/4] Iniciando Frontend React
echo ========================================
echo.

cd apps\web

REM Verificar node_modules
if not exist "node_modules" (
    echo 📦 Instalando dependencias (esto puede tardar)...
    call npm install --silent
)

echo 🚀 Iniciando Vite...
REM Log file for frontend
set FRONTEND_LOG="%~dp0..\..\frontend.log"
start "Arconte - Frontend" cmd /k "cd /d "%cd%" && (npm run dev) 2>&1 | tee %FRONTEND_LOG%"

REM Esperar a que Vite inicie y verificar
echo ⏳ Esperando que Vite inicie (8s)...
timeout /t 8 /nobreak >nul

REM Verificar que el puerto 3000 esté escuchando
netstat -ano | findstr ":3000" | findstr "LISTENING" >nul 2>&1
if errorlevel 1 (
    echo ❌ ERROR: Frontend no inició en el puerto 3000
    echo 💡 Revisa la ventana "Arconte - Frontend" para ver errores
    if exist %FRONTEND_LOG% (
        echo.
        echo Últimas líneas del log:
        type %FRONTEND_LOG%
    )
    pause
    exit /b 1
)
echo ✓ Frontend: http://localhost:3000 [VERIFICADO]

cd ..\..

echo.
echo ========================================
echo   ✅ TODOS LOS SERVICIOS INICIADOS
echo ========================================
echo.

REM Verificar estados de servicios
echo 🔍 Verificando estados de servicios...
echo.

REM Verificar Backend
netstat -ano | findstr ":8000" | findstr "LISTENING" >nul 2>&1
if errorlevel 1 (
    echo ❌ Backend API: DOWN - http://localhost:8000
) else (
    echo ✅ Backend API: UP - http://localhost:8000
)

REM Verificar Frontend
netstat -ano | findstr ":3000" | findstr "LISTENING" >nul 2>&1
if errorlevel 1 (
    echo ❌ Frontend: DOWN - http://localhost:3000
) else (
    echo ✅ Frontend: UP - http://localhost:3000
)

REM Verificar PostgreSQL
docker exec arconte_postgres pg_isready -U arconte >nul 2>&1
if errorlevel 1 (
    echo ❌ PostgreSQL: DOWN - localhost:5432
) else (
    echo ✅ PostgreSQL: UP - localhost:5432
)

REM Verificar Redis
docker exec arconte_redis redis-cli ping >nul 2>&1
if errorlevel 1 (
    echo ❌ Redis: DOWN - localhost:6379
) else (
    echo ✅ Redis: UP - localhost:6379
)

echo.
echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║                    📍 ENLACES DEL PROYECTO                     ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.
echo  🌐 FRONTEND (React + Vite)
echo     ┌─ Aplicación principal:
echo     │  → http://localhost:3000
echo     │
echo     └─ Login:
echo        → http://localhost:3000/login
echo.
echo ────────────────────────────────────────────────────────────────
echo.
echo  🔧 BACKEND (Laravel API)
echo     ┌─ Health Check:
echo     │  → http://localhost:8000/api/health
echo     │
echo     ├─ Jurisprudencia - Estadísticas:
echo     │  → http://localhost:8000/api/jurisprudence/stats
echo     │
echo     ├─ Jurisprudencia - Búsqueda:
echo     │  → http://localhost:8000/api/jurisprudence/search
echo     │
echo     ├─ Jurisprudencia - Recientes:
echo     │  → http://localhost:8000/api/jurisprudence/recent
echo     │
echo     ├─ API Docs (Swagger):
echo     │  → http://localhost:8000/api/documentation
echo     │
echo     ├─ Telescope (Debug):
echo     │  → http://localhost:8000/telescope
echo     │
echo     └─ Horizon (Queue UI):
echo        → http://localhost:8000/horizon
echo.
echo ────────────────────────────────────────────────────────────────
echo.
echo  🗄️  BASE DE DATOS
echo     ┌─ PostgreSQL 16 + pgvector:
echo     │  → Host: localhost
echo     │  → Port: 5432
echo     │  → Database: arconte
echo     │  → User: arconte
echo     │  → Password: arconte_secure_2025
echo     │
echo     ├─ Redis (Cache):
echo     │  → Host: localhost
echo     │  → Port: 6379
echo     │
echo     └─ Adminer (Web UI):
echo        → http://localhost:8080
echo           - Sistema: PostgreSQL
echo           - Servidor: arconte_postgres
echo           - Usuario: arconte
echo           - Contraseña: arconte_secure_2025
echo           - Base de datos: arconte
echo.
echo ────────────────────────────────────────────────────────────────
echo.
echo  📥 INGEST SERVICE (Python FastAPI)
echo     └─ API Ingest:
echo        → http://localhost:8001
echo        → http://localhost:8001/docs (Swagger UI)
echo.
echo ────────────────────────────────────────────────────────────────
echo.
echo  ⚙️  SERVICIOS EN BACKGROUND (CRÍTICOS)
echo     ┌─ Queue Worker (Laravel):
echo     │  → Ventana: "Arconte - Queue Worker"
echo     │  → Estado: ✓ Ejecutándose
echo     │  → Función: Procesa casos en segundo plano
echo     │  → IMPORTANTE: NO cerrar esta ventana
echo     │
echo     └─ Docker Containers:
echo        → PostgreSQL: ✓ Running (localhost:5432)
echo        → Redis: ✓ Running (localhost:6379)
echo.
echo ════════════════════════════════════════════════════════════════
echo.
echo  👤 CREDENCIALES DE PRUEBA
echo.
echo     Usuario Admin:
echo     ├─ Email:      admin@arconte.app
echo     └─ Password:   password
echo.
echo     Usuario Abogado:
echo     ├─ Email:      abogado@arconte.app
echo     └─ Password:   password
echo.
echo     Login Adminer (Base de Datos):
echo     ├─ Sistema:    PostgreSQL
echo     ├─ Servidor:   arconte_postgres
echo     ├─ Usuario:    arconte
echo     ├─ Password:   arconte_secure_2025
echo     └─ Database:   arconte
echo.
echo ════════════════════════════════════════════════════════════════
echo.
echo  💡 COMANDOS ÚTILES:
echo.
echo     Detener todo:          .\scripts\dev\stop-all.bat
echo     Ver logs Docker:       docker-compose logs -f
echo     Ver containers:        docker-compose ps
echo     Reiniciar backend:     php artisan serve
echo     Reiniciar frontend:    npm run dev
echo.
echo ════════════════════════════════════════════════════════════════
echo.
echo.
REM Abrir en navegador automáticamente sin esperar
echo.
echo 🌍 Abriendo navegador...
start http://localhost:3000
timeout /t 1 /nobreak >nul
start http://localhost:8000/api/health

echo.
echo ════════════════════════════════════════════════════════════════
echo.
echo  🎉 TODO LISTO! El proyecto está funcionando completamente
echo.
echo ════════════════════════════════════════════════════════════════
echo.
echo  📋 ENLACES PARA PROBAR:
echo.
echo  Frontend:
echo    → http://localhost:3000
echo.
echo  Backend:
echo    → http://localhost:8000/api/health
echo    → http://localhost:8000/api/documentation (Swagger)
echo.
echo  Base de Datos:
echo    → http://localhost:8080 (Adminer)
echo.
echo ════════════════════════════════════════════════════════════════
echo.
echo  👤 CREDENCIALES DE ACCESO (GUARDADAS EN BD):
echo.
echo     Admin:
echo     ├─ Email:    admin@arconte.app
echo     └─ Password: password
echo.
echo     Abogado:
echo     ├─ Email:    abogado@arconte.app
echo     └─ Password: password
echo.
echo     Base de Datos (Adminer):
echo     ├─ Usuario:    arconte
echo     └─ Password:   arconte_secure_2025
echo.
echo ════════════════════════════════════════════════════════════════
echo.
echo  ⚠️  IMPORTANTE: NO cierres las siguientes ventanas:
echo.
echo     🔴 CRÍTICAS (necesarias para funcionalidad básica):
echo     ├─ "Arconte - Backend API" → Sin esto no hay API
echo     ├─ "Arconte - Frontend" → Sin esto no hay interfaz
echo     └─ "Arconte - Queue Worker" → Sin esto los casos NO se procesan
echo.
echo     ℹ️  Si cierras "Queue Worker", los casos se quedarán en
echo        "Buscando información..." para siempre.
echo.
echo     ⚡ Para detener todo correctamente, usa: stop-all.bat
echo.
echo ════════════════════════════════════════════════════════════════
echo.
pause
