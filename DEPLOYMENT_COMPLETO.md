# 🚀 Guía Completa de Deployment - Arconte

## 📋 Índice

1. [Preparación Pre-Deployment](#preparación)
2. [Configuración de Infraestructura](#infraestructura)
3. [Deployment con Docker](#docker-deployment)
4. [CI/CD con GitHub Actions](#cicd)
5. [Monitoreo y Alertas](#monitoreo)
6. [Backups y Disaster Recovery](#backups)
7. [Troubleshooting](#troubleshooting)

---

## 🔧 Preparación Pre-Deployment {#preparación}

### 1. Checklist de Seguridad

- [ ] **Rotar todas las credenciales:**
  - GEMINI_API_KEY (nueva)
  - Gmail App Password (nueva)
  - INGEST_API_KEY (nueva)
  - DB_PASSWORD (generar fuerte)
  - REDIS_PASSWORD (generar)

- [ ] **Configurar .env producción:**
```bash
cp apps/api_php/.env.production.example apps/api_php/.env
# Editar con credenciales reales
```

- [ ] **SSL Certificates:**
```bash
# Opción 1: Let's Encrypt (gratis)
certbot certonly --webroot -w /var/www/certbot \
  -d arconte.com -d www.arconte.com

# Opción 2: Certificado comercial
# Copiar a nginx/ssl/
```

- [ ] **Configurar Secrets en GitHub:**
```
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
CLOUDFRONT_DISTRIBUTION_ID
SLACK_WEBHOOK
```

### 2. Requisitos del Servidor

**Mínimo Recomendado:**
- **CPU:** 4 vCPUs
- **RAM:** 16 GB
- **Disco:** 100 GB SSD
- **OS:** Ubuntu 22.04 LTS

**Producción Escalable:**
- **CPU:** 8+ vCPUs
- **RAM:** 32 GB
- **Disco:** 500 GB SSD NVMe
- **OS:** Ubuntu 22.04 LTS

---

## 🏗️ Configuración de Infraestructura {#infraestructura}

### Opción 1: AWS (Recomendado)

#### 1.1 VPC y Networking
```bash
# Crear VPC
aws ec2 create-vpc --cidr-block 10.0.0.0/16 --tag-specifications 'ResourceType=vpc,Tags=[{Key=Name,Value=arconte-vpc}]'

# Subnets públicas y privadas
aws ec2 create-subnet --vpc-id vpc-xxx --cidr-block 10.0.1.0/24 --availability-zone us-east-1a
aws ec2 create-subnet --vpc-id vpc-xxx --cidr-block 10.0.2.0/24 --availability-zone us-east-1b
```

#### 1.2 RDS PostgreSQL
```bash
aws rds create-db-instance \
  --db-instance-identifier arconte-postgres \
  --db-instance-class db.t3.medium \
  --engine postgres \
  --engine-version 16.1 \
  --master-username arconte \
  --master-user-password <PASSWORD> \
  --allocated-storage 100 \
  --storage-type gp3 \
  --backup-retention-period 30 \
  --multi-az \
  --publicly-accessible false
```

#### 1.3 ElastiCache Redis
```bash
aws elasticache create-cache-cluster \
  --cache-cluster-id arconte-redis \
  --engine redis \
  --cache-node-type cache.t3.medium \
  --num-cache-nodes 1 \
  --engine-version 7.0
```

#### 1.4 S3 para Documentos
```bash
aws s3 mb s3://arconte-documents
aws s3 mb s3://arconte-backups

# Configurar lifecycle policy
aws s3api put-bucket-lifecycle-configuration \
  --bucket arconte-backups \
  --lifecycle-configuration file://s3-lifecycle.json
```

#### 1.5 CloudFront CDN
```bash
aws cloudfront create-distribution \
  --origin-domain-name arconte.com \
  --default-root-object index.html \
  --enabled
```

### Opción 2: DigitalOcean (Más Simple)

```bash
# Droplet
doctl compute droplet create arconte-prod \
  --region nyc1 \
  --size s-4vcpu-8gb \
  --image ubuntu-22-04-x64 \
  --ssh-keys <YOUR_SSH_KEY_ID>

# Managed Database
doctl databases create arconte-db \
  --engine pg \
  --version 16 \
  --size db-s-2vcpu-4gb \
  --region nyc1 \
  --num-nodes 1
```

### Opción 3: Google Cloud Platform

```bash
# Compute Instance
gcloud compute instances create arconte-prod \
  --machine-type n2-standard-4 \
  --zone us-central1-a \
  --image-family ubuntu-2204-lts \
  --boot-disk-size 100GB \
  --boot-disk-type pd-ssd

# Cloud SQL PostgreSQL
gcloud sql instances create arconte-postgres \
  --database-version POSTGRES_16 \
  --tier db-n1-standard-2 \
  --region us-central1 \
  --backup-start-time 03:00
```

---

## 🐳 Deployment con Docker {#docker-deployment}

### 1. Preparar Servidor

```bash
# SSH al servidor
ssh root@your-server-ip

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Instalar Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Verificar
docker --version
docker-compose --version
```

### 2. Clonar Repositorio

```bash
git clone https://github.com/1128026Go/Arconte.git
cd Arconte

# Checkout a rama de producción
git checkout main
```

### 3. Configurar Variables de Entorno

```bash
# Crear archivo .env principal
cat > .env << 'EOF'
# Database
DB_DATABASE=arconte_production
DB_USERNAME=arconte
DB_PASSWORD=<SECURE_PASSWORD>

# Redis
REDIS_PASSWORD=<SECURE_PASSWORD>

# API
API_URL=https://api.arconte.com

# Ingest
INGEST_API_KEY=<64_CHAR_HEX>

# Monitoring
GRAFANA_PASSWORD=<SECURE_PASSWORD>

# AWS (opcional para backups)
AWS_S3_BUCKET=arconte-backups
AWS_ACCESS_KEY_ID=<KEY>
AWS_SECRET_ACCESS_KEY=<SECRET>
EOF

chmod 600 .env
```

### 4. Build y Deploy

```bash
# Build images
docker-compose -f docker-compose.production.yml build

# Iniciar servicios
docker-compose -f docker-compose.production.yml up -d

# Verificar estado
docker-compose -f docker-compose.production.yml ps

# Ver logs
docker-compose -f docker-compose.production.yml logs -f
```

### 5. Ejecutar Migraciones

```bash
docker-compose -f docker-compose.production.yml exec api php artisan migrate --force
docker-compose -f docker-compose.production.yml exec api php artisan db:seed --force
```

### 6. Optimizaciones Laravel

```bash
docker-compose -f docker-compose.production.yml exec api php artisan config:cache
docker-compose -f docker-compose.production.yml exec api php artisan route:cache
docker-compose -f docker-compose.production.yml exec api php artisan view:cache
docker-compose -f docker-compose.production.yml exec api php artisan optimize
```

---

## 🔄 CI/CD con GitHub Actions {#cicd}

### 1. Configurar Secrets en GitHub

```bash
# Ir a: Settings > Secrets and variables > Actions

AWS_ACCESS_KEY_ID          # Para ECR y S3
AWS_SECRET_ACCESS_KEY
CLOUDFRONT_DISTRIBUTION_ID # Para invalidar cache
SLACK_WEBHOOK             # Notificaciones
```

### 2. Workflow Automático

El archivo `.github/workflows/deploy.yml` ya está configurado para:

1. **Tests automáticos** en cada push
2. **Build de Docker images**
3. **Push a Amazon ECR**
4. **Deploy a ECS/Fargate**
5. **Migr

aciones automáticas**
6. **Health checks**
7. **Notificaciones Slack**

### 3. Trigger Manual

```bash
# Desde GitHub UI:
Actions > Deploy to Production > Run workflow

# O via CLI:
gh workflow run deploy.yml
```

---

## 📊 Monitoreo y Alertas {#monitoreo}

### 1. Prometheus + Grafana (Incluido en Docker)

**Acceso:**
- Prometheus: `http://your-server:9090`
- Grafana: `https://monitoring.arconte.com`
  - Usuario: `admin`
  - Password: `<GRAFANA_PASSWORD>`

**Dashboards Pre-configurados:**
- Laravel Application Metrics
- PostgreSQL Performance
- Nginx Traffic
- Redis Metrics
- Docker Container Stats

### 2. Configurar Alertas

**Editar:** `monitoring/prometheus.yml`

```yaml
alerting:
  alertmanagers:
    - static_configs:
        - targets: ['alertmanager:9093']

rule_files:
  - 'alerts.yml'
```

**Crear:** `monitoring/alerts.yml`

```yaml
groups:
  - name: arconte_alerts
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        annotations:
          summary: "High error rate detected"

      - alert: DatabaseDown
        expr: up{job="postgres"} == 0
        for: 1m
        annotations:
          summary: "PostgreSQL is down"

      - alert: HighMemoryUsage
        expr: (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes) < 0.1
        for: 5m
        annotations:
          summary: "Memory usage above 90%"
```

### 3. Integrar Sentry (Error Tracking)

```bash
# En .env
SENTRY_LARAVEL_DSN=https://xxx@sentry.io/xxx

# Laravel ya está configurado para enviar errores
```

### 4. Uptime Monitoring (Externo)

Configurar en:
- **UptimeRobot** (gratis): https://uptimerobot.com
- **Pingdom**
- **StatusCake**

URLs a monitorear:
- `https://arconte.com/health`
- `https://api.arconte.com/health`

---

## 💾 Backups y Disaster Recovery {#backups}

### 1. Backups Automáticos (Ya Configurados)

**Schedule:**
- **Daily:** 2:00 AM (PostgreSQL + Storage)
- **Weekly:** Domingo 3:00 AM (Full)
- **Monthly:** Primer día del mes

**Retención:**
- Daily: 30 días
- Weekly: 12 semanas
- Monthly: 12 meses

### 2. Verificar Backups

```bash
# Listar backups
ls -lh backups/

# Verificar integridad
gzip -t backups/postgres_20250108_020000.sql.gz

# Restaurar (si es necesario)
gunzip < backups/postgres_20250108_020000.sql.gz | \
  docker-compose -f docker-compose.production.yml exec -T postgres \
  psql -U arconte -d arconte_production
```

### 3. Disaster Recovery Plan

**RTO (Recovery Time Objective):** 4 horas
**RPO (Recovery Point Objective):** 1 hora

**Pasos:**

1. **Provisionar nueva infraestructura**
```bash
terraform apply -var="disaster_recovery=true"
```

2. **Restaurar último backup**
```bash
./scripts/restore.sh backups/latest
```

3. **Actualizar DNS**
```bash
# Apuntar a nueva IP
aws route53 change-resource-record-sets --hosted-zone-id Z123 \
  --change-batch file://dns-update.json
```

4. **Verificar funcionalidad**
```bash
./scripts/smoke-test.sh
```

**Tiempo total estimado:** 2-4 horas

---

## 🔍 Troubleshooting {#troubleshooting}

### Problema 1: API no responde

```bash
# Verificar contenedor
docker-compose -f docker-compose.production.yml ps api

# Ver logs
docker-compose -f docker-compose.production.yml logs --tail=100 api

# Reiniciar
docker-compose -f docker-compose.production.yml restart api

# Verificar health
curl https://api.arconte.com/health
```

### Problema 2: Base de datos lenta

```bash
# Conectar a PostgreSQL
docker-compose -f docker-compose.production.yml exec postgres psql -U arconte

# Ver queries lentas
SELECT pid, now() - query_start as duration, query
FROM pg_stat_activity
WHERE state = 'active'
ORDER BY duration DESC;

# Analizar performance
EXPLAIN ANALYZE SELECT * FROM case_models WHERE user_id = 1;

# Reindexar si es necesario
REINDEX TABLE case_models;
```

### Problema 3: Espacio en disco lleno

```bash
# Ver uso de disco
df -h

# Limpiar logs antiguos
docker system prune -a --volumes

# Limpiar backups viejos
find backups/ -mtime +90 -delete

# Ver tamaño de base de datos
docker-compose -f docker-compose.production.yml exec postgres \
  psql -U arconte -c "SELECT pg_size_pretty(pg_database_size('arconte_production'));"
```

### Problema 4: SSL/HTTPS no funciona

```bash
# Renovar certificado Let's Encrypt
certbot renew

# Verificar nginx config
docker-compose -f docker-compose.production.yml exec nginx nginx -t

# Reload nginx
docker-compose -f docker-compose.production.yml exec nginx nginx -s reload

# Verificar certificado
openssl s_client -connect arconte.com:443 -servername arconte.com
```

### Problema 5: Queue workers no procesan

```bash
# Ver estado de workers
docker-compose -f docker-compose.production.yml exec queue php artisan queue:work --once

# Ver jobs fallidos
docker-compose -f docker-compose.production.yml exec api php artisan queue:failed

# Retry jobs fallidos
docker-compose -f docker-compose.production.yml exec api php artisan queue:retry all

# Restart workers
docker-compose -f docker-compose.production.yml restart queue
```

---

## 📈 Optimizaciones Adicionales

### 1. CDN (CloudFlare o AWS CloudFront)

```bash
# CloudFlare (opción más simple)
1. Agregar dominio en cloudflare.com
2. Cambiar nameservers en registrar
3. Habilitar "Full SSL"
4. Habilitar "Always Use HTTPS"
5. Cache TTL: 1 month para assets
```

### 2. Database Read Replicas

```bash
# AWS RDS
aws rds create-db-instance-read-replica \
  --db-instance-identifier arconte-postgres-replica \
  --source-db-instance-identifier arconte-postgres \
  --db-instance-class db.t3.medium

# Laravel config (config/database.php)
'read' => [
    'host' => env('DB_READ_HOST', 'replica.xxx.rds.amazonaws.com'),
],
'write' => [
    'host' => env('DB_WRITE_HOST', 'primary.xxx.rds.amazonaws.com'),
],
```

### 3. Auto Scaling (AWS ECS)

```bash
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --resource-id service/arconte-production/arconte-api \
  --scalable-dimension ecs:service:DesiredCount \
  --min-capacity 3 \
  --max-capacity 10

aws application-autoscaling put-scaling-policy \
  --policy-name arconte-api-cpu-scaling \
  --service-namespace ecs \
  --resource-id service/arconte-production/arconte-api \
  --scalable-dimension ecs:service:DesiredCount \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration file://scaling-policy.json
```

---

## ✅ Checklist Final Pre-Launch

- [ ] SSL certificates instalados y renovación automática configurada
- [ ] DNS apuntando correctamente (A records, CNAME)
- [ ] Todas las credenciales rotadas
- [ ] Backups automáticos funcionando (verificar manualmente)
- [ ] Monitoring y alertas configurados (Prometheus + Grafana)
- [ ] Error tracking activo (Sentry)
- [ ] CDN configurado para assets estáticos
- [ ] Rate limiting testeado
- [ ] Load testing completado (Apache Bench o k6)
- [ ] Disaster recovery plan documentado y probado
- [ ] Equipo entrenado en deployment y troubleshooting
- [ ] Documentación API publicada (`/docs`)
- [ ] Terms of Service y Privacy Policy publicados
- [ ] GDPR/Compliance verificado (si aplica)
- [ ] Smoke tests pasando en producción

---

## 🆘 Soporte

**En caso de emergencia:**
1. Revisar logs: `docker-compose logs -f`
2. Verificar health checks
3. Restaurar último backup conocido bueno
4. Contactar equipo de desarrollo

**Contactos:**
- DevOps Lead: devops@arconte.com
- Database Admin: dba@arconte.com
- Security: security@arconte.com

---

**¡Arconte está listo para producción! 🚀🇨🇴**
