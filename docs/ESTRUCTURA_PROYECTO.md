# 📁 ESTRUCTURA DEL PROYECTO ARCONTE

**Actualizado:** 2025-10-17

---

## Estructura de carpetas

```
Aplicacion Juridica/
│
├── 📄 README.md                                    # Guía de inicio rápido
├── 📄 ARCONTE_DOCUMENTACION_MAESTRA.md            # Documentación técnica completa
├── 📄 package.json                                 # Configuración monorepo
├── 📄 package-lock.json                            # Lock de dependencias
├── 📄 docker-compose.yml                           # Docker para desarrollo
├── 📄 .gitignore                                   # Control de versiones
├── 📄 .env.example                                 # Variables de entorno template
├── 📄 .nvmrc                                       # Versión de Node.js
├── 📄 .php-version                                 # Versión de PHP
├── 📄 .python-version                              # Versión de Python
│
├── 📁 apps/                                        # Aplicaciones del monorepo
│   ├── api_php/                                   # Backend Laravel (PHP)
│   │   ├── app/                                   # Código de la aplicación
│   │   ├── routes/                                # Rutas API
│   │   ├── database/                              # Migraciones y seeders
│   │   └── storage/                               # Logs y cache
│   │
│   ├── web/                                       # Frontend React (TypeScript)
│   │   ├── src/                                   # Código fuente
│   │   ├── public/                                # Assets públicos
│   │   └── package.json                           # Dependencias frontend
│   │
│   └── ingest_py/                                 # Microservicio Python (FastAPI)
│       ├── src/                                   # Código fuente
│       ├── requirements.txt                       # Dependencias Python
│       └── run_persistent.py                      # Script de inicio
│
├── 📁 docs/                                        # Documentación organizada
│   ├── GUIA_RAPIDA.md                            # Quick start guide
│   ├── ESTRUCTURA_PROYECTO.md                    # Este archivo
│   ├── README.md                                 # Índice de documentación
│   │
│   ├── 📁 auditoria/                             # Reportes de auditoría
│   │   └── AUDITORIA_TECNICA_2025-10-10.md      # Auditoría completa del sistema
│   │
│   ├── 📁 sesiones/                              # Sesiones de trabajo
│   │   └── (archivos de sesiones de trabajo)
│   │
│   ├── 📁 analisis/                              # Análisis históricos
│   │   └── (reportes de análisis técnico)
│   │
│   ├── 📁 features/                              # Documentación de features
│   │   └── (especificaciones de funcionalidades)
│   │
│   ├── 📁 integraciones/                         # Documentación de APIs
│   │   └── (guías de integración)
│   │
│   ├── 📁 setup/                                 # Guías de configuración
│   │   └── (procedimientos de instalación)
│   │
│   ├── 📁 testing/                               # Documentación de tests
│   │   └── (guías de testing)
│   │
│   └── 📁 troubleshooting/                       # Guías de solución
│       └── (resolución de problemas comunes)
│
├── 📁 scripts/                                    # Scripts operativos
│   ├── start-all.bat                             # Inicia todos los servicios
│   └── setup-completo.ps1                        # Setup inicial completo
│
├── 📁 tests/                                      # Testing
│   ├── test_auth_migration.js                    # Tests automatizados
│   └── 📁 manual/                                # Scripts de testing manual
│       ├── recreate-case.php                     # Recrear casos de prueba
│       ├── verify-case-14.php                    # Verificar caso específico
│       ├── refresh-case-14.php                   # Refrescar datos de caso
│       ├── test-api-case-14.php                  # Test de API
│       └── test-api-response.php                 # Test de respuestas
│
├── 📁 docker/                                     # Configuración Docker
│   └── docker-compose.production.yml             # Docker para producción
│
├── 📁 nginx/                                      # Configuración Nginx
│   └── (archivos de configuración del servidor)
│
└── 📁 node_modules/                               # Dependencias (ignorado en git)

```

---

## Ubicación de archivos importantes

### Documentación principal

- **README.md** → Raíz (primera vista del proyecto)
- **ARCONTE_DOCUMENTACION_MAESTRA.md** → Raíz (fuente única de verdad)
- **docs/GUIA_RAPIDA.md** → Guía rápida de uso

