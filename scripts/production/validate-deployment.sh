#!/bin/bash

# ================================================
# SCRIPT DE VALIDACIÓN PRE-DEPLOYMENT
# Valida que todos los requisitos estén cumplidos
# ================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0
WARNING_CHECKS=0

echo "================================================"
echo "🔍 ARCONTE - VALIDACIÓN PRE-DEPLOYMENT"
echo "================================================"
echo ""

# ================================================
# FUNCIONES DE UTILIDAD
# ================================================

check_pass() {
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
    echo -e "${GREEN}✅ PASS${NC} - $1"
}

check_fail() {
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
    echo -e "${RED}❌ FAIL${NC} - $1"
    echo -e "${RED}   └─ $2${NC}"
}

check_warn() {
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    WARNING_CHECKS=$((WARNING_CHECKS + 1))
    echo -e "${YELLOW}⚠️  WARN${NC} - $1"
    echo -e "${YELLOW}   └─ $2${NC}"
}

check_info() {
    echo -e "${BLUE}ℹ️  INFO${NC} - $1"
}

section() {
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${BLUE}$1${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# ================================================
# 1. VALIDAR ARCHIVOS REQUERIDOS
# ================================================

section "1️⃣  ARCHIVOS REQUERIDOS"

# .env.production
if [ -f ".env.production" ]; then
    check_pass ".env.production existe"
else
    check_fail ".env.production NO existe" "Copiar de .env.production.example"
fi

# Dockerfiles
if [ -f "apps/api_php/Dockerfile" ]; then
    check_pass "Dockerfile backend existe"
else
    check_fail "Dockerfile backend NO existe" "Crear Dockerfile en apps/api_php/"
fi

if [ -f "apps/web/Dockerfile" ]; then
    check_pass "Dockerfile frontend existe"
else
    check_fail "Dockerfile frontend NO existe" "Crear Dockerfile en apps/web/"
fi

# docker-compose.production.yml
if [ -f "docker-compose.production.yml" ]; then
    check_pass "docker-compose.production.yml existe"
else
    check_fail "docker-compose.production.yml NO existe" "Crear archivo de configuración"
fi

# Certificados SSL
if [ -f "nginx/ssl/fullchain.pem" ] && [ -f "nginx/ssl/privkey.pem" ]; then
    check_pass "Certificados SSL presentes"
else
    check_warn "Certificados SSL NO encontrados" "Generar desde Cloudflare Origin Certificates"
fi

# ================================================
# 2. VALIDAR VARIABLES DE ENTORNO
# ================================================

section "2️⃣  VARIABLES DE ENTORNO"

if [ -f ".env.production" ]; then
    source .env.production 2>/dev/null || true

    # APP_ENV
    if [ "$APP_ENV" == "production" ]; then
        check_pass "APP_ENV=production"
    else
        check_fail "APP_ENV NO es production" "Valor actual: $APP_ENV"
    fi

    # APP_DEBUG
    if [ "$APP_DEBUG" == "false" ]; then
        check_pass "APP_DEBUG=false"
    else
        check_fail "APP_DEBUG debe ser false en producción" "Valor actual: $APP_DEBUG"
    fi

    # APP_KEY
    if [ ! -z "$APP_KEY" ] && [ "$APP_KEY" != "base64:your_generated_app_key_here" ]; then
        check_pass "APP_KEY configurado"
    else
        check_fail "APP_KEY NO configurado" "Generar con: php artisan key:generate"
    fi

    # APP_URL
    if [ ! -z "$APP_URL" ] && [ "$APP_URL" != "https://arconte.com" ]; then
        check_pass "APP_URL configurado: $APP_URL"
    else
        check_warn "APP_URL usa valor por defecto" "Configurar con tu dominio real"
    fi

    # DB_PASSWORD
    if [ ! -z "$DB_PASSWORD" ] && [ "$DB_PASSWORD" != "your_secure_database_password_here" ]; then
        if [ ${#DB_PASSWORD} -ge 16 ]; then
            check_pass "DB_PASSWORD configurado (${#DB_PASSWORD} caracteres)"
        else
            check_warn "DB_PASSWORD muy corto" "Recomendado: mínimo 16 caracteres"
        fi
    else
        check_fail "DB_PASSWORD NO configurado" "Generar con: openssl rand -base64 32"
    fi

    # REDIS_PASSWORD
    if [ ! -z "$REDIS_PASSWORD" ] && [ "$REDIS_PASSWORD" != "your_secure_redis_password_here" ]; then
        check_pass "REDIS_PASSWORD configurado"
    else
        check_fail "REDIS_PASSWORD NO configurado" "Generar con: openssl rand -base64 32"
    fi

    # MAIL_PASSWORD
    if [ ! -z "$MAIL_PASSWORD" ] && [ "$MAIL_PASSWORD" != "your_resend_api_key" ]; then
        check_pass "MAIL_PASSWORD configurado"
    else
        check_warn "MAIL_PASSWORD NO configurado" "Obtener API key de proveedor de email"
    fi

    # GEMINI_API_KEY
    if [ ! -z "$GEMINI_API_KEY" ] && [ "$GEMINI_API_KEY" != "your_gemini_api_key_here" ]; then
        check_pass "GEMINI_API_KEY configurado"
    else
        check_warn "GEMINI_API_KEY NO configurado" "Funcionalidad de IA no funcionará"
    fi

    # EPAYCO_PUBLIC_KEY
    if [ ! -z "$EPAYCO_PUBLIC_KEY" ] && [ "$EPAYCO_PUBLIC_KEY" != "your_epayco_public_key" ]; then
        check_pass "EPAYCO_PUBLIC_KEY configurado"
    else
        check_warn "EPAYCO_PUBLIC_KEY NO configurado" "Pagos no funcionarán"
    fi

    # EPAYCO_TEST
    if [ "$EPAYCO_TEST" == "false" ]; then
        check_pass "EPAYCO_TEST=false (modo producción)"
    else
        check_warn "EPAYCO_TEST no es false" "Pagos estarán en modo prueba"
    fi

    # SESSION_SECURE_COOKIE
    if [ "$SESSION_SECURE_COOKIE" == "true" ]; then
        check_pass "SESSION_SECURE_COOKIE=true"
    else
        check_fail "SESSION_SECURE_COOKIE debe ser true" "Requerido para HTTPS"
    fi

else
    check_fail "No se puede validar variables" ".env.production no existe"
fi

# ================================================
# 3. VALIDAR DOCKER
# ================================================

section "3️⃣  DOCKER"

# Docker instalado
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version | grep -oP '\d+\.\d+')
    check_pass "Docker instalado (v$DOCKER_VERSION)"
else
    check_fail "Docker NO instalado" "Instalar Docker Engine"
fi

# Docker Compose instalado
if command -v docker-compose &> /dev/null; then
    COMPOSE_VERSION=$(docker-compose --version | grep -oP '\d+\.\d+')
    check_pass "Docker Compose instalado (v$COMPOSE_VERSION)"
else
    check_fail "Docker Compose NO instalado" "Instalar Docker Compose"
fi

# Docker daemon corriendo
if docker ps &> /dev/null; then
    check_pass "Docker daemon corriendo"
else
    check_fail "Docker daemon NO corriendo" "Iniciar con: sudo systemctl start docker"
fi

# Espacio en disco
DISK_AVAILABLE=$(df -BG . | tail -1 | awk '{print $4}' | sed 's/G//')
if [ "$DISK_AVAILABLE" -ge 10 ]; then
    check_pass "Espacio en disco suficiente (${DISK_AVAILABLE}GB disponibles)"
else
    check_warn "Poco espacio en disco" "Solo ${DISK_AVAILABLE}GB disponibles. Recomendado: 20GB+"
fi

# ================================================
# 4. VALIDAR CONFIGURACIÓN NGINX
# ================================================

section "4️⃣  CONFIGURACIÓN NGINX"

# nginx.conf
if [ -f "nginx/nginx.conf" ]; then
    check_pass "nginx.conf principal existe"
else
    check_fail "nginx.conf NO existe" "Crear en nginx/nginx.conf"
fi

# default.conf
if [ -f "nginx/conf.d/default.conf" ]; then
    check_pass "default.conf existe"

    # Verificar SSL habilitado
    if grep -q "listen 443 ssl http2" nginx/conf.d/default.conf; then
        check_pass "SSL habilitado en Nginx (listen 443)"
    else
        check_warn "SSL NO habilitado en Nginx" "Descomentar línea 'listen 443 ssl http2'"
    fi

    # Verificar certificados referenciados
    if grep -q "ssl_certificate" nginx/conf.d/default.conf; then
        check_pass "Certificados SSL referenciados"
    else
        check_warn "Certificados SSL NO referenciados" "Descomentar líneas ssl_certificate"
    fi
else
    check_fail "default.conf NO existe" "Crear en nginx/conf.d/default.conf"
fi

# ================================================
# 5. VALIDAR ESTRUCTURA DE PROYECTO
# ================================================

section "5️⃣  ESTRUCTURA DE PROYECTO"

# Backend
if [ -d "apps/api_php" ]; then
    check_pass "Directorio backend existe"
else
    check_fail "Directorio backend NO existe" "apps/api_php/"
fi

# Frontend
if [ -d "apps/web" ]; then
    check_pass "Directorio frontend existe"
else
    check_fail "Directorio frontend NO existe" "apps/web/"
fi

# Scripts de producción
if [ -d "scripts/production" ]; then
    check_pass "Scripts de producción existen"

    if [ -x "scripts/production/build.sh" ]; then
        check_pass "build.sh es ejecutable"
    else
        check_warn "build.sh NO es ejecutable" "chmod +x scripts/production/build.sh"
    fi

    if [ -x "scripts/production/deploy.sh" ]; then
        check_pass "deploy.sh es ejecutable"
    else
        check_warn "deploy.sh NO es ejecutable" "chmod +x scripts/production/deploy.sh"
    fi
else
    check_fail "Scripts de producción NO existen" "Crear scripts/production/"
fi

# ================================================
# 6. VALIDAR PERMISOS
# ================================================

section "6️⃣  PERMISOS DE ARCHIVOS"

# Certificados SSL
if [ -f "nginx/ssl/privkey.pem" ]; then
    PRIVKEY_PERMS=$(stat -c "%a" nginx/ssl/privkey.pem)
    if [ "$PRIVKEY_PERMS" == "600" ]; then
        check_pass "Permisos de privkey.pem correctos (600)"
    else
        check_warn "Permisos de privkey.pem incorrectos ($PRIVKEY_PERMS)" "chmod 600 nginx/ssl/privkey.pem"
    fi
fi

# .env.production
if [ -f ".env.production" ]; then
    ENV_PERMS=$(stat -c "%a" .env.production)
    if [ "$ENV_PERMS" == "600" ] || [ "$ENV_PERMS" == "640" ]; then
        check_pass "Permisos de .env.production seguros ($ENV_PERMS)"
    else
        check_warn "Permisos de .env.production abiertos ($ENV_PERMS)" "chmod 600 .env.production"
    fi
fi

# ================================================
# 7. VALIDAR SEGURIDAD
# ================================================

section "7️⃣  SEGURIDAD"

# .gitignore protege secretos
if [ -f ".gitignore" ]; then
    if grep -q ".env.production" .gitignore; then
        check_pass ".env.production en .gitignore"
    else
        check_fail ".env.production NO en .gitignore" "Agregar a .gitignore"
    fi

    if grep -q "nginx/ssl/\*.pem" .gitignore || grep -q "nginx/ssl/\*.key" .gitignore; then
        check_pass "Certificados SSL en .gitignore"
    else
        check_warn "Certificados SSL NO en .gitignore" "Agregar nginx/ssl/*.pem"
    fi
else
    check_warn ".gitignore NO existe" "Crear archivo .gitignore"
fi

# Verificar que secretos no estén en Git
if [ -d ".git" ]; then
    if git ls-files | grep -q ".env.production"; then
        check_fail ".env.production está trackeado en Git" "git rm --cached .env.production"
    else
        check_pass ".env.production NO trackeado en Git"
    fi
fi

# ================================================
# 8. TESTS OPCIONALES
# ================================================

section "8️⃣  TESTS OPCIONALES (Build)"

# Intentar build (si Docker está disponible)
if command -v docker &> /dev/null && docker ps &> /dev/null; then
    check_info "Intentando build de prueba..."

    # Backend build test
    if docker build -t arconte-api:test -f apps/api_php/Dockerfile apps/api_php &> /dev/null; then
        check_pass "Build de backend exitoso"
        docker rmi arconte-api:test &> /dev/null || true
    else
        check_warn "Build de backend falló" "Revisar Dockerfile"
    fi

    # Frontend build test (comentado por defecto - puede tomar tiempo)
    # if docker build -t arconte-web:test -f apps/web/Dockerfile apps/web &> /dev/null; then
    #     check_pass "Build de frontend exitoso"
    #     docker rmi arconte-web:test &> /dev/null || true
    # else
    #     check_warn "Build de frontend falló" "Revisar Dockerfile"
    # fi
else
    check_info "Saltando build tests (Docker no disponible)"
fi

# ================================================
# RESUMEN
# ================================================

echo ""
echo "================================================"
echo "📊 RESUMEN DE VALIDACIÓN"
echo "================================================"
echo ""
echo -e "Total de checks:    ${BLUE}$TOTAL_CHECKS${NC}"
echo -e "✅ Pasados:         ${GREEN}$PASSED_CHECKS${NC}"
echo -e "⚠️  Warnings:        ${YELLOW}$WARNING_CHECKS${NC}"
echo -e "❌ Fallidos:        ${RED}$FAILED_CHECKS${NC}"
echo ""

PASS_PERCENTAGE=$((PASSED_CHECKS * 100 / TOTAL_CHECKS))
echo -e "Porcentaje de éxito: ${BLUE}$PASS_PERCENTAGE%${NC}"
echo ""

# Recomendación final
if [ $FAILED_CHECKS -eq 0 ] && [ $WARNING_CHECKS -eq 0 ]; then
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}✅ LISTO PARA DEPLOYMENT${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    exit 0
elif [ $FAILED_CHECKS -eq 0 ]; then
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}⚠️  LISTO CON WARNINGS${NC}"
    echo -e "${YELLOW}Revisar warnings antes de deployar${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    exit 0
elif [ $PASS_PERCENTAGE -ge 80 ]; then
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}⚠️  CASI LISTO${NC}"
    echo -e "${YELLOW}Resolver checks fallidos antes de deployar${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    exit 1
else
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${RED}❌ NO LISTO PARA DEPLOYMENT${NC}"
    echo -e "${RED}Resolver todos los checks críticos${NC}"
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    exit 1
fi
