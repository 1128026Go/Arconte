# 🏛️ ARCONTE - Sistema de Gestión Jurídica con IA

**Plataforma completa de gestión legal para abogados y bufetes en Colombia**

## 🚀 Inicio Rápido

### 📋 Credenciales de Acceso
```
Email:    admin@juridica.test
Password: admin123

Frontend: http://localhost:3000
Backend:  http://localhost:3000
API Docs: http://localhost:3000/docs
```

### ⚡ Iniciar Servicios

```bash
# Backend Laravel
cd apps/api_php
php artisan serve  # http://localhost:3000

# Frontend React
cd apps/web
npm run dev  # http://localhost:3000

# Python Ingest Service
cd apps/ingest_py
python run_persistent.py  # http://localhost:8001
```

## 🏗️ Arquitectura

### Monorepo con 3 aplicaciones:
- **Backend:** Laravel 11 + PostgreSQL + Redis
- **Frontend:** React 18 + Vite + Tailwind CSS
- **Ingest:** Python FastAPI (scraping Rama Judicial)

### Stack Tecnológico:
- **Auth:** Laravel Sanctum (sesiones)
- **Database:** PostgreSQL
- **Cache:** Redis (phpredis)
- **Queue:** Redis
- **AI:** Gemini API
- **OCR:** Tesseract (opcional)

## ✨ Características Principales

### ⚖️ Gestión de Casos
- Seguimiento automático vía Rama Judicial
- Partes procesales y actuaciones
- Sistema de notificaciones
- Monitoreo de cambios

### 📄 Gestión Documental
- Upload y versionado de archivos
- Organización por carpetas/casos
- Compartición segura con tokens
- Verificación SHA256

### 💰 Facturación y Tiempo
- Control de horas trabajadas
- Generación de facturas
- Reportes y analytics
- Estados (draft/sent/paid)

### 🤖 AI Assistant (Gemini)
- Chat con contexto legal colombiano
- Generación de documentos
- Análisis de casos
- Plantillas (tutela, derecho de petición, demanda, contrato)

### 🔔 Recordatorios y Notificaciones
- Alertas por términos judiciales
- Prioridades configurables
- Notificaciones push

### 📊 Analytics
- Dashboard con métricas clave
- Reportes de actividad
- Estadísticas de casos

## 📡 API Endpoints Principales

### Auth
```bash
POST /api/auth/login
POST /api/auth/register
POST /api/auth/logout
GET  /api/auth/me
```

### Casos
```bash
GET    /api/cases
POST   /api/cases
GET    /api/cases/{id}
POST   /api/cases/{id}/refresh
PUT    /api/cases/{id}/mark-read
```

### Documentos
```bash
GET    /api/documents
POST   /api/documents
GET    /api/documents/{id}
DELETE /api/documents/{id}
GET    /api/documents/{id}/download
POST   /api/documents/{id}/share
```

### AI
```bash
POST /api/ai/chat
POST /api/ai/generate-document
GET  /api/ai/conversations
GET  /api/ai/conversations/{id}
```

### Facturación
```bash
GET    /api/invoices
POST   /api/invoices
GET    /api/invoices/{id}
POST   /api/time-entries
GET    /api/analytics/dashboard
```

## 🔧 Configuración

### Variables de Entorno (.env)

**Backend (apps/api_php/.env):**
```env
APP_NAME=Arconte
APP_ENV=local
APP_URL=http://localhost:3000

DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=arconte
DB_USERNAME=arconte
DB_PASSWORD=arconte_secure_2025

CACHE_STORE=redis
QUEUE_CONNECTION=redis
SESSION_DRIVER=database

GEMINI_API_KEY=tu_api_key_aqui

INGEST_BASE_URL=http://127.0.0.1:8001
INGEST_API_KEY=5d95c7ed99d196f47c374cc04c7cf77c2235a29b67dc85baa573f3bb815024b1
```

**Frontend (apps/web/.env):**
```env
VITE_API_URL=http://localhost:3000
VITE_API_BASE_URL=http://localhost:3000/api
```

## 📦 Instalación Completa

### 1. Backend Setup
```bash
cd apps/api_php
composer install
cp .env.example .env
php artisan key:generate

# Configurar PostgreSQL
createdb arconte
createuser arconte -P  # password: arconte_secure_2025

# Migraciones
php artisan migrate
php artisan db:seed  # Opcional: datos de prueba

# Crear usuario admin
php artisan tinker
>>> App\Models\User::create([
    'name' => 'Admin',
    'email' => 'admin@juridica.test',
    'password' => bcrypt('admin123')
]);
```

### 2. Frontend Setup
```bash
cd apps/web
npm install
cp .env.example .env
npm run dev
```

### 3. Python Service Setup
```bash
cd apps/ingest_py
pip install -r requirements.txt
python run_persistent.py
```

