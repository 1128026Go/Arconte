# Setup: Testing & Automation

## 🎯 Objetivo

Configurar el entorno de tests automáticos y hooks de Git para prevenir regresiones del bug de autenticación.

---

## 📦 Instalación de Playwright (Primera vez)

### En el proyecto frontend:

```bash
cd apps/web

# Instalar Playwright
npm install -D @playwright/test

# Instalar navegadores (Chrome, Firefox, WebKit)
npx playwright install

# Verificar instalación
npx playwright --version
```

---

## 🔧 Instalación de Husky (Git Hooks)

### Setup inicial:

```bash
# Desde la raíz del proyecto
cd "C:\Users\David\Herd\Aplicacion Juridica\Aplicacion Juridica"

# Instalar Husky
npm install -D husky

# Inicializar Husky
npx husky install

# Dar permisos al hook (Linux/Mac)
chmod +x .husky/pre-push

# Windows: Los permisos ya están OK
```

### Verificar que funciona:

```bash
# Hacer un commit y push de prueba
git add .
git commit -m "test: verificar hook pre-push"
git push

# Debe ejecutar automáticamente los tests E2E antes del push
```

---

## 🧪 Scripts de Testing Disponibles

### Tests E2E con Playwright:

```bash
cd apps/web

# Ejecutar todos los tests E2E
npm run test:e2e

# Solo tests de autenticación (rápido, ~30s)
npm run test:e2e:auth

# Con interfaz UI (navegador)
npm run test:e2e:ui

# Ver tests ejecutarse en el navegador (headed mode)
npm run test:e2e:headed

# Modo debug (paso a paso)
npm run test:e2e:debug
```

### Tests unitarios (Vitest):

```bash
cd apps/web

# Ejecutar tests unitarios
npm run test

# Con UI
npm run test:ui

# Coverage
npm run coverage
```

---

## 📝 Checklist Diario

### Quick Check (5 minutos):

```bash
# Linux/Mac
./scripts/daily-check.sh

# Windows PowerShell
.\scripts\daily-check.ps1

# Con tests E2E incluidos (10 minutos)
./scripts/daily-check.sh --with-e2e
.\scripts\daily-check.ps1 --with-e2e
```

### Qué verifica el script:

✅ PostgreSQL corriendo en Docker
✅ Laravel API respondiendo (puerto 8000)
✅ Ingest Python respondiendo (puerto 8001)
✅ Queue Worker activo
✅ Frontend corriendo (puerto 3000)
✅ CSRF cookie funcionando
✅ `/auth/me` con headers no-cache
✅ Variables de sesión en `.env` correctas
✅ (Opcional) Tests E2E pasando

---

## 🚀 Workflow de Desarrollo

### 1. Inicio del día:

```bash
# Verificar que todo funciona
.\scripts\daily-check.ps1
```

### 2. Mientras desarrollas:

```bash
# Levantar servicios (si no están)
docker start arconte_postgres
cd apps/api_php && php artisan serve
cd apps/api_php && php artisan queue:work --tries=3 --timeout=120
cd apps/ingest_py && python run_persistent.py
cd apps/web && npm run dev
```

### 3. Antes de hacer commit:

```bash
# Ejecutar tests relevantes
cd apps/web
npm run test:e2e:auth  # Si tocaste autenticación
npm run test           # Tests unitarios
```

### 4. Antes de push:

```bash
# El hook pre-push ejecuta automáticamente:
git push

# Se ejecutan tests E2E de auth
# Si fallan, el push se cancela
```

### 5. Para saltar el hook (emergencias):

```bash
git push --no-verify
```

⚠️ **Solo usar `--no-verify` en emergencias reales**, ya que saltea la validación que previene bugs.

---

## 📊 CI/CD (Futuro)

### GitHub Actions (ejemplo):

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e:auth
```

---

## 🐛 Troubleshooting

### "Playwright not found"

```bash
cd apps/web
npm install -D @playwright/test
npx playwright install
```

### "Tests failing locally"

1. **Verificar servicios corriendo:**
   ```bash
   curl http://127.0.0.1:8000/api/health/external
   curl http://localhost:3000
   ```

2. **Limpiar cachés:**
   ```bash
   cd apps/api_php
   php artisan cache:clear
   php artisan config:clear
   ```

3. **Limpiar navegador:**
   ```javascript
   // En consola del navegador
   localStorage.clear();
   sessionStorage.clear();
   location.reload();
   ```

4. **Ver logs de Playwright:**
   ```bash
   cd apps/web
   npx playwright test auth.spec.ts --reporter=html
   # Abre el reporte en: playwright-report/index.html
   ```

### "Hook pre-push no se ejecuta"

**Windows:**
```powershell
# Verificar que Git puede ejecutar el hook
Get-Content .husky\pre-push
# Debe tener shebang: #!/usr/bin/env sh
```

**Linux/Mac:**
```bash
# Dar permisos
chmod +x .husky/pre-push

# Verificar
ls -la .husky/
```

### "Tests pasan localmente pero fallan en CI"

- Verificar versiones de Node y npm
- Asegurar que todos los servicios estén corriendo en CI
- Revisar variables de entorno en CI

---

## 📚 Referencias

### Documentación creada:

- **`docs/RUNBOOK_LOGIN_REDIRECT.md`**: Diagnóstico completo del bug de autenticación
- **`docs/CHECKLIST_OPERATIVO.md`**: Checklist diario de verificación
- **`apps/web/e2e/auth.spec.ts`**: Tests E2E de autenticación (8 casos)
- **`scripts/daily-check.sh`**: Script de verificación automática (Linux/Mac)
- **`scripts/daily-check.ps1`**: Script de verificación automática (Windows)
- **`.husky/pre-push`**: Hook que previene pushes con tests fallando

### Archivos modificados:

- **`apps/web/package.json`**: Scripts de test agregados
- **`apps/web/src/hooks/useAuth.js`**: Hook mejorado con eventos y no-cache
- **`apps/web/src/lib/apiSecure.js`**: Headers no-cache en `/auth/me`
- **`apps/web/src/pages/Logout.jsx`**: Recarga dura con `window.location.replace`
- **`apps/api_php/app/Http/Controllers/AuthController.php`**: Headers no-cache en backend

### Playwright Docs:

- https://playwright.dev/docs/intro
- https://playwright.dev/docs/test-annotations
- https://playwright.dev/docs/ci

---

## ✅ Verificación Final

Después del setup, ejecutar estos comandos para verificar:

```bash
# 1. Tests E2E funcionan
cd apps/web
npm run test:e2e:auth

# 2. Script de verificación funciona
cd ../..
.\scripts\daily-check.ps1

# 3. Hook pre-push funciona
git add .
git commit -m "test: verificar setup"
git push
# Debe ejecutar tests automáticamente
```

Si todo pasa ✅, el setup está completo.

---

**Última actualización:** 2025-10-11
**Mantenimiento:** Scripts y tests se mantienen solos, solo actualizar si cambia la arquitectura
