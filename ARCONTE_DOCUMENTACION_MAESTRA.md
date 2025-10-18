# Proyecto Arconte - Documentación Maestra
*Actualizado: 2025-10-14*
*Versión del Proyecto: 1.0.0*

---

## 1. INFORMACIÓN GENERAL

### 1.1 Descripción del Proyecto
**Arconte** es una plataforma web integral de gestión jurídica con inteligencia artificial diseñada específicamente para abogados y bufetes en Colombia. Permite automatizar la consulta de procesos judiciales, gestionar casos, documentos, facturación, control de tiempo y recibir notificaciones inteligentes sobre actuaciones críticas.

### 1.2 Propósito
Convertir Arconte en la plataforma legal número 1 de Colombia mediante:
- Integración con fuentes de datos oficiales (Rama Judicial de Colombia)
- Análisis automático de actuaciones judiciales con IA
- Sistema completo de gestión legal (casos, documentos, facturación, tiempo)
- Asistencia inteligente para generación de documentos legales
- Notificaciones oportunas sobre plazos y actuaciones críticas

### 1.3 Alcance Actual
- **Estado del Proyecto:** En Optimización (75% completado)
- **Usuarios Objetivo:** Abogados, bufetes jurídicos y estudios legales en Colombia
- **Cobertura Geográfica:** Nacional (Colombia)
- **Modelo de Negocio:** Freemium (Plan Free + Planes Premium)

### 1.4 Estado de Implementación
- **Core Funcional:** 75% completado
- **Funcionalidades Críticas:** Implementadas y operativas
- **Integraciones Externas:** 4 de 4 implementadas
- **Testing:** 10% completado
- **Documentación:** 80% completada

---

## 2. ARQUITECTURA ACTUAL

### 2.1 Arquitectura General del Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                    USUARIO (Navegador)                           │
│                   http://localhost:3000                          │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTP/REST + Cookies httpOnly
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│              FRONTEND - React 18 + Vite                          │
│  - Single Page Application (SPA)                                 │
│  - Tailwind CSS 3.4.18 + Headless UI                            │
│  - React Router 6.26.2                                           │
│  - Autenticación por cookies httpOnly                            │
│  - Auto-refresh de casos en procesamiento                        │
│  - Diseño responsive                                             │
└──────────────────────────┬───────────────────────────────────────┘
                           │ REST API (JSON)
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│              BACKEND API - Laravel 12.0                          │
│  - Laravel Sanctum 4.2 (autenticación cookie-based)             │
│  - CORS configurado para localhost:3000                          │
│  - Sistema de Queues (actualmente sync, debe migrar a database) │
│  - Rate Limiting por IP                                          │
│  - Cache con Redis                                               │
│  - Spatie Permission 6.8 (roles y permisos)                      │
│  - Sistema de suscripciones con ePayco                           │
│  - Scribe 5.3 (documentación de API)                             │
└──────────────┬────────────────────┬──────────────────────────────┘
               │                    │
    ┌──────────┴────────┐   ┌──────┴─────────┐
    ▼                   ▼   ▼                ▼
┌──────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│PostgreSQL│  │    Redis     │  │  Ingest API  │  │ APIs Externas│
│  16      │  │   7          │  │  (FastAPI)   │  │              │
│          │  │              │  │  Puerto 8001 │  │ - ePayco     │
│ - users  │  │ - Cache      │  │              │  │ - Gemini     │
│ - cases  │  │ - Sessions   │  │ - Playwright │  │ - Resend     │
│ - acts   │  │ - Queues     │  │ - Scraping   │  │ - Rama       │
│ - parties│  │              │  │ - OCR        │  │   Judicial   │
│ - plans  │  └──────────────┘  │ - IA Gemini  │  │              │
│ - subs   │                    │              │  └──────────────┘
└──────────┘                    └──────┬───────┘
                                       │
                                       ▼
                              ┌─────────────────┐
                              │  Rama Judicial  │
                              │  (API Real)     │
                              │ + Gemini API    │
                              │   (Análisis)    │
                              └─────────────────┘
```

### 2.2 Estructura del Monorepo

```
Aplicacion Juridica/
├── apps/
│   ├── api_php/                    # Backend Laravel 12.0
│   │   ├── app/
│   │   │   ├── Http/Controllers/   # Controladores API REST
│   │   │   ├── Models/             # Modelos Eloquent
│   │   │   ├── Services/           # Lógica de negocio
│   │   │   ├── Jobs/               # Jobs de queue
│   │   │   ├── Policies/           # Autorización
│   │   │   └── Middleware/         # Middleware personalizado
│   │   ├── database/
│   │   │   ├── migrations/         # Migraciones de BD
│   │   │   └── seeders/            # Seeders (PlansSeeder)
│   │   ├── routes/
│   │   │   └── api.php             # Rutas de API
│   │   ├── config/                 # Configuraciones
│   │   └── .env                    # Variables de entorno
│   │
│   ├── web/                        # Frontend React 18
│   │   ├── src/
│   │   │   ├── api/                # Cliente HTTP (axios)
│   │   │   ├── components/         # Componentes React
│   │   │   ├── pages/              # Páginas (rutas)
│   │   │   ├── hooks/              # Custom hooks
│   │   │   ├── utils/              # Utilidades
│   │   │   └── App.jsx             # Componente raíz
│   │   ├── public/                 # Assets estáticos
│   │   ├── vite.config.mjs         # Configuración Vite
│   │   └── package.json
│   │
│   └── ingest_py/                  # Microservicio Python
│       ├── src/
│       │   ├── main.py             # FastAPI app
│       │   ├── rama_client.py      # Cliente Rama Judicial
│       │   ├── normalizer.py       # Normalización de datos
│       │   └── analyzers/
│       │       └── auto_classifier.py  # Clasificación IA
│       ├── run_persistent.py       # Servidor FastAPI
│       └── requirements.txt        # Dependencias Python
│
├── docker-compose.yml              # PostgreSQL 16 + Redis 7
├── consolidacion_docs/             # Documentación del proceso
└── docs/                           # Documentación organizada
```

### 2.3 Flujo de Datos - Consulta de Casos

```
1. Usuario ingresa radicado en Frontend (React)
   └─> POST /api/cases {radicado: "73001600045..."}

