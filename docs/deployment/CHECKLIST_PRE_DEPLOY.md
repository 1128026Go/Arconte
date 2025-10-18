# ✅ Checklist Pre-Deployment - Arconte

Este checklist garantiza que todos los requisitos estén cumplidos antes del despliegue a producción.

**Fecha:** ___/___/______
**Versión:** ___________
**Responsable:** ___________

---

## 🎯 RESUMEN EJECUTIVO

| Categoría | Items | Completados | % |
|-----------|-------|-------------|---|
| Infraestructura | 8 | __ | __% |
| Dominio y SSL | 7 | __ | __% |
| Variables de Entorno | 15 | __ | __% |
| Base de Datos | 6 | __ | __% |
| Seguridad | 10 | __ | __% |
| APIs Externas | 4 | __ | __% |
| Testing | 8 | __ | __% |
| Monitoring | 5 | __ | __% |
| Backups | 4 | __ | __% |
| Documentación | 5 | __ | __% |
| **TOTAL** | **72** | **__** | **__%** |

**Status:**
- 🟢 100% = LISTO PARA DEPLOY
- 🟡 80-99% = REVISAR ITEMS PENDIENTES
- 🔴 <80% = NO DEPLOYAR

---

## 1️⃣ INFRAESTRUCTURA

### Servidor

- [ ] **Servidor Linux provisionado**
  - [ ] Ubuntu 20.04 LTS o superior
  - [ ] Mínimo 2 CPU cores
  - [ ] Mínimo 4GB RAM
  - [ ] Mínimo 40GB disco
  - [ ] IP pública asignada
  - Notas: _______________________

- [ ] **Acceso SSH configurado**
  - [ ] Clave SSH generada
  - [ ] Acceso root o sudo
  - [ ] Puerto SSH (default: 22)
  - Notas: _______________________

- [ ] **Firewall configurado**
  ```bash
  sudo ufw status
  ```
  - [ ] Puerto 22 (SSH) abierto
  - [ ] Puerto 80 (HTTP) abierto
  - [ ] Puerto 443 (HTTPS) abierto
  - [ ] Otros puertos cerrados
  - Notas: _______________________

### Docker

- [ ] **Docker Engine instalado**
  ```bash
  docker --version
  # Requerido: 20.10+
  ```
  - Versión: __________
  - Notas: _______________________

- [ ] **Docker Compose instalado**
  ```bash
  docker-compose --version
  # Requerido: 2.0+
  ```
  - Versión: __________
  - Notas: _______________________

- [ ] **Docker daemon corriendo**
  ```bash
  sudo systemctl status docker
  ```
  - Status: __________

- [ ] **Usuario agregado a grupo docker**
  ```bash
  sudo usermod -aG docker $USER
  ```

- [ ] **Test de Docker**
  ```bash
  docker run hello-world
  ```
  - [ ] Ejecuta correctamente

---

## 2️⃣ DOMINIO Y SSL

### Dominio

- [ ] **Dominio registrado**
  - Dominio: ___________________
  - Registrador: _______________
  - Expiración: ____/____/______

- [ ] **DNS configurado en Cloudflare**
  - [ ] Nameservers cambiados
  - [ ] Status: Active ✅
  - [ ] Propagación completada (24-48h)
  - Notas: _______________________

- [ ] **Registros DNS creados**
  - [ ] Registro A (@) → IP servidor
  - [ ] Registro A (www) → IP servidor
  - [ ] Proxy habilitado (nube naranja)
  - [ ] Registro TXT para verificación email (si aplica)
  - [ ] Registros MX para email (si aplica)

### SSL/TLS

- [ ] **Modo SSL configurado**
  - [ ] Cloudflare SSL/TLS: Full (strict) ✅
  - Notas: _______________________

- [ ] **Certificado Origin generado**
  - [ ] Origin Certificate creado
  - [ ] Certificado guardado en servidor
  - [ ] Ubicación: nginx/ssl/fullchain.pem
  - [ ] Clave privada: nginx/ssl/privkey.pem
  - [ ] Permisos correctos (600 para key)

- [ ] **HTTPS habilitado en Nginx**
  - [ ] Líneas SSL descomentadas en nginx/conf.d/default.conf
  - [ ] Redirect HTTP → HTTPS configurado

