#!/bin/bash
# Daily Health Check - Arconte
# Verifica que los servicios y la autenticación funcionen correctamente

set -e

COLOR_GREEN='\033[0;32m'
COLOR_RED='\033[0;31m'
COLOR_YELLOW='\033[1;33m'
COLOR_RESET='\033[0m'

echo "=================================================="
echo "🔍 Arconte - Daily Health Check"
echo "=================================================="
echo ""

# ========================================
# 1. Servicios
# ========================================
echo "📦 Verificando servicios..."

# PostgreSQL
if docker ps | grep -q "arconte"; then
    echo -e "${COLOR_GREEN}✓${COLOR_RESET} PostgreSQL (Docker) corriendo"
else
    echo -e "${COLOR_RED}✗${COLOR_RESET} PostgreSQL NO está corriendo"
    echo "   Ejecuta: docker start arconte_postgres"
    exit 1
fi

# Laravel API (puerto 8000)
if curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8000/api/health/external | grep -q "200\|503"; then
    echo -e "${COLOR_GREEN}✓${COLOR_RESET} Laravel API (8000) respondiendo"
else
    echo -e "${COLOR_RED}✗${COLOR_RESET} Laravel API NO responde en puerto 8000"
    echo "   Ejecuta: php artisan serve"
    exit 1
fi

# Ingest Python (puerto 8001)
if curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8001/healthz | grep -q "200"; then
    echo -e "${COLOR_GREEN}✓${COLOR_RESET} Ingest Python (8001) respondiendo"
else
    echo -e "${COLOR_RED}✗${COLOR_RESET} Ingest Python NO responde en puerto 8001"
    echo "   Ejecuta: python apps/ingest_py/run_persistent.py"
    exit 1
fi

# Queue Worker
QUEUE_COUNT=$(ps aux | grep -c "[q]ueue:work" || echo "0")
if [ "$QUEUE_COUNT" -gt 0 ]; then
    echo -e "${COLOR_GREEN}✓${COLOR_RESET} Queue Worker activo ($QUEUE_COUNT proceso(s))"
else
    echo -e "${COLOR_YELLOW}⚠${COLOR_RESET} Queue Worker NO está corriendo"
    echo "   Ejecuta: php artisan queue:work --tries=3 --timeout=120"
fi

echo ""

# ========================================
# 2. Auth - CSRF y /auth/me
# ========================================
echo "🔐 Verificando autenticación..."

# CSRF Cookie
CSRF_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8000/sanctum/csrf-cookie)
if [ "$CSRF_STATUS" = "204" ]; then
    echo -e "${COLOR_GREEN}✓${COLOR_RESET} CSRF cookie endpoint OK (204)"
else
    echo -e "${COLOR_RED}✗${COLOR_RESET} CSRF cookie endpoint retorna $CSRF_STATUS (esperado 204)"
    exit 1
fi

# /auth/me headers (debe tener no-cache)
ME_HEADERS=$(curl -s -I http://127.0.0.1:8000/api/auth/me 2>&1)
if echo "$ME_HEADERS" | grep -iq "cache-control.*no-store"; then
    echo -e "${COLOR_GREEN}✓${COLOR_RESET} /auth/me tiene headers no-cache"
else
    echo -e "${COLOR_RED}✗${COLOR_RESET} /auth/me NO tiene headers no-cache"
    echo "   Verifica AuthController@me"
    exit 1
fi

# /auth/me sin sesión debe dar 401
ME_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8000/api/auth/me)
if [ "$ME_STATUS" = "401" ]; then
    echo -e "${COLOR_GREEN}✓${COLOR_RESET} /auth/me retorna 401 sin sesión"
else
    echo -e "${COLOR_YELLOW}⚠${COLOR_RESET} /auth/me retorna $ME_STATUS (puede estar logueado)"
fi

echo ""

# ========================================
# 3. Frontend
# ========================================
echo "🌐 Verificando frontend..."

if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200"; then
    echo -e "${COLOR_GREEN}✓${COLOR_RESET} Frontend (3000) respondiendo"
else
    echo -e "${COLOR_RED}✗${COLOR_RESET} Frontend NO responde en puerto 3000"
    echo "   Ejecuta: cd apps/web && npm run dev"
    exit 1
fi

echo ""

# ========================================
# 4. Configuración crítica
# ========================================
echo "⚙️  Verificando configuración..."

cd apps/api_php

# .env variables críticas
if grep -q "SESSION_DRIVER=database" .env && \
   grep -q "SESSION_DOMAIN=localhost" .env && \
   grep -q "SANCTUM_STATEFUL_DOMAINS=localhost:3000" .env; then
    echo -e "${COLOR_GREEN}✓${COLOR_RESET} Variables de sesión en .env OK"
else
    echo -e "${COLOR_RED}✗${COLOR_RESET} Variables de sesión en .env incorrectas"
    echo "   Revisa SESSION_DRIVER, SESSION_DOMAIN, SANCTUM_STATEFUL_DOMAINS"
    exit 1
fi

cd ../..

echo ""

# ========================================
# 5. Tests E2E (opcional, puede ser lento)
# ========================================
if [ "$1" = "--with-e2e" ]; then
    echo "🧪 Ejecutando tests E2E de autenticación..."
    cd apps/web
    if npx playwright test auth.spec.ts --reporter=line 2>&1 | grep -q "passed"; then
        echo -e "${COLOR_GREEN}✓${COLOR_RESET} Tests E2E de autenticación pasaron"
    else
        echo -e "${COLOR_RED}✗${COLOR_RESET} Tests E2E de autenticación FALLARON"
        exit 1
    fi
    cd ../..
    echo ""
fi

# ========================================
# Resumen
# ========================================
echo "=================================================="
echo -e "${COLOR_GREEN}✅ Todos los checks pasaron${COLOR_RESET}"
echo "=================================================="
echo ""
echo "Servicios corriendo:"
echo "  - PostgreSQL: docker ps | grep arconte"
echo "  - Laravel API: http://127.0.0.1:8000"
echo "  - Ingest Python: http://127.0.0.1:8001"
echo "  - Frontend: http://localhost:3000"
echo ""
echo "Para ejecutar con tests E2E: ./scripts/daily-check.sh --with-e2e"
