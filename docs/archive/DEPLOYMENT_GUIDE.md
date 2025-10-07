# 🚀 Guía de Despliegue - Arconte
**Tu asistente jurídico inteligente**

## 📋 Requisitos Previos

### Backend (Laravel API)
- PHP 8.2+
- Composer
- Base de datos (MySQL 8.0+ o PostgreSQL 14+)
- Redis (opcional, recomendado para producción)
- Extensiones PHP: `pdo`, `mbstring`, `openssl`, `json`, `curl`, `xml`, `gd`

### Frontend (React)
- Node.js 18+
- npm o yarn

---

## 🔧 Configuración del Backend

### 1. Clonar el Repositorio
```bash
git clone <tu-repositorio>
cd Aplicacion\ Juridica/apps/api_php
```

### 2. Instalar Dependencias
```bash
composer install --optimize-autoloader --no-dev
```

### 3. Configurar Variables de Entorno
```bash
cp .env.production.example .env
php artisan key:generate
```

Edita el archivo `.env` y configura:

#### Base de Datos
```env
DB_CONNECTION=mysql
DB_HOST=tu-servidor-db
DB_PORT=3306
DB_DATABASE=nombre_db
DB_USERNAME=usuario_db
DB_PASSWORD=contraseña_segura
```

#### URL de la Aplicación
```env
APP_URL=https://api.tudominio.com
SANCTUM_STATEFUL_DOMAINS=app.tudominio.com
```

#### Correo Electrónico
```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=tu-email@gmail.com
MAIL_PASSWORD=tu-contraseña-app
MAIL_FROM_ADDRESS=noreply@tudominio.com
```

#### API de Gemini (Ya configurada)
```env
GEMINI_API_KEY=AIzaSyAQL5ROVVhsInQVR1Sv54ku5kB8aXET9Gw
```

### 4. Ejecutar Migraciones
```bash
php artisan migrate --force
```

### 5. Crear Usuario Administrador
```bash
php artisan app:create-test-user
```

### 6. Optimizar para Producción
```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan optimize
```

### 7. Configurar Permisos
```bash
chmod -R 755 storage bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache
```

### 8. Configurar Cron (para recordatorios automáticos)
Agrega a tu crontab:
```bash
* * * * * cd /ruta/a/tu/app && php artisan schedule:run >> /dev/null 2>&1
```

---

## 🎨 Configuración del Frontend

### 1. Navegar al Directorio
```bash
cd ../../apps/web
```

### 2. Instalar Dependencias
```bash
npm install
```

### 3. Configurar Variables de Entorno
```bash
cp .env.production.example .env.production
```

Edita `.env.production`:
```env
VITE_API_URL=https://api.tudominio.com/api
VITE_APP_URL=https://app.tudominio.com
```

### 4. Compilar para Producción
```bash
npm run build
```

Los archivos compilados estarán en `dist/`

---

## 🌐 Despliegue

### Opción 1: Servidor VPS (DigitalOcean, AWS EC2, etc.)

#### Backend
1. Usa Nginx como servidor web
2. Configura PHP-FPM
3. Apunta el root a `/ruta/app/public`

**Ejemplo de configuración Nginx:**
```nginx
server {
    listen 80;
    server_name api.tudominio.com;
    root /var/www/legaltech/public;

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

#### Frontend
Sirve los archivos de `dist/` con Nginx:
```nginx
server {
    listen 80;
    server_name app.tudominio.com;
    root /var/www/legaltech-frontend/dist;

    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### Opción 2: Usando Laravel Forge
1. Conecta tu servidor
2. Crea un nuevo sitio
3. Configura el repositorio Git
4. Activa despliegue automático

### Opción 3: Usando Vercel (Frontend) + Railway (Backend)

#### Backend en Railway
```bash
railway login
railway init
railway up
```

#### Frontend en Vercel
```bash
npm install -g vercel
vercel --prod
```

---

## 🔒 Seguridad en Producción

### 1. SSL/TLS
Instala certificados SSL usando Let's Encrypt:
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.tudominio.com -d app.tudominio.com
```

### 2. Firewall
```bash
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

### 3. Variables Sensibles
- ✅ Nunca comitees archivos `.env`
- ✅ Usa contraseñas fuertes para la base de datos
- ✅ Cambia `APP_KEY` en producción
- ✅ Desactiva `APP_DEBUG=false`

---

## 📊 Monitoreo

### Logs del Backend
```bash
tail -f storage/logs/laravel.log
```

### Estado del Sistema
```bash
php artisan health:check
```

### Verificar Jobs en Cola (si usas Redis)
```bash
php artisan queue:work --tries=3
```

---

## 🧪 Verificación Post-Despliegue

### Backend
```bash
curl https://api.tudominio.com/api
# Respuesta esperada: {"message":"LegalTechCO API"}
```

### Registro de Usuario
```bash
curl -X POST https://api.tudominio.com/api/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","password":"password123"}'
```

### Frontend
Visita `https://app.tudominio.com` y verifica:
- ✅ Página de login carga correctamente
- ✅ Registro de usuario funciona
- ✅ Dashboard carga después del login
- ✅ Todos los módulos son accesibles

---

## 🆘 Solución de Problemas

### Error: "CSRF token mismatch"
```bash
php artisan config:cache
php artisan cache:clear
```

### Error: "Connection refused"
Verifica que `VITE_API_URL` apunta a la URL correcta del backend.

### Error 500 en API
```bash
php artisan optimize:clear
tail -f storage/logs/laravel.log
```

### Frontend no conecta con API
1. Verifica CORS en `config/cors.php`
2. Confirma que `SANCTUM_STATEFUL_DOMAINS` incluye tu dominio
3. Verifica que el certificado SSL es válido

---

## 📞 Soporte

Si encuentras problemas durante el despliegue:
1. Revisa los logs: `storage/logs/laravel.log`
2. Verifica la configuración: `php artisan config:show`
3. Prueba la conectividad de la base de datos: `php artisan db:show`

---

## ✅ Checklist de Despliegue

### Backend
- [ ] Repositorio clonado
- [ ] Dependencias instaladas con `composer install`
- [ ] Archivo `.env` configurado
- [ ] `APP_KEY` generada
- [ ] Base de datos configurada
- [ ] Migraciones ejecutadas
- [ ] Usuario administrador creado
- [ ] Configuración cacheada
- [ ] Permisos configurados
- [ ] Cron configurado
- [ ] SSL instalado

### Frontend
- [ ] Dependencias instaladas con `npm install`
- [ ] Variables de entorno configuradas
- [ ] Build de producción creado
- [ ] Archivos subidos al servidor
- [ ] Nginx configurado
- [ ] SSL instalado

### Pruebas
- [ ] API responde correctamente
- [ ] Login funciona
- [ ] Registro funciona
- [ ] Módulos cargan correctamente
- [ ] Asistente IA responde (Gemini)
- [ ] Recordatorios se envían

---

## 🎉 ¡Listo!

Tu aplicación LegalTech Colombia ahora está en producción y lista para usar.

**Credenciales de Prueba:**
- Email: `admin@test.com`
- Password: `admin123`

**Módulos Disponibles:**
- 📄 Documentos
- 💰 Facturación
- ⏱️ Time Tracking
- 🔔 Recordatorios
- ⚖️ Jurisprudencia
- 📊 Analíticas
- 🤖 Asistente IA
- 👥 Equipos
