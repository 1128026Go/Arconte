# ✅ Guía de Verificación - ARCONTE

## Configuración Completada

### 1️⃣ Backend .env (`apps/api_php/.env`)

✅ Configurado:
```env
APP_URL=http://localhost:8000
SESSION_DRIVER=database
SESSION_DOMAIN=localhost
SESSION_SAME_SITE=lax
SESSION_SECURE_COOKIE=false
SANCTUM_STATEFUL_DOMAINS=localhost:3000,127.0.0.1:3000
FRONTEND_URL=http://localhost:3000
QUEUE_CONNECTION=database
```

### 2️⃣ CORS (`apps/api_php/config/cors.php`)

✅ Configurado:
- `supports_credentials` → `true`
- `allowed_origins` → `['http://localhost:3000']`
- `allowed_methods` → `['GET','POST','PUT','PATCH','DELETE','OPTIONS']`
- `allowed_headers` → `['Content-Type','X-Requested-With','X-XSRF-TOKEN']`
- `expose_headers` → `['Set-Cookie']`
- `max_age` → `0`

### 3️⃣ Sanctum (`apps/api_php/config/sanctum.php`)

✅ Configurado:
```php
'stateful' => explode(',', env('SANCTUM_STATEFUL_DOMAINS', 'localhost:3000,127.0.0.1:3000'))
```

### 4️⃣ Frontend .env (`apps/web/.env`)

✅ Configurado:
```env
VITE_API_URL=http://localhost:8000/api
VITE_APP_URL=http://localhost:3000
```

## 🧪 Procedimiento de Verificación

### Paso 0: Backend UP (Verificación de Accesibilidad)

Antes de hacer cualquier cosa, asegúrate de que el backend está corriendo y accesible:

#### 1. Health Check del Backend

Abre una terminal/PowerShell y ejecuta:

```cmd
curl -I http://localhost:8000/api/health
```

✅ **Resultado esperado:**
```
HTTP/1.1 200 OK
Content-Type: application/json
...
```

Si recibes `Connection refused` o `ERR_CONNECTION_REFUSED`:
- El backend **NO está corriendo**
- Ejecuta el script `scripts/dev/start-all.bat` o inicia manualmente:
  ```cmd
  cd apps/api_php
  php artisan serve --host=127.0.0.1 --port=8000
  ```

#### 2. Verificar Cookie XSRF-TOKEN

El endpoint `/sanctum/csrf-cookie` debe devolver la cookie:

```cmd
curl -I http://localhost:8000/sanctum/csrf-cookie
```

✅ **Resultado esperado:**
```
HTTP/1.1 204 No Content
Set-Cookie: XSRF-TOKEN=...; ...
```

Si NO hay `Set-Cookie`:
- Verifica que `SESSION_SECURE_COOKIE=false` en `.env`
- Verifica CORS en `config/cors.php`

#### 3. Verificar Autenticación

Con una sesión válida (después de login):

```cmd
curl -b "arconte_session=YOUR_SESSION_VALUE" http://localhost:8000/api/auth/me
```

✅ **Resultado esperado:**
```json
{
  "user": {
    "id": 4,
    "name": "Admin Demo",
    "email": "admin@arconte.app"
  }
}
```

**Nota:** Si cambias el puerto del backend, actualiza `VITE_API_URL` en `apps/web/.env` y reinicia `npm run dev`:
```env
VITE_API_URL=http://localhost:NUEVO_PUERTO/api
```

---

### Paso 0a: Verificar Jobs en BD

Después de confirmar que el backend está UP, verifica que la tabla `jobs` existe:

```cmd
cd apps/api_php
php artisan migrate:status | findstr jobs
```

✅ **Resultado esperado:** `jobs` debe estar en la lista

Si NO existe:
```cmd
php artisan queue:table
php artisan migrate --force
```

**Verificar driver:**
```cmd
php artisan tinker -q
>>> config('queue.default')
# Resultado esperado: "database"
>>> exit
```

### Paso 1: Iniciar los servicios

#### Opción A: Usar el script automático (RECOMENDADO)

Ejecuta desde el directorio raíz del proyecto:
```cmd
scripts\dev\start-all.bat
```

Este script:
- ✅ Inicia PostgreSQL y Redis (Docker)
- ✅ Inicia Backend Laravel (puerto 8000)
- ✅ **Realiza health check automático** (`/api/health`)
- ✅ Inicia Queue Worker (procesa jobs)
- ✅ Inicia Frontend React (puerto 3000)
- ✅ Muestra credenciales y links de acceso

Si el health check falla, el script se detiene y muestra el error en el log.

---

#### Opción B: Iniciar manualmente (3 ventanas cmd)

Si prefieres o necesitas debugging:

**Ventana 1 - Backend:**
```cmd
cd apps/api_php
php artisan serve --host=127.0.0.1 --port=8000
```
Espera a ver: `Laravel development server started at http://127.0.0.1:8000`

**Ventana 2 - Frontend:**
```cmd
cd apps/web
npm run dev
```
Espera a ver: `VITE v... ready in ... ms`

