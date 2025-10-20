# 🛠️ Arconte - Developer Quickstart Guide

**Objetivo:** Levantar el proyecto en menos de 30 minutos.

---

## ⚡ Quick Start (5 minutos)

```bash
# 1. Clonar repositorio
git clone https://github.com/1128026Go/Arconte.git
cd "Aplicacion Juridica"

# 2. Copiar variables de entorno
cp apps/api_php/.env.example apps/api_php/.env
cp apps/ingest_py/.env.example apps/ingest_py/.env

# 3. Instalar dependencias
cd apps/api_php && composer install && cd ../..
cd apps/web && npm install && cd ../..

# 4. Configurar base de datos
cd apps/api_php
php artisan key:generate
php artisan migrate --seed
cd ../..

# 5. Iniciar servicios (Windows)
.\scripts\dev\start-all.bat

# 5. Iniciar servicios (Linux/macOS)
# Terminal 1: cd apps/api_php && php artisan serve
# Terminal 2: cd apps/web && npm run dev
# Terminal 3: cd apps/ingest_py && python run_persistent.py
```

**Acceso:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Python Service: http://localhost:8001
- Credenciales: `admin@juridica.test` / `admin123`

---

## 📋 Prerrequisitos

### Versiones Requeridas:

| Herramienta | Versión Mínima | Recomendada | Verificar |
|------------|----------------|-------------|-----------|
| **PHP** | 8.2 | 8.4 | `php -v` |
| **Composer** | 2.6 | 2.8+ | `composer -V` |
| **Node.js** | 20.x | 22.x | `node -v` |
| **npm** | 10.x | 10.x | `npm -v` |
| **Python** | 3.11 | 3.11 | `python --version` |
| **PostgreSQL** | 14 | 16 | `psql --version` |
| **Redis** | 7.0 | 7.2 | `redis-cli --version` |

### Extensiones PHP Requeridas:

```bash
# Verificar extensiones instaladas
php -m | grep -E 'pdo_pgsql|pgsql|redis|mbstring|xml|curl|zip|gd'
```

**Extensiones necesarias:**
- `pdo_pgsql` - PostgreSQL driver
- `pgsql` - PostgreSQL functions
- `redis` - Redis cache
- `mbstring` - Multibyte string
- `xml` - XML parsing
- `curl` - HTTP requests
- `zip` - Archive handling
- `gd` - Image processing

### Paquetes Python Requeridos:

```bash
cd apps/ingest_py
pip install -r requirements.txt
```

---

## 🔧 Configuración Detallada

### 1. Base de Datos PostgreSQL

**Crear base de datos:**
```sql
-- Conectar a PostgreSQL
psql -U postgres

-- Crear base de datos
CREATE DATABASE arconte_dev;
CREATE USER arconte_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE arconte_dev TO arconte_user;
```

**Configurar en `.env`:**
```env
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=arconte_dev
DB_USERNAME=arconte_user
DB_PASSWORD=secure_password
```

### 2. Redis

**Verificar Redis corriendo:**
```bash
redis-cli ping
# Debe responder: PONG
```

**Configurar en `.env`:**
```env
REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379
```

### 3. Variables de Entorno Críticas

**Laravel (`apps/api_php/.env`):**
```env
APP_NAME=Arconte
APP_ENV=local
APP_KEY=base64:... # Generado con php artisan key:generate
APP_DEBUG=true
APP_URL=http://localhost:8000

# Base de datos
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=arconte_dev
DB_USERNAME=arconte_user
DB_PASSWORD=secure_password

# Redis
REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379

# Queue
QUEUE_CONNECTION=database

# Microservicio Python
INGEST_BASE_URL=http://127.0.0.1:8001
INGEST_API_KEY=5d95c7ed99d196f47c374cc04c7cf77c2235a29b67dc85baa573f3bb815024b1
INGEST_TIMEOUT=45
INGEST_RETRIES=2

# Gemini AI (opcional para features IA)
GEMINI_API_KEY=your_gemini_api_key_here

# CORS
SANCTUM_STATEFUL_DOMAINS=localhost:3000
SESSION_DOMAIN=localhost
```

