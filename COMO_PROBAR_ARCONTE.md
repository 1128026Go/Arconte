# 🚀 Cómo Probar Arconte - Guía Completa

## ✅ Servicios Ya Iniciados

Los servicios ya están corriendo en tu máquina:

### 🎨 **FRONTEND (React)**
**URL Principal:** **http://localhost:3000**

**Credenciales de Prueba:**
- **Email:** `admin@arconte.test`
- **Password:** `admin123`

---

## 📍 URLS DISPONIBLES AHORA MISMO

### 🌐 Frontend (Interfaz Web)

| Sección | URL | Descripción |
|---------|-----|-------------|
| **🏠 Inicio** | http://localhost:3000 | Página principal |
| **🔐 Login** | http://localhost:3000/login | Iniciar sesión |
| **📊 Dashboard** | http://localhost:3000/dashboard | Panel principal |
| **⚖️ Casos** | http://localhost:3000/cases | Gestión de casos |
| **📄 Documentos** | http://localhost:3000/documents | Gestión documental |
| **💰 Facturación** | http://localhost:3000/billing | Facturación |
| **🤖 IA Assistant** | http://localhost:3000/ai-assistant | Asistente con IA |
| **🏪 Marketplace** | http://localhost:3000/marketplace | Marketplace abogados |
| **⏰ Recordatorios** | http://localhost:3000/reminders | Recordatorios |
| **📈 Analytics** | http://localhost:3000/analytics | Analytics |

### 🔧 Backend (API)

| Endpoint | URL | Descripción |
|----------|-----|-------------|
| **📚 Documentación API** | http://localhost:8000/docs | Scribe API Docs (OpenAPI) |
| **❤️ Health Check** | http://localhost:8000/health | Estado del servidor |
| **🔑 Auth - Login** | http://localhost:8000/api/auth/login | POST para login |
| **👤 Auth - Me** | http://localhost:8000/api/auth/me | GET usuario actual |
| **⚖️ Casos** | http://localhost:8000/api/cases | CRUD casos |
| **📄 Documentos** | http://localhost:8000/api/documents | CRUD documentos |
| **🤖 IA Chat** | http://localhost:8000/api/ai/chat | POST para chat IA |

### 🐍 Python Service (Ingest)

| Endpoint | URL | Descripción |
|----------|-----|-------------|
| **📡 Normalized** | http://localhost:8001/normalized/{radicado} | Obtener caso normalizado |
| **❤️ Health** | http://localhost:8001/health | Estado servicio Python |

---

## 🎬 PASOS PARA PROBAR

### 1. **Acceder al Frontend**

Abre tu navegador y ve a:
```
http://localhost:3000
```

### 2. **Iniciar Sesión**

Usa las credenciales:
- **Email:** `admin@arconte.test`
- **Password:** `admin123`

### 3. **Explorar el Dashboard**

Una vez logueado, verás:
- **Casos activos**
- **Recordatorios próximos**
- **Estadísticas**
- **Acceso rápido a módulos**

### 4. **Probar Módulos Principales**

#### ⚖️ **Casos**
1. Ir a http://localhost:3000/cases
2. Click en "Nuevo Caso"
3. Llenar formulario
4. Ver detalles del caso creado

#### 🤖 **IA Assistant**
1. Ir a http://localhost:3000/ai-assistant
2. Hacer una pregunta legal
3. Ver respuesta generada con IA

#### 🏪 **Marketplace**
1. Ir a http://localhost:3000/marketplace
2. Ver abogados disponibles
3. Filtrar por especialidad/ubicación
4. Ver matching score

#### 📄 **Documentos**
1. Ir a http://localhost:3000/documents
2. Subir documento
3. Ver preview
4. Compartir con link

---

## 🧪 PROBAR API CON CURL

### Login
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@arconte.test","password":"admin123"}'
```

### Obtener Usuario Actual
```bash
curl http://localhost:8000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Listar Casos
```bash
curl http://localhost:8000/api/cases \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Chat con IA
```bash
curl -X POST http://localhost:8000/api/ai/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"message":"¿Cómo redactar una demanda de tutela?"}'
```

---

## 📱 PROBAR PWA (Progressive Web App)

### 1. **Abrir en Navegador**
```
http://localhost:3000
```

### 2. **Instalar como App**

**Chrome/Edge:**
1. Click en ⋮ (menú)
2. "Instalar Arconte"
3. Se abre como app independiente

**Verificar Service Worker:**
1. F12 (DevTools)
2. Tab "Application"
3. Ver "Service Workers" activo

### 3. **Probar Offline**

1. Abrir DevTools (F12)
2. Tab "Network"
3. Seleccionar "Offline"
4. Recargar página
5. Ver página offline elegante
6. Operaciones se guardan en queue
7. Volver online
8. Sync automático

---

## 🧪 PROBAR FEATURES AVANZADAS

### 🎙️ **IA Multimodal (Voz + PDF)**

**Endpoint:**
```bash
curl -X POST http://localhost:8000/api/ai/multimodal \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "text=Analiza este documento" \
  -F "pdf_file=@documento.pdf"
