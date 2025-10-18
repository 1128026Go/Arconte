# 🔒 Configuración de SSL con Cloudflare

Esta guía detalla cómo configurar SSL/TLS y DNS usando Cloudflare para Arconte.

---

## 📋 Tabla de Contenidos

1. [Requisitos Previos](#requisitos-previos)
2. [Configuración de Dominio](#configuración-de-dominio)
3. [Configuración SSL/TLS](#configuración-ssltls)
4. [Configuración DNS](#configuración-dns)
5. [Firewall y Seguridad](#firewall-y-seguridad)
6. [Validación y Testing](#validación-y-testing)
7. [Troubleshooting](#troubleshooting)

---

## 1️⃣ Requisitos Previos

### ✅ Checklist Inicial

- [ ] Dominio registrado (ejemplo: arconte.com)
- [ ] Cuenta de Cloudflare creada (gratis en https://cloudflare.com)
- [ ] Servidor con IP pública
- [ ] Acceso SSH al servidor
- [ ] Docker instalado y funcionando

### 📝 Información Necesaria

Antes de comenzar, ten a mano:
- **Dominio**: arconte.com
- **IP del servidor**: Tu IP pública
- **Acceso al registrador de dominio** (GoDaddy, Namecheap, etc.)

---

## 2️⃣ Configuración de Dominio

### Paso 1: Agregar Sitio a Cloudflare

1. **Ir a Cloudflare Dashboard**
   ```
   https://dash.cloudflare.com
   ```

2. **Agregar Sitio**
   - Click en "Add a Site"
   - Ingresar tu dominio: `arconte.com`
   - Seleccionar plan Free
   - Click en "Add site"

3. **Esperar Escaneo DNS**
   - Cloudflare escaneará tus registros DNS existentes
   - Esto toma ~1 minuto

### Paso 2: Cambiar Nameservers

Cloudflare te asignará 2 nameservers, por ejemplo:
```
ada.ns.cloudflare.com
carl.ns.cloudflare.com
```

**En tu registrador de dominio** (GoDaddy, Namecheap, etc.):

1. Ir a configuración de DNS/Nameservers
2. Cambiar de nameservers del registrador a los de Cloudflare
3. Guardar cambios

**⏳ Propagación:** Puede tomar 2-24 horas

**✅ Verificar:** En Cloudflare verás "Active" cuando esté listo

---

## 3️⃣ Configuración SSL/TLS

### Paso 1: Modo SSL/TLS

1. **Ir a SSL/TLS**
   - Dashboard > tu dominio > SSL/TLS

2. **Seleccionar Modo**

   **Para producción con Docker (Recomendado):**
   ```
   Modo: Full (strict)
   ```

   **Opciones disponibles:**
   - ❌ **Off**: Sin SSL (NO usar)
   - ❌ **Flexible**: SSL solo Cloudflare→Cliente (NO seguro para APIs)
   - ⚠️ **Full**: SSL completo pero sin validar certificado del servidor
   - ✅ **Full (strict)**: SSL completo con certificado válido (RECOMENDADO)

### Paso 2: Generar Certificado Origin

Para usar "Full (strict)", necesitas un certificado en tu servidor.

**Opción A: Certificado Cloudflare Origin (Recomendado)**

1. **Ir a SSL/TLS > Origin Server**
   - Click en "Create Certificate"

2. **Configuración del Certificado**
   ```
   Private key type: RSA (2048)
   Hostnames:
     - arconte.com
     - *.arconte.com (para subdominios)
   Certificate Validity: 15 years
   ```
   - Click en "Create"

3. **Guardar Certificados**

   Cloudflare te mostrará dos archivos:

   **Origin Certificate** (fullchain.pem):
   ```pem
   -----BEGIN CERTIFICATE-----
   MIIEpDCCA4ygAwIBAgIUdO3...
   -----END CERTIFICATE-----
   ```

   **Private Key** (privkey.pem):
   ```pem
   -----BEGIN PRIVATE KEY-----
   MIIEvgIBADANBgkqhkiG9w0...
   -----END PRIVATE KEY-----
   ```

4. **Instalar en el Servidor**

   ```bash
   # Conectar al servidor
   ssh usuario@tu-servidor-ip

   # Crear directorio SSL
   cd /ruta/a/Aplicacion\ Juridica
   mkdir -p nginx/ssl

   # Crear archivo del certificado
   nano nginx/ssl/fullchain.pem
   # Pegar el contenido del Origin Certificate
   # Ctrl+X, Y, Enter

   # Crear archivo de la clave privada
   nano nginx/ssl/privkey.pem
   # Pegar el contenido del Private Key
   # Ctrl+X, Y, Enter

   # Permisos restrictivos
   chmod 600 nginx/ssl/privkey.pem
   chmod 644 nginx/ssl/fullchain.pem
   ```

**Opción B: Let's Encrypt (Alternativa)**

```bash
# Instalar certbot
sudo apt update
sudo apt install certbot

# Generar certificado
sudo certbot certonly --standalone -d arconte.com -d www.arconte.com

# Certificados en:
# /etc/letsencrypt/live/arconte.com/fullchain.pem
# /etc/letsencrypt/live/arconte.com/privkey.pem
```

### Paso 3: Habilitar SSL en Nginx

Edita el archivo de configuración:

```bash
nano nginx/conf.d/default.conf
```

**Descomentar líneas SSL:**

```nginx
# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name arconte.com www.arconte.com;
    return 301 https://$server_name$request_uri;
}

# Main server block
server {
    listen 80;
    listen 443 ssl http2;  # ← Descomentar esta línea
    server_name arconte.com www.arconte.com;

    # SSL configuration
    ssl_certificate /etc/nginx/ssl/fullchain.pem;      # ← Descomentar
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;    # ← Descomentar

    # ... resto de configuración
}
```

### Paso 4: Configuraciones SSL Adicionales

En Cloudflare Dashboard:

**SSL/TLS > Edge Certificates:**

✅ Habilitar:
- Always Use HTTPS
- Automatic HTTPS Rewrites
- Minimum TLS Version: TLS 1.2
- Opportunistic Encryption
- TLS 1.3

❌ Opcional:
- HTTP Strict Transport Security (HSTS)
  - ⚠️ Habilitar solo cuando todo funcione bien
  - Max Age: 6 months
  - Include subdomains: Yes
  - Preload: No (inicialmente)

---

## 4️⃣ Configuración DNS

### Registros DNS Necesarios

**Ir a: DNS > Records**

**1. Registro A (Apex domain)**
```
Type: A
Name: @
IPv4 address: [IP de tu servidor]
Proxy status: Proxied (nube naranja) ✅
TTL: Auto
```

**2. Registro A (www subdomain)**
```
Type: A
Name: www
IPv4 address: [IP de tu servidor]
Proxy status: Proxied (nube naranja) ✅
TTL: Auto
```

**3. Registro CNAME (api subdomain) - Opcional**
```
Type: CNAME
Name: api
Target: arconte.com
Proxy status: Proxied ✅
TTL: Auto
```

**4. Registros para Email (si usas dominio propio)**

Si usas Resend con dominio personalizado:

```
Type: TXT
Name: @
Content: [Valor de verificación de Resend]
TTL: Auto
```

```
Type: MX
Name: @
Priority: 10
Mail server: [Servidor MX de Resend]
TTL: Auto
```

### ⚡ Proxy vs DNS Only

**Proxied (Nube naranja) ✅ - Recomendado:**
- Pasa por Cloudflare (CDN + DDoS protection)
- Oculta IP real del servidor
- Usa certificado de Cloudflare para usuarios
- Aplica firewall rules

**DNS Only (Nube gris):**
- Conexión directa a tu servidor
- IP visible
- Sin protecciones de Cloudflare
- Usa certificado de tu servidor

**Recomendación:** Usar Proxied para todos los registros web.

---

## 5️⃣ Firewall y Seguridad

### Paso 1: Page Rules (Opcional)

**Ir a: Rules > Page Rules**

**Regla 1: Forzar HTTPS**
```
URL: http://*arconte.com/*
Settings:
  - Always Use HTTPS: On
```

**Regla 2: Cache para Assets**
```
URL: *arconte.com/*.js
Settings:
  - Cache Level: Cache Everything
  - Edge Cache TTL: 1 month
```

### Paso 2: Firewall Rules

**Ir a: Security > WAF**

**Nivel de Seguridad:**
```
Security Level: Medium
```

**Reglas recomendadas:**

**1. Bloquear países no deseados (Opcional)**
```
Field: Country
Operator: does not equal
Value: CO, US, MX, ES  (países permitidos)
Action: Block
```

**2. Rate Limiting para Login**
```
Field: URI Path
Operator: equals
Value: /api/login
Rate: 5 requests per minute
Action: Block for 1 hour
```

### Paso 3: Bot Fight Mode

**Ir a: Security > Bots**

```
✅ Bot Fight Mode: On
```

Protege contra bots maliciosos automáticamente.

---

## 6️⃣ Validación y Testing

### Verificar SSL

**1. Test SSL Labs**
```
https://www.ssllabs.com/ssltest/analyze.html?d=arconte.com
```

**Objetivo:** Calificación A o A+

**2. Verificar en Navegador**
```
https://arconte.com
```

- Click en el candado 🔒
- Ver certificado
- Verificar que sea válido

### Verificar DNS

**1. Propagación DNS**
```
https://www.whatsmydns.net/#A/arconte.com
```

Verificar que todos los servidores muestren tu IP.

**2. Comando dig**
```bash
dig arconte.com +short
# Debe mostrar tu IP
```

### Verificar HTTPS Redirect

```bash
# Debe redirigir a HTTPS
curl -I http://arconte.com

# Debe responder directamente
curl -I https://arconte.com
```

### Test de Aplicación

**1. Frontend**
```
https://arconte.com
```
- Debe cargar sin errores SSL
- Ver candado verde 🔒

**2. API**
```
https://arconte.com/api/health
```
- Debe responder con 200 OK

**3. Mixed Content**
- Abrir DevTools > Console
- No debe haber warnings de "Mixed Content"
- Todos los recursos deben cargarse via HTTPS

---

## 7️⃣ Troubleshooting

### ❌ Error: "Your connection is not private"

**Causa:** Certificado SSL no válido o no configurado

**Solución:**
1. Verificar que fullchain.pem y privkey.pem estén en nginx/ssl/
2. Verificar permisos: `ls -l nginx/ssl/`
3. Reiniciar nginx: `docker-compose restart nginx`
4. Verificar logs: `docker-compose logs nginx`

### ❌ Error: "Too many redirects"

**Causa:** Loop de redirección HTTP → HTTPS

**Solución:**
1. En Cloudflare: SSL/TLS mode debe ser "Full" o "Full (strict)"
2. En nginx.conf: verificar redirect HTTP → HTTPS
3. Verificar variable `TRUSTED_PROXIES=*` en .env

### ❌ Error: "Mixed Content"

**Causa:** Frontend carga recursos via HTTP

**Solución:**
1. En .env.production:
   ```
   APP_URL=https://arconte.com
   FRONTEND_URL=https://arconte.com
   ```
2. Rebuild frontend: `npm run build`
3. Verificar API calls usen HTTPS

### ❌ Cloudflare no muestra "Active"

**Causa:** Nameservers no han propagado

**Solución:**
1. Verificar nameservers en registrador
2. Esperar 24-48 horas
3. Verificar con: `dig NS arconte.com`

### ❌ Error 521: Web server is down

**Causa:** Cloudflare no puede conectar a tu servidor

**Solución:**
1. Verificar servidor está corriendo: `docker-compose ps`
2. Verificar firewall permite puertos 80/443
3. Verificar IP correcta en DNS
4. Temporalmente desactivar proxy (nube gris) para debug

### ❌ Certificado SSL expira pronto

**Cloudflare Origin Certificate:**
- Válido por 15 años
- No requiere renovación

**Let's Encrypt:**
```bash
# Renovar manualmente
sudo certbot renew

# Auto-renovación (cron)
sudo crontab -e
# Agregar:
0 3 * * * certbot renew --quiet
```

---

## 📊 Monitoring

### Cloudflare Analytics

**Ir a: Analytics & Logs**

Métricas importantes:
- Requests totales
- Bandwidth
- Threats blocked
- Status codes

### Uptime Monitoring

**Servicios recomendados:**
- UptimeRobot (gratis): https://uptimerobot.com
- Pingdom
- StatusCake

Configurar:
```
URL: https://arconte.com/health
Interval: 5 minutes
Alert: Email/SMS cuando caiga
```

---

## 🎯 Checklist Final

- [ ] Nameservers apuntando a Cloudflare
- [ ] SSL/TLS mode: Full (strict)
- [ ] Certificado Origin instalado
- [ ] DNS records configurados (A, www, etc)
- [ ] Proxy activado (nube naranja)
- [ ] Always Use HTTPS habilitado
- [ ] HSTS configurado (opcional)
- [ ] Firewall rules configuradas
- [ ] Bot protection habilitada
- [ ] Test SSL Labs: A/A+
- [ ] HTTPS redirect funcionando
- [ ] No mixed content warnings
- [ ] API respondiendo via HTTPS
- [ ] Monitoring configurado

---

## 📚 Recursos Adicionales

**Cloudflare Docs:**
- https://developers.cloudflare.com/ssl/

**SSL Best Practices:**
- https://cheatsheetseries.owasp.org/cheatsheets/Transport_Layer_Protection_Cheat_Sheet.html

**Test Tools:**
- SSL Labs: https://www.ssllabs.com/ssltest/
- DNS Checker: https://dnschecker.org/
- Security Headers: https://securityheaders.com/

---

**Última actualización:** 2024
**Soporte:** docs@arconte.com
