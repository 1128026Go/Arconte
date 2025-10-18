# 🚀 Guía de Despliegue en Producción - Arconte

Esta guía describe cómo desplegar la aplicación Arconte en producción utilizando Docker.

## 📋 Prerrequisitos

- Docker Engine 20.10+
- Docker Compose 2.0+
- Servidor Linux (Ubuntu 20.04+ recomendado)
- Dominio configurado (opcional pero recomendado)
- Certificados SSL (para HTTPS)

## 🏗️ Estructura del Proyecto

```
Aplicacion Juridica/
├── apps/
│   ├── api_php/          # Backend Laravel (API REST)
│   │   ├── Dockerfile    # Dockerfile optimizado para producción
│   │   └── docker/       # Configuraciones PHP, Nginx, Supervisor
│   ├── web/              # Frontend React
│   │   ├── Dockerfile    # Dockerfile con build estático + Nginx
│   │   └── docker/       # Configuración Nginx
│   └── ingest_py/        # Servicio Python (si aplica)
├── nginx/                # Reverse proxy principal
│   ├── nginx.conf        # Configuración principal
│   ├── conf.d/           # Configuraciones de sitios
│   └── ssl/              # Certificados SSL
├── scripts/
│   └── production/       # Scripts de deployment
│       ├── build.sh      # Build de imágenes Docker
│       ├── deploy.sh     # Despliegue completo
│       └── rollback.sh   # Rollback a versión anterior
├── docker-compose.production.yml
└── .env.production       # Variables de entorno (NO commitearlo)
```

## 🔧 Configuración Inicial

### 1. Configurar Variables de Entorno

Copia el archivo de ejemplo y configura las variables:

```bash
cp .env.production.example .env.production
nano .env.production
```

Variables críticas a configurar:
- `DB_PASSWORD`: Contraseña segura para PostgreSQL
- `REDIS_PASSWORD`: Contraseña segura para Redis
- `APP_KEY`: Generar con `php artisan key:generate`
- `MAIL_*`: Configuración de correo (Resend)
- `EPAYCO_*`: Credenciales de pago

### 2. Configurar SSL (HTTPS)

Si tienes certificados SSL:

1. Coloca los archivos en `nginx/ssl/`:
   ```bash
   cp fullchain.pem nginx/ssl/
   cp privkey.pem nginx/ssl/
   ```

2. Descomenta las líneas SSL en `nginx/conf.d/default.conf`:
   ```nginx
   listen 443 ssl http2;
   ssl_certificate /etc/nginx/ssl/fullchain.pem;
   ssl_certificate_key /etc/nginx/ssl/privkey.pem;
   ```

### 3. Configurar Dominio

Edita `nginx/conf.d/default.conf` y reemplaza:
```nginx
server_name arconte.com www.arconte.com;
```

## 🚀 Despliegue

### Opción 1: Despliegue Automático (Recomendado)

```bash
# 1. Build de imágenes
./scripts/production/build.sh

# 2. Despliegue completo
./scripts/production/deploy.sh
```

### Opción 2: Despliegue Manual

```bash
# 1. Build de imágenes
docker build -t arconte-api:latest -f apps/api_php/Dockerfile apps/api_php
docker build -t arconte-web:latest -f apps/web/Dockerfile apps/web

# 2. Iniciar servicios
docker-compose -f docker-compose.production.yml up -d

# 3. Ejecutar migraciones
docker-compose -f docker-compose.production.yml exec api php artisan migrate --force

# 4. Optimizar Laravel
docker-compose -f docker-compose.production.yml exec api php artisan config:cache
docker-compose -f docker-compose.production.yml exec api php artisan route:cache
docker-compose -f docker-compose.production.yml exec api php artisan view:cache
docker-compose -f docker-compose.production.yml exec api php artisan optimize
```

## 📊 Monitoreo

### Ver logs de los servicios

