# 🔐 Configuración Congelada - Autenticación Sanctum

**Última actualización:** 2025-10-16
**Estado:** ✅ DOCUMENTO MAESTRO - CONFIGURACIÓN VALIDADA

## ✅ Cambios Aplicados (NO MODIFICAR)

### 1. Middleware ForceLocalhost

**Archivo:** `apps/api_php/app/Http/Middleware/ForceLocalhost.php`

Redirige automáticamente `127.0.0.1` → `localhost` para evitar problemas de cookies en diferentes dominios.

Registrado globalmente en `bootstrap/app.php` (líneas 15-22).

### 2. Redirección Frontend

**Archivo:** `apps/web/index.html` (líneas 15-20)

Script que redirige en el navegador si detecta `127.0.0.1` → `localhost`.

### 3. Logout Mejorado (FIX CRÍTICO CSRF)

**Archivo:** `apps/api_php/app/Http/Controllers/AuthController.php` (líneas 82-121)

- Invalida sesión en backend
- Envía cookies de eliminación con valores negativos
- Incluye dominio explícito (`localhost`)
- Borra tanto `XSRF-TOKEN` como `arconte-session`

**Archivo:** `apps/web/src/pages/Logout.jsx` ⚠️ **FIX CRÍTICO**

- **Obtiene CSRF token FRESCO antes de logout** (previene error 419)
- Llama a `/sanctum/csrf-cookie` primero
- Decodifica `XSRF-TOKEN` con `decodeURIComponent()`
- Envía token en header `X-XSRF-TOKEN`
- Limpia cookies defensivamente después
- Usa `window.location.replace('/login')` para hard reload

**Flujo correcto:**
1. GET `/sanctum/csrf-cookie` → Obtener token
2. POST `/auth/logout` con header `X-XSRF-TOKEN` → Invalidar sesión (200, NO 419)
3. Limpiar cookies del navegador
4. Hard reload a `/login`

### 4. Login Mejorado

**Archivo:** `apps/web/src/pages/Login.jsx` (línea 26)

- Usa `window.location.replace('/dashboard')` en vez de `navigate()`
- Force hard reload para limpiar estado en memoria

### 5. Configuración de Session

**Archivo:** `apps/api_php/config/session.php` (línea 132)

```php
'cookie' => 'arconte-session',
```

Nombre de cookie fijo (no dinámico).

**Archivo:** `apps/api_php/.env` (líneas 24, 18)

```bash
SESSION_DOMAIN=localhost
SANCTUM_STATEFUL_DOMAINS=localhost:3000
```

⚠️ **IMPORTANTE:**
- Solo usar `localhost`, nunca `127.0.0.1`
- `SANCTUM_STATEFUL_DOMAINS` debe ser SOLO `localhost:3000` (sin otros dominios)
- Si incluyes múltiples dominios, las cookies pueden no funcionar correctamente

### 6. Headers No-Cache

**Archivo:** `apps/api_php/app/Http/Controllers/AuthController.php` (líneas 77-79)

```php
->header('Cache-Control', 'no-store, no-cache, must-revalidate')
->header('Pragma', 'no-cache')
->header('Expires', '0');
```

**Archivo:** `apps/web/src/lib/apiSecure.js` (líneas 132-137)

```javascript
cache: 'no-store',
headers: {
  'Cache-Control': 'no-store, no-cache, must-revalidate',
  'Pragma': 'no-cache',
}
```

## 🚀 Iniciar Sistema (SIEMPRE)

```bash
# Backend
cd apps/api_php
php artisan config:clear
php artisan cache:clear
php artisan serve --host=localhost --port=3000

# Frontend
cd apps/web
npm run dev
```

⚠️ **NUNCA** usar `--host=127.0.0.1` o `--host=0.0.0.0`.

## ✅ Validación del Flujo

### Flujo Correcto

1. Abrir http://localhost:3000 (NO 127.0.0.1)
2. Ver `/login`
3. Ingresar credenciales
4. Redirigir a `/dashboard` con hard reload
5. Click en "Cerrar sesión"
6. Redirigir a `/login` con hard reload
7. Refresh en `/login` → permanece en `/login`

### Cookies Después del Login

Abrir DevTools → Application → Cookies → http://localhost:3000

Debería ver:
- `arconte-session` (dominio: `localhost`)
- `XSRF-TOKEN` (dominio: `localhost`)

### Cookies Después del Logout

**Ambas cookies deben desaparecer.**

Si permanecen, hay un problema.

## 🔧 Diagnóstico Rápido

### Verificar en DevTools (CRÍTICO)

Abre DevTools (F12) → Network → Preservar log

