# ✅ Checklist Operativo Diario - Arconte

**Última actualización:** 2025-10-16

## 🎯 Objetivo

Verificar diariamente que todos los servicios y funcionalidades críticas están operando correctamente, especialmente el flujo de autenticación Laravel Sanctum que es propenso a regresiones.

---

## ⚡ Quick Check (5 minutos)

Ejecutar el script automatizado:

```bash
# Linux/Mac
./scripts/daily-check.sh

# Windows
.\scripts\daily-check.ps1
```

Si **todos los checks pasan** ✅, el sistema está OK.

Si **algún check falla** ❌, seguir la sección correspondiente más abajo.

---

## 📋 Checklist Manual (si el script no está disponible)

### 1. Servicios Base

#### PostgreSQL
```bash
# Verificar que el contenedor está corriendo
docker ps | grep arconte

# Debe mostrar: arconte_postgres ... Up X minutes
```

**Si falla:**
```bash
docker start arconte_postgres
```

#### Laravel API (puerto 3000)
```bash
curl -s http://127.0.0.1:3000/api/health/external
```

**Esperado:**
```json
{"ok":false,"rama_ok":false,"queue_ok":true,"queue_size":0,"db_ok":true}
```

**Si falla:**
```bash
cd apps/api_php
php artisan serve
```

#### Ingest Python (puerto 8001)
```bash
curl -s http://127.0.0.1:8001/healthz
```

**Esperado:**
```json
{"ok":true,"service":"ingest_py","status":"healthy"}
```

**Si falla:**
```bash
cd apps/ingest_py
python run_persistent.py
```

#### Queue Worker
```bash
# Linux/Mac
ps aux | grep "queue:work"

# Windows
Get-Process php | Where-Object { $_.CommandLine -like "*queue:work*" }
```

**Si no hay proceso:**
```bash
cd apps/api_php
php artisan queue:work --tries=3 --timeout=120
```

#### Frontend (puerto 3000)
```bash
curl -s http://localhost:3000
```

**Si falla:**
```bash
cd apps/web
npm run dev
```

---

### 2. Autenticación (Crítico)

#### CSRF Cookie
```bash
curl -I http://127.0.0.1:8000/sanctum/csrf-cookie
```

**Esperado:** `HTTP/1.1 204 No Content`

#### /auth/me Headers (No-Cache)
```bash
curl -I http://127.0.0.1:8000/api/auth/me
```

**Esperado en headers:**
```
Cache-Control: no-store, no-cache, must-revalidate
Pragma: no-cache
```

**Si faltan headers:**
- Revisar `apps/api_php/app/Http/Controllers/AuthController.php:77-79`
- Ejecutar: `php artisan config:clear`

#### /auth/me sin sesión
```bash
curl -s http://127.0.0.1:8000/api/auth/me
```

**Esperado:** `HTTP/1.1 401` o `{"message":"Unauthenticated."}`

---

### 3. Frontend - Login/Logout

#### Test Manual en Navegador

1. **Abrir** http://localhost:3000/login
   - ✅ Debe permanecer en `/login` (NO redirigir a `/dashboard`)
   - ✅ Debe mostrar formulario de login

2. **Login** con credenciales: `admin@juridica.test` / `admin123`
   - ✅ Debe redirigir a `/dashboard`
   - ✅ Debe mostrar nombre del usuario

3. **Logout** (visitar `/logout` o hacer click en botón)
   - ✅ Debe hacer **recarga completa** de la página
   - ✅ Debe terminar en `/login`
   - ✅ DevTools > Network debe mostrar "document" load (no solo XHR)

4. **Refresh** en `/login`
   - ✅ Debe permanecer en `/login`
   - ✅ NO debe redirigir a `/dashboard`

**Si alguno falla**, consultar `docs/RUNBOOK_LOGIN_REDIRECT.md`

---

### 4. Configuración Crítica (.env)

```bash
cd apps/api_php
cat .env | grep -E "SESSION|SANCTUM"
```