### 4. Redis Setup
```bash
# Instalar Redis
brew install redis  # macOS
sudo apt install redis  # Ubuntu

# Iniciar Redis
redis-server
```

## 🧪 Testing

```bash
cd apps/api_php
php artisan test  # Ejecutar tests
```

## 🐛 Troubleshooting

### Frontend no carga
```bash
cd apps/web
rm -rf node_modules
npm install
npm run dev
```

### Backend errores 500
```bash
cd apps/api_php
php artisan cache:clear
php artisan config:clear
php artisan route:clear
tail -f storage/logs/laravel.log
```

### Base de datos
```bash
php artisan migrate:fresh  # ⚠️ Borra todos los datos
php artisan migrate:refresh --seed
```

### AI no responde
- Verificar GEMINI_API_KEY en .env
- Comprobar cuota de Gemini API
- Ver logs: `storage/logs/laravel.log`

### Casos no se actualizan
- Verificar Python service corriendo (puerto 8001)
- Verificar INGEST_API_KEY coincida en ambos .env
- Test: `curl http://localhost:8001/health`

## 📚 Arquitectura del Código

### Backend (Laravel)
```
apps/api_php/
├── app/
│   ├── Http/Controllers/     # Controladores API
│   ├── Models/                # Modelos Eloquent
│   ├── Services/              # Lógica de negocio
│   ├── Policies/              # Autorización
│   └── Providers/
├── database/
│   ├── migrations/            # Schema database
│   └── seeders/
├── routes/
│   └── api.php                # Rutas API
└── tests/                     # Tests PHPUnit
```

### Frontend (React)
```
apps/web/
├── src/
│   ├── api/                   # Cliente API
│   ├── components/            # Componentes React
│   ├── pages/                 # Páginas
│   ├── hooks/                 # Custom hooks
│   └── App.jsx
└── public/
```

### Python Service
```
apps/ingest_py/
├── run_persistent.py          # FastAPI server
├── rama_judicial_scraper.py   # Scraper principal
└── requirements.txt
```

## 🔐 Seguridad

- ✅ Laravel Sanctum (autenticación basada en sesiones)
- ✅ CORS configurado
- ✅ CSRF protection
- ✅ Rate limiting en API
- ✅ Políticas de autorización
- ✅ Validación de entrada
- ✅ SQL injection protection (Eloquent)
- ✅ XSS protection
- ✅ Soft deletes (recuperación de datos)

## 📊 Base de Datos

### Tablas Principales:
- `users` - Usuarios del sistema
- `cases` - Casos judiciales
- `case_parties` - Partes procesales
- `case_acts` - Actuaciones judiciales
- `documents` - Documentos
- `invoices` - Facturas
- `time_entries` - Registro de tiempo
- `reminders` - Recordatorios
- `ai_conversations` - Conversaciones IA
- `ai_messages` - Mensajes IA
- `generated_documents` - Documentos generados por IA

## 🚀 Features Avanzadas

### Integración Rama Judicial
El servicio Python (puerto 8001) hace scraping de:
- Consulta de procesos por radicado
- Actuaciones y movimientos
- Partes procesales
- Estado del proceso

### AI Multimodal
Gemini 2.5 Flash integrado:
- Chat contextual legal
- Generación de documentos
- Análisis de casos
- Predicciones

### Sistema de Colas
Redis queue para:
- Envío de emails
- Notificaciones
- Sincronización de casos
- Jobs programados

## 📝 Convenciones de Código

### Backend (Laravel)
- PSR-12 coding standard
- Eloquent ORM (no raw queries)
- Form Request validation
- Resource controllers
- API Resources para transformaciones

### Frontend (React)
- Componentes funcionales + hooks
- Tailwind CSS para estilos
- React Router v6
- Axios para HTTP

### Git
- Feature branches
- Commits descriptivos
- Pull requests con review

## 📞 Soporte y Documentación

### Logs
- Backend: `apps/api_php/storage/logs/laravel.log`
- Frontend: Console del navegador (F12)

### Documentación API
```
http://localhost:8000/docs
```

### Health Checks
```bash
# Backend
curl http://localhost:8000/health

# Python Service
curl http://localhost:8001/health
```

## 🎯 Roadmap

### En Desarrollo
- [ ] PWA offline support
- [ ] Notificaciones push
- [ ] Integración WhatsApp
- [ ] Export Excel/PDF
- [ ] Mobile app (React Native)

### Completado
- [x] Autenticación y autorización
- [x] Gestión de casos
- [x] Gestión documental
- [x] Facturación
- [x] AI Assistant
- [x] Analytics dashboard
- [x] Integración Rama Judicial

---

**Versión:** 1.0.0
**Última actualización:** Octubre 2025
**Licencia:** Privado - Todos los derechos reservados
