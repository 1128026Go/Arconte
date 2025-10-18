#!/bin/bash
# Script para comparar archivo actual con versión estable
# Uso: ./scripts/compare-versions.sh <ruta/al/archivo>

FILE=$1

if [ -z "$FILE" ]; then
    echo "❌ Uso: ./scripts/compare-versions.sh <ruta/al/archivo>"
    echo ""
    echo "Ejemplos:"
    echo "  ./scripts/compare-versions.sh apps/api_php/config/sanctum.php"
    echo "  ./scripts/compare-versions.sh apps/web/src/lib/axios.js"
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

STABLE_FILE=".stable-versions/$TYPE/$REL_PATH.stable"

if [ ! -f "$STABLE_FILE" ]; then
    echo "❌ No hay versión estable para: $FILE"
    exit 1
fi

echo "🔍 Comparando: $FILE vs versión estable"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

diff -u "$STABLE_FILE" "$FILE" || true

if diff -q "$STABLE_FILE" "$FILE" > /dev/null; then
    echo ""
    echo "✅ Archivos idénticos - No hay cambios"
else
    echo ""
    echo "⚠️  Archivos diferentes - Hay cambios sin guardar"
    echo ""
    echo "Opciones:"
    echo "  - Guardar cambios como nueva versión estable: ./scripts/save-stable.sh $FILE"
    echo "  - Restaurar versión estable: ./scripts/restore-stable.sh $FILE"
fi
