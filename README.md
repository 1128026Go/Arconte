# 🏛️ Arconte - Sistema de Gestión Jurídica con IA

[![CI](https://github.com/1128026Go/Arconte/actions/workflows/ci.yml/badge.svg)](https://github.com/1128026Go/Arconte/actions/workflows/ci.yml)

**Plataforma completa de gestión legal para abogados y bufetes en Colombia**

## 🚀 Inicio Rápido

```bash
# 1. Backend Laravel
cd apps/api_php && php artisan serve

# 2. Frontend React
cd apps/web && npm run dev

# 3. Python Service
cd apps/ingest_py && python run_persistent.py
```

**Acceso:** http://localhost:3000
**Credenciales:** admin@juridica.test / admin123

## 📚 Documentación

### 📖 Documentos Principales

- **⭐ [ARCONTE_DOCUMENTACION_MAESTRA.md](ARCONTE_DOCUMENTACION_MAESTRA.md)** - Fuente única de verdad del proyecto
- **[docs/](docs/)** - Documentación organizada por categorías
  - [Getting Started](docs/getting-started/) - Guías de inicio rápido
  - [Features](docs/features/) - Suscripciones, vigilancia de autos
  - [Integraciones](docs/integraciones/) - Rama Judicial, APIs Colombia
  - [Troubleshooting](docs/troubleshooting/) - Solución de problemas
  - [Testing](docs/testing/) - Guías de pruebas
  - [Setup](docs/setup/) - Plan maestro e implementación
  - [Historial](docs/historial/) - Implementaciones por sprint
  - [Sesiones](docs/sesiones/) - Reportes de sesiones de trabajo

### 🎯 Progreso de Implementación

- **✅ [FASE_0_COMPLETADA.md](FASE_0_COMPLETADA.md)** - Correcciones críticas (2025-10-19)
- **⏳ FASE 1: Developer Experience** - Pendiente
- **⏳ [FASE_2_PROGRESO.md](FASE_2_PROGRESO.md)** - Generación de documentos IA (En progreso)
- **📋 [FASES_3_Y_4_PENDIENTES.md](FASES_3_Y_4_PENDIENTES.md)** - Roadmap pendiente

> 💡 **Nuevo:** Consulta [docs/README.md](docs/README.md) para navegar toda la documentación

## ✨ Características Principales

- ⚖️ **Gestión de Casos** - Seguimiento automático vía Rama Judicial
- 📄 **Gestión Documental** - Upload, versionado, compartición
- 💰 **Facturación** - Control de tiempo y generación de facturas
- 🤖 **AI Assistant** - Chat legal y generación de documentos (Gemini)
- 🔔 **Recordatorios** - Alertas y notificaciones
- 📊 **Analytics** - Dashboard y reportes

## 🏗️ Stack Tecnológico

- **Backend:** Laravel 11 + PostgreSQL + Redis
- **Frontend:** React 18 + Vite + Tailwind CSS
- **AI:** Gemini 2.5 Flash
- **Ingest:** Python FastAPI

## 📡 URLs

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- Python Service: http://localhost:8001

## 📄 Licencia

Proyecto privado - Todos los derechos reservados
\n+## Comandos Comunes
\n+```bash
# Desde la raíz del repo (Aplicacion Juridica)

# Setup inicial (verifica prerrequisitos, Laravel y frontend)
npm run setup

# Entorno de desarrollo (Vite + verificación Laravel)
npm run dev

# Detener servicios (puertos comunes)
npm run stop

# Limpieza básica / profunda
npm run clean
npm run clean:deep

# Frontend directo
npm run web:dev
npm run web:build
npm run web:test
```

## 🔧 Comandos del Proyecto

### Setup y Desarrollo
```bash
# Configuración inicial (verifica prerrequisitos, Laravel y Frontend)
npm run setup

# Entorno de desarrollo (Vite + verificación Laravel)
npm run dev

# Detener todos los servicios
npm run stop
```

### Limpieza
```bash
# Limpieza básica (cachés, logs, artefactos)
npm run clean

# Limpieza profunda (incluye node_modules)
npm run clean:deep

# Limpieza avanzada con reporte
python scripts/maintenance/cleanup.py
```

### Frontend
```bash
# Iniciar Vite dev server
npm run web:dev

# Build de producción
npm run web:build

# Ejecutar tests
npm run web:test
```

### Scripts Útiles
```bash
# Verificar prerrequisitos del sistema
.\scripts\check_prereqs.ps1  # Windows
./scripts/check_prereqs.ps1  # Linux/macOS

# Backup de base de datos
.\scripts\maintenance\backup-database.ps1  # Windows
./scripts/maintenance/backup-database.sh   # Linux/macOS

# Health check diario
.\scripts\maintenance\daily-check.ps1  # Windows
./scripts/maintenance/daily-check.sh   # Linux/macOS
```

> 📘 **Más comandos:** Consulta [scripts/README.md](scripts/README.md) para documentación completa de scripts