2. Backend Laravel recibe petición
   ├─> Valida autenticación (Sanctum)
   ├─> Verifica límites del plan del usuario
   ├─> Crea caso en BD con estado "Buscando información..."
   ├─> Dispatch FetchCaseData Job a Queue (actualmente sync)
   └─> Retorna response inmediata al frontend (< 100ms)

3. Frontend recibe caso con estado_checked=false
   └─> Inicia auto-refresh cada 3 segundos

4. Job FetchCaseData se ejecuta (background)
   ├─> Llama a Ingest API: GET /normalized/{radicado}
   └─> Espera respuesta de Python

5. Ingest API (Python FastAPI)
   ├─> Verifica cache de radicado
   ├─> Si no existe en cache:
   │   ├─> Lanza Playwright (navegador headless)
   │   ├─> Navega a Rama Judicial
   │   ├─> Rellena formulario con radicado
   │   ├─> Extrae datos del proceso
   │   ├─> Extrae actuaciones
   │   ├─> Descarga PDFs de autos (si existen)
   │   ├─> Aplica OCR si es necesario
   │   ├─> Analiza autos con Gemini API
   │   │   ├─> Clasifica tipo de auto (perentorio/trámite/definitivo)
   │   │   ├─> Detecta plazos y términos
   │   │   └─> Extrae información relevante
   │   ├─> Normaliza datos a formato JSON estándar
   │   └─> Guarda en cache
   └─> Retorna JSON normalizado

6. Job recibe datos normalizados
   ├─> Actualiza información del caso en BD
   ├─> Crea/actualiza partes procesales
   ├─> Crea/actualiza actuaciones
   ├─> Marca estado_checked = true
   └─> Finaliza

7. Frontend detecta estado_checked=true en auto-refresh
   ├─> Detiene polling
   ├─> Actualiza UI con datos completos
   └─> Muestra notificación de éxito
```

---

## 3. TECNOLOGÍAS Y VERSIONES ACTUALES

### 3.1 Backend (Laravel)
| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| PHP | 8.2 | Lenguaje base |
| Laravel | 12.0 | Framework backend |
| PostgreSQL | 16 | Base de datos |
| Redis | 7 | Cache y queues |
| Laravel Sanctum | 4.2 | Autenticación |
| Spatie Permission | 6.8 | Roles y permisos |
| Scribe | 5.3 | Documentación API |
| DomPDF | 2.0 | Generación de PDFs |
| Guzzle | 7.10 | Cliente HTTP |
| PHPUnit | 11.5.3 | Testing |
| epayco/epayco-php | 1.9.0 | Pagos (ePayco) |
| resend/resend-php | - | Emails transaccionales |

### 3.2 Frontend (React)
| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| Node.js | 18+ | Runtime JavaScript |
| React | 18.3.1 | Framework UI |
| Vite | 5.0.0 | Build tool |
| TypeScript | 5.9.3 | Tipado estático |
| TailwindCSS | 3.4.18 | Framework CSS |
| Headless UI | 2.2.9 | Componentes accesibles |
| React Router | 6.26.2 | Routing |
| Axios | 1.7.7 | Cliente HTTP |
| Lucide React | 0.544.0 | Iconos |
| Recharts | 3.2.1 | Gráficos |
| React Big Calendar | 1.19.4 | Calendario |
| React Dropzone | 14.3.8 | Upload de archivos |
| date-fns | 4.1.0 | Utilidades de fecha |
| Vitest | 3.0.0 | Testing |

### 3.3 Microservicio Python (Ingest)
| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| Python | 3.11+ | Lenguaje base |
| FastAPI | - | Framework web |
| Playwright | 1.41.0 | Web scraping |
| PyPDF2 | 3.0.1 | Procesamiento de PDFs |
| pytesseract | 0.3.10 | OCR |
| pdf2image | 1.17.0 | Conversión PDF a imagen |
| Pillow | 10.3.0 | Procesamiento de imágenes |
| APScheduler | 3.10.4 | Tareas programadas |
| Gemini API | 2.5 Flash | Análisis IA |

### 3.4 Infraestructura de Desarrollo
| Componente | Versión | Puerto | Propósito |
|------------|---------|--------|-----------|
| Docker | - | - | Contenedores |
| PostgreSQL | 16 | 5432 | Base de datos |
| Redis | 7 | 6379 | Cache y queues |
| Laravel API | 12.0 | 8000 | Backend |
| React App | 18.3.1 | 3000 | Frontend |
| FastAPI Python | - | 8001 | Scraping |

---

## 4. CONFIGURACIÓN E INSTALACIÓN

### 4.1 Requisitos Previos
```bash
# Verificar versiones instaladas
php --version       # Debe ser 8.2+
node --version      # Debe ser 18+
python --version    # Debe ser 3.11+
docker --version    # Para PostgreSQL y Redis
composer --version  # Gestor de dependencias PHP
npm --version       # Gestor de dependencias Node
```

### 4.2 Instalación Completa

#### Paso 1: Clonar Repositorio
```bash
git clone https://github.com/1128026Go/Arconte.git
cd "Aplicacion Juridica"
```

#### Paso 2: Configurar Backend Laravel
```bash
cd apps/api_php
composer install
cp .env.example .env
php artisan key:generate

