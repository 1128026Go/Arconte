# 🔧 Solución: Error CORS en /api/cases

## 📊 Diagnóstico del Problema

### ❌ Error Reportado
```
Access to fetch at 'http://localhost:8000/api/cases' from origin 'http://localhost:3000'
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present
```

### ✅ Problema REAL

**El error NO es de CORS, es de AUTENTICACIÓN**

El servidor Laravel **SÍ está enviando** los headers CORS correctos:
```
Access-Control-Allow-Origin: http://localhost:3000 ✓
Access-Control-Allow-Credentials: true ✓
```

El verdadero problema:
1. **HTTP 401 Unauthorized** - Usuario NO autenticado
2. El endpoint `/api/cases` requiere autenticación con Sanctum
3. El navegador muestra error "CORS" pero es por la falta de login

### 🔍 Verificación Técnica

```bash
# El preflight CORS funciona correctamente:
curl -X OPTIONS http://localhost:8000/api/cases \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: GET"

# Respuesta: 204 No Content con headers CORS ✓

# El problema es autenticación:
curl http://localhost:8000/api/cases \
  -H "Origin: http://localhost:3000"

# Respuesta: 401 {"message":"Unauthenticated."} ✗
```

---

## ✅ Soluciones

### Solución 1: **LOGIN CORRECTO** (Recomendada)

El sistema YA está bien implementado. Solo necesitas:

1. **Ir a la página de login**: `http://localhost:3000/login`

2. **Iniciar sesión** con tus credenciales

3. **Sanctum guardará la cookie automáticamente**

4. **Todas las peticiones funcionarán**

El flujo correcto es:
```
Usuario → /login → Login exitoso → Cookie guardada → /cases ✓
```

### Solución 2: **Verificar que el servidor esté corriendo**

```bash
# En terminal 1: Servidor Laravel
cd apps/api_php
php artisan serve --port=8000

# En terminal 2: Frontend React
cd apps/web
npm run dev
```

### Solución 3: **Limpiar cookies si hay conflicto**

Si ya iniciaste sesión pero sigue fallando:

1. Abre DevTools (F12)
2. Application → Cookies
3. Elimina cookies de `localhost:8000`
4. Refresca y vuelve a hacer login

---

## 📁 Estructura de Archivos del Frontend

### ✅ Archivos Correctos (NO eliminar)

```
apps/web/src/
├── lib/
│   ├── apiSecure.js        ← ✅ API CLIENT PRINCIPAL (bien implementado)
│   ├── api.js              ← ✅ Re-exporta apiSecure (OK)
│   ├── date.js             ← ✅ Utilidades de fecha
│   ├── caseMap.js          ← ✅ Normalización de datos
│   └── logger.js           ← ✅ Logs
│
├── hooks/
│   └── useAuth.js          ← ✅ Hook de autenticación (bien implementado)
│
├── components/
│   ├── ProtectedRoute.jsx  ← ✅ Protección de rutas
│   └── ...
│
└── pages/
    ├── Login.jsx           ← ✅ Página de login
    ├── Cases.jsx           ← ✅ Usa API correctamente
    └── ...
```

### ✅ NO hay archivos redundantes

El sistema está **muy bien organizado**:
- `apiSecure.js` - Cliente API único con todas las funciones
- `api.js` - Wrapper para compatibilidad (3 líneas, OK mantener)
- Todos los componentes usan el mismo cliente

---

## 🎯 Mejores Prácticas Implementadas

### ✅ 1. Autenticación por Cookies (Sanctum)

```javascript
// apps/web/src/lib/apiSecure.js

const fetchConfig = {
  credentials: 'include', // ✓ Incluye cookies automáticamente
  headers: {
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  }
};
```

**Ventajas**:
- ✓ Más seguro que tokens en localStorage
- ✓ Protección CSRF automática
- ✓ HttpOnly cookies (no accesibles por JavaScript)

### ✅ 2. Manejo de CSRF Tokens

```javascript
const getCsrfToken = () => {
  const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
};

// Agregado automáticamente a cada request
headers['X-XSRF-TOKEN'] = getCsrfToken();
```

### ✅ 3. Manejo de Errores 401

```javascript
if (response.status === 401) {
  // Dispara evento que el hook escucha
  window.dispatchEvent(new CustomEvent('auth:unauthorized'));
  throw new Error('unauthorized');
}
```

```javascript
// Hook escucha y redirige automáticamente
const handleAuthUnauthorized = () => {
  setUser(null);
  setIsAuthenticated(false);
  window.location.href = '/login'; // ✓ Redirige a login
};
```

### ✅ 4. Rutas Protegidas

```javascript
// App.jsx
<Route path="/cases" element={
  <ProtectedRoute>
    <Cases />
  </ProtectedRoute>
} />
```

```javascript
// ProtectedRoute.jsx
if (!isAuthenticated) {
  return <Navigate to="/login" replace />; // ✓ Redirige si no autenticado
}
```

### ✅ 5. Cliente API Centralizado

