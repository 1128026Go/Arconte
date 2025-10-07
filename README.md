# Arconte
**Sistema de Gestión Jurídica con IA**

Plataforma completa de gestión legal para abogados y bufetes en Colombia. Incluye seguimiento de casos, gestión documental, facturación, recordatorios y asistente de IA.

## ✨ Características Principales

### 🔐 Autenticación y Autorización
- Registro y login con Laravel Sanctum
- Sistema de roles y permisos con Spatie Permission
- Políticas de autorización granular
- Auditoría completa de acciones

### ⚖️ Gestión de Casos
- Creación y seguimiento de casos judiciales
- Partes procesales y actuaciones
- Monitoreo automático de cambios
- Sistema de notificaciones inteligente
- Historial de cambios con diff

### 📄 Gestión Documental
- Carga y organización de documentos
- Versionado automático de archivos
- Carpetas organizadas por caso
- Sistema de compartición con tokens
- Soft deletes para recuperación
- Verificación SHA256 de integridad

### 💰 Facturación y Control de Tiempo
- Creación de facturas con items detallados
- Seguimiento de tiempo por caso
- Tarifas facturables configurables
- Reportes de tiempo trabajado
- Estados de factura (draft, sent, paid, cancelled)

### 🔔 Recordatorios
- Recordatorios vinculados a casos
- Prioridades configurables
- Estado de completado
- Notificaciones programadas (jobs)

### 📚 Jurisprudencia
- Búsqueda de casos relevantes
- Almacenamiento de jurisprudencia
- Servicio especializado de búsqueda

### 👥 Teams
- Gestión de equipos de trabajo
- Miembros con roles específicos
- Colaboración multi-usuario

### 📊 Analytics
- Dashboard con métricas clave
- Estadísticas de casos
- Reportes de actividad

### 🤖 AI Assistant
- Conversaciones con IA
- Generación de documentos
- Plantillas de documentos
- Historial de mensajes

### 🔍 OCR
- Extracción de texto de PDFs
- Procesamiento de imágenes
- Integración con Tesseract

## 🏗️ Arquitectura

Monorepo con 3 aplicaciones:

- **Backend:** Laravel 12 + Sanctum (API REST)
- **Frontend:** React 18 + Vite + Tailwind CSS
- **Ingest Service:** Python FastAPI (scraping Rama Judicial)

## 🚀 Inicio Rápido

### Requisitos
- PHP 8.2+, Composer
- Node.js 18+
- Python 3.11+
- SQLite (dev) o PostgreSQL/MySQL (producción)

### Instalación

**1. Backend (Laravel):**
```bash
cd apps/api_php
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve  # http://localhost:8000
```

**2. Frontend (React):**
```bash
cd apps/web
npm install
cp .env.example .env
npm run dev  # http://localhost:3000
```

**3. Python Service:**
```bash
cd apps/ingest_py
pip install -r requirements.txt
python run_persistent.py  # http://localhost:8001
```

**4. Crear usuario de prueba:**
```bash
cd apps/api_php
php artisan tinker
>>> App\Models\User::create(['name' => 'Admin', 'email' => 'admin@test.com', 'password' => bcrypt('password')]);
```

Abre http://localhost:3000 y login con `admin@test.com` / `password`

## 📡 API Principal

La API REST está disponible en `http://localhost:8000/api`

**Módulos:** Auth, Cases, Documents, Reminders, Billing, Time Tracking, Jurisprudence, Analytics, AI Assistant, Notifications

Ver documentación completa en `docs/API.md` o ejecutar:
```bash
php artisan route:list
```

## 🧪 Testing

```bash
cd apps/api_php
php artisan test  # 26 tests pasando
```

## 🚀 Deployment

Para desplegar a producción, consulta `GUIA_MAESTRA.md`

Incluye:
- Configuración de servidor (VPS, Nginx, HTTPS)
- Variables de entorno de producción
- Base de datos (PostgreSQL/MySQL)
- Optimizaciones y cache
- Troubleshooting

## 📚 Documentación

- **`GUIA_MAESTRA.md`** - Guía completa de instalación, configuración y deployment
- **`ANALISIS_PROFUNDO_PROYECTO.md`** - Análisis técnico detallado del proyecto
- **`docs/`** - Documentación adicional y archivos históricos

## 📄 Licencia

Proyecto privado - Todos los derechos reservados.