# Editar .env con tus credenciales:
# DB_CONNECTION=pgsql
# DB_HOST=127.0.0.1
# DB_PORT=5432
# DB_DATABASE=arconte
# DB_USERNAME=arconte
# DB_PASSWORD=arconte_secure_2025
#
# GEMINI_API_KEY=tu_api_key
# INGEST_API_KEY=5d95c7ed99d196f47c374cc04c7cf77c2235a29b67dc85baa573f3bb815024b1
# EPAYCO_PUBLIC_KEY=tu_public_key
# EPAYCO_PRIVATE_KEY=tu_private_key
# RESEND_API_KEY=tu_resend_key
```

#### Paso 3: Iniciar PostgreSQL y Redis (Docker)
```bash
# Desde la raíz del proyecto
docker-compose up -d
```

#### Paso 4: Ejecutar Migraciones y Seeders
```bash
cd apps/api_php
php artisan migrate
php artisan db:seed --class=PlansSeeder
```

#### Paso 5: Configurar Frontend React
```bash
cd apps/web
npm install
cp .env.example .env

# Editar .env:
# VITE_API_URL=http://localhost:8000
# VITE_API_BASE_URL=http://localhost:8000/api
```

#### Paso 6: Configurar Servicio Python
```bash
cd apps/ingest_py
python -m venv venv

# En Windows:
venv\Scripts\activate

# En Linux/Mac:
source venv/bin/activate

pip install -r requirements.txt
playwright install chromium
```

### 4.3 Variables de Entorno Críticas

**Backend (.env Laravel):**
```env
APP_NAME=Arconte
APP_ENV=local
APP_URL=http://localhost:8000
APP_FRONTEND_URL=http://localhost:3000

DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=arconte
DB_USERNAME=arconte
DB_PASSWORD=arconte_secure_2025

CACHE_STORE=redis
QUEUE_CONNECTION=sync              # ⚠️ Cambiar a "database" en producción
SESSION_DRIVER=database

REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379

GEMINI_API_KEY=tu_api_key_aqui
INGEST_BASE_URL=http://127.0.0.1:8001
INGEST_API_KEY=5d95c7ed99d196f47c374cc04c7cf77c2235a29b67dc85baa573f3bb815024b1

EPAYCO_PUBLIC_KEY=tu_public_key
EPAYCO_PRIVATE_KEY=tu_private_key
EPAYCO_TEST_MODE=true

RESEND_API_KEY=tu_resend_key
MAIL_FROM_ADDRESS=noreply@arconte.app
```

**Frontend (.env Vite):**
```env
VITE_API_URL=http://localhost:8000
VITE_API_BASE_URL=http://localhost:8000/api
```

### 4.4 Comandos de Inicio

**Terminal 1: PostgreSQL + Redis**
```bash
docker-compose up -d
```

**Terminal 2: Backend Laravel**
```bash
cd apps/api_php
php artisan serve
# Corre en http://localhost:8000
```

**Terminal 3: Queue Worker (Opcional pero recomendado)**
```bash
cd apps/api_php
php artisan queue:work --verbose --tries=3 --timeout=120
```

**Terminal 4: Servicio Python**
```bash
cd apps/ingest_py
python run_persistent.py
# Corre en http://localhost:8001
```

**Terminal 5: Frontend React**
```bash
cd apps/web
npm run dev
# Corre en http://localhost:3000
```

### 4.5 Verificación de Instalación

```bash
# Backend Laravel
curl http://127.0.0.1:8000/api/
# Respuesta esperada: {"message": "Arconte API v1.0.0"}

# Ingest Python
curl http://127.0.0.1:8001/healthz
# Respuesta esperada: {"ok": true, "service": "ingest"}

# PostgreSQL
docker ps | findstr postgres
# Debe mostrar contenedor corriendo

# Redis
docker ps | findstr redis
# Debe mostrar contenedor corriendo

# Frontend
# Abrir en navegador: http://localhost:3000
```

---

## 5. DESARROLLO

### 5.1 Backend Laravel - Comandos Útiles

```bash
# Desarrollo
php artisan serve                           # Iniciar servidor
php artisan tinker                          # REPL de Laravel
php artisan route:list                      # Ver todas las rutas
php artisan route:list --path=api/cases    # Filtrar rutas

# Base de Datos
php artisan migrate                         # Ejecutar migraciones
php artisan migrate:fresh                   # Reiniciar BD (borra datos)
php artisan migrate:fresh --seed            # Reiniciar BD con seeders
php artisan db:seed --class=PlansSeeder    # Ejecutar seeder específico

# Cache
php artisan cache:clear                     # Limpiar cache
php artisan config:clear                    # Limpiar config cache
php artisan route:clear                     # Limpiar route cache
php artisan view:clear                      # Limpiar view cache

# Queue
php artisan queue:work                      # Iniciar worker
php artisan queue:work --verbose            # Worker con logs
php artisan queue:work --tries=3            # Reintentos en fallos
php artisan queue:failed                    # Ver jobs fallidos
php artisan queue:retry all                 # Reintentar todos los fallidos
php artisan queue:table                     # Crear migración de queue
php artisan queue:batches-table             # Crear tabla job_batches

# Testing
php artisan test                            # Ejecutar tests
php artisan test --filter=CaseTest         # Test específico
```

### 5.2 Frontend React - Comandos Útiles

```bash
# Desarrollo
npm run dev                                 # Iniciar dev server (Vite)
npm run build                               # Build de producción
npm run preview                             # Preview del build

# Testing
npm run test                                # Ejecutar tests (Vitest)
npm run test:watch                          # Tests en modo watch
npm run test:coverage                       # Coverage report

# Linting y Formato
npm run lint                                # Ejecutar ESLint
npm run format                              # Formatear con Prettier

# Utilidades
npm install                                 # Instalar dependencias
npm update                                  # Actualizar dependencias
npm outdated                                # Ver paquetes desactualizados
```

### 5.3 Python Ingest - Comandos Útiles

```bash
# Desarrollo
python run_persistent.py                    # Iniciar servidor FastAPI
uvicorn src.main:app --reload --port 8001  # Alternativa con uvicorn

# Testing
python test_auto_detection.py              # Test de clasificador
python test_rama_client.py                  # Test de scraper

# Playwright
playwright install chromium                 # Instalar navegador
playwright install                          # Instalar todos los navegadores