**Python (`apps/ingest_py/.env`):**
```env
# API Key compartida con Laravel
INGEST_API_KEY=5d95c7ed99d196f47c374cc04c7cf77c2235a29b67dc85baa573f3bb815024b1

# Puerto del servidor
PORT=8001
HOST=127.0.0.1
```

**React (`apps/web/.env`):**
```env
VITE_API_URL=http://localhost:8000
VITE_INGEST_URL=http://localhost:8001
```

---

## 🚨 Troubleshooting

### Problema 1: "SQLSTATE[08006] could not connect to server"

**Causa:** PostgreSQL no está corriendo o credenciales incorrectas.

**Solución:**
```bash
# Windows
net start postgresql-x64-16

# Linux/macOS
sudo systemctl start postgresql
# o
brew services start postgresql@16

# Verificar conexión
psql -U postgres -h localhost
```

### Problema 2: "Class 'Redis' not found"

**Causa:** Extensión PHP Redis no instalada.

**Solución:**
```bash
# Windows (via PECL)
pecl install redis

# Linux/macOS
sudo apt-get install php-redis  # Ubuntu/Debian
brew install php-redis          # macOS

# Verificar
php -m | grep redis
```

### Problema 3: "Vite: Failed to resolve import"

**Causa:** Dependencias de Node.js no instaladas o corruptas.

**Solución:**
```bash
cd apps/web
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Problema 4: "python: command not found"

**Causa:** Python no está en PATH o no instalado.

**Solución:**
```bash
# Verificar instalación
python --version
python3 --version

# Windows: Descargar de python.org
# Linux: sudo apt-get install python3.11
# macOS: brew install python@3.11

# Crear alias (Linux/macOS)
echo "alias python=python3" >> ~/.bashrc
source ~/.bashrc
```

### Problema 5: "CORS policy: No 'Access-Control-Allow-Origin'"

**Causa:** Configuración CORS incorrecta en Laravel.

**Solución:**
```bash
# Verificar apps/api_php/config/cors.php
php artisan config:clear
php artisan cache:clear

# Verificar .env
SANCTUM_STATEFUL_DOMAINS=localhost:3000
SESSION_DOMAIN=localhost
```

**Archivo `config/cors.php` debe tener:**
```php
'allowed_origins' => ['http://localhost:3000'],
'allowed_origins_patterns' => [],
'allowed_headers' => ['*'],
'allowed_methods' => ['*'],
'supports_credentials' => true,
```

---

## 🧪 Testing Rápido

### Verificar Backend (Laravel)

```bash
cd apps/api_php

# Health check
curl http://localhost:8000/api/health
# Debe responder: {"status":"ok"}

# Test autenticación
php artisan tinker
>>> User::first()
>>> exit

# Ejecutar tests
php artisan test
```

### Verificar Frontend (React)

```bash
cd apps/web

# Verificar compilación
npm run build

# Verificar tests (si existen)
npm run test
```

### Verificar Python Service

```bash
# Health check
curl http://localhost:8001/healthz
# Debe responder: {"ok":true}

# Test con API Key
curl -H "X-API-Key: 5d95c7ed99d196f47c374cc04c7cf77c2235a29b67dc85baa573f3bb815024b1" \
  http://localhost:8001/metrics
```

### Verificar Integración Completa

**1. Login en frontend:**
```
Abrir: http://localhost:3000/login
Usuario: admin@juridica.test
Password: admin123
```

**2. Crear caso de prueba:**
- Dashboard → Nuevo Caso
- Radicado: `11001-31-03-001-2023-00001-00`
- Guardar

**3. Verificar en base de datos:**
```bash
cd apps/api_php
php artisan tinker
>>> \App\Models\CaseModel::count()
# Debe retornar: 1
```

---

## 📊 Verificación de Servicios

### Script de Health Check Completo

```bash
# Crear archivo: scripts/health-check.sh
#!/bin/bash

echo "🔍 Verificando servicios..."
echo ""