**Esperado:**
```
SESSION_DRIVER=database
SESSION_DOMAIN=localhost
SESSION_SAME_SITE=lax
SESSION_SECURE_COOKIE=false
SANCTUM_STATEFUL_DOMAINS=localhost:3000,127.0.0.1:3000
```

**Si hay diferencias:**
1. Corregir el `.env`
2. Ejecutar:
   ```bash
   php artisan config:clear
   php artisan cache:clear
   ```
3. Reiniciar Laravel: `php artisan serve`

---

## 🧪 Tests Automáticos (Gate de Calidad)

### Ejecutar antes de cada deploy:

```bash
cd apps/web

# Instalar dependencias (primera vez)
npm ci
npx playwright install

# Ejecutar tests E2E de autenticación
npm run test:e2e:auth
```

**Resultado esperado:**
```
✓ 8 passed (Xms)
```

**Si fallan:**
1. Ver detalles: `npm run test:e2e:auth -- --reporter=html`
2. Debuggear: `npm run test:e2e:debug`
3. NO hacer deploy hasta que pasen

---

## 🔄 Automatización con Git Hooks

### Setup (una sola vez):

```bash
# Instalar Husky si no está
npm install -D husky
npx husky install

# El hook pre-push ya está configurado en .husky/pre-push
chmod +x .husky/pre-push
```

### Uso:

```bash
git push
# Automáticamente ejecuta tests E2E antes de push
# Si fallan, el push se cancela
```

**Para saltar el hook** (solo emergencias):
```bash
git push --no-verify
```

---

## 🚨 Runbook Rápido - Problemas de Autenticación

### Problema 1: Login/Logout no persiste o 401 intermitente

**Síntomas:** Sesión se pierde, `/api/auth/me` da 401 de manera intermitente.

**Fix rápido:**
1. Verificar uso de `localhost` (NO `127.0.0.1`):
   ```bash
   # Backend
   cd apps/api_php
   grep "SESSION_DOMAIN\|SANCTUM_STATEFUL" .env
   # Debe mostrar: SESSION_DOMAIN=localhost, SANCTUM_STATEFUL_DOMAINS=localhost:3000

   # Si están mal, corregir y reiniciar:
   php artisan config:clear && php artisan cache:clear
   php artisan serve --host=localhost --port=8000
   ```

2. Eliminar cookies duplicadas:
   - DevTools → Application → Cookies
   - Eliminar TODAS las cookies de `localhost` Y `127.0.0.1`
   - Cerrar navegador y volver a abrir

3. Verificar regeneración de sesión:
   ```bash
   cd apps/api_php
   grep "session()->regenerate()" app/Http/Controllers/AuthController.php
   # Debe aparecer en el método login
   ```

### Problema 2: Cookies duplicadas

**Síntomas:** Aparecen múltiples cookies con diferentes dominios.

**Fix rápido:**
1. Limpiar todas las cookies del navegador (DevTools → Application → Storage → Clear site data)
2. Verificar configuración unificada:
   ```bash
   # Backend debe usar SOLO localhost
   SESSION_DOMAIN=localhost
   SANCTUM_STATEFUL_DOMAINS=localhost:3000  # SIN 127.0.0.1

   # Frontend debe usar SOLO localhost
   VITE_API_URL=http://localhost:8000  # NO 127.0.0.1
   ```
3. Reiniciar ambos servidores

### Problema 3: Logout solo ejecuta OPTIONS

**Síntomas:** OPTIONS pasa pero POST no se ejecuta.

**Fix rápido:**
1. Verificar CORS:
   ```bash
   cd apps/api_php
   grep "supports_credentials" config/cors.php
   # Debe ser: 'supports_credentials' => true,
   ```

2. Verificar que se obtiene CSRF antes de logout:
   ```javascript
   // apps/web/src/pages/Logout.jsx
   // Debe tener:
   await axios.get('/sanctum/csrf-cookie');
   await axios.post('/api/auth/logout');
   ```

3. Inspeccionar request en DevTools → Network:
   - POST debe tener header `X-XSRF-TOKEN`
   - Response debe ser 200 OK (NO 419)