- [ ] **Configuraciones SSL adicionales**
  - [ ] Always Use HTTPS: ON
  - [ ] Automatic HTTPS Rewrites: ON
  - [ ] Minimum TLS Version: 1.2
  - [ ] TLS 1.3: Enabled
  - [ ] HSTS: Configurado (opcional)

- [ ] **Test SSL**
  - [ ] SSL Labs test: https://www.ssllabs.com/ssltest/
  - Calificación obtenida: ______
  - [ ] Objetivo: A o A+

---

## 3️⃣ VARIABLES DE ENTORNO

### Archivo .env.production

- [ ] **Archivo creado**
  ```bash
  cp .env.production.example .env.production
  ```

### Aplicación

- [ ] **APP_NAME** configurado
  - Valor: _______________________

- [ ] **APP_ENV=production** ⚠️ CRÍTICO
  - [ ] Verificado

- [ ] **APP_DEBUG=false** ⚠️ CRÍTICO
  - [ ] Verificado

- [ ] **APP_URL** correcto
  - Valor: _______________________
  - [ ] Coincide con dominio

- [ ] **APP_KEY** generado ⚠️ CRÍTICO
  ```bash
  docker-compose exec api php artisan key:generate --show
  ```
  - [ ] Generado y configurado
  - [ ] Formato: base64:XXXXX

### Base de Datos

- [ ] **DB_PASSWORD** seguro ⚠️ CRÍTICO
  - [ ] Mínimo 16 caracteres
  - [ ] Generado con: `openssl rand -base64 32`
  - ❌ NO usar contraseñas comunes

### Redis

- [ ] **REDIS_PASSWORD** seguro ⚠️ CRÍTICO
  - [ ] Mínimo 16 caracteres
  - [ ] Generado con: `openssl rand -base64 32`

### Email

- [ ] **MAIL_HOST** configurado
  - Proveedor: ___________________

- [ ] **MAIL_PASSWORD** (API Key)
  - [ ] API Key obtenido
  - [ ] Valor configurado

- [ ] **MAIL_FROM_ADDRESS** verificado
  - Email: _______________________
  - [ ] Dominio verificado en proveedor

### APIs Externas

- [ ] **GEMINI_API_KEY** configurado
  - [ ] API Key obtenido de Google AI Studio
  - [ ] Límites verificados

- [ ] **EPAYCO_PUBLIC_KEY** configurado
  - [ ] Obtenido del dashboard

- [ ] **EPAYCO_PRIVATE_KEY** configurado
  - [ ] Obtenido del dashboard

- [ ] **EPAYCO_TEST=false** ⚠️ CRÍTICO
  - [ ] Modo producción habilitado

### Seguridad

- [ ] **SANCTUM_STATEFUL_DOMAINS** correcto
  - Valor: _______________________
  - [ ] Coincide con frontend

- [ ] **SESSION_SECURE_COOKIE=true** ⚠️ CRÍTICO

- [ ] **TRUSTED_PROXIES=*** (si usas Cloudflare)

---

## 4️⃣ BASE DE DATOS

- [ ] **PostgreSQL preparado**
  - [ ] Contenedor levantado
  - [ ] Puerto 5432 accesible internamente
  - [ ] Credentials funcionando

- [ ] **Conexión verificada**
  ```bash
  docker-compose exec postgres psql -U arconte -d arconte
  ```

- [ ] **Migraciones preparadas**
  - [ ] Archivos de migración revisados
  - [ ] Sin conflictos

- [ ] **Seeders preparados (opcional)**
  - [ ] Datos iniciales listos
  - [ ] Usuarios admin creados

- [ ] **Backup inicial creado**
  - [ ] Primera copia de seguridad
  - Ubicación: ___________________

- [ ] **Performance tuning**
  - [ ] PostgreSQL config optimizado (si aplica)
  - [ ] Índices verificados

---

## 5️⃣ SEGURIDAD

### Cloudflare

- [ ] **Firewall Rules configuradas**
  - [ ] Rate limiting para /api/login
  - [ ] Rate limiting para API general
  - [ ] Bloqueo de países (opcional)

- [ ] **Bot Fight Mode habilitado**
  - [ ] Security > Bots > ON