# Dependencias
pip install -r requirements.txt             # Instalar dependencias
pip list                                    # Ver paquetes instalados
pip freeze > requirements.txt               # Actualizar requirements
```

### 5.4 Estructura de Controladores Backend

| Controlador | Propósito | Endpoints Principales |
|-------------|-----------|----------------------|
| AuthController | Autenticación | /api/auth/login, /api/auth/register |
| CaseController | Casos judiciales | /api/cases, /api/cases/{id} |
| CaseActController | Actuaciones | /api/cases/{id}/acts |
| AttachmentController | Archivos adjuntos | /api/cases/{id}/attachments |
| NotificationController | Notificaciones | /api/notifications |
| SubscriptionController | Suscripciones | /api/subscriptions |
| WebhookController | Webhooks ePayco | /api/webhooks/epayco |
| DocumentController | Documentos | /api/documents |
| ReminderController | Recordatorios | /api/reminders |
| InvoiceController | Facturación | /api/billing/invoices |
| TimeTrackingController | Control de tiempo | /api/time-tracking |
| LawyerController | Marketplace | /api/lawyers |
| AnalyticsController | Analytics | /api/analytics/dashboard |
| AIAssistantController | IA Chat | /api/ai/chat |

### 5.5 Estructura de Componentes Frontend

```
src/
├── components/
│   ├── layout/
│   │   ├── Navbar.jsx              # Barra de navegación
│   │   ├── Sidebar.jsx             # Menú lateral
│   │   └── Footer.jsx
│   ├── cases/
│   │   ├── CaseList.jsx            # Lista de casos
│   │   ├── CaseDetail.jsx          # Detalle de caso
│   │   ├── CaseForm.jsx            # Formulario crear caso
│   │   └── ActsListCompact.jsx     # Lista de actuaciones
│   ├── subscription/
│   │   ├── PricingCard.jsx         # Card de planes
│   │   └── CheckoutResponse.jsx    # Respuesta de pago
│   ├── dashboard/
│   │   └── StatsCard.jsx           # Card de estadísticas
│   └── common/
│       ├── Button.jsx              # Botón reutilizable
│       ├── Modal.jsx               # Modal genérico
│       └── Spinner.jsx             # Loading spinner
├── pages/
│   ├── Login.jsx
│   ├── Dashboard.jsx
│   ├── Cases.jsx
│   ├── Subscription.jsx
│   ├── Settings.jsx
│   └── Lawyers.jsx
├── api/
│   └── apiSecure.js                # Cliente Axios configurado
├── hooks/
│   ├── useAuth.js                  # Hook de autenticación
│   └── useCases.js                 # Hook de casos
└── utils/
    └── formatters.js               # Utilidades de formato
```

---

## 6. INTEGRACIONES DE APIs

### 6.1 Rama Judicial de Colombia (ACTIVO)

**Tipo:** Web Scraping con API Real
**Estado:** PRODUCCIÓN
**Tecnología:** Playwright + FastAPI Python

**URL Base:**
```
https://consultaprocesos.ramajudicial.gov.co:448/api/v2/
```

**Endpoints Usados:**
```
POST /Procesos/Consulta/NumeroRadicacion
GET  /Proceso/Actuaciones/{idProceso}
```

**Flujo de Consulta:**
1. Usuario ingresa radicado en frontend
2. Backend Laravel envía request a Ingest API Python
3. Python usa Playwright para navegar a Rama Judicial
4. Extrae datos del proceso y actuaciones
5. Normaliza datos a formato JSON estándar
6. Retorna a Laravel para almacenar en BD

**Datos Extraídos:**
- Número de radicado
- Tipo de proceso
- Clase de proceso
- Sujetos procesales (demandante, demandado, etc.)
- Despacho judicial
- Ubicación del proceso
- Ponente
- Actuaciones completas con fechas
- Estado del proceso

**Características:**
- Cache de resultados (sin expiración)
- Normalización automática de datos
- Análisis de autos con IA (Gemini)
- Clasificación de actuaciones
- Detección de plazos

**Configuración en .env:**
```env
INGEST_BASE_URL=http://127.0.0.1:8001
INGEST_API_KEY=5d95c7ed99d196f47c374cc04c7cf77c2235a29b67dc85baa573f3bb815024b1
```

### 6.2 ePayco (ACTIVO)

**Tipo:** Pasarela de Pagos Colombia
**Estado:** MODO TESTING (listo para producción)
**Tecnología:** ePayco PHP SDK 1.9.0

**Propósito:**
Sistema completo de suscripciones con pagos recurrentes para planes Premium/Enterprise.

**Planes Configurados:**
| Plan | Precio Mensual | Precio Anual | Casos | Consultas/Día |
|------|---------------|--------------|-------|---------------|
| Free | $0 COP | $0 COP | 3 | 10 |
| Premium Mensual | $49,900 COP | - | Ilimitados | Ilimitadas |
| Premium Anual | - | $479,900 COP | Ilimitados | Ilimitadas |

**Features Implementadas:**
- Checkout estándar de ePayco
- Webhooks de confirmación de pago
- Gestión de suscripciones activas
- Validación de límites por plan
- Historial de pagos
- Cancelación de suscripciones

**Endpoints:**
```
GET  /api/subscriptions/plans          # Listar planes
GET  /api/subscriptions/current        # Suscripción actual
POST /api/subscriptions/checkout       # Iniciar checkout
GET  /api/subscriptions/usage          # Uso actual
POST /api/subscriptions/cancel         # Cancelar suscripción
POST /api/webhooks/epayco/confirmation # Webhook confirmación
```

**Configuración en .env:**
```env
EPAYCO_PUBLIC_KEY=test_public_key_xxx
EPAYCO_PRIVATE_KEY=test_private_key_xxx
EPAYCO_TEST_MODE=true
EPAYCO_WEBHOOK_URL=https://tudominio.com/api/webhooks/epayco/confirmation
```

**Webhooks:**
- Confirmación de pago: Activa suscripción automáticamente
- Pago fallido: Notifica al usuario
- Cancelación: Desactiva suscripción

### 6.3 Google Gemini API (ACTIVO)

**Tipo:** IA Generativa
**Estado:** PRODUCCIÓN
**Modelo:** Gemini 2.5 Flash

**Propósito:**
Análisis inteligente de actuaciones judiciales y clasificación automática de autos.

**Features Implementadas:**
- Clasificación de autos judiciales:
  - Perentorio (requiere respuesta urgente)
  - Trámite (informativo)
  - Definitivo (fin del proceso)
- Detección automática de plazos y términos
- Análisis de urgencia de actuaciones
- Extracción de información relevante
- Generación de resúmenes (pendiente)

**Prompts Utilizados:**
El sistema envía el texto de la actuación judicial con instrucciones específicas para:
1. Identificar tipo de auto
2. Extraer plazos si existen
3. Determinar si requiere respuesta del abogado
4. Calcular urgencia (alta/media/baja)

**Uso en el Sistema:**
- Análisis automático al obtener nuevas actuaciones
- Clasificación en background (job queue)
- Notificaciones basadas en clasificación IA
- Detección de términos críticos

**Configuración en .env:**
```env
GEMINI_API_KEY=tu_gemini_api_key_aqui
```

**Rate Limits:**
- Gratuito: 15 requests/minuto
- Recomendación: Implementar cache agresivo

### 6.4 Resend API (CONFIGURADO)

**Tipo:** Servicio de Email Transaccional
**Estado:** CONFIGURADO (pendiente implementación completa)
**Tecnología:** Resend PHP SDK + Symfony Mailer

**Propósito:**
Envío de emails transaccionales y notificaciones automáticas.

**Emails Planificados:**
- Bienvenida al registrarse
- Confirmación de suscripción
- Notificación de actuaciones nuevas
- Recordatorios de plazos
- Reportes semanales/mensuales
- Alertas de autos perentorios

**Configuración en .env:**
```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.resend.com
MAIL_PORT=465
MAIL_USERNAME=resend
MAIL_PASSWORD=tu_resend_api_key
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@arconte.app
MAIL_FROM_NAME=Arconte

