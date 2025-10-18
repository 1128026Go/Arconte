# 📁 Estructura del Proyecto Arconte

## Organización General

```
Aplicacion Juridica/
├── apps/                           # Aplicaciones del monorepo
│   ├── api_php/                   # 🔵 BACKEND - Laravel API
│   │   ├── app/                   # Lógica de la aplicación
│   │   ├── bootstrap/             # Bootstrap de Laravel
│   │   ├── config/                # Configuraciones
│   │   ├── database/              # Migraciones y seeders
│   │   ├── public/                # Punto de entrada público
│   │   ├── resources/             # Recursos (solo views Laravel)
│   │   ├── routes/                # Rutas de la API
│   │   ├── storage/               # Almacenamiento (logs, cache, uploads)
│   │   ├── tests/                 # Tests del backend
│   │   ├── docker/                # Configuraciones Docker
│   │   │   ├── php/              # PHP-FPM config
│   │   │   ├── nginx/            # Nginx config
│   │   │   └── supervisor/       # Supervisor config
│   │   ├── scripts/               # Scripts de desarrollo
│   │   │   └── dev/              # Scripts PHP de desarrollo
│   │   ├── Dockerfile             # Dockerfile de producción
│   │   ├── composer.json          # Dependencias PHP
│   │   └── artisan                # CLI de Laravel
│   │
│   ├── web/                       # 🟢 FRONTEND - React SPA
│   │   ├── src/                   # Código fuente React
│   │   │   ├── components/       # Componentes reutilizables
│   │   │   ├── pages/            # Páginas/vistas
│   │   │   ├── hooks/            # Custom hooks
│   │   │   ├── lib/              # Utilidades y helpers
│   │   │   ├── App.jsx           # Componente principal
│   │   │   └── main.jsx          # Punto de entrada
│   │   ├── public/                # Assets estáticos
│   │   ├── docker/                # Configuraciones Docker
│   │   │   └── nginx/            # Nginx config para servir build
│   │   ├── e2e/                   # Tests end-to-end
│   │   ├── Dockerfile             # Dockerfile de producción
│   │   ├── package.json           # Dependencias Node.js
│   │   ├── vite.config.mjs        # Configuración Vite
│   │   └── index.html             # HTML principal
│   │
│   └── ingest_py/                 # 🟡 SERVICIO PYTHON
│       └── ...                    # Servicio de ingestión de datos
│
├── nginx/                         # Reverse Proxy de Producción
│   ├── nginx.conf                 # Configuración principal
│   ├── conf.d/                    # Configuraciones de sitios
│   │   └── default.conf          # Configuración del sitio
│   └── ssl/                       # Certificados SSL
│
├── scripts/                       # Scripts del proyecto
│   ├── dev/                       # Scripts de desarrollo
│   │   ├── setup.ps1             # Setup inicial
│   │   └── dev.ps1               # Inicio de desarrollo
│   ├── production/                # Scripts de producción
│   │   ├── build.sh              # Build de imágenes
│   │   ├── deploy.sh             # Despliegue
│   │   └── rollback.sh           # Rollback
│   └── maintenance/               # Scripts de mantenimiento
│       └── cleanup.ps1            # Limpieza
│
├── docker/                        # Configuraciones Docker de desarrollo
├── tests/                         # Tests de integración
├── docs/                          # Documentación
│
├── docker-compose.yml             # Desarrollo
├── docker-compose.production.yml  # Producción
├── package.json                   # Workspaces del monorepo
├── .env.production.example        # Variables de entorno de producción
├── .dockerignore                  # Archivos ignorados por Docker
├── PRODUCTION_DEPLOYMENT.md       # Guía de despliegue
└── README.md                      # Documentación principal
```

## 🎯 Separación Frontend/Backend

### Backend (apps/api_php)

**Propósito:** API REST con Laravel

**Contenido:**
- ✅ Código PHP (Laravel)
- ✅ Lógica de negocio
- ✅ Modelos, Controladores, Middleware
- ✅ Migraciones de base de datos
- ✅ Rutas API
- ✅ Configuración PHP-FPM + Nginx
- ❌ NO contiene: Vite, React, código frontend

**Deployment:**
- Multi-stage Docker build
- PHP-FPM + Nginx + Supervisor
- Queue workers para jobs
- OPcache habilitado

### Frontend (apps/web)

**Propósito:** Single Page Application con React

**Contenido:**
- ✅ Código React/JSX
- ✅ Componentes UI
- ✅ Rutas de navegación (React Router)
- ✅ Estado global
- ✅ Llamadas a la API
- ❌ NO contiene: Código PHP, lógica de backend

**Deployment:**
- Build estático con Vite
- Servido por Nginx
- Assets optimizados y minificados
- Cache agresivo de estáticos

## 🔄 Flujo de Comunicación

```
Usuario
   ↓
Nginx Reverse Proxy (puerto 80/443)
   ├─→ /api/* → Backend (Laravel)
   │              ↓
   │         PostgreSQL + Redis
   └─→ /* → Frontend (React)
```

## 📦 Entornos

### Desarrollo
- `docker-compose.yml`
- Hot reload habilitado
- Debugging activado
- Scripts en `scripts/dev/`

### Producción
- `docker-compose.production.yml`
- Builds optimizados
- Caching habilitado
- Health checks
- Scripts en `scripts/production/`

## 🚀 Comandos Importantes

### Desarrollo
```bash
npm run dev          # Iniciar desarrollo
npm run web:dev      # Solo frontend
```

### Producción
```bash
./scripts/production/build.sh    # Build
./scripts/production/deploy.sh   # Deploy
./scripts/production/rollback.sh # Rollback
```

## 📝 Notas

1. **Scripts PHP de desarrollo** ahora están en `apps/api_php/scripts/dev/`
2. **Vite eliminado del backend** - no es necesario
3. **Configuración Docker separada** para cada servicio
4. **Nginx principal** actúa como reverse proxy
5. **Health checks** configurados en todos los servicios

---

**Última actualización:** 2024
