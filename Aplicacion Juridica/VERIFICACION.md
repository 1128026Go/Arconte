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

### Paso 0: Verificar Jobs en BD

Antes de iniciar, verifica que la tabla `jobs` existe:

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

Abre **3 ventanas cmd** y ejecuta:

**Ventana 1 - Backend:**
```cmd
cd apps/api_php
php artisan serve --host=0.0.0.0 --port=8000
```

**Ventana 2 - Frontend:**
```cmd
cd apps/web
npm run dev
```

**Ventana 3 - Queue Worker (CRÍTICO para jobs asíncronos):**
```cmd
cd apps/api_php
php artisan queue:work --tries=3 --timeout=300
```

**Nota:** El comando usa `php` (debe estar en PATH). Si usas Herd, asegúrate de que Herd PHP está en PATH o reemplaza `php` con `%USERPROFILE%\.config\herd\bin\php`

### Paso 2: Verificar Backend

Abre en el navegador: **http://localhost:8000/api/health**

✅ **Resultado esperado:**
```json
{"status":"ok"}
```

### Paso 3: Verificar Frontend

Abre en el navegador: **http://localhost:3000**

✅ **Resultado esperado:** Página de login visible

### Paso 4: Login con Credenciales de Prueba

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

### Paso 5: Verificar Cookies

1. Abre **DevTools** (F12)
2. Ve a pestaña **"Application"**
3. En el menú izquierdo, selecciona **"Cookies"** → **"http://localhost:3000"**

✅ **Resultado esperado:**

Deberías ver:
- **arconte_session** - Cookie de sesión
- **XSRF-TOKEN** - Token CSRF

### Paso 6: Verificar API Authentication

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

**IMPORTANTE:** El Queue Worker debe estar corriendo en la Ventana 3

### Paso 1: Verificar tabla de jobs

```cmd
cd apps/api_php
php artisan migrate:status | findstr jobs
```

✅ **Resultado esperado:**
- Tabla `jobs` debe estar en la lista
- Status: Migrated

### Paso 2: Verificar driver en Tinker

```cmd
cd apps/api_php
php artisan tinker -q
>>> config('queue.default')
# Resultado: "database"
>>> DB::table('jobs')->count()
# Resultado: 0 (sin jobs pendientes)
>>> exit
```

### Paso 3: Prueba de extremo a extremo

1. **Inicia los servicios** (3 ventanas cmd):
   - Ventana 1: `cd apps/api_php && php artisan serve --host=0.0.0.0 --port=8000`
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