RESEND_API_KEY=re_tu_api_key_aqui
```

**Estado Actual:**
- Configuración completa
- Solo notificaciones visuales en UI implementadas
- Envío de emails: PENDIENTE

---

## 7. BASE DE DATOS

### 7.1 Esquema Principal

**Tablas Core:**
```sql
-- Usuarios
users (id, name, email, password, created_at, updated_at)

-- Casos Judiciales
case_models (
    id, user_id, radicado, tipo_proceso, clase_proceso,
    despacho, ubicacion, recurso, tipo_actuacion,
    fecha_actuacion, actuacion, estado_checked,
    has_unread, last_viewed_at, created_at, updated_at
)

-- Partes Procesales
case_parties (
    id, case_model_id, nombre, role, created_at, updated_at
)

-- Actuaciones
case_acts (
    id, case_model_id, fecha, actuacion, anotacion,
    fecha_inicio_termino, fecha_fin_termino,
    fecha_registro, clasificacion_auto, tipo_auto,
    requiere_respuesta, urgencia, plazo_dias,
    fecha_plazo, analisis_ia, created_at, updated_at
)

-- Documentos de Actuaciones
case_act_documents (
    id, case_act_id, document_url, document_type,
    file_name, file_size, downloaded_at,
    text_content, ocr_applied, created_at, updated_at
)
```

**Tablas de Suscripciones:**
```sql
-- Planes
plans (
    id, name, display_name, price_monthly, price_yearly,
    max_cases, max_daily_queries, features, is_active,
    created_at, updated_at
)

-- Suscripciones
subscriptions (
    id, user_id, plan_id, status, starts_at, ends_at,
    auto_renew, payment_method, created_at, updated_at
)

-- Pagos
payments (
    id, user_id, subscription_id, amount, currency,
    status, payment_method, epayco_ref, epayco_invoice,
    paid_at, created_at, updated_at
)

-- Seguimiento de Uso
usage_tracking (
    id, user_id, date, query_count, case_count,
    created_at, updated_at
)
```

**Tablas Adicionales:**
```sql
-- Documentos
documents (id, user_id, name, path, size, ...)

-- Recordatorios
reminders (id, user_id, case_model_id, title, ...)

-- Facturas
invoices (id, user_id, invoice_number, amount, ...)

-- Control de Tiempo
time_entries (id, user_id, case_model_id, hours, ...)

-- Marketplace
lawyers (id, user_id, specialties, bio, ...)

-- Notificaciones
notifications (id, user_id, type, data, read_at, ...)

-- Roles y Permisos (Spatie)
roles (id, name, guard_name, ...)
permissions (id, name, guard_name, ...)
model_has_roles, model_has_permissions, role_has_permissions
```

### 7.2 Migraciones Importantes

**Recientes (Octubre 2025):**
```
2025_10_11_015131 - add_last_viewed_at_to_case_models.php
2025_10_11_012925 - create_case_act_documents_table.php
2025_10_10_234139 - add_plazos_fields_to_case_acts.php
2025_10_10_233807 - add_rama_judicial_fields_to_case_models.php
2025_10_10_232206 - add_clasificacion_autos_to_case_acts_table.php
2025_10_10_210511 - add_classification_fields_to_case_acts_table.php
2025_10_10_073727 - create_usage_tracking_table.php
2025_10_10_073726 - create_payments_table.php
2025_10_10_073725 - create_subscriptions_table.php
2025_10_10_073712 - create_plans_table.php
```

### 7.3 Índices para Performance

**Índices Actuales:**
```sql
-- Índices únicos
UNIQUE (user_id, radicado) en case_models
UNIQUE (email) en users

-- Índices de búsqueda
INDEX (estado_checked) en case_models
INDEX (has_unread) en case_models
INDEX (user_id) en case_models
INDEX (case_model_id) en case_acts
INDEX (user_id, date) en usage_tracking

