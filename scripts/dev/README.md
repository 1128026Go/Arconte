# 🛠️ Scripts de Desarrollo - Arconte

Scripts para desarrollo local en Windows/macOS/Linux.

---

## 📋 Scripts Disponibles

### `start-all.bat` (Windows)
**Inicia todos los servicios de desarrollo**

Inicia automáticamente:
- ✅ PostgreSQL + Redis (Docker)
- ✅ Backend Laravel (PHP)
- ✅ Queue Worker
- ✅ Frontend React (Vite)
- ✅ Python Ingest Service (opcional)

**Uso:**
```bash
# Desde raíz del proyecto
npm run dev:all

# O directamente
scripts\dev\start-all.bat
```

**Características:**
- Limpia puertos automáticamente
- Verifica prerequisitos (Docker, PHP, Node.js)
- Abre navegador con los servicios
- Muestra enlaces de acceso

**URLs:**
- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- Ingest: http://localhost:8001/docs

---

### `dev.ps1` (PowerShell)
**Script de desarrollo con opciones**

**Uso:**
```bash
# Iniciar desarrollo
npm run dev

# Limpiar y reiniciar
npm run dev:clean

# Detener todos los servicios
npm run stop
```

**Parámetros:**
- `-StopAll`: Detiene todos los servicios
- `-Clean`: Limpia puertos antes de iniciar

**Características:**
- Verifica Laravel en Herd
- Inicia solo frontend por defecto
- Gestión inteligente de puertos

---

### `setup.ps1` (PowerShell)
**Setup inicial del proyecto**

**Uso:**
```bash
npm run setup
```

**Acciones:**
- Verifica prerequisitos (Git, Node.js, PHP, Docker)
- Instala dependencias (npm, composer)
- Configura .env
- Ejecuta migraciones
- Seeders de datos iniciales

**Cuándo usar:**
- Primera vez clonando el proyecto
- Después de pull con cambios de dependencias
- Para resetear ambiente local

---

## 🎯 Flujo Típico de Desarrollo

### Primera Vez

```bash
# 1. Setup inicial
npm run setup

# 2. Iniciar todos los servicios
npm run dev:all
```

### Día a Día

```bash
# Opción 1: Solo frontend (si Laravel en Herd)
npm run dev

# Opción 2: Todos los servicios
npm run dev:all

# Detener
npm run stop
```

### Limpiar y Reiniciar

```bash
# Limpiar puertos y reiniciar
npm run dev:clean

# Limpieza profunda (cache, logs)
npm run clean:deep
```

---

## ⚙️ Configuración

### Variables de Entorno

**Backend (.env en apps/api_php/):**
```env
DB_HOST=localhost
DB_PORT=5432
REDIS_HOST=localhost
REDIS_PORT=6379
SESSION_DOMAIN=localhost
SANCTUM_STATEFUL_DOMAINS=localhost:3000
```

**Frontend (.env en apps/web/):**
```env
VITE_API_URL=http://localhost:8000
```

### Puertos Usados

| Servicio | Puerto | URL |
|----------|--------|-----|
| Frontend | 3000 | http://localhost:3000 |
| Backend | 8000 | http://localhost:8000 |
| Ingest | 8001 | http://localhost:8001 |
| PostgreSQL | 5432 | localhost:5432 |
| Redis | 6379 | localhost:6379 |
| Adminer | 8080 | http://localhost:8080 |

---

## 🐛 Troubleshooting

### Error: "Puerto ocupado"

```bash
# Detener servicios
npm run stop

# O limpiar manualmente
npm run dev:clean
```

### Error: "Docker no responde"

```bash
# Reiniciar Docker Desktop
# Luego
npm run dev:all
```

### Error: "PHP no encontrado"

**Opción 1: Instalar Laravel Herd**
- https://herd.laravel.com

**Opción 2: PHP global**
```bash
# Instalar PHP 8.2+
# Windows: https://windows.php.net
# macOS: brew install php@8.2
```

**Opción 3: Usar Docker**
El script detectará automáticamente si PHP no está disponible.

### Error: "Node.js no encontrado"

```bash
# Instalar Node.js 20+
# https://nodejs.org
```

---

## 📂 Estructura

```
scripts/dev/
├── start-all.bat       ← Inicia todos los servicios (Windows)
├── dev.ps1             ← Script principal de desarrollo
├── setup.ps1           ← Setup inicial
└── README.md           ← Este archivo
```

---

## 💡 Tips

### Desarrollo Rápido

Si solo trabajas en frontend:
```bash
npm run dev
```

Herd maneja automáticamente el backend en `http://public.test`

### Múltiples Proyectos

Si corres múltiples instancias de Arconte:
```bash
# Cambiar puertos en .env
FRONTEND_PORT=3001
BACKEND_PORT=8001
```

### Performance

Para mejor performance:
- Usa Herd para PHP (más rápido que `php artisan serve`)
- Cierra servicios no usados (ej: Ingest si no trabajas con él)

---

## 🔗 Scripts Relacionados

**Producción:**
- `scripts/production/` - Scripts de deployment

**Mantenimiento:**
- `scripts/maintenance/` - Backups, limpieza, logs

**Operaciones:**
- `scripts/ops/` - Health checks, monitoring

---

**¿Problemas?**

Reporta issues: https://github.com/1128026Go/Arconte/issues
