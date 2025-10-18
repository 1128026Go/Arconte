# 🔐 Guía Completa de Variables de Entorno - Arconte

Documentación de **TODAS** las variables de entorno necesarias para cada aplicación del proyecto.

---

## 📋 Tabla de Contenidos

- [Backend (Laravel)](#backend-laravel---api_php)
- [Frontend (React)](#frontend-react---web)
- [Ingest Service (Python)](#ingest-service-python---ingest_py)
- [Variables Compartidas](#variables-compartidas-críticas)
- [Setup Rápido](#setup-rápido)
- [Troubleshooting](#troubleshooting)

---

## 🔧 Backend (Laravel) - `api_php`

**Archivo:** `apps/api_php/.env`
**Template:** `apps/api_php/.env.example`

### Variables Críticas (REQUERIDAS)

| Variable | Descripción | Valor Dev | Valor Prod |
|----------|-------------|-----------|------------|
| `APP_KEY` | Clave de encriptación Laravel | Generar: `php artisan key:generate` | Generar nuevo |
| `DB_CONNECTION` | Tipo de base de datos | `pgsql` | `pgsql` |
| `DB_DATABASE` | Nombre de la base de datos | `arconte` | `arconte_prod` |
| `DB_USERNAME` | Usuario de PostgreSQL | `arconte` | `arconte_prod` |
| `DB_PASSWORD` | Contraseña de PostgreSQL | `arconte_secure_2025` | **CAMBIAR** |
| `SESSION_DRIVER` | Driver de sesiones | `database` | `database` |
| `SANCTUM_STATEFUL_DOMAINS` | Dominios para auth | `localhost:3000` | `app.arconte.com` |
| `APP_FRONTEND_URL` | URL del frontend | `http://localhost:3000` | `https://app.arconte.com` |
| `INGEST_API_KEY` | Key del servicio Python | Ver valor en `.env.example` | **CAMBIAR** |

### Variables de Autenticación

```env
# Configuración crítica para Sanctum
SESSION_DRIVER=database                    # NO cambiar
SESSION_SAME_SITE=lax                      # Requerido para cross-domain
SESSION_DOMAIN=localhost                   # En prod: .tudominio.com
SESSION_SECURE_COOKIE=false                # true en HTTPS
SANCTUM_STATEFUL_DOMAINS=localhost:3000    # En prod: app.arconte.com
```

### Variables de Integraciones

```env
# Google Gemini AI
GEMINI_API_KEY=                            # Obtener en makersuite.google.com

# ePayco Payment Gateway
EPAYCO_PUBLIC_KEY=                         # Dashboard ePayco
EPAYCO_PRIVATE_KEY=                        # Dashboard ePayco
EPAYCO_TEST_MODE=true                      # false en producción
```

### Variables de Email

```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=tu-email@gmail.com
MAIL_PASSWORD=                             # App password de Gmail
MAIL_ENCRYPTION=tls
```

### Checklist de Producción

- [ ] `APP_ENV=production`
- [ ] `APP_DEBUG=false`
- [ ] `SESSION_SECURE_COOKIE=true`
- [ ] Cambiar todas las contraseñas
- [ ] `EPAYCO_TEST_MODE=false`
- [ ] Configurar backups
- [ ] `php artisan config:cache`
- [ ] `php artisan route:cache`

**📚 Documentación completa:** `apps/api_php/.env.example`

---

## ⚛️ Frontend (React) - `web`

**Archivo:** `apps/web/.env`
**Template:** `apps/web/.env.example`

### Variables Críticas (REQUERIDAS)

| Variable | Descripción | Valor Dev | Valor Prod |
|----------|-------------|-----------|------------|
| `VITE_API_URL` | URL del backend Laravel | `http://public.test/api` | `https://api.arconte.com/api` |
| `VITE_APP_URL` | URL pública del frontend | `http://localhost:3000` | `https://app.arconte.com` |
| `VITE_APP_NAME` | Nombre de la aplicación | `"Arconte"` | `"Arconte"` |

### Variables Opcionales

```env
# Feature Flags
VITE_DEBUG_MODE=false                      # Debug en consola
VITE_DEMO_MODE=false                       # Datos ficticios

# Analytics
VITE_GA_ID=                                # Google Analytics
VITE_SENTRY_DSN=                           # Sentry para errores

# UI/UX
VITE_DEFAULT_THEME=light                   # light/dark
VITE_DEFAULT_LOCALE=es                     # es/en
VITE_SESSION_TIMEOUT=120                   # Minutos
```

### Notas Importantes

⚠️ **TODAS las variables deben empezar con `VITE_`** para ser accesibles en el código.

⚠️ **NO incluir secretos** - El código es público en el bundle del navegador.

⚠️ **Restart requerido** - Los cambios en `.env` requieren reiniciar `npm run dev`.

### Checklist de Producción

- [ ] `VITE_API_URL` apunta a API de producción
- [ ] `VITE_APP_URL` es el dominio público
- [ ] `VITE_DEBUG_MODE=false`
- [ ] `VITE_DEMO_MODE=false`
- [ ] Configurar analytics (opcional)
- [ ] `npm run build`
- [ ] Verificar `/dist`

**📚 Documentación completa:** `apps/web/.env.example`

---

## 🐍 Ingest Service (Python) - `ingest_py`

**Archivo:** `apps/ingest_py/.env`
**Template:** `apps/ingest_py/.env.example`

### Variables Críticas (REQUERIDAS)

| Variable | Descripción | Valor Dev | Valor Prod |
|----------|-------------|-----------|------------|
| `INGEST_API_KEY` | Key compartida con Laravel | Ver `.env.example` | **CAMBIAR** (debe coincidir con backend) |
| `PORT` | Puerto del servicio | `8001` | `8001` |
| `HOST` | IP de escucha | `127.0.0.1` | `0.0.0.0` |
| `LARAVEL_API_URL` | URL del backend Laravel | `http://localhost:8000/api` | `https://api.arconte.com/api` |
| `GEMINI_API_KEY` | API key de Gemini | Obtener en Google | **Requerido** |

### Variables de Scraping (Rama Judicial)

```env
RAMA_JUDICIAL_URL=https://consultaprocesos.ramajudicial.gov.co
RAMA_JUDICIAL_TIMEOUT=30                   # Segundos
RAMA_JUDICIAL_MAX_RETRIES=3                # Reintentos
RAMA_JUDICIAL_DELAY=2                      # Delay entre requests
```

### Variables de Scheduler

```env
SCHEDULER_ENABLED=true                     # Auto-start
SCHEDULER_CHECK_INTERVAL=60                # Minutos
SCHEDULER_START_HOUR=8                     # 24h format
SCHEDULER_END_HOUR=20                      # 24h format
```

### Variables de Playwright

```env
PLAYWRIGHT_HEADLESS=true                   # true en producción
PLAYWRIGHT_BROWSER=chromium                # chromium/firefox/webkit
PLAYWRIGHT_TIMEOUT=30000                   # Milisegundos
```

### Variables de Performance

```env
MAX_BATCH_SIZE=10                          # Casos por lote
MAX_WORKERS=3                              # Workers concurrentes
PROCESS_TIMEOUT=60                         # Segundos por caso
```

### Checklist de Producción

- [ ] Cambiar `INGEST_API_KEY` (sincronizar con backend)
- [ ] `ENVIRONMENT=production`
- [ ] `LOG_LEVEL=WARNING`
- [ ] `PLAYWRIGHT_HEADLESS=true`
- [ ] `AUTO_RELOAD=false`
- [ ] `DEBUG_ENDPOINTS=false`
- [ ] Configurar `GEMINI_API_KEY`
- [ ] Ajustar límites de recursos
- [ ] Configurar alertas

**📚 Documentación completa:** `apps/ingest_py/.env.example`

---

## 🔗 Variables Compartidas (CRÍTICAS)

Estas variables **DEBEN COINCIDIR** entre aplicaciones:

### 1. API Key del Ingest Service

```env
# apps/api_php/.env
INGEST_API_KEY=5d95c7ed99d196f47c374cc04c7cf77c2235a29b67dc85baa573f3bb815024b1

# apps/ingest_py/.env
INGEST_API_KEY=5d95c7ed99d196f47c374cc04c7cf77c2235a29b67dc85baa573f3bb815024b1
```

⚠️ **DEBEN SER IDÉNTICOS** - Si no coinciden, la comunicación fallará.

### 2. URLs de Comunicación

```env
# apps/api_php/.env
APP_FRONTEND_URL=http://localhost:3000      # URL del frontend
INGEST_BASE_URL=http://127.0.0.1:8001       # URL del servicio Python

# apps/web/.env
VITE_API_URL=http://localhost:8000/api      # URL del backend

# apps/ingest_py/.env
LARAVEL_API_URL=http://localhost:8000/api   # URL del backend
```

### 3. Gemini API Key (Opcional pero recomendado)

```env
# apps/api_php/.env
GEMINI_API_KEY=tu_api_key_aqui

# apps/ingest_py/.env
GEMINI_API_KEY=tu_api_key_aqui
```

Pueden ser iguales o diferentes según el plan de facturación.

---

## 🚀 Setup Rápido

### 1. Backend (Laravel)

```bash
cd apps/api_php
cp .env.example .env
php artisan key:generate
# Editar .env con tus valores
php artisan migrate
```

### 2. Frontend (React)

```bash
cd apps/web
cp .env.example .env
# Editar .env con URL del backend
npm install
npm run dev
```

### 3. Ingest Service (Python)

```bash
cd apps/ingest_py
cp .env.example .env
# Editar .env (importante: INGEST_API_KEY debe coincidir con backend)
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python run_persistent.py
```

### Verificación

```bash
# Backend health check
curl http://localhost:8000/api/health/external

# Ingest health check
curl http://localhost:8001/health

# Frontend
# Abrir http://localhost:3000
```

---

## 🐛 Troubleshooting

### Error: "Unauthenticated" en frontend

**Causa:** Configuración incorrecta de CORS/Sanctum

**Solución:**
1. Verificar `SANCTUM_STATEFUL_DOMAINS` en backend
2. Verificar `SESSION_SAME_SITE=lax`
3. Ver: `docs/troubleshooting/cors_auth.md`

### Error: Ingest service no responde

**Causa:** `INGEST_API_KEY` no coincide

**Solución:**
1. Comparar valores en `apps/api_php/.env` y `apps/ingest_py/.env`
2. Deben ser **EXACTAMENTE** iguales
3. Reiniciar ambos servicios

### Error: Gemini API no funciona

**Causa:** API key inválida o no configurada

**Solución:**
1. Obtener key en: https://makersuite.google.com/app/apikey
2. Agregar a `GEMINI_API_KEY` en backend y/o ingest
3. Verificar límites de cuota

### Error: Database connection failed

**Causa:** PostgreSQL no está corriendo o credenciales incorrectas

**Solución:**
1. Verificar que PostgreSQL esté corriendo
2. Verificar credenciales en `apps/api_php/.env`
3. Ejecutar: `php artisan migrate` para crear tablas

---

## 📊 Comparativa de Variables

| Categoría | Backend | Frontend | Ingest | Total |
|-----------|---------|----------|--------|-------|
| Críticas | 8 | 3 | 5 | 16 |
| Opcionales | 15+ | 8 | 20+ | 43+ |
| Compartidas | 3 | 1 | 2 | - |

---

## 🔐 Seguridad

### Secretos que NUNCA deben estar en Git

- ❌ `APP_KEY`
- ❌ `DB_PASSWORD`
- ❌ `GEMINI_API_KEY`
- ❌ `EPAYCO_PRIVATE_KEY`
- ❌ `MAIL_PASSWORD`
- ❌ Cualquier API key real

### ✅ Buenas Prácticas

1. **Usar `.env.example`** como template (sin secretos)
2. **Agregar `.env` a `.gitignore`** (ya incluido)
3. **Rotar secretos** periódicamente en producción
4. **Usar diferentes keys** para dev/staging/prod
5. **Almacenar secretos** en un gestor (1Password, AWS Secrets Manager, etc.)

---

## 📚 Referencias

- **Backend:** `apps/api_php/.env.example` - Documentación completa con 148 líneas
- **Frontend:** `apps/web/.env.example` - Documentación completa con 101 líneas
- **Ingest:** `apps/ingest_py/.env.example` - Documentación completa con 212 líneas
- **Setup:** `docs/setup/config_congelada.md` - Configuración de producción
- **Getting Started:** `docs/getting-started/guia_rapida.md` - Inicio rápido

---

## 🎯 Comandos Útiles

```bash
# Generar nueva APP_KEY (Laravel)
cd apps/api_php && php artisan key:generate

# Generar INGEST_API_KEY segura
openssl rand -hex 32

# Validar configuración de Laravel
cd apps/api_php && php artisan config:show

# Limpiar cache de config (después de cambios)
cd apps/api_php && php artisan config:clear

# Verificar variables de Vite (frontend)
cd apps/web && npm run dev -- --debug
```

---

*Última actualización: 2025-10-17*
*Mantenedor: Equipo Arconte*
*Versión: 1.0*