-- Índices recomendados adicionales
INDEX (radicado) en case_models       -- Para búsquedas sin user_id
INDEX (status) en subscriptions        -- Para filtrar activas
INDEX (tipo_auto) en case_acts         -- Para filtrar por tipo
```

### 7.4 Relaciones Eloquent

```php
// User
hasMany(CaseModel)
hasMany(Subscription)
hasMany(Document)
hasOne(Lawyer)

// CaseModel
belongsTo(User)
hasMany(CaseParty)
hasMany(CaseAct)
hasMany(Attachment)

// CaseAct
belongsTo(CaseModel)
hasMany(CaseActDocument)

// Subscription
belongsTo(User)
belongsTo(Plan)
hasMany(Payment)

// Plan
hasMany(Subscription)
```

---

## 8. FEATURES IMPLEMENTADAS

### 8.1 Autenticación y Usuarios
- Laravel Sanctum con cookies httpOnly (seguras)
- Login y registro
- Protección CSRF
- Middleware de autenticación
- Gestión de sesiones en base de datos
- Password reset (parcial)

### 8.2 Gestión de Casos Judiciales
- Crear caso ingresando número de radicado
- Consulta automática a Rama Judicial
- Normalización de datos judiciales
- Detección de novedades (has_unread)
- Marcar caso como visto (last_viewed_at)
- Auto-refresh cuando caso está procesando
- Filtros: ciudad, tipo de proceso, estado
- Refresh manual de casos
- Eliminación de casos

### 8.3 Sistema de Suscripciones
- 3 planes: Free, Premium Mensual, Premium Anual
- Integración completa con ePayco
- Webhooks de confirmación automática
- Límites por plan:
  - Free: 3 casos, 10 consultas/día
  - Premium: ilimitado
- Control de uso diario (usage_tracking)
- Middlewares de validación de límites (pendiente activar)
- UI de Pricing con cards de planes
- Checkout y respuesta de pago

### 8.4 Vigilancia Automática de Autos
- Clasificador de autos con IA (Gemini):
  - Perentorio (urgente, requiere respuesta)
  - Trámite (informativo)
  - Definitivo (cierra proceso)
- Detección automática de plazos y términos
- Extracción de texto de PDFs con OCR (Tesseract)
- Cálculo de urgencia (alta/media/baja)
- Scheduler automático de escaneo (APScheduler)
- Notificaciones visuales en UI
- Endpoints REST para análisis

### 8.5 Gestión de Documentos
- Upload de archivos adjuntos a casos
- Descarga de documentos de actuaciones judiciales
- Versionado de documentos (estructura creada)
- Gestión de documentos compartidos (estructura creada)
- Verificación SHA256 (pendiente)

### 8.6 Marketplace de Abogados
- Listado público de abogados
- Perfiles con especialidades
- Búsqueda por ciudad y especialidad
- Estadísticas de abogados
- Sistema de ratings (estructura creada)

### 8.7 Dashboard y Analytics
- Dashboard con gráficos (Recharts)
- Estadísticas de casos por estado
- Métricas de uso del sistema
- Gráficos de evolución temporal
- KPIs principales

### 8.8 Notificaciones
- Sistema de notificaciones en BD
- Detección de nuevas actuaciones
- Notificaciones visuales en UI
- Badge de contador no leídas
- Marcar como leída/todas leídas
- Notificaciones por email: PENDIENTE

### 8.9 Otras Features
- Recordatorios de tareas (modelos creados, UI pendiente)
- Control de tiempo (modelos creados, UI pendiente)
- Facturación (modelos creados, UI básica)
- IA Chat Assistant (endpoints creados, UI pendiente)
- Generación de documentos con IA (pendiente)

---

## 9. SEGURIDAD

### 9.1 Autenticación con Laravel Sanctum
- Sistema basado en cookies httpOnly (no tokens en localStorage)
- CSRF protection automático
- Sessions almacenadas en base de datos
- Sanctum SPA authentication
- Middleware auth:sanctum en rutas protegidas

**Configuración CORS:**
```php
// config/cors.php
'paths' => ['api/*', 'sanctum/csrf-cookie'],
'allowed_origins' => [env('APP_FRONTEND_URL', 'http://localhost:3000')],
'supports_credentials' => true,
```

**Flujo de Autenticación:**
1. Frontend solicita CSRF cookie: GET /sanctum/csrf-cookie
2. Frontend envía login: POST /api/auth/login (con CSRF token)
3. Backend valida credenciales y crea sesión
4. Backend retorna cookie httpOnly con sesión
5. Todas las peticiones subsecuentes incluyen cookie automáticamente

### 9.2 Políticas de Autorización (Spatie Permission)
- Sistema de roles y permisos con Spatie
- Policies para CaseModel, Document, Invoice, etc.
- Middleware role y permission
- Gates personalizados

**Roles Disponibles:**
- admin: Acceso total
- user: Usuario regular
- lawyer: Abogado con perfil público

**Permisos Principales:**
- view-any-case, view-case
- create-case, update-case, delete-case
- manage-subscription
- view-analytics

### 9.3 Security Headers
```php
// app/Http/Middleware/SecurityHeaders.php
'X-Content-Type-Options' => 'nosniff',
'X-Frame-Options' => 'SAMEORIGIN',
'X-XSS-Protection' => '1; mode=block',
'Referrer-Policy' => 'strict-origin-when-cross-origin',
'Content-Security-Policy' => "default-src 'self'",
```

### 9.4 Rate Limiting
- Rate limiting global por IP: 60 requests/minuto
- Rate limiting por usuario autenticado: 100 requests/minuto
- Middleware RateLimitByPlan (pendiente implementar)
- Límites de ePayco: según plan del usuario

### 9.5 Validación de Entrada
- FormRequest personalizado en cada endpoint crítico
- Sanitización de inputs
- Validación de tipos de archivo en uploads
- Máximo tamaño de archivos configurado

### 9.6 Protección de Datos Sensibles
- Credenciales en .env (no commiteadas)
- API keys rotadas y actualizadas
- Passwords hasheados con bcrypt
- Soft deletes para recuperación de datos
- Backups automáticos (pendiente configurar)

### 9.7 Problemas de Seguridad Identificados

**CRÍTICO:**
- Servicio Python Ingest SIN autenticación (no valida X-API-Key)
  - Solución: Implementar middleware verify_api_key en FastAPI

**MEDIO:**
- Endpoints debug expuestos en producción
  - Solución: Proteger con app()->environment('local')

---

## 10. DESPLIEGUE

### 10.1 Proceso de Deployment (Recomendado)

**Pre-requisitos de Producción:**
- Servidor con PHP 8.2+, Node.js 18+, Python 3.11+
- PostgreSQL 16
- Redis 7
- Nginx o Apache
- SSL/TLS (Let's Encrypt)
- Supervisor (para queue workers)

**Pasos de Deployment:**

1. **Preparar Servidor**
```bash
# Instalar dependencias
sudo apt update
sudo apt install php8.2 php8.2-fpm php8.2-pgsql php8.2-redis
sudo apt install postgresql-16 redis-server
sudo apt install nginx certbot
```

2. **Clonar y Configurar Backend**
```bash
cd /var/www
git clone <repo-url> arconte
cd arconte/apps/api_php
composer install --no-dev --optimize-autoloader
cp .env.production .env
php artisan key:generate
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