- [ ] **Security Level**
  - [ ] Configurado: Medium

### Aplicación

- [ ] **Archivos sensibles en .gitignore**
  - [ ] .env.production ✅
  - [ ] nginx/ssl/*.pem ✅
  - [ ] Credentials ✅

- [ ] **Permisos de archivos correctos**
  ```bash
  chmod 600 nginx/ssl/privkey.pem
  chmod 644 nginx/ssl/fullchain.pem
  chmod 755 storage/
  ```

- [ ] **CORS configurado correctamente**
  - [ ] Solo dominios permitidos

- [ ] **Rate Limiting habilitado**
  - [ ] En Nginx
  - [ ] En Cloudflare
  - [ ] En Laravel (si aplica)

### Secrets Management

- [ ] **Secretos NO en Git**
  - [ ] .env.production no trackeado
  - [ ] API keys no en código

- [ ] **Backup de secretos seguro**
  - [ ] Guardados en gestor de contraseñas
  - [ ] Compartidos con equipo de forma segura

- [ ] **Rotación de secretos planificada**
  - Plan: _______________________

---

## 6️⃣ APIS EXTERNAS

### Google Gemini

- [ ] **API Key funcionando**
  - [ ] Test realizado
  - [ ] Límites verificados
  - Límite diario: _______________

### ePayco

- [ ] **Cuenta en modo producción**
  - [ ] EPAYCO_TEST=false
  - [ ] Cuenta verificada
  - [ ] Métodos de pago activos

- [ ] **Webhooks configurados**
  - [ ] URL de confirmación configurada
  - [ ] URL de respuesta configurada

### Email (Resend/SendGrid)

- [ ] **Dominio verificado**
  - [ ] Registros DNS agregados
  - [ ] Verificación completada
  - Status: _____________________

---

## 7️⃣ TESTING

### Tests Locales

- [ ] **Build de producción exitoso**
  ```bash
  ./scripts/production/build.sh
  ```
  - [ ] Backend build OK
  - [ ] Frontend build OK

- [ ] **Docker Compose levanta correctamente**
  ```bash
  docker-compose -f docker-compose.production.yml up -d
  ```

- [ ] **Health checks pasando**
  - [ ] API: http://localhost/api/health
  - [ ] Frontend: http://localhost/health
  - [ ] Database: OK
  - [ ] Redis: OK

### Tests Funcionales

- [ ] **Autenticación funciona**
  - [ ] Login correcto
  - [ ] Logout correcto
  - [ ] Tokens generados

- [ ] **API endpoints responden**
  - [ ] GET /api/cases
  - [ ] POST /api/cases
  - [ ] Otros endpoints críticos

- [ ] **Frontend carga correctamente**
  - [ ] Página principal
  - [ ] Rutas protegidas
  - [ ] Assets cargan

### Tests de Carga (Opcional)

- [ ] **Load testing realizado**
  - Herramienta: _________________
  - Requests: ___________________
  - Latencia promedio: __________

---

## 8️⃣ MONITORING

### Health Checks

- [ ] **Endpoints de salud creados**
  - [ ] /api/health
  - [ ] /health

- [ ] **Uptime monitoring configurado**
  - Servicio: ___________________
  - [ ] UptimeRobot / Pingdom
  - Intervalo: __________________

### Logging

- [ ] **Logs configurados**
  - [ ] LOG_CHANNEL=daily
  - [ ] LOG_LEVEL=warning
  - [ ] Retención: 14 días

- [ ] **Acceso a logs verificado**
  ```bash
  docker-compose logs -f api
  ```

### Alertas

- [ ] **Alertas de downtime**
  - [ ] Email configurado
  - [ ] SMS (opcional)

---

## 9️⃣ BACKUPS

### Backup de Base de Datos

- [ ] **Script de backup creado**
  ```bash
  docker-compose exec postgres pg_dump -U arconte arconte > backup.sql
  ```

- [ ] **Backup automático configurado**
  - [ ] Cron job creado
  - Frecuencia: _________________

- [ ] **Retención de backups**
  - Días: _______________________
  - Ubicación: __________________

### Backup de Archivos

- [ ] **Storage backup**
  - [ ] Configurado
  - Destino: ____________________

---

## 🔟 DOCUMENTACIÓN

- [ ] **README actualizado**
  - [ ] Instrucciones de deployment

- [ ] **Credenciales documentadas**
  - [ ] En gestor de contraseñas del equipo
  - [ ] Compartidas con personas autorizadas

- [ ] **Runbook creado**
  - [ ] Procedimientos de emergencia
  - [ ] Contactos de soporte

- [ ] **Changelog preparado**
  - [ ] Versión 1.0.0 documentada

- [ ] **Handoff al equipo de ops**
  - [ ] Sesión de handoff realizada
  - [ ] Preguntas resueltas

---

## 📝 VALIDACIÓN FINAL

### Pre-Flight Check

Ejecutar script de validación:

```bash
./scripts/production/validate-deployment.sh
```

- [ ] **Todas las validaciones pasan**
- [ ] **Errores resueltos**

### Smoke Tests en Producción

Después del deploy:

- [ ] **Frontend carga** (https://arconte.com)
- [ ] **API responde** (https://arconte.com/api/health)
- [ ] **Login funciona**
- [ ] **Crear caso de prueba**
- [ ] **Subir documento**
- [ ] **Verificar email enviado**
- [ ] **Proceso de pago (sandbox)**

### Rollback Plan

- [ ] **Plan de rollback documentado**
  ```bash
  ./scripts/production/rollback.sh v0.9.0
  ```

- [ ] **Backup pre-deployment creado**
  - Backup ID: __________________
  - Fecha: _____________________

---

## ✍️ APROBACIONES

### Desarrollo

- [ ] Código revisado
- [ ] Tests pasando
- [ ] Sin deuda técnica crítica

**Firma:** _________________ **Fecha:** ___/___/___

### DevOps / SRE

- [ ] Infraestructura lista
- [ ] Monitoring configurado
- [ ] Backups funcionando

**Firma:** _________________ **Fecha:** ___/___/___

### Product Owner

- [ ] Features completas
- [ ] Criterios de aceptación cumplidos
- [ ] Go/No-go decision

**Firma:** _________________ **Fecha:** ___/___/___

---

## 🚀 DEPLOYMENT

### Información del Deployment

**Fecha programada:** ___/___/___ a las __:__ (hora)
**Ventana de mantenimiento:** ______ horas
**Versión:** _________
**Rama:** _________
**Commit:** _________

### Ejecución

```bash
# 1. Backup final
./scripts/production/backup.sh

# 2. Deploy
./scripts/production/deploy.sh

# 3. Smoke tests
./scripts/production/smoke-test.sh

# 4. Monitor
docker-compose -f docker-compose.production.yml logs -f
```

### Post-Deployment

- [ ] **Aplicación accesible**
- [ ] **Smoke tests OK**
- [ ] **Monitoring activo**
- [ ] **No errores en logs**
- [ ] **Performance aceptable**
- [ ] **Usuarios notificados**

---

## 🆘 CONTACTOS DE EMERGENCIA

**Desarrollo:**
- Nombre: _____________________
- Email: ______________________
- Teléfono: ___________________

**DevOps:**
- Nombre: _____________________
- Email: ______________________
- Teléfono: ___________________

**Proveedor de Hosting:**
- Nombre: _____________________
- Soporte: ____________________
- Teléfono: ___________________

---

## 📊 MÉTRICAS POST-DEPLOYMENT

Monitorear por 48 horas:

**Performance:**
- Response time API: < 200ms
- Page load time: < 2s
- Error rate: < 1%

**Availability:**
- Uptime: > 99.9%
- Database: 100%
- Redis: 100%

**Business:**
- Usuarios activos: ____________
- Casos creados: ______________
- Errores reportados: _________

---

**DEPLOYMENT AUTORIZADO POR:**

Nombre: _____________________
Cargo: ______________________
Firma: ______________________
Fecha: ___/___/___

---

**Status Final:**
- 🟢 DEPLOYMENT EXITOSO
- 🟡 DEPLOYMENT CON OBSERVACIONES
- 🔴 DEPLOYMENT FALLIDO - ROLLBACK EJECUTADO

**Notas finales:**
_________________________________
_________________________________
_________________________________
