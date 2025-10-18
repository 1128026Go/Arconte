#!/bin/bash
# Script para restaurar archivo desde versión estable
# Uso: ./scripts/restore-stable.sh <ruta/al/archivo>

set -e

FILE=$1

if [ -z "$FILE" ]; then
    echo "❌ Uso: ./scripts/restore-stable.sh <ruta/al/archivo>"
    echo ""
    echo "Ejemplos:"
    echo "  ./scripts/restore-stable.sh apps/api_php/config/sanctum.php"
    echo "  ./scripts/restore-stable.sh apps/web/src/lib/axios.js"
    exit 1
fi

# Determinar si es backend o frontend
if [[ "$FILE" == *"apps/api_php"* ]]; then
    TYPE="backend"
    REL_PATH="${FILE#*apps/api_php/}"
elif [[ "$FILE" == *"apps/web"* ]]; then
    TYPE="frontend"
    REL_PATH="${FILE#*apps/web/}"
else
    echo "❌ Archivo debe estar en apps/api_php o apps/web"
    exit 1
fi

STABLE_FILE=".stable-versions/$TYPE/$REL_PATH.stable"

if [ ! -f "$STABLE_FILE" ]; then
    echo "❌ No hay versión estable para: $FILE"
    echo "   Busca en: $STABLE_FILE"
    exit 1
fi

# Backup del archivo actual
if [ -f "$FILE" ]; then
    BACKUP_FILE="$FILE.backup-$(date +'%Y%m%d-%H%M%S')"
    cp "$FILE" "$BACKUP_FILE"
    echo "📦 Backup guardado en: $BACKUP_FILE"
fi

# Restaurar desde estable
cp "$STABLE_FILE" "$FILE"

echo "✅ Restaurado: $FILE"
echo "🔄 Archivo restaurado desde versión estable"