**Ventana 3 - Queue Worker (CRÍTICO para jobs asíncronos):**
```cmd
cd apps/api_php
php artisan queue:work --tries=3 --timeout=300
```
Espera a ver: `Listening for jobs`

**Nota:** El comando usa `php` (debe estar en PATH). Si usas Herd, asegúrate de que Herd PHP está en PATH.

### Paso 2: Verificar Frontend

Abre en el navegador: **http://localhost:3000**

✅ **Resultado esperado:** Página de login visible

### Paso 3: Login con Credenciales de Prueba

Abre: **http://localhost:3000/login**

Usa cualquiera de estas credenciales:

**Opción A - Admin:**
- Email: `admin@arconte.app`
- Contraseña: `password`

**Opción B - Abogado:**
- Email: `abogado@arconte.app`
- Contraseña: `password`

✅ **Resultado esperado:**
- Login exitoso
- Redirige a dashboard
- URL cambia a http://localhost:3000/dashboard

### Paso 4: Verificar Cookies

1. Abre **DevTools** (F12)
2. Ve a pestaña **"Application"**
3. En el menú izquierdo, selecciona **"Cookies"** → **"http://localhost:3000"**

✅ **Resultado esperado:**

Deberías ver:
- **arconte_session** - Cookie de sesión
- **XSRF-TOKEN** - Token CSRF

### Paso 5: Verificar API Authentication

1. En DevTools, ve a pestaña **"Console"**
2. Copia y ejecuta este código:

```javascript
fetch('http://localhost:8000/api/auth/me', {
  credentials: 'include'
})
.then(r => r.json())
.then(data => console.log(data))
```

✅ **Resultado esperado:**

```json
{
  "user": {
    "id": 4,
    "name": "Admin Demo",
    "email": "admin@arconte.app"
  }
}
```

**Status HTTP:** `200`

## 🔍 Troubleshooting

### Problema: Backend no responde (ERR_CONNECTION_REFUSED)

**Solución:**
1. Verifica que la ventana del backend está abierta
2. Verifica que dice "Laravel development server started..."
3. Mata el proceso: `taskkill /F /IM php.exe`
4. Reinicia el backend

### Problema: Frontend no carga

**Solución:**
1. Verifica que la ventana del frontend está abierta
2. Verifica que dice "VITE v... ready in ... ms"
3. Mata el proceso: `taskkill /F /IM node.exe`
4. Cd a `apps/web` y ejecuta `npm run dev`
5. Espera 10-15 segundos a que compile

### Problema: Cookies no aparecen

**Solución:**
1. Recarga la página (Ctrl+Shift+R)
2. Verifica que `SESSION_SECURE_COOKIE=false` en .env
3. Verifica que `VITE_API_URL=http://localhost:8000/api`
4. Verifica CORS en `config/cors.php`

### Problema: Error 401 en /api/auth/me

**Solución:**
1. Verifica que la cookie `arconte_session` existe
2. Verifica que SANCTUM_STATEFUL_DOMAINS incluye `localhost:3000`
3. Intenta logout y login nuevamente
4. Limpia cookies: DevTools → Application → Cookies → Delete All

## 🔄 Prueba de Jobs Asíncronos (Database Driver)

**IMPORTANTE:** El Queue Worker debe estar corriendo (incluido en `start-all.bat`)

### Paso A: Verificar tabla de jobs

```cmd
cd apps/api_php
php artisan migrate:status | findstr jobs
```

✅ **Resultado esperado:**
- Tabla `jobs` debe estar en la lista
- Status: Migrated

### Paso B: Verificar driver en Tinker

```cmd
cd apps/api_php
php artisan tinker -q
>>> config('queue.default')
# Resultado: "database"
>>> DB::table('jobs')->count()
# Resultado: 0 (sin jobs pendientes)
>>> exit
```

### Paso C: Prueba de extremo a extremo

Si usaste `start-all.bat`, todos los servicios ya están corriendo. Si inicias manualmente:

1. **Abre 3 ventanas cmd:**
   - Ventana 1: `cd apps/api_php && php artisan serve --host=127.0.0.1 --port=8000`
   - Ventana 2: `cd apps/web && npm run dev`
   - Ventana 3: `cd apps/api_php && php artisan queue:work --tries=3 --timeout=300`

2. **Crea un caso desde el frontend:**
   - Abre http://localhost:3000
   - Login con `admin@arconte.app / password`
   - Crea un nuevo caso

3. **Observa en la Ventana 3 (Queue Worker):**
   ```
   Processing: App\Jobs\FetchCaseData
   Processed: App\Jobs\FetchCaseData
   ```
   ✅ El job fue procesado exitosamente

4. **Verifica que la UI no se bloquea:**
   - La página responde inmediatamente
   - El caso aparece con estado "Procesando"
   - En 10-30 segundos cambia a "Completado"

