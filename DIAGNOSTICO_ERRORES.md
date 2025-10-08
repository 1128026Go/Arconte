# 🔍 Diagnóstico de Errores - Arconte

## Problemas Reportados

1. ❌ **Error `case_create_failed`** al agregar casos reales
2. ❌ **IA responde**: "Lo siento, hubo un error al procesar tu mensaje"

## Análisis Realizado

### ✅ Servicio Python (Puerto 8001)
**Estado:** FUNCIONANDO CORRECTAMENTE

```bash
curl http://localhost:8001/healthz
# Response: {"ok":true,"service":"ingest_py","status":"healthy"}

curl http://localhost:8001/normalized/73001600045020220057700
# Response: Datos reales del caso (jurisdicción, juzgado, partes, etc.)
```

El servicio Python está:
- ✅ Corriendo en puerto 8001
- ✅ Respondiendo al endpoint `/healthz`
- ✅ Devolviendo datos reales de Rama Judicial
- ✅ Parseando correctamente los radicados

### ❌ Backend Laravel (Puerto 8000)
**Estado:** PROBLEMA DE CONFIGURACIÓN

**Hallazgos:**
1. **Múltiples procesos PHP** corriendo simultáneamente (PIDs: 10060, 15996, 2972)
2. **Rutas API no responden** correctamente (devuelven página HTML en lugar de JSON)
3. **CORS probablemente mal configurado** o ausente

**Pruebas realizadas:**
```bash
curl http://localhost:8000/api/
# Esperado: JSON {"message": "Arconte API..."}
# Recibido: Página HTML de bienvenida de Laravel
```

### 🧐 Causa Raíz de los Errores

#### Error 1: `case_create_failed`
**Problema:** Laravel no puede comunicarse con el servicio Python

**Flujo esperado:**
```
Frontend -> Laravel API (/api/cases) -> Python Service (port 8001) -> Rama Judicial
```

**Flujo actual:**
```
Frontend -> Laravel API ❌ (rutas no funcionan) -> Error
```

**Posibles causas:**
1. Laravel serve corriendo múltiples veces
2. Rutas API no accesibles (problema de routing)
3. Falta configuración FRONTEND_URL en .env

#### Error 2: IA no responde
**Problema:** Timeout o fallo en Gemini API

**Configuración encontrada:**
- ✅ `GEMINI_API_KEY` está configurada en `.env`
- ✅ Servicio `OpenAIService.php` usa Gemini correctamente
- ⚠️ Timeout configurado a 60 segundos (puede ser insuficiente)
- ❌ Backend API no responde (mismo problema que Error 1)

**Archivo:** `apps/api_php/app/Services/OpenAIService.php:28`
```php
$response = Http::timeout(60)->post(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key={$this->apiKey}",
    // ...
);
```

## 🔧 Solución

### Paso 1: Detener todos los servicios

```bash
# Detener Laravel (PowerShell)
Get-NetTCPConnection -LocalPort 8000 | ForEach-Object {
    Stop-Process -Id $_.OwningProcess -Force
}

# O manualmente
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

### Paso 2: Reiniciar servicios correctamente

```bash
# 1. Backend Laravel
cd apps/api_php
php artisan serve --host=127.0.0.1 --port=8000

# 2. Frontend React (en otra terminal)
cd apps/web
npm run dev

# 3. Python ya está corriendo en puerto 8001 ✅
```

### Paso 3: Verificar endpoints

```bash
# Backend API
curl http://localhost:8000/api/
# Debe devolver: {"message":"Arconte API - Tu asistente jurídico inteligente"}

# Python
curl http://localhost:8001/healthz
# Debe devolver: {"ok":true,...}

# Frontend
curl http://localhost:3000
# Debe devolver HTML de React
```

### Paso 4: Probar caso real

```bash
# Login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@arconte.test","password":"admin123"}'

# Crear caso (con token obtenido)
curl -X POST http://localhost:8000/api/cases \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"radicado":"73001600045020220057700","cliente_id":1}'
```

## 📋 Checklist de Verificación

- [ ] Solo UN proceso PHP corriendo en puerto 8000
- [ ] Endpoint `/api/` devuelve JSON (no HTML)
- [ ] CORS configurado para `http://localhost:3000`
- [ ] Python servicio respondiendo en puerto 8001
- [ ] Gemini API key válida en `.env`
- [ ] Frontend puede hacer login correctamente
- [ ] Frontend puede crear casos
- [ ] IA puede responder mensajes

## 🚀 Script de Reinicio Automático

Creado: `REINICIAR_SERVICIOS.bat`

Ejecutar:
```bash
REINICIAR_SERVICIOS.bat
```

## 📝 Configuraciones Importantes

### `.env` (Backend)
```env
APP_URL=http://localhost:8000
GEMINI_API_KEY=AIzaSyAQL5ROVVhsInQVR1Sv54ku5kB8aXET9Gw
FRONTEND_URL=http://localhost:3000  # ⚠️ Agregar si falta
INGEST_SERVICE_URL=http://localhost:8001  # ⚠️ Agregar si falta
```

### `config/cors.php` (Backend)
```php
'paths' => ['api/*', 'sanctum/csrf-cookie'],
'allowed_origins' => [env('FRONTEND_URL', 'http://localhost:3000')],
'allowed_methods' => ['*'],
```

## 🎯 Próximos Pasos

1. **Reiniciar servicios limpios** (un solo proceso por puerto)
2. **Verificar CORS** está configurado para localhost:3000
3. **Probar creación de caso** desde el frontend
4. **Probar IA** desde el frontend
5. **Revisar logs** si persisten errores:
   ```bash
   tail -f apps/api_php/storage/logs/laravel.log
   ```

## 🐛 Errores Conocidos

### Error: "case_create_failed"
**Causa:** Backend no puede acceder al servicio Python o rutas API mal configuradas
**Solución:** Reiniciar backend correctamente

### Error: "Lo siento, hubo un error..."
**Causa:** Gemini API lenta o backend no responde
**Solución:**
1. Verificar API key válida
2. Aumentar timeout a 90 segundos
3. Verificar backend funcionando

### Error: 404 Not Found en `/api/auth/login`
**Causa:** Múltiples procesos Laravel interfiriendo
**Solución:** Matar todos los procesos y reiniciar UNO solo

---

**Fecha:** 2025-10-08
**Servicios verificados:**
- ✅ Python: http://localhost:8001
- ⚠️ Laravel: http://localhost:8000 (requiere reinicio limpio)
- ⚠️ React: http://localhost:3000 (depende de Laravel)
