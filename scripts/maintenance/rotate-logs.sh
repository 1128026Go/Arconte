#!/bin/bash
# Log Rotation - Laravel logs
# Ejecutar diariamente con cron: 0 3 * * * /path/to/rotate-logs.sh

# ========================================
# Configuración
# ========================================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOG_DIR="$PROJECT_ROOT/apps/api_php/storage/logs"

# Retención de logs (días)
RETENTION_DAYS="${LOG_RETENTION_DAYS:-30}"

# Archivos de log a rotar
LARAVEL_LOG="$LOG_DIR/laravel.log"
ROTATED_PREFIX="laravel"

# ========================================
# Verificar directorio de logs
# ========================================
if [ ! -d "$LOG_DIR" ]; then
    echo "$(date): ❌ Directorio de logs no existe: $LOG_DIR"
    exit 1
fi

# ========================================
# Rotar log de Laravel
# ========================================
echo "$(date): Iniciando rotación de logs..."

if [ -f "$LARAVEL_LOG" ]; then
    # Obtener tamaño del log actual
    LOG_SIZE=$(du -h "$LARAVEL_LOG" | cut -f1)
    LOG_LINES=$(wc -l < "$LARAVEL_LOG")

    echo "$(date): Laravel log actual: $LOG_SIZE ($LOG_LINES líneas)"

    # Solo rotar si el log tiene contenido significativo (>1MB o >10000 líneas)
    if [ $(stat -c%s "$LARAVEL_LOG" 2>/dev/null || stat -f%z "$LARAVEL_LOG") -gt 1048576 ] || [ $LOG_LINES -gt 10000 ]; then
        # Generar nombre con timestamp
        DATE=$(date +%Y%m%d_%H%M%S)
        ROTATED_FILE="$LOG_DIR/${ROTATED_PREFIX}_${DATE}.log"

        # Copiar log actual a archivo rotado
        cp "$LARAVEL_LOG" "$ROTATED_FILE"

        # Comprimir log rotado
        gzip "$ROTATED_FILE"

        # Truncar log actual (no borrar, para mantener permisos)
        > "$LARAVEL_LOG"

        echo "$(date): ✅ Log rotado: ${ROTATED_PREFIX}_${DATE}.log.gz"
    else
        echo "$(date): Log pequeño, no se rota ($(LOG_SIZE))"
    fi
else
    echo "$(date): No existe $LARAVEL_LOG"
fi

# ========================================
# Limpiar logs antiguos
# ========================================
echo "$(date): Limpiando logs antiguos (>${RETENTION_DAYS} días)..."

# Borrar logs rotados antiguos (comprimidos y sin comprimir)
find "$LOG_DIR" -name "${ROTATED_PREFIX}_*.log.gz" -type f -mtime +$RETENTION_DAYS -delete
find "$LOG_DIR" -name "${ROTATED_PREFIX}_*.log" -type f -mtime +$RETENTION_DAYS -delete

REMAINING_LOGS=$(find "$LOG_DIR" -name "${ROTATED_PREFIX}_*.log*" -type f | wc -l)
echo "$(date): Logs rotados restantes: $REMAINING_LOGS"

# ========================================
# Rotar logs de Ingest Service (Python)
# ========================================
INGEST_LOG_DIR="$PROJECT_ROOT/apps/ingest_py/logs"

if [ -d "$INGEST_LOG_DIR" ]; then
    echo "$(date): Rotando logs de Ingest Service..."

    for LOG_FILE in "$INGEST_LOG_DIR"/*.log; do
        if [ -f "$LOG_FILE" ]; then
            LOG_NAME=$(basename "$LOG_FILE" .log)
            LOG_SIZE=$(stat -c%s "$LOG_FILE" 2>/dev/null || stat -f%z "$LOG_FILE")

            if [ $LOG_SIZE -gt 1048576 ]; then
                DATE=$(date +%Y%m%d_%H%M%S)
                ROTATED_FILE="$INGEST_LOG_DIR/${LOG_NAME}_${DATE}.log"

                mv "$LOG_FILE" "$ROTATED_FILE"
                gzip "$ROTATED_FILE"

                # Crear nuevo log vacío
                touch "$LOG_FILE"

                echo "$(date): ✅ Ingest log rotado: ${LOG_NAME}_${DATE}.log.gz"
            fi
        fi
    done

    # Limpiar logs antiguos de Ingest
    find "$INGEST_LOG_DIR" -name "*.log.gz" -type f -mtime +$RETENTION_DAYS -delete
fi

# ========================================
# Resumen
# ========================================
TOTAL_LOG_SIZE=$(du -sh "$LOG_DIR" 2>/dev/null | cut -f1)
echo "$(date): Tamaño total de logs: $TOTAL_LOG_SIZE"
echo "$(date): Rotación de logs completada"

exit 0
