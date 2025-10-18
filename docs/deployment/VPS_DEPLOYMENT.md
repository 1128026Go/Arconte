# 🖥️ Deployment en VPS - Arconte

Guía completa para desplegar Arconte en un VPS (Virtual Private Server) usando Docker. Ideal para producción con control total y costos optimizados.

---

## 📋 Tabla de Contenidos

1. [Ventajas y Limitaciones](#ventajas-y-limitaciones)
2. [Proveedores Recomendados](#proveedores-recomendados)
3. [Requisitos](#requisitos)
4. [Preparación del Servidor](#preparación-del-servidor)
5. [Instalación de Docker](#instalación-de-docker)
6. [Deployment](#deployment)
7. [Configuración Post-Deployment](#configuración-post-deployment)
8. [Mantenimiento](#mantenimiento)
9. [Troubleshooting](#troubleshooting)

---

## ✅ Ventajas y Limitaciones

### ✅ Ventajas

- ✅ **Control total** sobre la infraestructura
- ✅ **Costo optimizado** ($5-20/mes vs $25-50/mes Railway)
- ✅ **Performance predecible** (recursos dedicados)
- ✅ **Escalabilidad flexible** (upgrades fáciles)
- ✅ **Sin vendor lock-in** (portabilidad)
- ✅ **Acceso root completo**
- ✅ **Ideal para producción** a largo plazo
- ✅ **Múltiples apps** en mismo servidor

### ⚠️ Limitaciones

- ⚠️ **Requiere conocimientos DevOps**
- ⚠️ **Setup manual** (1-2 horas)
- ⚠️ **Mantenimiento continuo** (actualizaciones, seguridad)
- ⚠️ **Sin auto-scaling** (escalado manual)
- ⚠️ **Responsabilidad de backups**
- ⚠️ **Monitoreo manual**

---

## 🏢 Proveedores Recomendados

### Comparativa de Proveedores

| Proveedor | CPU/RAM | Disco | Precio | Ubicación | Recomendado |
|-----------|---------|-------|--------|-----------|-------------|
| **DigitalOcean** | 1vCPU/2GB | 50GB SSD | $12/mes | Global | ⭐⭐⭐⭐⭐ |
| **Hetzner** | 2vCPU/4GB | 40GB SSD | €4.5/mes | EU | ⭐⭐⭐⭐⭐ |
| **Linode (Akamai)** | 1vCPU/2GB | 50GB SSD | $12/mes | Global | ⭐⭐⭐⭐ |
| **Vultr** | 1vCPU/2GB | 55GB SSD | $12/mes | Global | ⭐⭐⭐⭐ |
| **Contabo** | 4vCPU/8GB | 200GB SSD | €6/mes | EU | ⭐⭐⭐ |
| **AWS Lightsail** | 1vCPU/2GB | 60GB SSD | $12/mes | Global | ⭐⭐⭐ |

### 🏆 Recomendación Top 3

**1. Hetzner (Mejor precio/performance)**
- Excelente hardware
- Ubicación: Alemania/Finlandia
- Ideal para Europa/Latam
- [Hetzner Cloud](https://www.hetzner.com/cloud)

**2. DigitalOcean (Más fácil de usar)**
- Excelente documentación
- Snapshots fáciles
- Global coverage
- [DigitalOcean](https://www.digitalocean.com)

**3. Linode/Akamai (Balanceado)**
- Red de Akamai
- Soporte excelente
- [Linode](https://www.linode.com)

---

## 📋 Requisitos

### Especificaciones Mínimas del Servidor

**Para Arconte (Producción):**
- ✅ **CPU:** 2 vCPUs
- ✅ **RAM:** 4GB
- ✅ **Disco:** 40GB SSD
- ✅ **OS:** Ubuntu 22.04 LTS
- ✅ **Bandwidth:** 1TB/mes

**Para Testing/Staging:**
- ⚠️ **CPU:** 1 vCPU
- ⚠️ **RAM:** 2GB
- ⚠️ **Disco:** 25GB SSD

### Software Requerido

- Ubuntu 22.04 LTS (recomendado)
- Docker 20.10+
- Docker Compose 2.0+
- Git
- Nginx (opcional, para reverse proxy)

### APIs y Servicios Externos

- [ ] Gemini API Key
- [ ] ePayco Keys
- [ ] Resend API Key
- [ ] Dominio registrado
- [ ] Cloudflare account (DNS)

---

## 🚀 Preparación del Servidor

### Paso 1: Crear VPS

**En DigitalOcean (ejemplo):**

1. **Ir a DigitalOcean**
   ```
   https://cloud.digitalocean.com/droplets/new
   ```

2. **Configuración:**
   - **Imagen:** Ubuntu 22.04 LTS x64
   - **Plan:** Basic ($12/mes - 2GB RAM)
   - **Datacenter:**
     - Latam: NYC1, SFO3
     - Europa: AMS3, FRA1
   - **Autenticación:** SSH Key (recomendado)
   - **Hostname:** arconte-prod

3. **Create Droplet**
   - Esperar ~1 minuto
   - Copiar IP pública

### Paso 2: Conectar al Servidor

```bash
# Conectar vía SSH
ssh root@TU_IP_SERVIDOR

# Si usas contraseña, la recibirás por email
# Recomendado: Usar SSH keys
```

### Paso 3: Actualizar Sistema

```bash
# Actualizar paquetes
apt update && apt upgrade -y

# Instalar utilidades básicas
apt install -y curl wget git vim ufw net-tools
```

### Paso 4: Configurar Firewall

```bash
# Habilitar UFW
ufw default deny incoming
ufw default allow outgoing

# Permitir SSH (¡IMPORTANTE antes de habilitar!)
ufw allow 22/tcp

# Permitir HTTP y HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Habilitar firewall
ufw enable

# Verificar status
ufw status
```

**Output esperado:**
```
Status: active

To                         Action      From
--                         ------      ----
22/tcp                     ALLOW       Anywhere
80/tcp                     ALLOW       Anywhere
443/tcp                    ALLOW       Anywhere
```

### Paso 5: Crear Usuario No-Root (Recomendado)

```bash
# Crear usuario
adduser arconte

# Agregar a sudo
usermod -aG sudo arconte

# Agregar a docker (después de instalar Docker)
usermod -aG docker arconte

# Cambiar a usuario
su - arconte
```

---

## 🐳 Instalación de Docker

### Opción A: Script Automatizado (Recomendado)

```bash
# Descargar script oficial de Docker
curl -fsSL https://get.docker.com -o get-docker.sh

# Ejecutar instalación
sudo sh get-docker.sh

# Verificar instalación
docker --version
# Output: Docker version 24.0.x

# Instalar Docker Compose
sudo apt install docker-compose-plugin

# Verificar Docker Compose
docker compose version
# Output: Docker Compose version v2.x.x
```

### Opción B: Instalación Manual

```bash
# Agregar repositorio Docker
sudo apt-get update
sudo apt-get install ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch="$(dpkg --print-architecture)" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  "$(. /etc/os-release && echo "$VERSION_CODENAME")" stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Instalar Docker
sudo apt-get update
sudo apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Verificar
sudo docker run hello-world
```

### Post-Instalación

```bash
# Agregar usuario actual al grupo docker
sudo usermod -aG docker $USER

# Aplicar cambios (logout y login, o:)
newgrp docker

# Habilitar Docker al inicio
sudo systemctl enable docker.service
sudo systemctl enable containerd.service

# Verificar que funciona sin sudo
docker ps
```

---

## 📦 Deployment

### Paso 1: Clonar Repositorio

```bash
# Ir a home directory
cd ~

# Clonar repo
git clone https://github.com/1128026Go/Arconte.git

# Entrar al proyecto
cd Arconte/"Aplicacion Juridica"
```

### Paso 2: Configurar Variables de Entorno

```bash
# Copiar template
cp .env.production.example .env.production

# Editar variables
nano .env.production
```

**Variables críticas a configurar:**

```bash
# Aplicación
APP_NAME="Arconte"
APP_ENV=production
APP_DEBUG=false
APP_URL=https://tu-dominio.com

# Generar APP_KEY
docker run --rm -v $(pwd)/apps/api_php:/app -w /app php:8.2-cli php artisan key:generate --show
# Copiar el output y pegarlo en APP_KEY

# Base de datos
DB_PASSWORD=$(openssl rand -base64 32)
# Copiar y pegar en .env.production

# Redis
REDIS_PASSWORD=$(openssl rand -base64 32)

# Email (Resend)
MAIL_PASSWORD=re_XXXXXXXXXX  # Tu API key

# Gemini
GEMINI_API_KEY=XXXXXXXXXXX

# ePayco
EPAYCO_PUBLIC_KEY=XXXXXXXXXXX
EPAYCO_PRIVATE_KEY=XXXXXXXXXXX
EPAYCO_TEST=false

# Frontend
FRONTEND_URL=https://tu-dominio.com
SANCTUM_STATEFUL_DOMAINS=tu-dominio.com,www.tu-dominio.com

# Seguridad
SESSION_SECURE_COOKIE=true
TRUSTED_PROXIES=*
```

**Guardar:** Ctrl+X, Y, Enter

### Paso 3: Configurar SSL (Cloudflare Origin)

Seguir guía: [SSL_CLOUDFLARE_SETUP.md](./SSL_CLOUDFLARE_SETUP.md)

```bash
# Crear directorio SSL
mkdir -p nginx/ssl

# Crear certificados (copiar de Cloudflare)
nano nginx/ssl/fullchain.pem
# Pegar certificado Origin Certificate

nano nginx/ssl/privkey.pem
# Pegar Private Key

# Permisos restrictivos
chmod 600 nginx/ssl/privkey.pem
chmod 644 nginx/ssl/fullchain.pem
```

### Paso 4: Habilitar SSL en Nginx

```bash
# Editar configuración
nano nginx/conf.d/default.conf

# Descomentar líneas SSL:
# listen 443 ssl http2;
# ssl_certificate /etc/nginx/ssl/fullchain.pem;
# ssl_certificate_key /etc/nginx/ssl/privkey.pem;

# Descomentar redirect HTTP → HTTPS
```

### Paso 5: Validar Deployment

```bash
# Ejecutar script de validación
./scripts/production/validate-deployment.sh
```

**Debe pasar 100% de checks.**

Si hay errores, resolverlos antes de continuar.

### Paso 6: Build de Imágenes

```bash
# Ejecutar script de build
./scripts/production/build.sh
```

**Tiempo estimado:** 5-10 minutos

**Output esperado:**
```
✅ API backend built successfully
✅ Web frontend built successfully
✅ All images built successfully!
```

### Paso 7: Iniciar Servicios

```bash
# Iniciar todos los servicios
docker-compose -f docker-compose.production.yml up -d

# Ver logs en tiempo real
docker-compose -f docker-compose.production.yml logs -f
```

**Verificar que todos los servicios estén UP:**
```bash
docker-compose -f docker-compose.production.yml ps
```

### Paso 8: Ejecutar Migraciones

```bash
# Esperar ~30 segundos para que DB esté lista
sleep 30

# Ejecutar migraciones
docker-compose -f docker-compose.production.yml exec api php artisan migrate --force

# Optimizar Laravel
docker-compose -f docker-compose.production.yml exec api php artisan config:cache
docker-compose -f docker-compose.production.yml exec api php artisan route:cache
docker-compose -f docker-compose.production.yml exec api php artisan view:cache
docker-compose -f docker-compose.production.yml exec api php artisan optimize
```

### Paso 9: Verificar Health Checks

```bash
# API health check
curl http://localhost/api/health
# Debe responder: 200 OK

# Frontend health check
curl http://localhost/health
# Debe responder: healthy
```

---

## ⚙️ Configuración Post-Deployment

### Configurar DNS en Cloudflare

**Registros necesarios:**

```
Type: A
Name: @
Content: [IP del servidor]
Proxy: Proxied (nube naranja)

Type: A
Name: www
Content: [IP del servidor]
Proxy: Proxied

Type: A
Name: api
Content: [IP del servidor]
Proxy: Proxied
```

### Configurar Backups Automáticos

**Crear script de backup:**

```bash
# Crear directorio para backups
mkdir -p ~/backups

# Crear script
nano ~/backup-arconte.sh
```

**Contenido del script:**

```bash
#!/bin/bash

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=~/backups
PROJECT_DIR=~/Arconte/"Aplicacion Juridica"

cd $PROJECT_DIR

# Backup de base de datos
docker-compose -f docker-compose.production.yml exec -T postgres \
  pg_dump -U arconte arconte > $BACKUP_DIR/db_$DATE.sql

# Comprimir
gzip $BACKUP_DIR/db_$DATE.sql

# Backup de storage
tar -czf $BACKUP_DIR/storage_$DATE.tar.gz apps/api_php/storage/app

# Eliminar backups antiguos (>30 días)
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete

echo "Backup completado: $DATE"
```

**Hacer ejecutable:**
```bash
chmod +x ~/backup-arconte.sh
```

**Programar backup diario (cron):**

```bash
# Editar crontab
crontab -e

# Agregar línea (backup diario a las 3 AM)
0 3 * * * /home/arconte/backup-arconte.sh >> /home/arconte/backup.log 2>&1
```

### Configurar Monitoring

**Opción 1: Uptime Monitoring Externo**

- UptimeRobot: https://uptimerobot.com (gratis)
- Configurar: https://tu-dominio.com/health
- Alertas: Email/SMS

**Opción 2: Netdata (Self-hosted)**

```bash
# Instalar Netdata
bash <(curl -Ss https://my-netdata.io/kickstart.sh)

# Acceder: http://TU_IP:19999
```

### Configurar Log Rotation

```bash
# Crear config para logs de Docker
sudo nano /etc/docker/daemon.json
```

```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

```bash
# Reiniciar Docker
sudo systemctl restart docker

# Reiniciar containers
cd ~/Arconte/"Aplicacion Juridica"
docker-compose -f docker-compose.production.yml restart
```

---

## 🔄 Mantenimiento

### Actualizar Aplicación

```bash
# 1. Backup
~/backup-arconte.sh

# 2. Pull cambios
cd ~/Arconte/"Aplicacion Juridica"
git pull origin main

# 3. Rebuild
./scripts/production/build.sh

# 4. Deploy
./scripts/production/deploy.sh
```

### Ver Logs

```bash
# Todos los servicios
docker-compose -f docker-compose.production.yml logs -f

# Servicio específico
docker-compose -f docker-compose.production.yml logs -f api

# Últimas 100 líneas
docker-compose -f docker-compose.production.yml logs --tail=100 api
```

### Reiniciar Servicios

```bash
# Todos
docker-compose -f docker-compose.production.yml restart

# Específico
docker-compose -f docker-compose.production.yml restart api
```

### Actualizar Sistema Operativo

```bash
# Actualizar paquetes
sudo apt update && sudo apt upgrade -y

# Reiniciar si es necesario
sudo reboot
```

---

## 🐛 Troubleshooting

### Error: "Cannot connect to Docker daemon"

```bash
# Iniciar Docker
sudo systemctl start docker

# Verificar status
sudo systemctl status docker

# Agregar usuario a grupo docker
sudo usermod -aG docker $USER
newgrp docker
```

### Error: "Port 80 already in use"

```bash
# Ver qué proceso usa el puerto
sudo lsof -i :80

# Matar proceso (si no es importante)
sudo kill -9 <PID>

# O cambiar puerto de Nginx
nano nginx/conf.d/default.conf
# Cambiar listen 80 → listen 8080
```

### Error: "Database connection refused"

```bash
# Verificar que postgres esté running
docker-compose ps postgres

# Ver logs
docker-compose logs postgres

# Reiniciar
docker-compose restart postgres
```

### Error: "Out of disk space"

```bash
# Ver espacio
df -h

# Limpiar imágenes Docker sin usar
docker system prune -a --volumes

# Limpiar logs
sudo journalctl --vacuum-time=7d

# Eliminar backups antiguos
find ~/backups -mtime +30 -delete
```

### Performance lento

```bash
# Ver uso de recursos
docker stats

# Ver procesos
htop  # (instalar si no existe: apt install htop)

# Verificar swap
free -h

# Agregar swap si es necesario (1GB)
sudo fallocate -l 1G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

---

## 📊 Optimización

### Performance del Servidor

```bash
# Optimizar PostgreSQL
# Editar postgresql.conf en container
docker-compose exec postgres psql -U arconte -c "ALTER SYSTEM SET shared_buffers = '256MB';"
docker-compose exec postgres psql -U arconte -c "ALTER SYSTEM SET effective_cache_size = '1GB';"
docker-compose restart postgres
```

### Reducir Costos

**Downgrade si es posible:**
- 2GB RAM suficiente para tráfico bajo
- Migrar a Hetzner (€4.5/mes vs $12/mes)
- Usar CDN de Cloudflare (reduce bandwidth)

---

## ✅ Checklist VPS Deployment

- [ ] VPS provisionado (Ubuntu 22.04)
- [ ] SSH key configurado
- [ ] Firewall configurado (UFW)
- [ ] Usuario no-root creado
- [ ] Docker instalado
- [ ] Docker Compose instalado
- [ ] Repositorio clonado
- [ ] .env.production configurado
- [ ] Certificados SSL instalados
- [ ] Validación exitosa
- [ ] Build completado
- [ ] Servicios levantados
- [ ] Migraciones ejecutadas
- [ ] DNS configurado
- [ ] Backups automáticos
- [ ] Monitoring configurado
- [ ] Health checks OK
- [ ] Aplicación accesible

---

## 📚 Recursos

**Proveedores:**
- DigitalOcean: https://www.digitalocean.com
- Hetzner: https://www.hetzner.com
- Linode: https://www.linode.com

**Tutoriales:**
- DigitalOcean Tutorials: https://www.digitalocean.com/community/tutorials
- Docker Docs: https://docs.docker.com
- Ubuntu Server Guide: https://ubuntu.com/server/docs

**Herramientas:**
- Netdata: https://www.netdata.cloud
- UptimeRobot: https://uptimerobot.com
- Portainer (Docker UI): https://www.portainer.io

---

**¡Tu VPS está listo!** 🎉

Costo estimado: **$5-12/mes**
Control total: **✅**
Performance: **⚡**
