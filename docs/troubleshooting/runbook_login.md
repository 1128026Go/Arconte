# Runbook: "Login redirige solo al Dashboard"

## 🐛 Síntoma

El usuario hace logout pero al volver a `/login`, la aplicación lo redirige automáticamente a `/dashboard`, como si todavía estuviera autenticado.

## 🔍 Causa Raíz

Este bug puede ocurrir por una o más de estas causas:

1. **Estado en memoria de React**: `isAuthenticated` queda en `true` aunque la sesión del backend expiró
2. **localStorage contaminado**: Código legacy que guarda tokens en localStorage
3. **Cookies persistentes**: Las cookies de sesión no se borran correctamente en logout
4. **Cache del navegador**: El endpoint `/api/auth/me` se cachea y devuelve respuestas viejas
5. **Guards prematuros**: Los guards de ruta (`PublicRoute`, `ProtectedRoute`) redirigen antes de que termine `isLoading`

## ✅ Solución Implementada

### 1. **Source of Truth = Backend**

El hook `useAuthCheck` NO usa `localStorage`. La única fuente de verdad es el endpoint `/api/auth/me`:

```javascript
// apps/web/src/hooks/useAuth.js
export function useAuthCheck() {
  // ✅ Llama a auth.check() que internamente hace fetch a /api/auth/me
  // ✅ Escucha visibilitychange para re-verificar al volver a la pestaña
  // ✅ Headers no-cache para evitar respuestas cacheadas
}
```

### 2. **Headers No-Cache**

**Frontend** (`apps/web/src/lib/apiSecure.js:129-141`):
```javascript
me: async () => {
  const response = await fetch(`${BASE}/auth/me`, {
    cache: 'no-store',
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Pragma': 'no-cache',
    },
  });
  return parseJson(response, 'me_failed');
},
```

**Backend** (`apps/api_php/app/Http/Controllers/AuthController.php:66-80`):
```php
public function me(Request $request) {
    return response()->json([...])
        ->header('Cache-Control', 'no-store, no-cache, must-revalidate')
        ->header('Pragma', 'no-cache')
        ->header('Expires', '0');
}
```

### 3. **Logout con Recarga Dura**

El componente `Logout.jsx` usa `window.location.replace('/login')` en lugar de `navigate()`:

```javascript
// apps/web/src/pages/Logout.jsx
finally {
  // ⚠️ window.location.replace fuerza recarga completa
  // Limpia TODO el estado en memoria de React
  window.location.replace('/login');
}
```

**Por qué**: `navigate()` mantiene el estado de React en memoria. `window.location.replace()` recarga la página completamente, limpiando event listeners, estado, caché de React Query, etc.

### 4. **Guards Esperan `isLoading`**

Los guards (`PublicRoute`, `ProtectedRoute`) NO redirigen hasta que `isLoading === false`:

```javascript
// apps/web/src/App.jsx
function PublicRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuthCheck();

  // ✅ Espera a que termine isLoading antes de decidir
  if (isLoading) return <PageLoader />;

  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
}
```

### 5. **Evento `visibilitychange`**

El hook re-verifica autenticación cuando el usuario vuelve a la pestaña:

```javascript
// apps/web/src/hooks/useAuth.js
const handleVisibilityChange = () => {
  if (document.visibilityState === 'visible') {
    checkAuth();
  }
};
document.addEventListener('visibilitychange', handleVisibilityChange);
```

## 🛠️ Diagnóstico Paso a Paso

Si el bug reaparece, sigue estos pasos:

### Paso 1: Verificar que no hay localStorage

```javascript
// En la consola del navegador
localStorage.clear();
sessionStorage.clear();
location.reload();
```

Si esto lo arregla, hay código que usa localStorage. Buscar en el codebase:
```bash
grep -r "localStorage" apps/web/src
```

### Paso 2: Verificar cookies

```bash
# En DevTools > Application > Cookies
# Deben existir: laravel_session, XSRF-TOKEN
# Al hacer logout, ambas deben desaparecer
```

Si persisten después de logout, revisar `Logout.jsx:19-25`.

### Paso 3: Verificar headers no-cache

```bash
# En DevTools > Network > /api/auth/me
# Headers de respuesta deben incluir:
Cache-Control: no-store, no-cache, must-revalidate
Pragma: no-cache
Expires: 0
```

Si no están, revisar `AuthController.php:77-79`.

### Paso 4: Verificar `isLoading`

```javascript
// En React DevTools > Components > buscar PublicRoute
// Debe mostrar: isLoading: false, isAuthenticated: false
```

Si `isLoading` nunca se vuelve `false`, revisar `useAuthCheck` y la llamada a `auth.check()`.

### Paso 5: Verificar CORS y Sanctum

```bash
# .env del backend
APP_URL=http://127.0.0.1:8000
APP_FRONTEND_URL=http://localhost:3000
SANCTUM_STATEFUL_DOMAINS=localhost:3000,127.0.0.1:3000
SESSION_DRIVER=database
SESSION_DOMAIN=localhost
SESSION_SAME_SITE=lax
SESSION_SECURE_COOKIE=false
```

```bash
# Limpiar config cacheada
cd apps/api_php
php artisan config:clear
php artisan cache:clear
```

### Paso 6: Forzar recarga dura manualmente

Si el problema persiste después de logout:

1. Abrir DevTools > Network
2. Hacer logout
3. Verificar que aparece petición a `/api/auth/logout` con status 200
4. Verificar que hay petición a `/login` (page load completo, no AJAX)
5. Si solo ves XHR a `/login` sin page load, `window.location.replace` no funciona

## 📋 Checklist de Prevención

Antes de mergear cambios que toquen autenticación:

- [ ] `useAuthCheck` NO usa localStorage
- [ ] `/api/auth/me` tiene headers no-cache en frontend Y backend
- [ ] `Logout.jsx` usa `window.location.replace`, NO `navigate`
- [ ] Guards esperan `isLoading === false` antes de redirigir
- [ ] Evento `visibilitychange` registrado en `useAuthCheck`
- [ ] `.env` tiene `SANCTUM_STATEFUL_DOMAINS` correcto
- [ ] Correr test E2E de autenticación (ver `apps/web/e2e/auth.spec.ts`)

## 🧪 Test E2E

Para prevenir regresiones, ejecutar:

```bash
cd apps/web
npm run test:e2e -- auth.spec.ts
```

El test debe pasar estos casos:

1. ✅ `/login` sin sesión → NO redirige a `/dashboard`
2. ✅ Login exitoso → redirige a `/dashboard`
3. ✅ Visitar `/logout` → termina en `/login`
4. ✅ Refresh en `/login` después de logout → permanece en `/login`

## 📞 Escalamiento

Si después de seguir este runbook el problema persiste:

1. Capturar video del flujo completo (login → logout → login)
2. Exportar cookies y localStorage desde DevTools
3. Capturar HAR file de Network tab
4. Crear issue en GitHub con toda la información

## 🔗 Referencias

- Código: `apps/web/src/hooks/useAuth.js:85-153`
- Código: `apps/web/src/pages/Logout.jsx:4-45`
- Código: `apps/api_php/app/Http/Controllers/AuthController.php:66-91`
- Config: `apps/api_php/.env` (líneas SESSION_* y SANCTUM_*)
- Test: `apps/web/e2e/auth.spec.ts`

---

**Última actualización**: 2025-10-11
**Autor**: Claude Code
**Commits relacionados**:
- `feat(auth): make /auth/me non-cacheable and guards wait for isLoading`
- `fix(logout): invalidate session, clear cookies, hard reload`
