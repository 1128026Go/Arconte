# 🧹 Guía de Limpieza de Repositorio Git

Si quieres limpiar completamente el historial de Git y empezar fresco (eliminar commits antiguos con archivos innecesarios), sigue estos pasos.

## ⚠️ ADVERTENCIA

**Esto borrará TODO el historial de Git.** Solo hazlo si:
- No tienes colaboradores activos
- No has compartido el repositorio con nadie
- Quieres empezar desde cero

## Opción 1: Empezar Fresco (Recomendado)

### Pasos:

**1. Hacer backup de tu código actual:**

```bash
# Desde la raíz del proyecto
cd ..
cp -r "Aplicacion Juridica" "Aplicacion Juridica_BACKUP"
cd "Aplicacion Juridica"
```

**2. Eliminar Git completamente:**

```bash
# Windows (PowerShell o CMD)
rd /s /q .git

# Linux/Mac
rm -rf .git
```

**3. Inicializar nuevo repositorio:**

```bash
git init
git add .
git commit -m "Initial commit - Arconte v1.0 limpio"
```

**4. Conectar a GitHub (nuevo o existente):**

**Si quieres un repositorio NUEVO:**

```bash
# Crear repo en GitHub primero (sin README, sin .gitignore)
git remote add origin https://github.com/tu-usuario/arconte.git
git branch -M main
git push -u origin main --force
```

**Si quieres REEMPLAZAR el repositorio existente:**

```bash
# ⚠️ Esto borra TODO el historial remoto
git remote add origin https://github.com/tu-usuario/arconte.git
git branch -M main
git push -u origin main --force
```

## Opción 2: Mantener Repositorio pero Limpiar Historial

Si ya tienes colaboradores o no quieres cambiar la URL del repo:

**1. Crear rama huérfana (sin historial):**

```bash
git checkout --orphan nueva_rama_limpia
```

**2. Agregar todos los archivos:**

```bash
git add .
git commit -m "Initial commit - Repositorio limpio"
```

**3. Eliminar rama main antigua:**

```bash
git branch -D main
```

**4. Renombrar nueva rama a main:**

```bash
git branch -m main
```

**5. Forzar push (sobrescribe historial remoto):**

```bash
git push -f origin main
```

## Verificar Limpieza

**Comprobar que el historial es nuevo:**

```bash
git log --oneline
# Debería mostrar solo 1 commit
```

**Ver tamaño del repositorio:**

```bash
git count-objects -vH
# Debería ser mucho más pequeño
```

## Archivos que se Mantienen

Después de la limpieza, tendrás:

```
✅ README.md (actualizado)
✅ GUIA_MAESTRA.md (guía completa)
✅ ANALISIS_PROFUNDO_PROYECTO.md (análisis técnico)
✅ apps/ (todo el código)
✅ docs/archive/ (guías antiguas archivadas)
✅ .gitignore (actualizado)
✅ scripts/ (scripts de automatización)
```

## Archivos que se Eliminaron

```
❌ 16+ archivos MD antiguos (movidos a docs/archive/)
❌ Historial de commits anterior
❌ Archivos temporales (.txt, .bat innecesarios)
```

## ¿Necesitas Hacer Esto?

**NO necesitas limpiar Git si:**
- El repositorio funciona bien
- No hay problemas de tamaño
- No te molestan los commits antiguos

**SÍ deberías limpiar Git si:**
- Quieres un historial limpio para mostrar
- Hay archivos sensibles en commits antiguos
- El repo es muy grande (>500 MB)
- Estás empezando fresh después de desarrollo experimental

## Después de la Limpieza

**Informar a colaboradores (si los hay):**

```bash
# Ellos deben hacer:
git fetch origin
git reset --hard origin/main
```

**Confirmar que todo funciona:**

```bash
# Tests
cd apps/api_php && php artisan test

# Levantar servicios
php artisan serve  # Backend
cd ../web && npm run dev  # Frontend
cd ../ingest_py && python run_persistent.py  # Python
```

---

**¡Listo!** Tu repositorio ahora está limpio y profesional.
