# 🚂 Deployment en Railway - Arconte

Railway es una plataforma PaaS (Platform as a Service) que facilita el deployment de aplicaciones con Docker. Ideal para MVPs, startups y deployment rápido.

---

## 📋 Tabla de Contenidos

1. [Ventajas y Limitaciones](#ventajas-y-limitaciones)
2. [Requisitos](#requisitos)
3. [Preparación del Proyecto](#preparación-del-proyecto)
4. [Deployment Paso a Paso](#deployment-paso-a-paso)
5. [Configuración Avanzada](#configuración-avanzada)
6. [Troubleshooting](#troubleshooting)

---

## ✅ Ventajas y Limitaciones

### ✅ Ventajas

- ✅ **Deploy en 15 minutos** desde GitHub
- ✅ **Auto-scaling** incluido
- ✅ **HTTPS automático** (certificados SSL gratis)
- ✅ **PostgreSQL incluido** (base de datos gestionada)
- ✅ **Redis incluido** (opcional)
- ✅ **CI/CD automático** (push → deploy)
- ✅ **Logs centralizados**
- ✅ **Backups automáticos** de DB
- ✅ **Variables de entorno** fáciles de gestionar
- ✅ **No requiere DevOps** knowledge

### ⚠️ Limitaciones

- ⚠️ **Costo más alto** que VPS (~$20-50/mes vs $5-20/mes)
- ⚠️ **Menos control** sobre infraestructura
- ⚠️ **Dependencia de plataforma** (vendor lock-in)
- ⚠️ **Límites de recursos** en planes básicos
- ⚠️ **No ideal para tráfico muy alto** (mejor VPS/Kubernetes)

### 💰 Pricing Estimado

**Starter Plan (Recomendado):**
- PostgreSQL: $5-10/mes
- Redis: $5/mes
- Backend: $10-20/mes (según recursos)
- Frontend: $5/mes
- **Total:** ~$25-40/mes

**Trial:** $5 gratis de crédito para probar

---

## 📋 Requisitos

### Previos

- [ ] Cuenta de GitHub con el repositorio de Arconte
- [ ] Cuenta de Railway: https://railway.app (sign up con GitHub)
- [ ] Dominio registrado (opcional pero recomendado)
- [ ] Cuenta de Cloudflare (para DNS, opcional)

### APIs Externas

- [ ] Gemini API Key: https://makersuite.google.com/app/apikey
- [ ] ePayco Keys: https://dashboard.epayco.co
- [ ] Resend API Key: https://resend.com/api-keys

---

## 🔧 Preparación del Proyecto

### Paso 1: Ajustar Estructura para Railway

Railway necesita archivos de configuración específicos en la raíz.

**1.1. Crear railway.json (Configuración Railway)**

```bash
cd "Aplicacion Juridica"
nano railway.json
```

Agregar:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile.railway"
  },
  "deploy": {
    "numReplicas": 1,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

**1.2. Crear Dockerfile.railway (Multi-service)**

Railway prefiere un solo Dockerfile que maneje todo:

```dockerfile
# Dockerfile.railway
# Multi-stage build para Railway

ARG SERVICE_NAME=api

# ============================================
# Stage 1: Backend Builder
# ============================================
FROM php:8.2-fpm-alpine AS backend-builder

RUN apk add --no-cache \
    git curl libpng-dev libzip-dev zip unzip \
    postgresql-dev oniguruma-dev

RUN docker-php-ext-install \
    pdo_pgsql pgsql mbstring zip exif pcntl bcmath gd

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

COPY apps/api_php/composer.json apps/api_php/composer.lock ./
RUN composer install --no-dev --optimize-autoloader --no-interaction

COPY apps/api_php .

RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html/storage

# ============================================
# Stage 2: Frontend Builder
# ============================================
FROM node:20-alpine AS frontend-builder

WORKDIR /app

COPY apps/web/package*.json ./
RUN npm ci --only=production

COPY apps/web .
RUN npm run build

# ============================================
# Stage 3: Backend Runtime
# ============================================
FROM php:8.2-fpm-alpine AS backend

RUN apk add --no-cache libpng libzip postgresql-libs oniguruma nginx supervisor

RUN apk add --no-cache --virtual .build-deps \
    libpng-dev libzip-dev postgresql-dev oniguruma-dev \
    && docker-php-ext-install \
    pdo_pgsql pgsql mbstring zip exif pcntl bcmath gd \
    && apk del .build-deps

WORKDIR /var/www/html

COPY --from=backend-builder --chown=www-data:www-data /var/www/html /var/www/html
COPY apps/api_php/docker/php/php-fpm.conf /usr/local/etc/php-fpm.d/www.conf
COPY apps/api_php/docker/php/php.ini /usr/local/etc/php/php.ini
COPY apps/api_php/docker/nginx/nginx.conf /etc/nginx/nginx.conf
COPY apps/api_php/docker/nginx/default.conf /etc/nginx/http.d/default.conf
COPY apps/api_php/docker/supervisor/supervisord.conf /etc/supervisord.conf

RUN mkdir -p /var/log/supervisor /run/nginx

EXPOSE 8080

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]

# ============================================
# Stage 4: Frontend Runtime
# ============================================
FROM nginx:alpine AS frontend

COPY apps/web/docker/nginx/nginx.conf /etc/nginx/nginx.conf
COPY apps/web/docker/nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=frontend-builder /app/dist /usr/share/nginx/html

RUN chown -R nginx:nginx /usr/share/nginx/html

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]

# ============================================
# Final Stage Selection
# ============================================
FROM ${SERVICE_NAME}
```

**1.3. Actualizar Nginx para Railway**

Railway usa puerto 8080 (no 80):

```bash
# Editar apps/api_php/docker/nginx/default.conf
nano apps/api_php/docker/nginx/default.conf
```

Cambiar:
```nginx
listen 80;
```
Por:
```nginx
listen 8080;
```

Lo mismo para frontend:
```bash
nano apps/web/docker/nginx/default.conf
```

**1.4. Commit cambios**

```bash
git add .
git commit -m "feat: add Railway deployment config"
git push origin main
```

---

## 🚀 Deployment Paso a Paso

### Paso 1: Crear Proyecto en Railway

1. **Ir a Railway**
   ```
   https://railway.app
   ```

2. **New Project**
   - Click en "New Project"
   - Seleccionar "Deploy from GitHub repo"
   - Autorizar Railway en GitHub
   - Seleccionar repositorio: `Arconte`
   - Branch: `main`

### Paso 2: Crear Base de Datos PostgreSQL

1. **Add Service → Database**
   - Seleccionar "PostgreSQL"
   - Railway lo provisionará automáticamente
   - **Nombre:** `arconte-db`

2. **Copiar Variables**
   - Railway auto-genera:
     - `DATABASE_URL`
     - `POSTGRES_USER`
     - `POSTGRES_PASSWORD`
     - `POSTGRES_DB`

### Paso 3: Agregar Redis (Opcional)

1. **Add Service → Database**
   - Seleccionar "Redis"
   - **Nombre:** `arconte-redis`

2. **Copiar Variables**
   - `REDIS_URL`

### Paso 4: Crear Servicio de Backend

1. **Add Service → GitHub Repo**
   - Seleccionar mismo repo
   - **Service Name:** `api`

2. **Configurar Build**
   - Settings → Build
   - Builder: `DOCKERFILE`
   - Dockerfile Path: `Dockerfile.railway`
   - Build Arguments:
     ```
     SERVICE_NAME=backend
     ```

3. **Configurar Variables de Entorno**

   Settings → Variables

   **Aplicación:**
   ```
   APP_NAME=Arconte
   APP_ENV=production
   APP_DEBUG=false
   APP_URL=https://api-production-xxxx.up.railway.app
   APP_KEY=base64:XXXXXX  # Generar localmente
   ```

   **Base de Datos:**
   ```
   DB_CONNECTION=pgsql
   DB_HOST=${{Postgres.PGHOST}}
   DB_PORT=${{Postgres.PGPORT}}
   DB_DATABASE=${{Postgres.PGDATABASE}}
   DB_USERNAME=${{Postgres.PGUSER}}
   DB_PASSWORD=${{Postgres.PGPASSWORD}}
   ```

   **Redis:**
   ```
   REDIS_HOST=${{Redis.REDIS_HOST}}
   REDIS_PORT=${{Redis.REDIS_PORT}}
   REDIS_PASSWORD=${{Redis.REDIS_PASSWORD}}
   CACHE_DRIVER=redis
   SESSION_DRIVER=redis
   QUEUE_CONNECTION=redis
   ```

   **Email:**
   ```
   MAIL_MAILER=smtp
   MAIL_HOST=smtp.resend.com
   MAIL_PORT=587
   MAIL_USERNAME=resend
   MAIL_PASSWORD=re_XXXXXXXXX  # Tu API key
   MAIL_ENCRYPTION=tls
   MAIL_FROM_ADDRESS=noreply@arconte.com
   MAIL_FROM_NAME=Arconte
   ```

   **APIs:**
   ```
   GEMINI_API_KEY=XXXXXXXXXXX
   EPAYCO_PUBLIC_KEY=XXXXXXXXXXX
   EPAYCO_PRIVATE_KEY=XXXXXXXXXXX
   EPAYCO_TEST=false
   ```

   **Seguridad:**
   ```
   SANCTUM_STATEFUL_DOMAINS=arconte.com,www.arconte.com
   SESSION_SECURE_COOKIE=true
   TRUSTED_PROXIES=*
   ```

4. **Deploy**
   - Railway automáticamente hace build y deploy
   - Ver logs en "Deployments"

### Paso 5: Crear Servicio de Frontend

1. **Add Service → GitHub Repo**
   - Mismo repo
   - **Service Name:** `web`

2. **Configurar Build**
   - Settings → Build
   - Builder: `DOCKERFILE`
   - Dockerfile Path: `Dockerfile.railway`
   - Build Arguments:
     ```
     SERVICE_NAME=frontend
     ```

3. **Configurar Variables**
   ```
   VITE_API_URL=https://api-production-xxxx.up.railway.app
   ```

4. **Deploy**

### Paso 6: Ejecutar Migraciones

Railway no tiene terminal interactivo directo, así que usamos una solución alternativa:

**Opción A: Railway CLI**

```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login
railway login

# Conectar al proyecto
railway link

# Ejecutar comando
railway run --service api php artisan migrate --force
```

**Opción B: Script de inicio**

Agregar a `apps/api_php/docker/startup.sh`:

```bash
#!/bin/sh
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache

exec /usr/bin/supervisord -c /etc/supervisord.conf
```

Modificar Dockerfile.railway:
```dockerfile
COPY apps/api_php/docker/startup.sh /startup.sh
RUN chmod +x /startup.sh
CMD ["/startup.sh"]
```

### Paso 7: Configurar Dominio Personalizado

1. **En Railway → Settings → Domains**
   - Click "Generate Domain" (para testing)
   - O "Custom Domain"

2. **Agregar Dominio Personalizado**
   - Dominio: `arconte.com` (frontend)
   - Dominio: `api.arconte.com` (backend)

3. **En Cloudflare (tu DNS)**
   ```
   Type: CNAME
   Name: @
   Target: web-production-xxxx.up.railway.app
   Proxy: Off (importante para Railway)

   Type: CNAME
   Name: api
   Target: api-production-xxxx.up.railway.app
   Proxy: Off
   ```

4. **Esperar verificación**
   - Railway verificará el dominio
   - SSL se configura automáticamente

### Paso 8: Actualizar Variables con Dominio Real

```
APP_URL=https://api.arconte.com
FRONTEND_URL=https://arconte.com
SANCTUM_STATEFUL_DOMAINS=arconte.com,www.arconte.com
```

Redeploy automático se ejecuta.

---

## ⚙️ Configuración Avanzada

### Health Checks

Railway → Settings → Health Check:

```
Path: /health
Port: 8080
Timeout: 10
Interval: 30
```

### Auto-Scaling

Settings → Resources:
```
Min Replicas: 1
Max Replicas: 3
CPU Threshold: 80%
Memory Threshold: 80%
```

### Backups

PostgreSQL backups automáticos incluidos:
- Retención: 7 días (plan Hobby)
- Retención: 30 días (plan Pro)

Para backup manual:
```bash
railway run --service postgres pg_dump > backup.sql
```

### Logs

Ver logs en tiempo real:
```bash
railway logs --service api
```

---

## 🐛 Troubleshooting

### Error: "Build failed"

**Solución:**
```bash
# Verificar logs de build
railway logs --service api

# Común: falta de memoria
Settings → Resources → Increase Memory
```

### Error: "Database connection failed"

**Solución:**
```bash
# Verificar variables
railway variables --service api | grep DB_

# Verificar que PostgreSQL esté running
railway status
```

### Error: "502 Bad Gateway"

**Solución:**
- Verificar que el puerto sea 8080
- Verificar health check path
- Ver logs: `railway logs`

### Migraciones no se ejecutan

**Solución:**
```bash
# Ejecutar manualmente
railway run --service api php artisan migrate --force

# O usar startup script (ver Paso 6)
```

---

## 📊 Monitoring

### Métricas Disponibles

Railway Dashboard muestra:
- CPU usage
- Memory usage
- Network traffic
- Request count
- Error rate

### Uptime Monitoring

Configurar servicio externo:
- UptimeRobot: https://uptimerobot.com
- URL: https://arconte.com/health
- Interval: 5 minutes

---

## 💰 Optimización de Costos

### Tips para Reducir Costos

1. **Usar 1 instancia** (no auto-scale si no es necesario)
2. **Reducir recursos** del frontend (poco uso de CPU)
3. **PostgreSQL compartido** (suficiente para empezar)
4. **Deshabilitar servicios** en staging cuando no se usen

### Proyección de Costos

**Mínimo viable:**
- PostgreSQL Hobby: $5
- Redis (opcional): $5
- API (512MB): $10
- Frontend (256MB): $5
- **Total:** $25/mes

**Producción media:**
- PostgreSQL Pro: $10
- Redis: $5
- API (1GB): $20
- Frontend (512MB): $10
- **Total:** $45/mes

---

## 🔄 CI/CD

Railway configura CI/CD automáticamente:

```
1. Push a GitHub (main branch)
   ↓
2. Railway detecta cambio
   ↓
3. Build automático
   ↓
4. Deploy automático
   ↓
5. Health check
   ↓
6. Live ✅
```

### Deploy Preview (Branches)

Railway puede crear deploys de preview para PRs:

Settings → Environment → PR Deploys: Enable

---

## ✅ Checklist Railway

- [ ] Cuenta Railway creada
- [ ] Repositorio conectado
- [ ] PostgreSQL provisionado
- [ ] Redis provisionado (opcional)
- [ ] Variables de entorno configuradas
- [ ] Backend deployed
- [ ] Frontend deployed
- [ ] Migraciones ejecutadas
- [ ] Dominio personalizado configurado
- [ ] SSL verificado
- [ ] Health checks funcionando
- [ ] Logs monitoreados
- [ ] Backups verificados

---

## 🆚 Railway vs VPS

| Característica | Railway | VPS |
|---------------|---------|-----|
| Setup time | 15 min | 2 horas |
| DevOps skills | No requiere | Requiere |
| Costo | $25-45/mes | $5-20/mes |
| SSL | Automático | Manual |
| Backups | Incluidos | Manual |
| Scaling | Automático | Manual |
| Control | Limitado | Total |

**Cuándo usar Railway:**
- ✅ MVP o startup
- ✅ Equipo pequeño
- ✅ Sin DevOps en equipo
- ✅ Necesitas deploy rápido

**Cuándo usar VPS:**
- ✅ Control total necesario
- ✅ Presupuesto ajustado
- ✅ Tráfico alto
- ✅ Tienes DevOps skills

---

## 📚 Recursos

**Railway:**
- Docs: https://docs.railway.app
- Discord: https://discord.gg/railway
- Status: https://status.railway.app

**Alternativas PaaS:**
- Render: https://render.com
- Fly.io: https://fly.io
- Heroku: https://heroku.com (más caro)

---

**¿Listo para deploy?** 🚀

```bash
railway login
railway init
railway up
```

¡Tu app estará live en minutos!