# PostgreSQL
pg_isready -h localhost -p 5432 && echo "✅ PostgreSQL: OK" || echo "❌ PostgreSQL: FAIL"

# Redis
redis-cli ping > /dev/null && echo "✅ Redis: OK" || echo "❌ Redis: FAIL"

# Laravel
curl -s http://localhost:8000/api/health | grep -q "ok" && echo "✅ Laravel: OK" || echo "❌ Laravel: FAIL"

# React
curl -s http://localhost:3000 > /dev/null && echo "✅ React: OK" || echo "❌ React: FAIL"

# Python
curl -s http://localhost:8001/healthz | grep -q "ok" && echo "✅ Python: OK" || echo "❌ Python: FAIL"

echo ""
echo "🎯 Verificación completa"
```

**Uso:**
```bash
chmod +x scripts/health-check.sh
./scripts/health-check.sh
```

---

## 🔄 Comandos Útiles para Desarrollo

### Laravel

```bash
cd apps/api_php

# Limpiar cachés
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear

# Recrear base de datos
php artisan migrate:fresh --seed

# Ver logs en tiempo real
tail -f storage/logs/laravel.log

# Queue worker (desarrollo)
php artisan queue:work --tries=3 --timeout=90

# Tinker (REPL)
php artisan tinker
```

### React

```bash
cd apps/web

# Desarrollo con hot reload
npm run dev

# Build de producción
npm run build

# Preview build
npm run preview

# Linter
npm run lint
```

### Python

```bash
cd apps/ingest_py

# Servidor de desarrollo
python run_persistent.py

# Con auto-reload (requiere uvicorn)
uvicorn src.main:app --reload --port 8001

# Ver logs
# Los logs se muestran en consola directamente
```

---

## 📚 Recursos Adicionales

### Documentación del Proyecto

- **[ARCONTE_DOCUMENTACION_MAESTRA.md](ARCONTE_DOCUMENTACION_MAESTRA.md)** - Documentación completa
- **[FASE_0_COMPLETADA.md](FASE_0_COMPLETADA.md)** - Correcciones críticas implementadas
- **[docs/](docs/)** - Documentación detallada por categorías

### Arquitectura

```
Aplicacion Juridica/
├── apps/
│   ├── api_php/          # Backend Laravel 11
│   ├── web/              # Frontend React + Vite
│   └── ingest_py/        # Microservicio Python (FastAPI)
├── scripts/
│   ├── dev/              # Scripts de desarrollo
│   └── maintenance/      # Scripts de mantenimiento
└── docs/                 # Documentación
```

### Stack Tecnológico

**Backend:**
- Laravel 11 (PHP 8.4)
- PostgreSQL 16
- Redis 7.2
- Sanctum (Autenticación)

**Frontend:**
- React 18
- Vite 5
- Tailwind CSS 3
- React Router 6

**Microservicio:**
- Python 3.11
- FastAPI
- Uvicorn

**AI:**
- Gemini 2.5 Flash

---

## ⏱️ Tiempo Estimado de Setup

| Paso | Tiempo |
|------|--------|
| Prerrequisitos instalados | 0 min (asumido) |
| Clonar repo + dependencias | 5-10 min |
| Configuración DB + .env | 5 min |
| Migraciones + seed | 2 min |
| Iniciar servicios | 1 min |
| Verificación | 2 min |
| **TOTAL** | **15-20 min** ✅ |

**Meta:** <30 minutos para un developer nuevo

---

## 🆘 ¿Necesitas Ayuda?

1. **Revisar logs:**
   - Laravel: `apps/api_php/storage/logs/laravel.log`
   - Python: Consola donde corre el servidor
   - React: Consola del navegador (F12)

2. **Documentación:**
   - [Troubleshooting completo](docs/troubleshooting/)
   - [Issues de GitHub](https://github.com/1128026Go/Arconte/issues)

3. **Contacto:**
   - Crear issue en GitHub con logs completos
   - Tag: `help-wanted` o `bug`

---

**Última actualización:** 2025-10-19
**Autor:** Equipo Arconte