5. **Verifica la BD:**
   ```cmd
   cd apps/api_php
   php artisan tinker -q
   >>> DB::table('jobs')->count()
   # Resultado: 0 (jobs procesados y borrados)
   >>> exit
   ```

### Columns de la tabla `jobs`

Verifica que existan estas columnas:

```sql
- id (INTEGER PRIMARY KEY)
- queue (VARCHAR)
- payload (LONGTEXT)
- attempts (INTEGER)
- reserved_at (TIMESTAMP)
- available_at (TIMESTAMP)
- created_at (TIMESTAMP)
```

### Troubleshooting de Jobs

**Problema: El worker no procesa jobs**

Solución:
1. Verifica que `QUEUE_CONNECTION=database` en .env
2. Verifica que la tabla `jobs` existe: `php artisan migrate:status`
3. Reinicia el worker
4. Revisa logs: `storage/logs/laravel.log`

**Problema: Jobs se quedan en la tabla**

Solución:
1. Verifica que el worker está corriendo (debe mostrar "Listening for jobs")
2. Verifica que no hay errores en la Ventana 3
3. Aumenta el timeout si los jobs toman mucho tiempo

## 🚨 ON_REFUSED — Solución rápida para ERR_CONNECTION_REFUSED

Si ves errores como `ERR_CONNECTION_REFUSED` al acceder a `http://localhost:3000/login`:

### Paso 1: Verificar que backend está corriendo

Abre una terminal y ejecuta:

```cmd
netstat -ano | findstr :8000
```

✅ **Esperado:** Línea con `LISTENING` en `127.0.0.1:8000`

❌ **Si no aparece:** El backend NO está corriendo

**Solución:**
```cmd
cd apps\api_php
php artisan serve --host=127.0.0.1 --port=8000
```

Espera a ver:
```
Laravel development server started: http://127.0.0.1:8000
```

---

### Paso 2: Health check manual

Desde otra terminal, verifica que el backend responde:

```cmd
curl http://localhost:8000/api/health
```

✅ **Esperado:**
```json
{"status":"ok",...}
```

❌ **Si falla (Connection refused):**
- El backend no inició correctamente
- Revisa los errores en la terminal del backend
- Verifica `apps/api_php/storage/logs/laravel.log`

---

### Paso 3: Verificar CSRF Cookie

```cmd
curl -I http://localhost:8000/sanctum/csrf-cookie
```

✅ **Esperado:**
```
HTTP/1.1 204 No Content
Set-Cookie: XSRF-TOKEN=...; ...
```

Si NO hay `Set-Cookie`:
- Verifica que `SESSION_SECURE_COOKIE=false` en `.env`
- Verifica CORS en `config/cors.php`
- Reinicia el backend

---

### Paso 4: Diagnóstico automático

En la raíz del proyecto, ejecuta:

```cmd
test-backend.bat
```

Este script:
1. ✅ Verifica PHP en PATH
2. ✅ Verifica puerto 8000 libre
3. ✅ Verifica PostgreSQL activo
4. ✅ Verifica .env existe
5. ✅ Verifica APP_KEY
6. ✅ Inicia backend automáticamente
7. ✅ Realiza health check

---

### Paso 5: Comprobar configuración

**Archivo:** `apps/api_php/.env`
```
APP_URL=http://127.0.0.1:8000   # O http://localhost:8000
SESSION_DRIVER=database
SESSION_SECURE_COOKIE=false     # CRÍTICO para localhost
SANCTUM_STATEFUL_DOMAINS=localhost:3000,127.0.0.1:3000
```

**Archivo:** `apps/web/.env`
```
VITE_API_URL=http://localhost:8000/api
VITE_APP_URL=http://localhost:3000
```

Si cambias el puerto del backend:
1. Actualiza `APP_URL` en `apps/api_php/.env`
2. Actualiza `VITE_API_URL` en `apps/web/.env`
3. Reinicia ambos servicios:
   ```cmd
   taskkill /F /IM php.exe && taskkill /F /IM node.exe
   npm run dev        # desde apps/web
   php artisan serve  # desde apps/api_php
   ```

---

### Nota sobre manifest.json

El error `404 Failed to load /manifest.json` es NORMAL y no afecta al login. Es un archivo para PWA que no es crítico.

---

## 📊 Checklist de Verificación

- [ ] Backend responde en puerto 8000
- [ ] Frontend carga en puerto 3000
- [ ] Login exitoso con credenciales
- [ ] Cookies `arconte_session` y `XSRF-TOKEN` están presentes
- [ ] GET /api/auth/me devuelve 200 con datos del usuario
- [ ] No hay errores de CORS en DevTools Console
- [ ] Tabla `jobs` existe en BD
- [ ] Driver queue es `database`
- [ ] Queue Worker procesa jobs sin bloquear UI
- [ ] Jobs se procesan en 10-30 segundos

## 🎉 ¡Sistema Listo!

Si todos los pasos anteriores se completaron exitosamente, **ARCONTE está completamente configurado y funcionando**.

---

**Última actualización**: 28 de Octubre de 2025
**Estado**: ✅ Configuración Completada