```javascript
// Todas las entidades usan el mismo patrón
export const cases = {
  getAll: async (params) => apiRequest(`/cases${buildQuery(params)}`),
  getById: async (id) => apiRequest(`/cases/${id}`),
  create: async (data) => apiRequest('/cases', { method: 'POST', ... }),
  // ...
};

export const documents = { ... };
export const reminders = { ... };
export const billing = { ... };
// etc.
```

---

## 🚀 Flujo Completo de Autenticación

```
┌─────────────────────────────────────────────────┐
│ 1. Usuario visita http://localhost:3000/cases  │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│ 2. ProtectedRoute verifica autenticación       │
│    - useAuth hook llama auth.me()              │
└──────────────────┬──────────────────────────────┘
                   │
         ┌─────────┴─────────┐
         │                   │
         ▼                   ▼
┌────────────────┐  ┌────────────────────┐
│ NO autenticado │  │ SÍ autenticado     │
└────────┬───────┘  └────────┬───────────┘
         │                   │
         ▼                   ▼
┌────────────────┐  ┌────────────────────┐
│ Redirige a     │  │ Renderiza página   │
│ /login         │  │ Cases.jsx          │
└────────┬───────┘  └────────┬───────────┘
         │                   │
         ▼                   ▼
┌────────────────┐  ┌────────────────────┐
│ Login exitoso  │  │ cases.getAll()     │
│ Cookie guardada│  │ con credentials    │
└────────┬───────┘  └────────┬───────────┘
         │                   │
         └────────┬──────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│ Todas las peticiones incluyen cookie Sanctum   │
│ Backend valida y retorna datos                 │
└─────────────────────────────────────────────────┘
```

---

## 🔧 Configuración del Backend (Laravel)

### ✅ CORS Configurado Correctamente

```php
// apps/api_php/config/cors.php
return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['*'],
    'allowed_origins' => [
        'http://localhost:3000',  // ✓ Frontend permitido
        'http://127.0.0.1:3000',
    ],
    'allowed_headers' => ['*'],
    'supports_credentials' => true,  // ✓ Cookies permitidas
];
```

### ✅ Middleware Configurado

```php
// apps/api_php/bootstrap/app.php
->withMiddleware(function (Middleware $middleware): void {
    $middleware->statefulApi();  // ✓ Sanctum stateful

    $middleware->api(prepend: [
        \Illuminate\Http\Middleware\HandleCors::class,  // ✓ CORS primero
    ]);
})
```

### ✅ Rutas Protegidas

```php
// apps/api_php/routes/api.php
Route::middleware(['auth:sanctum', 'throttle:60,1'])->group(function () {
    Route::get('/cases', [CaseController::class, 'index']);  // ✓ Requiere auth
    // ...
});
```

---

## 🧪 Testing

### Test 1: Verificar CORS

```bash
curl -X OPTIONS http://localhost:8000/api/cases \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: GET" \
  -v

# Debe retornar:
# Access-Control-Allow-Origin: http://localhost:3000 ✓
# Access-Control-Allow-Credentials: true ✓
```

### Test 2: Verificar Login

```javascript
// En consola del navegador (F12)
import { auth } from './lib/api.js';

// Login
const result = await auth.login('tu@email.com', 'password');
console.log('Login exitoso:', result);

// Verificar sesión
const me = await auth.me();
console.log('Usuario actual:', me);
```

### Test 3: Verificar Peticiones

```javascript
// En consola del navegador después de login
import { cases } from './lib/api.js';

const lista = await cases.getAll();
console.log('Cases:', lista);
// Debe funcionar sin errores ✓
```

---

## 📝 Checklist de Solución

- [ ] Servidor Laravel corriendo en puerto 8000
- [ ] Frontend React corriendo en puerto 3000
- [ ] Ir a http://localhost:3000/login
- [ ] Iniciar sesión con credenciales válidas
- [ ] Verificar que aparece cookie en DevTools
- [ ] Navegar a /cases
- [ ] ✓ Debe cargar sin errores

---

## 🆘 Troubleshooting

### Problema: "Unauthenticated" después de login

**Solución**: Verificar que `.env` tenga:
```env
SESSION_DRIVER=cookie
SESSION_DOMAIN=localhost
SANCTUM_STATEFUL_DOMAINS=localhost:3000,127.0.0.1:3000
```

### Problema: Cookie no se guarda

**Causas posibles**:
1. Navegador bloqueando cookies de terceros
2. SESSION_DOMAIN incorrecto
3. SameSite=None sin HTTPS (cambiar a SameSite=Lax)

**Solución**:
```php
// config/session.php
'same_site' => 'lax',  // En desarrollo
```

### Problema: Error persiste después de login

**Solución**:
1. Limpiar cookies completamente
2. Reiniciar servidor Laravel
3. Reiniciar frontend
4. Probar en navegador privado/incógnito

---

## ✅ Resumen

**Tu código está PERFECTO** ✅

- ✓ CORS configurado correctamente
- ✓ Autenticación Sanctum implementada
- ✓ Cliente API con mejores prácticas
- ✓ Manejo de errores robusto
- ✓ Protección de rutas
- ✓ NO hay archivos redundantes

**El único problema**: Usuario no logueado

**La solución**: Ir a /login y autenticarse

---

**Fecha**: 2025-10-10
**Estado**: CÓDIGO CORRECTO - Solo falta login
