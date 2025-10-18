#!/bin/bash
# Database Backup - PostgreSQL
# Ejecutar diariamente con cron: 0 2 * * * /path/to/backup-database.sh

# ========================================
# Configuración
# ========================================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Leer configuración desde .env
if [ -f "$PROJECT_ROOT/apps/api_php/.env" ]; then
    export $(grep -v '^#' "$PROJECT_ROOT/apps/api_php/.env" | xargs)
fi

# Variables de backup
BACKUP_DIR="${BACKUP_PATH:-$PROJECT_ROOT/backups}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="arconte_backup_$DATE.sql.gz"

# Credenciales de PostgreSQL
DB_HOST="${DB_HOST:-127.0.0.1}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_DATABASE:-arconte}"
DB_USER="${DB_USERNAME:-arconte}"
DB_PASSWORD="${DB_PASSWORD}"

# ========================================
# Crear directorio de backups
# ========================================
mkdir -p "$BACKUP_DIR"

# ========================================
# Realizar backup
# ========================================
echo "$(date): Iniciando backup de base de datos..."

# Exportar password para pg_dump
export PGPASSWORD="$DB_PASSWORD"

# Ejecutar pg_dump con compresión
pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
    --format=plain \
    --no-owner \
    --no-acl \
    | gzip > "$BACKUP_DIR/$BACKUP_FILE"

DUMP_EXIT_CODE=$?

# Limpiar password del ambiente
unset PGPASSWORD

# ========================================
# Verificar resultado
# ========================================
if [ $DUMP_EXIT_CODE -eq 0 ] && [ -f "$BACKUP_DIR/$BACKUP_FILE" ]; then
    BACKUP_SIZE=$(du -h "$BACKUP_DIR/$BACKUP_FILE" | cut -f1)
    echo "$(date): ✅ Backup completado: $BACKUP_FILE ($BACKUP_SIZE)"

    # Log para monitoreo
    echo "$(date): Backup exitoso - $BACKUP_FILE ($BACKUP_SIZE)" >> "$BACKUP_DIR/backup.log"
else
    echo "$(date): ❌ Error en backup"
    echo "$(date): Error en backup" >> "$BACKUP_DIR/backup.log"
    exit 1
fi

# ========================================
# Limpiar backups antiguos
# ========================================
echo "$(date): Limpiando backups antiguos (>${RETENTION_DAYS} días)..."

find "$BACKUP_DIR" -name "arconte_backup_*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete

REMAINING_BACKUPS=$(find "$BACKUP_DIR" -name "arconte_backup_*.sql.gz" -type f | wc -l)
echo "$(date): Backups restantes: $REMAINING_BACKUPS"

# ========================================
# Notificación opcional
# ========================================
if [ -n "$SLACK_WEBHOOK_URL" ]; then
    # Enviar notificación a Slack solo si hay error
    if [ $DUMP_EXIT_CODE -ne 0 ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"❌ *Arconte Backup Failed*: $BACKUP_FILE\"}" \
            "$SLACK_WEBHOOK_URL" 2>/dev/null
    fi
fi

echo "$(date): Backup process completado"
exit 0