1. Ir a `/logout`
2. Buscar peticiones:
   - `GET /sanctum/csrf-cookie` → Debe ser **204 No Content**
   - `POST /api/auth/logout` → Debe ser **200 OK** (NO 419)
   - Si ves **419 CSRF token mismatch**, el token no se está enviando correctamente

3. Inspeccionar headers de `POST /api/auth/logout`:
   - Request Headers debe incluir: `X-XSRF-TOKEN: [token]`
   - Si NO está presente, el problema es en `Logout.jsx`

4. Después del logout:
   - `GET /api/auth/me` → Debe ser **401 Unauthenticated**
   - Si es 200, la sesión NO se invalidó

### Test con curl (desde localhost)

```bash
curl -c cookies.txt http://localhost:3000/sanctum/csrf-cookie
curl -b cookies.txt -c cookies.txt -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@juridica.test","password":"admin123"}'

# Verificar autenticación
curl -b cookies.txt http://localhost:3000/api/auth/me

# Logout
curl -b cookies.txt -X POST http://localhost:3000/api/auth/logout

# Verificar que ya NO está autenticado (debe ser 401)
curl -b cookies.txt http://localhost:3000/api/auth/me
```

Resultado esperado del último comando: `{"message":"Unauthenticated."}`

### Verificar Cookies en Terminal

```bash
cat cookies.txt | grep -E "(arconte-session|XSRF-TOKEN)"
```

Después del logout, **no debe mostrar nada**.

## ⚠️ Problemas Conocidos y Soluciones

### Problema 1: Sigo viendo el dashboard después de logout

**Causa:** Cookies no se están limpiando correctamente.

**Solución:**
1. Abrir DevTools (F12)
2. Application → Storage → Clear site data
3. Refresh (F5)

### Problema 2: Login da 419 (CSRF Token Mismatch)

**Causa:** Cookie `XSRF-TOKEN` no se está enviando.

**Solución:**
1. Verificar que estás usando `http://localhost:3000` (NO `127.0.0.1`)
2. Limpiar cookies del navegador
3. Reiniciar servidor

### Problema 3: /auth/me devuelve 401 intermitente después de login

**Causa:** Session no persiste correctamente o hay mezcla de `localhost` y `127.0.0.1`.

**Solución:**
1. Verificar que `SESSION_DRIVER=database` en `.env`
2. Verificar que `SESSION_DOMAIN=localhost` (NO `127.0.0.1`)
3. Ejecutar: `php artisan migrate` (asegurar que tabla `sessions` existe)
4. Verificar que `SANCTUM_STATEFUL_DOMAINS=localhost:3000` (sin otros dominios)
5. Asegurar que `$request->session()->regenerate()` se ejecuta tras login
6. Limpiar cache: `php artisan config:clear && php artisan cache:clear`

### Problema 4: Cookies duplicadas (arconte-session, XSRF-TOKEN, remember_web_*)

**Causa:** Uso mixto de `localhost` y `127.0.0.1` crea cookies en diferentes dominios.

**Solución:**
1. Abrir DevTools → Application → Cookies
2. **Eliminar TODAS las cookies** de `localhost` y `127.0.0.1`
3. Cerrar navegador completamente
4. Verificar en `.env` backend:
   ```env
   SESSION_DOMAIN=localhost
   SANCTUM_STATEFUL_DOMAINS=localhost:3000
   ```
5. Verificar en frontend que SIEMPRE se usa `http://localhost:3000` (no 127.0.0.1)
6. Reiniciar backend con: `php artisan serve --host=localhost --port=8000`

### Problema 5: Logout solo ejecuta OPTIONS, no POST

**Causa:** CORS rechaza la petición real, solo pasa el preflight.

**Solución:**
1. Verificar `config/cors.php`:
   ```php
   'supports_credentials' => true, // DEBE SER true
   'allowed_origins' => ['http://localhost:3000'],
   ```
2. Verificar que frontend envía `withCredentials: true`:
   ```javascript
   axios.create({ withCredentials: true });
   ```
3. Verificar que se obtiene CSRF cookie ANTES de logout:
   ```javascript
   await axios.get('/sanctum/csrf-cookie');
   await axios.post('/api/auth/logout');
   ```
4. Inspeccionar en DevTools → Network → Headers del POST:
   - Debe tener header `X-XSRF-TOKEN`
   - Response debe ser 200 OK (no 419)

### Problema 6: Error "Unexpected token '﻿' is not valid JSON"

**Causa:** Archivos PHP tienen BOM (Byte Order Mark) que corrompe respuestas JSON.

**Solución:**
```bash
cd apps/api_php

# Encontrar archivos con BOM
find . -type f -name "*.php" -exec grep -l $'^\xEF\xBB\xBF' {} \;

# Eliminar BOM de todos los archivos PHP
find . -type f -name "*.php" -exec sed -i '1s/^\xEF\xBB\xBF//' {} \;

# Verificar que ya no hay BOM
find . -type f -name "*.php" -exec file {} \; | grep -i "with BOM"
# Output esperado: (vacío)
```

