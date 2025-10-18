#!/bin/bash
# Health Monitor - Ejecutar cada 5 minutos con cron
# Verifica servicios críticos y envía alertas si algo falla

# ========================================
# Configuración
# ========================================
API_URL="http://127.0.0.1:8000"
INGEST_URL="http://127.0.0.1:8001"
SLACK_WEBHOOK="${SLACK_WEBHOOK_URL}"  # Desde .env
ALERT_EMAIL="${ALERT_EMAIL:-admin@arconte.com}"  # Desde .env o default

# Archivos de estado para evitar spam de alertas
STATE_DIR="/tmp/arconte-health"
mkdir -p "$STATE_DIR"

API_STATE="$STATE_DIR/api_down"
INGEST_STATE="$STATE_DIR/ingest_down"
BREAKER_STATE="$STATE_DIR/breaker_open"

# ========================================
# Funciones de alerta
# ========================================
send_slack_alert() {
    local message="$1"
    if [ -n "$SLACK_WEBHOOK" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"🚨 *Arconte Alert*: $message\"}" \
            "$SLACK_WEBHOOK" 2>/dev/null
    fi
}

send_email_alert() {
    local subject="$1"
    local body="$2"
    if command -v mail &> /dev/null; then
        echo "$body" | mail -s "$subject" "$ALERT_EMAIL"
    fi
}

# ========================================
# Check 1: Laravel API
# ========================================
check_api() {
    local response=$(curl -s -w "\n%{http_code}" "$API_URL/api/health/external" 2>/dev/null)
    local http_code=$(echo "$response" | tail -n1)
    local body=$(echo "$response" | sed '$d')

    if [ "$http_code" != "200" ] && [ "$http_code" != "503" ]; then
        # API está caída
        if [ ! -f "$API_STATE" ]; then
            # Primera vez que falla, enviar alerta
            send_slack_alert "Laravel API no responde (HTTP $http_code)"
            send_email_alert "Arconte: Laravel API Down" "Laravel API no responde.\nHTTP Code: $http_code\nURL: $API_URL"
            touch "$API_STATE"
            echo "$(date): API DOWN" >> "$STATE_DIR/health.log"
        fi
        return 1
    else
        # API está OK, borrar estado de fallo si existía
        if [ -f "$API_STATE" ]; then
            send_slack_alert "✅ Laravel API recuperada"
            rm "$API_STATE"
            echo "$(date): API UP" >> "$STATE_DIR/health.log"
        fi

        # Verificar health internos
        local db_ok=$(echo "$body" | grep -o '"db_ok":[^,}]*' | grep -o '[^:]*$')
        local queue_ok=$(echo "$body" | grep -o '"queue_ok":[^,}]*' | grep -o '[^:]*$')

        if [ "$db_ok" = "false" ]; then
            send_slack_alert "⚠️ PostgreSQL no responde correctamente"
        fi

        if [ "$queue_ok" = "false" ]; then
            send_slack_alert "⚠️ Queue no está operativa"
        fi

        return 0
    fi
}

# ========================================
# Check 2: Ingest Service
# ========================================
check_ingest() {
    local response=$(curl -s -w "\n%{http_code}" "$INGEST_URL/healthz" 2>/dev/null)
    local http_code=$(echo "$response" | tail -n1)

    if [ "$http_code" != "200" ]; then
        if [ ! -f "$INGEST_STATE" ]; then
            send_slack_alert "Ingest Service no responde (HTTP $http_code)"
            send_email_alert "Arconte: Ingest Down" "Ingest Service no responde.\nHTTP Code: $http_code\nURL: $INGEST_URL"
            touch "$INGEST_STATE"
            echo "$(date): INGEST DOWN" >> "$STATE_DIR/health.log"
        fi
        return 1
    else
        if [ -f "$INGEST_STATE" ]; then
            send_slack_alert "✅ Ingest Service recuperado"
            rm "$INGEST_STATE"
            echo "$(date): INGEST UP" >> "$STATE_DIR/health.log"
        fi
        return 0
    fi
}

# ========================================
# Check 3: Circuit Breaker Status
# ========================================
check_circuit_breaker() {
    local metrics=$(curl -s "$INGEST_URL/metrics" 2>/dev/null)
    local breaker_open=$(echo "$metrics" | grep -o '"breaker_open":[^,}]*' | grep -o '[^:]*$')

    if [ "$breaker_open" = "true" ]; then
        # Breaker está abierto
        if [ ! -f "$BREAKER_STATE" ]; then
            # Primera vez, verificar si lleva >15 min
            # (idealmente checkear timestamp, por simplicidad alertar siempre)
            send_slack_alert "⚠️ Circuit Breaker ABIERTO - Rama Judicial no disponible"
            touch "$BREAKER_STATE"
            echo "$(date): BREAKER OPEN" >> "$STATE_DIR/health.log"
        fi
    else
        # Breaker cerrado (OK)
        if [ -f "$BREAKER_STATE" ]; then
            send_slack_alert "✅ Circuit Breaker cerrado - Rama Judicial recuperada"
            rm "$BREAKER_STATE"
            echo "$(date): BREAKER CLOSED" >> "$STATE_DIR/health.log"
        fi
    fi
}

# ========================================
# Check 4: Failed Jobs
# ========================================
check_failed_jobs() {
    cd /path/to/apps/api_php || return

    local failed_count=$(php artisan queue:failed --json 2>/dev/null | grep -o '"id"' | wc -l)

    if [ "$failed_count" -gt 10 ]; then
        send_slack_alert "⚠️ Hay $failed_count jobs fallidos en la cola"
    fi
}

# ========================================
# Main
# ========================================
echo "$(date): Health check iniciado" >> "$STATE_DIR/health.log"

check_api
API_STATUS=$?

check_ingest
INGEST_STATUS=$?

check_circuit_breaker

# check_failed_jobs  # Descomentar si se desea

# Summary
if [ $API_STATUS -eq 0 ] && [ $INGEST_STATUS -eq 0 ]; then
    echo "$(date): ✅ All systems OK" >> "$STATE_DIR/health.log"
    exit 0
else
    echo "$(date): ❌ Some systems DOWN" >> "$STATE_DIR/health.log"
    exit 1
fi