3. **Configurar .env de Producción**
```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://arconte.app

DB_CONNECTION=pgsql
DB_HOST=localhost
DB_DATABASE=arconte_prod
DB_USERNAME=arconte_prod
DB_PASSWORD=secure_password_here

QUEUE_CONNECTION=database
CACHE_STORE=redis
SESSION_DRIVER=database

# APIs con credenciales reales
GEMINI_API_KEY=prod_key
EPAYCO_PUBLIC_KEY=prod_key
EPAYCO_PRIVATE_KEY=prod_key
EPAYCO_TEST_MODE=false
```

4. **Build de Frontend**
```bash
cd /var/www/arconte/apps/web
npm install
npm run build
# Servir desde dist/ con Nginx
```

5. **Configurar Queue Worker con Supervisor**
```ini
[program:arconte-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/arconte/apps/api_php/artisan queue:work database --sleep=3 --tries=3 --timeout=120
autostart=true
autorestart=true
user=www-data
numprocs=2
redirect_stderr=true
stdout_logfile=/var/www/arconte/worker.log
```

6. **Configurar Nginx**
```nginx
server {
    listen 80;
    server_name arconte.app;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name arconte.app;

    ssl_certificate /etc/letsencrypt/live/arconte.app/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/arconte.app/privkey.pem;

    root /var/www/arconte/apps/web/dist;
    index index.html;

    # Frontend SPA
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Ingest Python
    location /ingest {
        proxy_pass http://127.0.0.1:8001;
    }
}
```

7. **Iniciar Servicios**
```bash
sudo systemctl start postgresql
sudo systemctl start redis
sudo systemctl start nginx
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start arconte-worker:*
```

### 10.2 Comandos de Producción

```bash
# Deployment
git pull origin main
composer install --no-dev
php artisan migrate --force
php artisan cache:clear
php artisan config:cache
php artisan route:cache
npm run build
sudo supervisorctl restart arconte-worker:*

# Monitoreo
tail -f storage/logs/laravel.log
sudo supervisorctl status
systemctl status postgresql
systemctl status redis
```

### 10.3 Checklist de Producción

**Seguridad:**
- [ ] APP_DEBUG=false
- [ ] Variables de entorno seguras
- [ ] SSL/TLS configurado
- [ ] Firewall habilitado
- [ ] Autenticación Python implementada
- [ ] Endpoints debug deshabilitados

**Performance:**
- [ ] Cache de config/routes/views
- [ ] QUEUE_CONNECTION=database
- [ ] Queue workers corriendo
- [ ] Redis configurado
- [ ] Índices de BD optimizados

**Backups:**
- [ ] Backup diario de PostgreSQL
- [ ] Backup de archivos adjuntos
- [ ] Logs rotación configurada

---

## 11. TESTING

### 11.1 Testing Backend (PHPUnit)

**Comandos:**
```bash
php artisan test
php artisan test --filter=CaseTest
php artisan test --coverage
```

**Tests Existentes:**
- Feature/AuthTest.php
- Feature/CaseTest.php (básico)

**Tests Pendientes:**
- Sistema de suscripciones
- Webhooks de ePayco
- Clasificación de autos
- Rate limiting
- Políticas de autorización

### 11.2 Testing Frontend (Vitest)

**Comandos:**
```bash
npm run test
npm run test:watch
npm run test:coverage
```

**Tests Pendientes:**
- Componentes de UI
- Integración con API
- Flujos de autenticación
- Estados de loading/error

### 11.3 Testing de Integración

**Manual Testing Checklist:**
- [ ] Login/logout funcionando
- [ ] Crear caso con radicado real
- [ ] Auto-refresh de casos procesando
- [ ] Clasificación de autos con IA
- [ ] Checkout de suscripción
- [ ] Webhooks de ePayco
- [ ] Límites de plan Free
- [ ] Upload de documentos
- [ ] Marketplace de abogados

---

## 12. TROUBLESHOOTING

### 12.1 Problema: Frontend no conecta con Backend

**Síntomas:**
- Error CORS en consola
- 401 Unauthorized
- Cookies no se envían

**Soluciones:**
```bash
# 1. Verificar CORS en Laravel
# config/cors.php debe tener:
'supports_credentials' => true,
'allowed_origins' => ['http://localhost:3000'],

# 2. Verificar .env frontend
VITE_API_URL=http://localhost:8000

# 3. Solicitar CSRF cookie antes de login
GET /sanctum/csrf-cookie

# 4. Verificar configuración Axios
axios.defaults.withCredentials = true
```

### 12.2 Problema: Casos se quedan "Procesando..."

**Síntomas:**
- Caso con estado_checked=false permanentemente
- No se obtienen actuaciones

