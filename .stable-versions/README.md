# 🔐 Sistema de Versionado de Archivos Estables

## Propósito

Este sistema evita que configuraciones funcionales se pierdan cuando alguien modifica archivos críticos. Cada vez que un archivo funciona correctamente, se guarda aquí una copia "estable" que puede restaurarse en cualquier momento.

## Archivos Críticos a Versionar

### Backend (Laravel)
- `config/sanctum.php` - Configuración de autenticación
- `config/cors.php` - Configuración CORS
- `config/session.php` - Configuración de sesiones
- `app/Http/Controllers/AuthController.php` - Controlador de autenticación
- `app/Http/Middleware/*` - Middleware personalizado
- `.env` - Variables de entorno (SESSION_*, SANCTUM_*)

### Frontend (React)
- `src/lib/axios.js` - Cliente HTTP configurado
- `src/pages/Login.jsx` - Componente de login
- `src/pages/Logout.jsx` - Componente de logout
- `.env.local` - Variables de entorno

## Comandos Disponibles

### 1. Guardar Versión Estable

Cuando un archivo funciona correctamente:

```bash
./scripts/save-stable.sh apps/api_php/config/sanctum.php
```

Esto:
- Copia el archivo a `.stable-versions/backend/config/sanctum.php.stable`
- Calcula hash SHA256 del archivo
- Registra el cambio en `VERSION_LOG.md` con fecha y hora

### 2. Restaurar Versión Estable

Cuando algo se rompe y necesitas volver a lo que funcionaba:

```bash
./scripts/restore-stable.sh apps/api_php/config/sanctum.php
```

Esto:
- Crea backup del archivo actual (`.backup-YYYYMMDD-HHMMSS`)
- Restaura el archivo desde la versión estable
- Muestra ruta del backup por si lo necesitas

### 3. Comparar con Versión Estable

Para ver qué cambió desde la última versión funcional:

```bash
./scripts/compare-versions.sh apps/api_php/config/sanctum.php
```

Esto:
- Muestra diff entre archivo actual y versión estable
- Indica si son idénticos o diferentes
- Sugiere siguiente acción (guardar o restaurar)

## Workflow Recomendado

### Antes de Modificar un Archivo Crítico

1. Verificar que tienes versión estable:
   ```bash
   ./scripts/compare-versions.sh <archivo>
   ```

2. Si no existe versión estable, guardar la actual:
   ```bash
   ./scripts/save-stable.sh <archivo>
   ```

3. Hacer tus cambios

4. Probar exhaustivamente (tests E2E, manual, etc.)

5. Si funciona:
   ```bash
   ./scripts/save-stable.sh <archivo>
   # Agregar nota en VERSION_LOG.md explicando el cambio
   ```

6. Si falla:
   ```bash
   ./scripts/restore-stable.sh <archivo>
   ```

### Después de Detectar un Bug

1. Restaurar TODOS los archivos críticos:
   ```bash
   ./scripts/restore-stable.sh apps/api_php/config/sanctum.php
   ./scripts/restore-stable.sh apps/api_php/config/cors.php
   ./scripts/restore-stable.sh apps/api_php/app/Http/Controllers/AuthController.php
   ./scripts/restore-stable.sh apps/web/src/lib/axios.js
   ```

2. Limpiar cachés:
   ```bash
   cd apps/api_php
   php artisan config:clear
   php artisan cache:clear
   ```

3. Reiniciar servidores

4. Probar que funciona

5. Investigar qué cambió para causar el bug:
   ```bash
   git log --oneline apps/api_php/config/sanctum.php
   git diff HEAD~5 apps/api_php/config/sanctum.php
   ```

## Integración con Git

Los archivos `.stable` NO se commitean a Git (están en `.gitignore`). Esto es intencional:
- Git rastrea cambios del código fuente
- `.stable-versions/` rastrea configuraciones que FUNCIONAN
- Son sistemas complementarios, no redundantes

Sin embargo, `VERSION_LOG.md` SÍ se commitea para mantener historial de cuándo se validó cada configuración.

## Prevención de Pérdidas

### Hook Pre-Commit (Opcional)

Para alertar cuando modificas archivos críticos sin actualizar versión estable:

```bash
# .husky/pre-commit
#!/bin/bash

CRITICAL_FILES=(
  "apps/api_php/config/sanctum.php"
  "apps/api_php/config/cors.php"
  "apps/api_php/app/Http/Controllers/AuthController.php"
  "apps/web/src/lib/axios.js"
)

MODIFIED_CRITICAL=()

for file in "${CRITICAL_FILES[@]}"; do
  if git diff --cached --name-only | grep -q "^$file$"; then
    MODIFIED_CRITICAL+=("$file")
  fi
done

if [ ${#MODIFIED_CRITICAL[@]} -gt 0 ]; then
  echo "⚠️  ADVERTENCIA: Archivos críticos modificados:"
  for file in "${MODIFIED_CRITICAL[@]}"; do
    echo "   - $file"
  done
  echo ""
  echo "¿Ya guardaste versión estable? (s/N)"
  read -r response
  if [[ ! "$response" =~ ^[Ss]$ ]]; then
    echo "❌ Commit cancelado. Guarda versión estable primero:"
    for file in "${MODIFIED_CRITICAL[@]}"; do
      echo "   ./scripts/save-stable.sh $file"
    done
    exit 1
  fi
fi
```

## Estructura de Directorios

```
.stable-versions/
├── README.md              # Este archivo
├── VERSION_LOG.md         # Historial de cambios
├── backend/               # Versiones estables de backend
│   ├── config/
│   │   ├── sanctum.php.stable
│   │   ├── cors.php.stable
│   │   └── session.php.stable
│   └── app/
│       └── Http/
│           ├── Controllers/
│           │   └── AuthController.php.stable
│           └── Middleware/
│               └── ForceLocalhost.php.stable
└── frontend/              # Versiones estables de frontend
    ├── src/
    │   ├── lib/
    │   │   └── axios.js.stable
    │   └── pages/
    │       ├── Login.jsx.stable
    │       └── Logout.jsx.stable
    └── .env.local.stable
```

## FAQ

**P: ¿Cuándo debo guardar una versión estable?**
R: Cuando hayas probado exhaustivamente y confirmes que el sistema funciona correctamente (login, logout, /api/auth/me, tests E2E pasan).

**P: ¿Puedo versionar cualquier archivo?**
R: Sí, pero el sistema está diseñado para archivos en `apps/api_php` y `apps/web`. Para otros archivos, usa Git.

**P: ¿Qué pasa si restauro y sigue sin funcionar?**
R: Verifica que también restauraste TODOS los archivos críticos relacionados. A veces un problema requiere restaurar varios archivos (sanctum.php + cors.php + AuthController.php).

**P: ¿Cómo sé qué archivos tengo versionados?**
R: Revisa `.stable-versions/VERSION_LOG.md` o explora las carpetas `backend/` y `frontend/`.

**P: ¿Los scripts funcionan en Windows?**
R: Los `.sh` requieren Git Bash o WSL. Para Windows nativo, consulta la sección siguiente.

## Scripts para Windows (PowerShell)

Si necesitas scripts nativos de PowerShell, créalos basados en la misma lógica:

```powershell
# scripts/save-stable.ps1
param([string]$File)

if (-not $File) {
    Write-Host "❌ Uso: .\scripts\save-stable.ps1 <ruta/al/archivo>"
    exit 1
}

# ... (implementar lógica similar)
```

---

**Última actualización:** 2025-10-16
**Mantenedor:** Equipo Arconte
