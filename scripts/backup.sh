#!/bin/bash

# Arconte Backup Script
# Realiza backup automático de PostgreSQL + Documentos

set -e

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/backups"
RETENTION_DAYS=90

echo "[$(date)] Starting backup..."

# 1. Backup PostgreSQL
pg_dump -h postgres -U ${POSTGRES_USER} ${POSTGRES_DB} > "${BACKUP_DIR}/postgres_${TIMESTAMP}.sql"
gzip "${BACKUP_DIR}/postgres_${TIMESTAMP}.sql"

echo "[$(date)] PostgreSQL backup completed: postgres_${TIMESTAMP}.sql.gz"

# 2. Backup Storage (documentos)
if [ -d "/var/www/html/storage" ]; then
    tar -czf "${BACKUP_DIR}/storage_${TIMESTAMP}.tar.gz" -C /var/www/html storage/
    echo "[$(date)] Storage backup completed: storage_${TIMESTAMP}.tar.gz"
fi

# 3. Limpiar backups antiguos (retención 90 días)
find ${BACKUP_DIR} -name "postgres_*.sql.gz" -mtime +${RETENTION_DAYS} -delete
find ${BACKUP_DIR} -name "storage_*.tar.gz" -mtime +${RETENTION_DAYS} -delete

echo "[$(date)] Old backups cleaned (>${RETENTION_DAYS} days)"

# 4. Upload a S3 (opcional)
if [ ! -z "${AWS_S3_BUCKET}" ]; then
    aws s3 cp "${BACKUP_DIR}/postgres_${TIMESTAMP}.sql.gz" \
        "s3://${AWS_S3_BUCKET}/backups/postgres_${TIMESTAMP}.sql.gz"

    aws s3 cp "${BACKUP_DIR}/storage_${TIMESTAMP}.tar.gz" \
        "s3://${AWS_S3_BUCKET}/backups/storage_${TIMESTAMP}.tar.gz"

    echo "[$(date)] Backups uploaded to S3"
fi

# 5. Verificar integridad
if gzip -t "${BACKUP_DIR}/postgres_${TIMESTAMP}.sql.gz"; then
    echo "[$(date)] Backup integrity verified ✓"
else
    echo "[$(date)] ERROR: Backup corrupted!" >&2
    exit 1
fi

echo "[$(date)] Backup completed successfully!"

# Notificar por email (opcional)
if [ ! -z "${NOTIFICATION_EMAIL}" ]; then
    echo "Backup completed at $(date)" | \
        mail -s "Arconte Backup Success" ${NOTIFICATION_EMAIL}
fi