**Soluciones:**
```bash
# 1. Verificar servicio Python corriendo
curl http://127.0.0.1:8001/healthz

# 2. Verificar logs de Python
cd apps/ingest_py
tail -f logs/ingest.log

# 3. Verificar queue worker corriendo
cd apps/api_php
php artisan queue:work --verbose

# 4. Ver jobs fallidos
php artisan queue:failed

# 5. Reintentar job
php artisan queue:retry <job_id>
```

### 12.3 Problema: Queue Worker no procesa Jobs

**Síntomas:**
- Jobs se quedan en tabla jobs
- FetchCaseData no se ejecuta

**Soluciones:**
```bash
# 1. Verificar QUEUE_CONNECTION
# .env debe tener:
QUEUE_CONNECTION=database

# 2. Verificar tabla jobs existe
php artisan queue:table
php artisan migrate

# 3. Iniciar worker manualmente
php artisan queue:work --verbose --tries=3

# 4. Verificar Redis corriendo
redis-cli ping
# Respuesta esperada: PONG
```

### 12.4 Problema: Servicio Python no responde

**Síntomas:**
- Error "ingest_unreachable"
- Timeout en consultas

**Soluciones:**
```bash
# 1. Verificar puerto 8001
netstat -ano | findstr 8001

# 2. Reiniciar servicio
cd apps/ingest_py
python run_persistent.py

# 3. Verificar Playwright instalado
playwright install chromium

# 4. Test manual del scraper
curl http://127.0.0.1:8001/normalized/73001600045020220057700
```

### 12.5 Problema: Base de Datos no conecta

**Síntomas:**
- SQLSTATE[08006]
- Connection refused

**Soluciones:**
```bash
# 1. Verificar PostgreSQL corriendo
docker ps | findstr postgres

# 2. Verificar credenciales .env
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432

# 3. Reiniciar Docker
docker-compose down
docker-compose up -d

# 4. Test conexión
php artisan tinker
>>> DB::connection()->getPdo();
```

### 12.6 Problema: ePayco webhook no llega

**Síntomas:**
- Pago exitoso pero suscripción no activa
- No se registra en tabla payments

**Soluciones:**
```bash
# 1. Verificar URL del webhook en ePayco dashboard
# Debe apuntar a: https://tudominio.com/api/webhooks/epayco/confirmation

# 2. Verificar logs de Laravel
tail -f storage/logs/laravel.log

# 3. Test manual del webhook
POST /api/webhooks/epayco/confirmation
Content-Type: application/x-www-form-urlencoded

x_transaction_id=123456
x_ref_payco=REF123
x_amount=49900
x_response=Aceptada

# 4. Verificar tabla payments
php artisan tinker
>>> App\Models\Payment::latest()->get();
```

---

## 13. PRÓXIMOS PASOS

### 13.1 Correcciones Críticas (Prioridad ALTA)
- [ ] Cambiar QUEUE_CONNECTION a database
- [ ] Implementar autenticación en servicio Python (X-API-Key)
- [ ] Crear migraciones: queue:table y queue:batches-table
- [ ] Agregar campo last_viewed_at a $fillable en CaseModel
- [ ] Crear índice en campo radicado

### 13.2 Mejoras de Código (Prioridad MEDIA)
- [ ] Crear CaseUpdateService (eliminar duplicación)
- [ ] Implementar RateLimitByPlan middleware
- [ ] Validar límites de casos al crear
- [ ] Implementar observers de cache
- [ ] Proteger endpoints debug con environment check
- [ ] Mejorar manejo de errores en IngestClient

### 13.3 Features Pendientes (Prioridad MEDIA)
- [ ] Notificaciones por email (Resend configurado)
- [ ] WebSockets para notificaciones en tiempo real
- [ ] IA Generativa para documentos legales
- [ ] Control de tiempo con timer en tiempo real
- [ ] Generación de PDFs de facturas
- [ ] Búsqueda de jurisprudencia (API datos.gov.co)

### 13.4 Testing (Prioridad MEDIA)
- [ ] Tests de autenticación
- [ ] Tests de suscripciones
- [ ] Tests de webhooks ePayco
- [ ] Tests de clasificación de autos
- [ ] Tests E2E con Playwright
- [ ] CI/CD con GitHub Actions

### 13.5 DevOps y Producción (Prioridad BAJA)
- [ ] Configurar Supervisor para queue workers
- [ ] Implementar logs centralizados
- [ ] Configurar backups automáticos
- [ ] Implementar monitoring (New Relic/Sentry)
- [ ] Configurar CI/CD pipeline
- [ ] Documentar proceso de deployment
- [ ] Crear runbook de troubleshooting

### 13.6 Optimizaciones (Prioridad BAJA)
- [ ] Implementar caching agresivo de consultas Rama Judicial
- [ ] Optimizar queries N+1 en listado de casos
- [ ] Implementar lazy loading en frontend
- [ ] Minificar y optimizar assets
- [ ] Implementar CDN para archivos estáticos

---

## 14. CONTACTO Y SOPORTE

### 14.1 URLs del Proyecto
- **Repositorio:** https://github.com/1128026Go/Arconte
- **Frontend Dev:** http://localhost:3000
- **Backend Dev:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs
- **Ingest API:** http://localhost:8001

### 14.2 Documentación Adicional
- ARCONTE_INFORME_COMPLETO.md - Informe técnico completo
- ARCONTE_DOCS.md - Documentación general del sistema
- PLAN_MAESTRO_IMPLEMENTACION.md - Roadmap y planificación
- TESTING_COMPLETO.md - Guía de testing
- docs/features/ - Documentación de features específicas

### 14.3 Credenciales de Desarrollo
```
Usuario Admin:
Email: admin@juridica.test
Password: admin123

Usuario Test:
Email: test@arconte.com
Password: password123
```

---

**FIN DE LA DOCUMENTACIÓN MAESTRA**

*Este documento es la fuente de verdad para el proyecto Arconte.*
*Mantener actualizado con cada cambio significativo.*

**Última actualización:** 2025-10-14
**Próxima revisión:** Al completar cada fase de correcciones
**Mantenedor:** Equipo Arconte
