# 🚀 Guía Completa de CI/CD - Arconte

Documentación del pipeline de integración y despliegue continuo.

---

## 📋 Tabla de Contenidos

- [Resumen](#resumen)
- [Workflows de GitHub Actions](#workflows-de-github-actions)
- [Scripts de Deployment](#scripts-de-deployment)
- [Configuración de Secrets](#configuración-de-secrets)
- [Proceso de Deployment](#proceso-de-deployment)
- [Rollback](#rollback)
- [Troubleshooting](#troubleshooting)

---

## 📊 Resumen

### Pipeline Overview

```
┌─────────────┐
│   Git Push  │
└──────┬──────┘
       │
       ├─────────────────────────────────────┐
       │                                     │
       ▼                                     ▼
┌──────────────┐                    ┌──────────────┐
│   Tests      │                    │   Linting    │
│   Workflow   │                    │   Workflow   │
└──────┬───────┘                    └──────┬───────┘
       │                                   │
       │  All tests pass                   │  Code quality OK
       │                                   │
       └─────────────┬─────────────────────┘
                     │
                     ▼
              ┌──────────────┐
              │    Build     │
              │   Workflow   │
              └──────┬───────┘
                     │
                     │  Build successful
                     │
                     ▼
              ┌──────────────┐
              │   Deploy     │
              │  (staging)   │
              └──────────────┘
```

### Workflows

| Workflow | Trigger | Duración Promedio | Propósito |
|----------|---------|-------------------|-----------|
| **Tests** | Push/PR a main, develop, staging | ~5-8 min | Ejecutar tests automatizados |
| **Linting** | Push/PR a main, develop, staging | ~3-5 min | Verificar calidad de código |
| **Build** | Push a main, staging | ~4-6 min | Compilar artefactos de producción |
| **Deploy** | Push a staging/main | ~8-12 min | Desplegar a servidores |

---

## 🔄 Workflows de GitHub Actions

### 1. Tests Workflow (`.github/workflows/tests.yml`)

Ejecuta todos los tests automatizados en paralelo.

**Jobs:**

- **backend-tests** (PHP 8.4)
  - PostgreSQL 15 service container
  - Redis service container
  - PHPUnit con cobertura (min 70%)
  - ~200+ tests

- **frontend-unit-tests** (Node 18)
  - Vitest para componentes React
  - ~50+ tests
  - Coverage reports

- **frontend-e2e-tests** (Playwright)
  - Tests E2E completos
  - Backend + Frontend integrados
  - Screenshots on failure
  - ~30+ tests

- **python-tests** (Python 3.11)
  - Tests del servicio de ingestión
  - pytest con coverage

- **test-summary**
  - Resumen de resultados
  - Falla si cualquier test crítico falla

**Ejecución Manual:**

```bash
# Trigger desde GitHub UI
# Actions → Tests → Run workflow

# O con gh CLI
gh workflow run tests.yml
```

**Visualizar Resultados:**

```bash
gh run list --workflow=tests.yml
gh run view <run-id>
```

---

### 2. Linting Workflow (`.github/workflows/lint.yml`)

Verifica calidad y estilo de código.

**Jobs:**

- **php-lint** - Laravel Pint (PSR-12)
- **phpstan** - Static analysis
- **js-lint** - ESLint
- **prettier** - Code formatting
- **python-lint** - Black, Flake8, isort, mypy
- **markdown-lint** - Markdown files
- **security-audit** - npm audit, composer audit
- **lint-summary** - Resumen de resultados

**Correr Localmente:**

```bash
# PHP
cd apps/api_php
./vendor/bin/pint
./vendor/bin/phpstan analyse

# JavaScript
cd apps/web
npm run lint
npx prettier --check "src/**/*.{js,jsx,ts,tsx}"

# Python
cd apps/ingest_py
black --check .
flake8 .
isort --check-only .
mypy .
```

---

### 3. Build Workflow (`.github/workflows/build.yml`)

Compila y verifica artefactos de producción.

**Jobs:**

- **frontend-build**
  - Build con Vite
  - Optimización de bundles
  - Análisis de tamaño
  - Upload artifacts (7 días)

- **backend-build**
  - Composer install --no-dev --optimize-autoloader
  - Verificación de autoloader
  - Upload vendor artifacts

- **python-build**
  - Install dependencies
  - Verificar imports
  - Syntax check

- **docker-build** (opcional)
  - Multi-stage Docker builds

**Artifacts:**

Los builds se guardan como artifacts por 7 días y pueden descargarse:

```bash
gh run download <run-id>
```

---

### 4. Deploy Workflow (`.github/workflows/deploy.yml`)

Despliega automáticamente a staging/production.

**Jobs:**

- **deploy-staging**
  - Trigger: Push a `staging` branch
  - Build frontend con env staging
  - Deploy vía SSH
  - Health check
  - ~8-10 min

- **deploy-production**
  - Trigger: Push a `main` branch
  - Requiere GitHub environment approval
  - Backup automático antes de deploy
  - Deploy vía SSH
  - Health check
  - Rollback automático on failure
  - ~10-12 min

- **backup-database**
  - Solo para production
  - pg_dump automático
  - Retención: 7 días

**Ambientes GitHub:**

Configurar en: Repository Settings → Environments

- **staging**
  - URL: https://staging.arconte.app
  - No requiere approval

- **production**
  - URL: https://arconte.app
  - Requiere approval de 1 reviewer
  - Protection rules enabled

---

## 📜 Scripts de Deployment

### 1. Deploy to Staging (`scripts/deploy-staging.sh`)

Despliega a staging desde línea de comando.

**Uso:**

```bash
./scripts/deploy-staging.sh
```

**Qué hace:**

1. Verifica branch actual (debe ser `staging`)
2. Verifica commits pendientes
3. Pull latest changes
4. Ejecuta tests localmente
5. Deploy vía SSH a staging server
6. Health check
7. Reporte de éxito/fallo

**Variables de Entorno:**

```bash
export STAGING_HOST=staging.arconte.app
export STAGING_USER=deploy
export STAGING_PATH=/var/www/arconte
```

---

### 2. Deploy to Production (`scripts/deploy-production.sh`)

Despliega a producción con confirmación y backup.

**Uso:**

```bash
./scripts/deploy-production.sh
```

**Qué hace:**

1. **Confirmación interactiva** (requiere "yes")
2. Verifica branch actual (debe ser `main`)
3. Verifica commits pendientes
4. Pull latest changes
5. Ejecuta tests localmente
6. Crea release tag (ej: `release_20251017_143022`)
7. **Crea backup** en servidor (código + DB)
8. Deploy vía SSH
9. Health check
10. Smoke tests
11. Post-deployment checklist

**Variables de Entorno:**

```bash
export PRODUCTION_HOST=arconte.app
export PRODUCTION_USER=deploy
export PRODUCTION_PATH=/var/www/arconte
```

**Post-Deployment Checklist:**

```bash
# Monitor logs
ssh deploy@arconte.app
tail -f /var/www/arconte/apps/api_php/storage/logs/laravel.log

# Check queue workers
php artisan queue:monitor

# Monitor server resources
htop
```

---

### 3. Rollback Production (`scripts/rollback-production.sh`)

Rollback a versión anterior desde backup.

**Uso:**

```bash
./scripts/rollback-production.sh
```

**Qué hace:**

1. **Confirmación interactiva**
2. Lista backups disponibles
3. Confirma uso del último backup
4. Pone app en mantenimiento
5. Crea backup del estado actual (pre-rollback)
6. Extrae backup anterior
7. Reinstala dependencies
8. Reinicia servicios
9. Health check

**Cuándo Usar:**

- Deploy falló pero pasó health check inicial
- Bug crítico detectado en producción
- Migración de DB problemática
- Performance issues después de deploy

**Nota:** Las migraciones de DB NO se revierten automáticamente. Si es necesario:

```bash
ssh deploy@arconte.app
cd /var/www/arconte/apps/api_php
php artisan migrate:rollback --force --step=1
```

---

### 4. Setup CI Secrets (`scripts/setup-ci-secrets.sh`)

Script interactivo para configurar GitHub secrets.

**Requisitos:**

```bash
# Instalar GitHub CLI
brew install gh  # macOS
# o
sudo apt install gh  # Ubuntu

# Autenticarse
gh auth login
```

**Uso:**

```bash
./scripts/setup-ci-secrets.sh
```

**Secrets que configura:**

**Staging:**
- `STAGING_HOST`
- `STAGING_USER`
- `STAGING_SSH_KEY`
- `STAGING_PORT`
- `STAGING_PATH`
- `STAGING_API_URL`

**Production:**
- `PRODUCTION_HOST`
- `PRODUCTION_USER`
- `PRODUCTION_SSH_KEY`
- `PRODUCTION_PORT`
- `PRODUCTION_PATH`
- `PRODUCTION_API_URL`

**Database:**
- `DB_USERNAME`
- `DB_PASSWORD`
- `DB_DATABASE`

---

## 🔐 Configuración de Secrets

### GitHub Secrets

Configurar en: `Repository Settings → Secrets and variables → Actions`

#### SSH Keys

Generar SSH key para deployment:

```bash
# En tu máquina local
ssh-keygen -t ed25519 -C "deploy@arconte-ci" -f ~/.ssh/arconte_deploy

# Copiar public key al servidor
ssh-copy-id -i ~/.ssh/arconte_deploy.pub deploy@staging.arconte.app
ssh-copy-id -i ~/.ssh/arconte_deploy.pub deploy@arconte.app

# Copiar private key a GitHub secrets
cat ~/.ssh/arconte_deploy
# Copiar TODO el contenido (incluyendo -----BEGIN/END-----)
```

Luego agregar a:
- `STAGING_SSH_KEY`
- `PRODUCTION_SSH_KEY`

#### Verificar Secrets

```bash
gh secret list
```

---

## 🚀 Proceso de Deployment

### Staging Deployment

```bash
# 1. Asegurar que estás en staging branch
git checkout staging

# 2. Merge de develop
git merge develop

# 3. Push (esto triggerea el workflow automático)
git push origin staging

# 4. Monitorear en GitHub Actions
# O usar script manual:
./scripts/deploy-staging.sh
```

**Timeline:**

```
0:00  - Push to staging
0:05  - Tests completos
0:10  - Linting completo
0:15  - Build completo
0:20  - Deploy iniciado
0:28  - Health check passed
0:30  - ✅ Deployment completo
```

---

### Production Deployment

**Proceso Completo:**

```bash
# 1. Verificar que staging funciona
curl https://staging.arconte.app/api/health

# 2. Merge staging a main
git checkout main
git merge staging

# 3. Ejecutar tests localmente
cd apps/api_php && php artisan test
cd apps/web && npm run test

# 4. Push a main (requiere approval en GitHub)
git push origin main

# 5. Aprobar deployment en GitHub UI
# O usar script manual (con confirmación):
./scripts/deploy-production.sh
```

**GitHub Approval:**

1. Push a `main` triggerea el workflow
2. Workflow espera approval
3. Reviewer recibe notificación
4. Reviewer aprueba en: `Actions → Deploy → Review deployments`
5. Deployment continúa

**Post-Deployment:**

```bash
# Monitor logs
ssh deploy@arconte.app
tail -f /var/www/arconte/apps/api_php/storage/logs/laravel.log

# Check queue
php artisan queue:monitor

# Test critical flows
curl https://arconte.app/api/health
curl https://arconte.app/api/auth/me
```

---

## 🔄 Rollback

### Rollback Automático

El workflow de production incluye rollback automático si:
- Health check falla después de deploy
- Cualquier step del deploy falla

### Rollback Manual

```bash
# 1. Ejecutar script de rollback
./scripts/rollback-production.sh

# 2. Verificar que funcionó
curl https://arconte.app/api/health

# 3. Investigar qué salió mal
git log --oneline -10
git diff HEAD~1

# 4. Fix the issue
git revert <commit-hash>
# o
git checkout -b hotfix/issue-description
# ... fix ...
git push origin hotfix/issue-description
```

### Rollback de Migraciones

Si una migración causó problemas:

```bash
ssh deploy@arconte.app
cd /var/www/arconte/apps/api_php

# Ver migraciones ejecutadas
php artisan migrate:status

# Rollback última migración
php artisan migrate:rollback --force --step=1

# O rollback batch completo
php artisan migrate:rollback --force
```

---

## 🐛 Troubleshooting

### Build Falla

**Error: Frontend build fails**

```bash
# Localmente
cd apps/web
rm -rf node_modules package-lock.json
npm install
npm run build

# Verificar variables de entorno
cat .env
```

**Error: Composer install fails**

```bash
cd apps/api_php
composer clear-cache
composer install
```

---

### Deploy Falla

**Error: SSH connection refused**

```bash
# Verificar SSH key
ssh -i ~/.ssh/arconte_deploy deploy@staging.arconte.app

# Verificar secrets
gh secret list

# Regenerar SSH key si es necesario
```

**Error: Migrations fail**

```bash
# Conectar al servidor
ssh deploy@arconte.app

# Ver estado de migraciones
cd /var/www/arconte/apps/api_php
php artisan migrate:status

# Rollback migration problemática
php artisan migrate:rollback --force --step=1

# Fix migration localmente, commit, re-deploy
```

**Error: Health check fails**

```bash
# Verificar logs
ssh deploy@arconte.app
tail -100 /var/www/arconte/apps/api_php/storage/logs/laravel.log

# Verificar servicios
sudo systemctl status php8.4-fpm
sudo systemctl status nginx
sudo systemctl status postgresql

# Verificar DB connection
cd /var/www/arconte/apps/api_php
php artisan tinker
>>> DB::connection()->getPdo();
```

---

### Tests Fallan en CI pero Pasan Localmente

**Diferencias de entorno:**

```yaml
# CI usa:
- PHP 8.4
- PostgreSQL 15
- Redis 7
- Node 18

# Verificar versiones locales:
php -v
psql --version
redis-cli --version
node -v
```

**Time zone issues:**

```bash
# En tests
// Usar Carbon::setTestNow() para tests de fechas
use Carbon\Carbon;

test('fecha test', function() {
    Carbon::setTestNow('2025-10-17 12:00:00');
    // ...
});
```

**Database state:**

```bash
# CI usa base de datos limpia cada vez
# Asegurar que tests usan RefreshDatabase

use Illuminate\Foundation\Testing\RefreshDatabase;

class MyTest extends TestCase
{
    use RefreshDatabase;

    // ...
}
```

---

## 📈 Métricas y Monitoreo

### Workflow Metrics

Ver en GitHub:

```
Actions → Workflows → <workflow-name>
```

Métricas:
- Total runs
- Success rate
- Average duration
- Trends

### Deploy Frequency

```bash
# Ver deploys recientes
gh run list --workflow=deploy.yml --limit=20

# Ver tags de releases
git tag -l "release_*" | tail -10
```

### Health Check Endpoints

```bash
# Backend
curl https://arconte.app/api/health
# Expected: {"status":"ok","timestamp":"2025-10-17T12:00:00Z"}

# Frontend
curl https://arconte.app
# Expected: 200 OK

# Database
curl https://arconte.app/api/health/db
# Expected: {"database":"connected"}
```

---

## 🔒 Seguridad

### Secrets Management

- **Nunca** commits secrets en código
- **Siempre** usa GitHub Secrets para CI/CD
- **Rota** SSH keys cada 6 meses
- **Usa** environment-specific secrets

### Server Access

- **Solo** CI/CD users tienen acceso SSH
- **2FA** habilitado en GitHub
- **Branch protection** en main/staging
- **Require reviews** para production deploys

### Backups

- **Automático** antes de cada production deploy
- **Retención** 7 días para code backups
- **Database dumps** diarios
- **Offsite backups** recomendado (S3, etc)

---

## 📚 Referencias

- **GitHub Actions Docs:** https://docs.github.com/en/actions
- **Laravel Deployment:** https://laravel.com/docs/11.x/deployment
- **Vite Production Build:** https://vitejs.dev/guide/build.html
- **PostgreSQL Backup:** https://www.postgresql.org/docs/current/backup.html

---

## ✅ Checklist de Setup Inicial

- [ ] Crear GitHub repository
- [ ] Configurar branch protection para `main` y `staging`
- [ ] Crear environments en GitHub (staging, production)
- [ ] Configurar secrets con `./scripts/setup-ci-secrets.sh`
- [ ] Setup servidores (staging + production)
- [ ] Configurar SSH keys para deployment
- [ ] Habilitar GitHub Actions
- [ ] Test manual de cada workflow
- [ ] Documentar URLs y accesos
- [ ] Configurar notificaciones (Slack, email, etc)
- [ ] Setup monitoring (Sentry, New Relic, etc)

---

*Última actualización: 2025-10-17*
*Autor: Claude Code (Anthropic)*
*Versión: 1.0*