**Prevención en VS Code:**
```json
// .vscode/settings.json
{
  "files.encoding": "utf8",
  "files.autoGuessEncoding": false,
  "[php]": {
    "files.encoding": "utf8"
  }
}
```

### Problema 7: Puerto 8000 ocupado o bloqueado

**Causa:** Proceso zombie de Laravel o firewall bloqueando el puerto.

**Solución Windows (PowerShell):**
```powershell
# Ver qué proceso usa el puerto 8000
Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue

# Matar el proceso
$pid = (Get-NetTCPConnection -LocalPort 8000).OwningProcess
Stop-Process -Id $pid -Force

# Verificar que el puerto está libre
Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue
# Output esperado: error o vacío
```

**Solución Linux/Mac:**
```bash
# Ver qué proceso usa el puerto 8000
lsof -i :8000

# Matar el proceso
kill -9 $(lsof -t -i:8000)

# Verificar que el puerto está libre
lsof -i :8000
# Output esperado: vacío
```

**Script de inicio seguro (Windows):**
Crear `apps/api_php/start-safe.bat`:
```batch
@echo off
cd /d "%~dp0"

echo Verificando puerto 8000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000') do (
    echo Matando proceso %%a en puerto 8000
    taskkill /F /PID %%a 2>nul
)

timeout /t 2 /nobreak >nul

echo Limpiando cache Laravel...
php artisan config:clear
php artisan cache:clear

echo Iniciando servidor Laravel en localhost:8000...
php artisan serve --host=localhost --port=8000
```

### Problema 8: Header CSRF no se envía correctamente

**Causa:** Token XSRF no se extrae de cookies o no se decodifica.

**Solución en Axios (frontend):**
```javascript
// apps/web/src/lib/axios.js
import axios from 'axios';

const client = axios.create({
  baseURL: 'http://localhost:8000',
  withCredentials: true,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
});

// Interceptor para incluir CSRF token
client.interceptors.request.use((config) => {
  const token = document.cookie
    .split('; ')
    .find(row => row.startsWith('XSRF-TOKEN='))
    ?.split('=')[1];

  if (token) {
    // IMPORTANTE: Decodificar el token
    config.headers['X-XSRF-TOKEN'] = decodeURIComponent(token);
  }

  return config;
});

export default client;
```

**Verificar en DevTools:**
1. Network → Select request → Headers
2. Request Headers debe mostrar: `X-XSRF-TOKEN: (valor del token)`
3. Si no aparece, el interceptor no está funcionando

## 📚 Documentación Relacionada

- `docs/RUNBOOK_LOGIN_REDIRECT.md` - Troubleshooting detallado
- `docs/CHECKLIST_OPERATIVO.md` - Verificación diaria
- `docs/SETUP_TESTING_AUTOMATION.md` - E2E tests
- `ARCONTE_DOCUMENTACION_MAESTRA.md` - Arquitectura y configuración completa

## 🔒 ARCHIVOS CRÍTICOS - NO MODIFICAR Sin Sistema de Versionado

Los siguientes archivos son críticos para el funcionamiento del login/logout. **Cualquier modificación debe seguir el proceso de versionado documentado en `.stable-versions/README.md`**:

### Backend (Laravel)
- `apps/api_php/app/Http/Middleware/ForceLocalhost.php`
- `apps/api_php/bootstrap/app.php` (middleware registration)
- `apps/api_php/app/Http/Controllers/AuthController.php`
- `apps/api_php/config/session.php`
- `apps/api_php/config/sanctum.php`
- `apps/api_php/config/cors.php`
- `apps/api_php/.env` (SESSION_*, SANCTUM_*)

### Frontend (React)
- `apps/web/src/pages/Logout.jsx`
- `apps/web/src/pages/Login.jsx`
- `apps/web/src/lib/axios.js` (o apiSecure.js)
- `apps/web/index.html` (script de redirección)
- `apps/web/.env.local` (VITE_API_URL)

### Proceso Antes de Modificar:
1. Guardar versión estable actual: `./scripts/save-stable.sh <archivo>`
2. Hacer cambios y probar exhaustivamente
3. Si funciona: Guardar nueva versión estable
4. Si falla: Restaurar versión estable con `./scripts/restore-stable.sh <archivo>`
5. Actualizar `VERSION_LOG.md` con motivo del cambio

---

**Última actualización:** 2025-10-16
**Estado:** ✅ Congelado y Versionado
**Validado:** Flujo login → dashboard → logout → login funciona correctamente
**Sistema de Versionado:** Activo (ver `.stable-versions/`)