### Problema 4: Error "Unexpected token '﻿'" (BOM)

**Fix rápido:**
```bash
cd apps/api_php
# Eliminar BOM de todos los archivos PHP
find . -type f -name "*.php" -exec sed -i '1s/^\xEF\xBB\xBF//' {} \;
```

### Problema 5: Puerto 8000 ocupado

**Fix rápido (Windows PowerShell):**
```powershell
$pid = (Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue).OwningProcess
if ($pid) { Stop-Process -Id $pid -Force }
```

**O usar script automático:**
```bash
cd apps/api_php
./start-safe.bat  # Windows
./start-safe.sh   # Linux/Mac
```

### Problema 6: Header CSRF no se envía

**Fix rápido:**
1. Verificar interceptor de Axios incluye `decodeURIComponent()`:
   ```javascript
   // apps/web/src/lib/axios.js
   const token = decodeURIComponent(
     document.cookie
       .split('; ')
       .find(row => row.startsWith('XSRF-TOKEN='))
       ?.split('=')[1] || ''
   );
   config.headers['X-XSRF-TOKEN'] = token;
   ```

2. Verificar en DevTools → Network → Request Headers

### Restaurar Configuración Funcional

Si todo falla, restaurar desde versiones estables:
```bash
cd "Aplicacion Juridica"
./scripts/restore-stable.sh apps/api_php/config/sanctum.php
./scripts/restore-stable.sh apps/api_php/config/cors.php
./scripts/restore-stable.sh apps/api_php/app/Http/Controllers/AuthController.php
./scripts/restore-stable.sh apps/web/src/lib/axios.js

# Limpiar y reiniciar
cd apps/api_php
php artisan config:clear && php artisan cache:clear
php artisan serve --host=localhost --port=8000
```

### Consultar Documentación Completa
```bash
cat docs/CONFIG_CONGELADA.md  # Soluciones detalladas de 8 problemas
cat docs/RUNBOOK_LOGIN_REDIRECT.md  # Troubleshooting específico de login
```

---

## 📊 Monitoreo (Opcional pero Recomendado)

### Logs a revisar:

```bash
# Laravel logs
tail -f apps/api_php/storage/logs/laravel.log | grep "401\|auth"

# Ingest logs
# Ver output del proceso corriendo en puerto 8001

# Queue logs
# Ver output del queue:work
```

### Métricas importantes:

1. **Tasa de 401 en `/auth/me`** después de logout → Debe ser 100%
2. **Redirects prematuros** a `/dashboard` cuando `!isAuthenticated` → Debe ser 0%
3. **Failed jobs** en la cola → Debe mantenerse bajo
4. **Tiempo de respuesta** de `/auth/me` → <100ms

---

## ✅ Criterios de Éxito

Al final del checklist diario, debes poder confirmar:

- [ ] Todos los servicios corriendo (DB, API, Ingest, Queue, Frontend)
- [ ] `/auth/me` retorna headers no-cache
- [ ] Login/Logout funciona correctamente en el navegador
- [ ] Tests E2E de autenticación pasan
- [ ] No hay failed jobs en la cola
- [ ] Logs no muestran errores críticos

---

## 📞 Escalamiento

Si después de seguir este checklist hay problemas:

1. Ejecutar script de diagnóstico completo:
   ```bash
   ./scripts/daily-check.sh --with-e2e
   ```

2. Capturar evidencia:
   - HAR file de Network tab
   - Screenshot/video del flujo
   - Logs de Laravel y Queue

3. Consultar:
   - `docs/RUNBOOK_LOGIN_REDIRECT.md` (bug de autenticación)
   - `docs/ARCONTE_INFORME_COMPLETO.md` (arquitectura general)

4. Crear issue en GitHub con toda la evidencia

---

**Última actualización:** 2025-10-11
**Frecuencia:** Diaria (antes de empezar a trabajar)
**Duración:** 5-10 minutos
**Responsable:** Equipo de desarrollo