### Scripts para desarrollo diario

- **Iniciar servicios:** `scripts/start-all.bat`
- **Setup inicial:** `scripts/setup-completo.ps1`

### Testing manual

- **Scripts de testing:** `tests/manual/*.php`

### Docker

- **Desarrollo:** `docker-compose.yml` (raíz)
- **Producción:** `docker/docker-compose.production.yml`

### Configuración

- **Variables de entorno:** `.env` (crear desde `.env.example`)
- **Configuración monorepo:** `package.json`

---

## Flujo de trabajo típico

### 1. Iniciar el proyecto por primera vez

```bash
# 1. Configurar variables de entorno
cp .env.example .env

# 2. Ejecutar setup completo (instala dependencias, crea DB, etc.)
scripts/setup-completo.ps1

# 3. Iniciar todos los servicios
scripts/start-all.bat
```

### 2. Desarrollo diario

```bash
# Iniciar todos los servicios
scripts/start-all.bat

# Los servicios estarán disponibles en:
# - Frontend:      http://localhost:3000
# - API Backend:   http://localhost:8000/api
# - Microservicio: http://localhost:8001
# - Docs API:      http://localhost:8001/docs
```

### 3. Testing manual

```bash
# Ejecutar tests PHP desde la raíz
cd apps/api_php
php ../../tests/manual/verify-case-14.php
```

---

## Puertos utilizados

| Servicio | Puerto | URL |
|----------|--------|-----|
| Frontend React | 3000 | http://localhost:3000 |
| Backend Laravel | 8000 | http://localhost:8000/api |
| Microservicio Python | 8001 | http://localhost:8001 |
| Docs FastAPI | 8001 | http://localhost:8001/docs |

---

## Archivos de configuración clave

### Monorepo
- `package.json` - Configuración del workspace
- `.nvmrc` - Versión de Node.js (v20.x)

### Backend PHP
- `apps/api_php/.env` - Variables de entorno Laravel
- `apps/api_php/composer.json` - Dependencias PHP

### Frontend React
- `apps/web/package.json` - Dependencias React
- `apps/web/vite.config.ts` - Configuración de Vite

### Microservicio Python
- `apps/ingest_py/requirements.txt` - Dependencias Python
- `apps/ingest_py/.env` - Variables de entorno Python

---

## Logs y debugging

### Ubicación de logs

Durante desarrollo:
- **Backend Laravel:** `apps/api_php/storage/logs/laravel.log`
- **Frontend React:** `apps/web/web-dev.log` (cuando se inicia con script)
- **Python Ingest:** `apps/ingest_py/ingest.log`

Los logs en la raíz se ignoran automáticamente por `.gitignore`:
- `frontend.log`
- `ingest.log`
- `serve.log`
- `worker.log`

---

## Backups

Los backups de reorganización se guardan en:
```
backup_reorganizacion_YYYY-MM-DD_HH-MM-SS/
```

Estos backups están ignorados en `.gitignore` (patrón `backup_*/`)

---

## Herramientas de desarrollo

### Requerimientos

- **Node.js:** v20.x (especificado en `.nvmrc`)
- **PHP:** 8.4 (Laravel Herd)
- **Python:** 3.11+
- **Composer:** Para dependencias PHP
- **npm:** Para dependencias JavaScript

### IDEs recomendados

- **VS Code** con extensiones:
  - PHP Intelephense
  - ESLint
  - Prettier
  - Python

---

## Contribución

### Antes de hacer cambios

1. Crear una rama feature: `git checkout -b feature/nombre-feature`
2. Hacer cambios en el código
3. Ejecutar tests
4. Hacer commit con mensajes descriptivos
5. Push y crear Pull Request

### Convenciones

- **Commits:** Usar conventional commits (feat:, fix:, docs:, etc.)
- **Código:** Seguir PSR-12 para PHP, Airbnb para JavaScript
- **Documentación:** Actualizar docs/ cuando se agreguen features

---

## Más información

Para documentación detallada, consultar:
- **Documentación técnica completa:** `ARCONTE_DOCUMENTACION_MAESTRA.md`
- **Guía rápida de uso:** `docs/GUIA_RAPIDA.md`
- **Índice de documentación:** `docs/README.md`