```

### 💰 **Pagos PSE (Simulado)**

**Endpoint:**
```bash
curl -X POST http://localhost:8000/api/marketplace/payment/pse \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "escrow_id": 1,
    "bank_code": "1007",
    "document_number": "123456789",
    "email": "test@test.com"
  }'
```

### 🏢 **Verificar Empresa en RUES**

**Endpoint:**
```bash
curl http://localhost:8000/api/camara-comercio/verificar/900123456 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 📊 **Predicción de Casos**

**Endpoint:**
```bash
curl http://localhost:8000/api/cases/1/predict \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Respuesta:
```json
{
  "probabilidad_exito": 0.75,
  "tiempo_estimado_meses": 14,
  "factores_clave": ["Jurisprudencia favorable", "..."],
  "confianza": 82
}
```

---

## 📚 VER DOCUMENTACIÓN COMPLETA

**OpenAPI Docs (Scribe):**
```
http://localhost:8000/docs
```

Incluye:
- ✅ Todos los endpoints documentados
- ✅ Ejemplos de request/response
- ✅ Códigos de error
- ✅ Schemas de datos
- ✅ Probar endpoints desde el browser

---

## 🔍 VERIFICAR SERVICIOS

### Backend (Laravel)
```bash
curl http://localhost:8000/health
```
Respuesta: `{"status":"healthy"}`

### Frontend (React)
```bash
curl http://localhost:3000
```
Respuesta: HTML de la app

### Python Service
```bash
curl http://localhost:8001/health
```
Respuesta: `{"status":"ok"}`

---

## 🛠️ COMANDOS ÚTILES

### Ver Rutas API
```bash
cd apps/api_php
php artisan route:list
```

### Ver Logs Backend
```bash
cd apps/api_php
tail -f storage/logs/laravel.log
```

### Ejecutar Tests
```bash
cd apps/api_php
php artisan test
```

### Ejecutar Migraciones
```bash
cd apps/api_php
php artisan migrate
```

### Crear Más Usuarios
```bash
cd apps/api_php
php artisan tinker
>>> App\Models\User::create([
    'name' => 'Test User',
    'email' => 'test@test.com',
    'password' => bcrypt('password')
]);
```

---

## 🎯 FEATURES PRINCIPALES A PROBAR

### ✅ Gestión de Casos
- [x] Crear caso
- [x] Editar caso
- [x] Ver actuaciones
- [x] Monitoreo automático

### ✅ IA Legal
- [x] Chat con IA
- [x] Generación de documentos
- [x] Predicción de resultados
- [x] Análisis multimodal (voz + PDF)

### ✅ Marketplace
- [x] Ver abogados
- [x] Matching automático
- [x] Sistema de reviews
- [x] Escrow de pagos

### ✅ Integraciones
- [x] DIAN (facturación)
- [x] PSE/Nequi/Daviplata (pagos)
- [x] Cámaras de Comercio (RUES)
- [x] ERPs (SIIGO, SAP, etc.)

### ✅ PWA
- [x] Instalable como app
- [x] Funcionalidad offline
- [x] Push notifications
- [x] Background sync

---

## 🐛 TROUBLESHOOTING

### Frontend no carga
```bash
cd apps/web
npm run dev
```
Abrir: http://localhost:3000

### Backend da error
```bash
cd apps/api_php
php artisan serve
```
Abrir: http://localhost:8000

### Error de base de datos
```bash
cd apps/api_php
php artisan migrate:fresh
php artisan tinker
>>> App\Models\User::create(['name' => 'Admin', 'email' => 'admin@arconte.test', 'password' => bcrypt('admin123')]);
```

### Puerto ocupado
```bash
# Cambiar puerto en .env
VITE_PORT=3001
```

---

## 📞 SOPORTE

¿Problemas? Revisa:
1. **Logs:** `apps/api_php/storage/logs/laravel.log`
2. **Console:** DevTools del navegador (F12)
3. **Network:** Tab Network en DevTools

---

## 🎉 ¡DISFRUTA PROBANDO ARCONTE!

**Recuerda:**
- Usuario: `admin@arconte.test`
- Password: `admin123`
- Frontend: http://localhost:3000
- Docs API: http://localhost:8000/docs

**¡Explora todas las funcionalidades! 🚀🇨🇴**
