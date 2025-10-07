# 📚 Guía Maestra - Arconte

**Sistema de Gestión Jurídica con IA**

Esta es la guía completa y definitiva para instalar, configurar y desplegar Arconte. Todo lo que necesitas saber está aquí.

---

## 📑 Tabla de Contenidos

1. [Instalación Local](#1-instalación-local)
2. [Configuración](#2-configuración)
3. [Uso Básico](#3-uso-básico)
4. [Deployment a Producción](#4-deployment-a-producción)
5. [Seguridad](#5-seguridad)
6. [Troubleshooting](#6-troubleshooting)
7. [Mantenimiento](#7-mantenimiento)

---

## 1. Instalación Local

### 1.1 Requisitos

```
✅ PHP 8.2 o superior
✅ Composer 2.x
✅ Node.js 18+ y npm
✅ Python 3.11+
✅ SQLite (desarrollo)
✅ Git
```

**Opcional:**
- MySQL/PostgreSQL (producción)
- Redis (cache y queues)

### 1.2 Clonar el Repositorio

```bash
git clone https://github.com/tu-usuario/arconte.git
cd arconte
```

### 1.3 Backend (Laravel)

```bash
cd apps/api_php

# Instalar dependencias
composer install

# Configurar ambiente
cp .env.example .env

# Generar key de aplicación
php artisan key:generate

# Crear base de datos (SQLite)
touch database/database.sqlite

# Ejecutar migraciones
php artisan migrate

# Levantar servidor
php artisan serve
```

**Backend corriendo en:** http://localhost:8000

### 1.4 Frontend (React)

```bash
cd apps/web

# Instalar dependencias
npm install

# Configurar ambiente
cp .env.example .env

# Levantar servidor de desarrollo
npm run dev
```

**Frontend corriendo en:** http://localhost:3000

### 1.5 Python Service (Ingest)

```bash
cd apps/ingest_py

# Instalar dependencias
pip install -r requirements.txt

# Configurar ambiente (opcional)
cp .env.example .env

# Levantar servidor
python run_persistent.py
```

**Python service corriendo en:** http://localhost:8001

### 1.6 Crear Usuario de Prueba

```bash
cd apps/api_php
php artisan tinker
```

En el shell interactivo:

```php
App\Models\User::create([
    'name' => 'Admin Test',
    'email' => 'admin@test.com',
    'password' => bcrypt('password')
]);
```

Presiona `Ctrl+D` para salir.

### 1.7 Probar la Aplicación

1. Abre http://localhost:3000
2. Login:
   - **Email:** `admin@test.com`
   - **Password:** `password`
3. Explora los módulos disponibles

---

## 2. Configuración

### 2.1 Variables de Entorno - Backend

Archivo: `apps/api_php/.env`

**Configuración básica:**

```env
APP_NAME="Arconte"
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8000

DB_CONNECTION=sqlite
DB_DATABASE=./database/database.sqlite

SANCTUM_STATEFUL_DOMAINS=localhost:3000
CACHE_STORE=file
QUEUE_CONNECTION=sync
```

**Configuración de APIs:**

```env
# Gemini AI (obtener en https://makersuite.google.com/app/apikey)
GEMINI_API_KEY=tu_api_key_aqui

# Email (Gmail SMTP con App Password)
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=tu_email@gmail.com
MAIL_PASSWORD=tu_app_password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@arconte.com

# Python Ingest Service
INGEST_BASE_URL=http://127.0.0.1:8001
INGEST_API_KEY=generar_key_aleatoria_32_chars
```

**Generar INGEST_API_KEY:**

```bash
php -r "echo bin2hex(random_bytes(16));"
```

### 2.2 Variables de Entorno - Frontend

Archivo: `apps/web/.env`

```env
VITE_API_URL=http://localhost:8000/api
```

### 2.3 Variables de Entorno - Python

Archivo: `apps/ingest_py/.env` (opcional)

```env
INGEST_API_KEY=la_misma_del_backend
PORT=8001
HOST=127.0.0.1
```

---

## 3. Uso Básico

### 3.1 Levantar Servicios en Desarrollo

**Opción A: Manual (3 terminales)**

```bash
# Terminal 1 - Backend
cd apps/api_php && php artisan serve

# Terminal 2 - Frontend
cd apps/web && npm run dev

# Terminal 3 - Python
cd apps/ingest_py && python run_persistent.py
```

**Opción B: Scripts automatizados (Windows)**

```bash
# Desde la raíz del proyecto
START_SERVERS.bat
```

### 3.2 Ejecutar Tests

```bash
cd apps/api_php
php artisan test

# Output esperado: 26 tests pasando
```

### 3.3 Módulos Disponibles

1. **Dashboard** - Vista general con métricas
2. **Casos** - Gestión de casos judiciales (consulta automática Rama Judicial)
3. **Documentos** - Subir, organizar y versionar archivos
4. **Recordatorios** - Calendario de eventos y plazos
5. **Notificaciones** - Alertas de actuaciones nuevas
6. **Facturación** - Crear y gestionar facturas
7. **Time Tracking** - Registro de horas trabajadas
8. **Jurisprudencia** - Búsqueda de precedentes
9. **Analytics** - Reportes y estadísticas
10. **AI Assistant** - Chat con IA legal (Gemini)

---

## 4. Deployment a Producción

### 4.1 Preparación

**Checklist pre-deployment:**

- [ ] Todos los tests pasan
- [ ] Variables de entorno de producción configuradas
- [ ] Base de datos migrada a PostgreSQL/MySQL
- [ ] Frontend compilado (`npm run build`)
- [ ] Servidor preparado (VPS con Ubuntu 22.04+)

### 4.2 Servidor Recomendado

**Proveedores:**
- DigitalOcean: desde $6/mes
- Vultr: desde $6/mes
- Linode: desde $5/mes
- AWS Lightsail: desde $3.50/mes

**Requisitos mínimos:**
- 1 GB RAM
- 1 CPU
- 25 GB SSD

**Stack necesario:**
- Ubuntu 22.04 LTS
- Nginx
- PHP 8.2 + PHP-FPM
- PostgreSQL 15 o MySQL 8.0
- Python 3.11
- Certbot (HTTPS gratis)
- (Opcional) Redis

### 4.3 Instalación en Servidor

**1. Conectar al servidor:**

```bash
ssh root@tu_servidor_ip
```

**2. Actualizar sistema:**

```bash
apt update && apt upgrade -y
```

**3. Instalar dependencias:**

```bash
# Nginx
apt install -y nginx

# PHP 8.2
apt install -y php8.2 php8.2-fpm php8.2-cli php8.2-common php8.2-mysql \
    php8.2-zip php8.2-gd php8.2-mbstring php8.2-curl php8.2-xml php8.2-bcmath php8.2-sqlite3

# Composer
curl -sS https://getcomposer.org/installer | php
mv composer.phar /usr/local/bin/composer

# Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Python 3.11 (ya incluido en Ubuntu 22.04)
apt install -y python3 python3-pip python3-venv

# PostgreSQL
apt install -y postgresql postgresql-contrib

# Redis (opcional)
apt install -y redis-server
```

**4. Configurar PostgreSQL:**

```bash
sudo -u postgres psql

# En el shell de PostgreSQL:
CREATE DATABASE arconte_prod;
CREATE USER arconte_user WITH PASSWORD 'password_seguro_aqui';
GRANT ALL PRIVILEGES ON DATABASE arconte_prod TO arconte_user;
\q
```

**5. Clonar código:**

```bash
cd /var/www
git clone https://github.com/tu-usuario/arconte.git
cd arconte
```

**6. Backend (Laravel):**

```bash
cd /var/www/arconte/apps/api_php

# Instalar dependencias (sin dev)
composer install --optimize-autoloader --no-dev

# Configurar .env de producción
cp .env.example .env
nano .env  # Editar con valores de producción (ver sección 4.4)

# Generar key
php artisan key:generate

# Migrar base de datos
php artisan migrate --force

# Optimizar
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Permisos
chown -R www-data:www-data /var/www/arconte/apps/api_php/storage
chown -R www-data:www-data /var/www/arconte/apps/api_php/bootstrap/cache
chmod -R 775 /var/www/arconte/apps/api_php/storage
chmod -R 775 /var/www/arconte/apps/api_php/bootstrap/cache
```

**7. Frontend (React):**

```bash
cd /var/www/arconte/apps/web

# Instalar dependencias
npm install

# Configurar .env de producción
cp .env.example .env
nano .env
# VITE_API_URL=https://api.arconte.com/api

# Build de producción
npm run build
# Los archivos estarán en dist/
```

**8. Python Service:**

```bash
cd /var/www/arconte/apps/ingest_py

# Crear virtual environment
python3 -m venv venv
source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt

# Configurar .env
nano .env
# INGEST_API_KEY=la_misma_del_backend
```

### 4.4 Variables de Entorno de Producción

**Backend (`apps/api_php/.env`):**

```env
APP_NAME="Arconte"
APP_ENV=production
APP_DEBUG=false
APP_URL=https://arconte.com

DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=arconte_prod
DB_USERNAME=arconte_user
DB_PASSWORD=tu_password_seguro

SANCTUM_STATEFUL_DOMAINS=arconte.com
SESSION_SECURE_COOKIE=true

CACHE_STORE=redis
QUEUE_CONNECTION=redis

REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379

GEMINI_API_KEY=tu_api_key
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=tu_email@gmail.com
MAIL_PASSWORD=tu_app_password
MAIL_ENCRYPTION=tls

INGEST_BASE_URL=http://127.0.0.1:8001
INGEST_API_KEY=tu_key_generada
```

### 4.5 Configurar Nginx

```bash
nano /etc/nginx/sites-available/arconte
```

**Configuración:**

```nginx
# Frontend
server {
    listen 80;
    server_name arconte.com;
    root /var/www/arconte/apps/web/dist;

    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}

# Backend API
server {
    listen 80;
    server_name api.arconte.com;
    root /var/www/arconte/apps/api_php/public;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";

    index index.php;

    charset utf-8;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    error_page 404 /index.php;

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

**Activar sitio:**

```bash
ln -s /etc/nginx/sites-available/arconte /etc/nginx/sites-enabled/
nginx -t  # Verificar configuración
systemctl restart nginx
```

### 4.6 HTTPS con Let's Encrypt

```bash
# Instalar Certbot
apt install -y certbot python3-certbot-nginx

# Obtener certificados
certbot --nginx -d arconte.com -d api.arconte.com

# Renovación automática ya está configurada
```

### 4.7 Systemd para Python Service

```bash
nano /etc/systemd/system/arconte-ingest.service
```

**Contenido:**

```ini
[Unit]
Description=Arconte Python Ingest Service
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/arconte/apps/ingest_py
Environment="PATH=/var/www/arconte/apps/ingest_py/venv/bin"
ExecStart=/var/www/arconte/apps/ingest_py/venv/bin/python run_persistent.py
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

**Activar servicio:**

```bash
systemctl daemon-reload
systemctl enable arconte-ingest
systemctl start arconte-ingest
systemctl status arconte-ingest
```

### 4.8 Configurar DNS

En tu proveedor de dominio (GoDaddy, Namecheap, etc.):

```
A    arconte.com        → IP_DEL_SERVIDOR
A    api.arconte.com    → IP_DEL_SERVIDOR
```

Espera 5-15 minutos para propagación.

---

## 5. Seguridad

### 5.1 Protección de Claves

**NUNCA hagas esto:**
- ❌ Subir `.env` a Git
- ❌ Compartir claves por email/chat
- ❌ Usar la misma clave en dev y prod

**SIEMPRE haz esto:**
- ✅ Usa `.env.example` para documentar
- ✅ Genera claves únicas por ambiente
- ✅ Rota claves cada 6-12 meses
- ✅ Usa secrets manager en producción (AWS Secrets, Vault)

### 5.2 Firewall (UFW)

```bash
ufw allow 22/tcp   # SSH
ufw allow 80/tcp   # HTTP
ufw allow 443/tcp  # HTTPS
ufw enable
```

### 5.3 Fail2Ban (Anti-Brute Force)

```bash
apt install -y fail2ban
systemctl enable fail2ban
systemctl start fail2ban
```

### 5.4 Backups Automáticos

**Base de datos (diario):**

```bash
nano /etc/cron.daily/backup-arconte
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d)
pg_dump -U arconte_user arconte_prod > /backups/arconte_$DATE.sql
# Opcional: subir a S3, Google Drive, etc.
find /backups -name "arconte_*.sql" -mtime +7 -delete  # Borrar backups >7 días
```

```bash
chmod +x /etc/cron.daily/backup-arconte
mkdir -p /backups
```

---

## 6. Troubleshooting

### 6.1 Error: "API Key invalid"

**Causa:** La key en Laravel y Python no coinciden

**Solución:**

```bash
# Verificar en Laravel
cd apps/api_php
grep INGEST_API_KEY .env

# Verificar en Python
cd apps/ingest_py
grep INGEST_API_KEY .env  # O variable de entorno

# Deben ser EXACTAMENTE iguales
```

### 6.2 Error: "CORS policy"

**Causa:** Frontend y backend en dominios distintos

**Solución en desarrollo:**

```env
# apps/api_php/.env
SANCTUM_STATEFUL_DOMAINS=localhost:3000
```

**Solución en producción:**

```env
# apps/api_php/.env
SANCTUM_STATEFUL_DOMAINS=arconte.com
```

### 6.3 Error: "Connection refused"

**Verificar servicios:**

```bash
# Backend (Laravel)
systemctl status php8.2-fpm
systemctl status nginx

# Python
systemctl status arconte-ingest

# Base de datos
systemctl status postgresql  # o mysql

# Redis (si aplica)
systemctl status redis
```

**Reiniciar servicios:**

```bash
systemctl restart php8.2-fpm nginx arconte-ingest
```

### 6.4 Performance Lento

**Verificar cache:**

```bash
cd apps/api_php
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

**Verificar Redis:**

```bash
redis-cli ping  # Debe responder PONG
```

**Verificar índices de DB:**

```bash
php artisan migrate:status  # Verificar que add_performance_indexes esté ejecutada
```

### 6.5 Error 500 en Producción

**Ver logs:**

```bash
# Laravel
tail -f /var/www/arconte/apps/api_php/storage/logs/laravel.log

# Nginx
tail -f /var/log/nginx/error.log

# Python
journalctl -u arconte-ingest -f
```

**Causa común:** Permisos incorrectos

```bash
cd /var/www/arconte/apps/api_php
chown -R www-data:www-data storage bootstrap/cache
chmod -R 775 storage bootstrap/cache
```

---

## 7. Mantenimiento

### 7.1 Deployments Posteriores

```bash
cd /var/www/arconte
git pull origin main

# Backend
cd apps/api_php
composer install --optimize-autoloader --no-dev
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Frontend
cd ../web
npm install
npm run build

# Python
cd ../ingest_py
source venv/bin/activate
pip install -r requirements.txt
sudo systemctl restart arconte-ingest

# Reiniciar servicios
sudo systemctl restart php8.2-fpm nginx
```

### 7.2 Actualizar Dependencias

```bash
# Backend (Laravel)
cd apps/api_php
composer update

# Frontend (React)
cd apps/web
npm update

# Python
cd apps/ingest_py
pip install --upgrade -r requirements.txt
```

### 7.3 Monitoreo

**Herramientas recomendadas:**

1. **Uptime:** UptimeRobot (gratis) - Monitorea si el sitio está up
2. **Errors:** Sentry.io (gratis hasta 5k errores/mes)
3. **Logs:** Papertrail o Loggly
4. **Performance:** New Relic (APM)

**Health check endpoint:**

```bash
curl https://api.arconte.com/up  # Debe retornar 200 OK
```

### 7.4 Rotación de Logs

Nginx ya incluye rotación. Para Laravel:

```bash
nano /etc/logrotate.d/arconte
```

```
/var/www/arconte/apps/api_php/storage/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    notifempty
    sharedscripts
}
```

---

## 🎯 Resumen de Comandos Útiles

**Desarrollo:**
```bash
# Levantar servicios
php artisan serve              # Backend
npm run dev                    # Frontend
python run_persistent.py       # Python

# Tests
php artisan test

# Ver rutas
php artisan route:list

# Crear usuario
php artisan tinker
>>> User::create([...])
```

**Producción:**
```bash
# Deploy
git pull && composer install --no-dev && php artisan migrate --force && npm run build

# Cache
php artisan config:cache && php artisan route:cache && php artisan view:cache

# Logs
tail -f storage/logs/laravel.log
journalctl -u arconte-ingest -f

# Reiniciar servicios
systemctl restart php8.2-fpm nginx arconte-ingest
```

---

## 📞 Soporte

Si encuentras problemas:

1. Revisa los logs primero
2. Busca el error en Google
3. Consulta esta guía
4. Revisa `docs/archive/` para documentación histórica
5. Abre un issue en GitHub (si es bug del código)

---

## ✅ Checklist Final

**Desarrollo:**
- [ ] Backend corre en :8000
- [ ] Frontend corre en :3000
- [ ] Python corre en :8001
- [ ] Puedo hacer login
- [ ] Tests pasan

**Producción:**
- [ ] Servidor configurado (Nginx + PHP + PostgreSQL)
- [ ] HTTPS funcionando (Let's Encrypt)
- [ ] DNS apunta correctamente
- [ ] Backups automáticos configurados
- [ ] Monitoring configurado
- [ ] Firewall activo
- [ ] Python service corriendo como systemd
- [ ] Logs rotando automáticamente

---

**¡Tu aplicación está lista!**

Esta guía cubre el 95% de los casos de uso. Para casos específicos o problemas avanzados, consulta la documentación oficial de Laravel, React, o FastAPI.

**Última actualización:** Octubre 2025