```bash
# Todos los servicios
docker-compose -f docker-compose.production.yml logs -f

# Servicio específico
docker-compose -f docker-compose.production.yml logs -f api
docker-compose -f docker-compose.production.yml logs -f web
docker-compose -f docker-compose.production.yml logs -f postgres
```

### Ver estado de servicios

```bash
docker-compose -f docker-compose.production.yml ps
```

### Health checks

```bash
# API health
curl http://localhost/api/health

# Web health
curl http://localhost/health
```

## 🔄 Actualización

### Actualizar a nueva versión

```bash
# 1. Pull del código
git pull origin main

# 2. Build de nuevas imágenes
./scripts/production/build.sh

# 3. Despliegue
./scripts/production/deploy.sh
```

### Rollback a versión anterior

```bash
./scripts/production/rollback.sh v1.0.0
```

## 🛠️ Mantenimiento

### Backup de Base de Datos

```bash
# Crear backup
docker-compose -f docker-compose.production.yml exec -T postgres pg_dump -U arconte arconte > backup_$(date +%Y%m%d).sql

# Restaurar backup
docker-compose -f docker-compose.production.yml exec -T postgres psql -U arconte arconte < backup_20240101.sql
```

### Limpiar logs y caches

```bash
docker-compose -f docker-compose.production.yml exec api php artisan cache:clear
docker-compose -f docker-compose.production.yml exec api php artisan config:clear
docker-compose -f docker-compose.production.yml exec api php artisan route:clear
docker-compose -f docker-compose.production.yml exec api php artisan view:clear
```

### Reiniciar servicios

```bash
# Reiniciar todos
docker-compose -f docker-compose.production.yml restart

# Reiniciar servicio específico
docker-compose -f docker-compose.production.yml restart api
```

## 🔒 Seguridad

### Checklist de Seguridad

- [ ] Variables de entorno configuradas correctamente
- [ ] SSL/HTTPS configurado
- [ ] Firewall configurado (permitir solo 80, 443)
- [ ] Rate limiting activado (configurado en Nginx)
- [ ] Backups automáticos configurados
- [ ] Monitoreo de logs configurado
- [ ] APP_DEBUG=false en producción
- [ ] Credenciales de base de datos seguras
- [ ] CORS configurado correctamente

### Firewall (UFW)

```bash
# Permitir SSH
sudo ufw allow 22

# Permitir HTTP/HTTPS
sudo ufw allow 80
sudo ufw allow 443

# Activar firewall
sudo ufw enable
```

## 📈 Optimización

### Performance del Backend (Laravel)

1. **OPcache habilitado** (ya configurado en `docker/php/php.ini`)
2. **Queue workers** (ya configurado en Supervisor)
3. **Cache de configuración** (ejecutar en deploy)

### Performance del Frontend (React)

1. **Build optimizado** con Vite (minificación, tree-shaking)
2. **Gzip compression** (configurado en Nginx)
3. **Cache de assets** (1 año para estáticos)
4. **Lazy loading** de componentes

## 🐛 Troubleshooting

### Contenedor no inicia

```bash
# Ver logs del contenedor
docker-compose -f docker-compose.production.yml logs <servicio>

# Inspeccionar contenedor
docker inspect <container_id>
```

### Base de datos no conecta

```bash
# Verificar que PostgreSQL esté corriendo
docker-compose -f docker-compose.production.yml ps postgres

# Conectar manualmente
docker-compose -f docker-compose.production.yml exec postgres psql -U arconte
```

### Problemas de permisos

```bash
# Dentro del contenedor API
docker-compose -f docker-compose.production.yml exec api chown -R www-data:www-data /var/www/html/storage
docker-compose -f docker-compose.production.yml exec api chmod -R 755 /var/www/html/storage
```

## 📞 Soporte

Para problemas o preguntas:
- Issues: https://github.com/1128026Go/Arconte/issues
- Email: soporte@arconte.com

---

**Última actualización:** 2024
**Versión:** 1.0.0
