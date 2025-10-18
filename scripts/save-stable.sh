#!/bin/bash
# Script para guardar versión estable de archivos críticos
# Uso: ./scripts/save-stable.sh <ruta/al/archivo>

set -e

FILE=$1

if [ -z "$FILE" ]; then
    echo "❌ Uso: ./scripts/save-stable.sh <ruta/al/archivo>"
    echo ""
    echo "Ejemplos:"
    echo "  ./scripts/save-stable.sh apps/api_php/config/sanctum.php"
    echo "  ./scripts/save-stable.sh apps/web/src/lib/axios.js"
    exit 1
fi

if [ ! -f "$FILE" ]; then
    echo "❌ Archivo no encontrado: $FILE"
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

STABLE_DIR=".stable-versions/$TYPE/$(dirname "$REL_PATH")"
STABLE_FILE="$STABLE_DIR/$(basename "$REL_PATH").stable"

# Crear directorio si no existe
mkdir -p "$STABLE_DIR"

# Copiar archivo
cp "$FILE" "$STABLE_FILE"

# Calcular hash SHA256
if command -v sha256sum &> /dev/null; then
    HASH=$(sha256sum "$STABLE_FILE" | awk '{print $1}')
elif command -v shasum &> /dev/null; then
    HASH=$(shasum -a 256 "$STABLE_FILE" | awk '{print $1}')
else
    HASH="N/A"
fi

# Registrar en log
echo "" >> .stable-versions/VERSION_LOG.md
echo "### ✅ $REL_PATH" >> .stable-versions/VERSION_LOG.md
echo "- **Fecha:** $(date +'%Y-%m-%d %H:%M:%S')" >> .stable-versions/VERSION_LOG.md
echo "- **SHA256:** $HASH" >> .stable-versions/VERSION_LOG.md
echo "- **Tipo:** $TYPE" >> .stable-versions/VERSION_LOG.md

echo "✅ Versión estable guardada: $STABLE_FILE"
echo "📝 Registro actualizado en .stable-versions/VERSION_LOG.md"
