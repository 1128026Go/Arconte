# 🧪 Guía Completa de Testing - Arconte

Documentación de tests automatizados para backend (Laravel) y frontend (React).

---

## 📋 Tabla de Contenidos

- [Resumen](#resumen)
- [Backend Tests (Laravel + PHPUnit)](#backend-tests-laravel--phpunit)
- [Frontend Tests (React + Vitest)](#frontend-tests-react--vitest)
- [E2E Tests (Playwright)](#e2e-tests-playwright)
- [Ejecutar Tests](#ejecutar-tests)
- [Cobertura](#cobertura)
- [CI/CD](#cicd)

---

## 📊 Resumen

### Cobertura de Tests

| Tipo | Framework | Archivos | Casos | Estado |
|------|-----------|----------|-------|--------|
| **Backend Feature** | PHPUnit | 3 | 45+ | ✅ |
| **Backend Unit** | PHPUnit | 1 | 20+ | ✅ |
| **Frontend Unit** | Vitest | 2 | 30+ | ✅ |
| **E2E** | Playwright | 2 | 25+ | ✅ |

### Componentes Testeados

**Backend:**
- ✅ CaseController (CRUD completo)
- ✅ AuthController (login, register, logout)
- ✅ NotificationService (lógica de negocio)

**Frontend:**
- ✅ NotificationBell (component)
- ✅ useAuth (hook)
- ✅ Auth flow (E2E)
- ✅ Cases management (E2E)

---

## 🔧 Backend Tests (Laravel + PHPUnit)

### Estructura

```
apps/api_php/tests/
├── Feature/
│   ├── CaseControllerTest.php          # 25+ tests
│   ├── AuthenticationTest.php          # 20+ tests
│   └── NotificationTest.php            # Existente
└── Unit/
    └── NotificationServiceTest.php     # 20+ tests
```

### Feature Tests

#### CaseControllerTest.php

**Casos cubiertos:**

```php
✅ GET /api/cases
  - List cases (paginated)
  - Filter by status
  - Only show user's cases

✅ POST /api/cases
  - Create case with valid radicado
  - Validation errors
  - Duplicate detection

✅ GET /api/cases/{id}
  - Get case details
  - Include acts
  - 403 for other user's cases
  - 404 for nonexistent

✅ POST /api/cases/{id}/mark-viewed
  - Mark as viewed

✅ POST /api/cases/{id}/refresh
  - Refresh case data

✅ DELETE /api/cases/{id}
  - Delete own case
  - Cannot delete others'

✅ Authentication
  - 401 when not authenticated
```

**Ejecutar:**

```bash
cd apps/api_php
php artisan test --filter CaseControllerTest
```

#### AuthenticationTest.php

**Casos cubiertos:**

```php
✅ Registration
  - Register with valid data
  - Validate name, email, password
  - Unique email
  - Password confirmation

✅ Login
  - Login with correct credentials
  - Wrong password rejection
  - Nonexistent user
  - Case-insensitive email

✅ Logout
  - Logout and revoke token
  - Cannot logout when unauthenticated

✅ Profile (Me)
  - Get authenticated user
  - 401 when not authenticated

✅ Security
  - Password not returned in responses
  - Token generation
  - Token validation
  - Failed login attempts
```

**Ejecutar:**

```bash
cd apps/api_php
php artisan test --filter AuthenticationTest
```

### Unit Tests

#### NotificationServiceTest.php

**Casos cubiertos:**

```php
✅ createNotification()
  - Create with all params
  - Create without case
  - Unread by default
  - Priority handling

✅ Counts & Stats
  - getUnreadCount()
  - getHighPriorityCount()
  - Only user's notifications

✅ markAllAsRead()
  - Mark all as read
  - Only affects user's notifications

✅ deleteOldNotifications()
  - Delete old read notifications
  - Keep recent ones
  - Keep unread ones

✅ Edge Cases
  - Zero notifications
  - Complex metadata storage
```

**Ejecutar:**

```bash
cd apps/api_php
php artisan test --filter NotificationServiceTest
```

### Ejecutar Todos los Backend Tests

```bash
cd apps/api_php

# Todos los tests
php artisan test

# Solo Feature tests
php artisan test --testsuite Feature

# Solo Unit tests
php artisan test --testsuite Unit

# Con cobertura
php artisan test --coverage

# Paralelo (más rápido)
php artisan test --parallel
```

---

## ⚛️ Frontend Tests (React + Vitest)

### Estructura

```
apps/web/src/
├── components/notifications/__tests__/
│   └── NotificationBell.test.jsx       # 15+ tests
└── hooks/__tests__/
    └── useAuth.test.jsx                # 15+ tests
```

### Component Tests

#### NotificationBell.test.jsx

**Casos cubiertos:**

```javascript
✅ Rendering
  - Renders bell button
  - Fetches stats on mount

✅ Badge Display
  - Shows count when unread > 0
  - Shows "99+" for counts > 99
  - Hides badge when count = 0

✅ Priority Indicators
  - Red for high priority
  - Blue for normal priority

✅ Polling
  - Polls every 30 seconds
  - Clears interval on unmount

✅ Dropdown
  - Opens on click

✅ Error Handling
  - Handles API errors gracefully
  - Shows zero on failure
```

**Ejecutar:**

```bash
cd apps/web
npm run test -- NotificationBell.test.jsx
```

### Hook Tests

#### useAuth.test.jsx

**Casos cubiertos:**

```javascript
✅ Initialization
  - Starts with loading state
  - Checks auth on mount

✅ Login
  - Successfully logs in
  - Handles errors
  - Sets user state

✅ Register
  - Successfully registers
  - Sets user state

✅ Logout
  - Successfully logs out
  - Clears state
  - Handles errors

✅ Authentication State
  - isAuthenticated = true when logged in
  - isAuthenticated = false when logged out

✅ Event Listeners
  - Handles auth:logout event
  - Handles auth:unauthorized event

✅ Loading State
  - Sets to false after check
```

**Ejecutar:**

```bash
cd apps/web
npm run test -- useAuth.test.jsx
```

### Ejecutar Todos los Frontend Unit Tests

```bash
cd apps/web

# Todos los tests
npm run test

# Watch mode
npm run test:watch

# Con cobertura
npm run test:coverage

# UI mode
npm run test:ui
```

---

## 🎭 E2E Tests (Playwright)

### Estructura

```
apps/web/e2e/
├── auth.spec.ts                        # 10+ tests (ya existente)
└── cases.spec.ts                       # 15+ tests (nuevo)
```

### Auth E2E Tests (auth.spec.ts)

**Casos cubiertos:**

```typescript
✅ Login Flow
  - /login doesn't redirect when unauthenticated
  - Login redirects to /dashboard
  - Logout redirects to /login
  - Refresh on /login stays on /login
```

**Ejecutar:**

```bash
cd apps/web
npx playwright test auth.spec.ts
```

### Cases E2E Tests (cases.spec.ts)

**Casos cubiertos:**

```typescript
✅ List Cases
  - View cases list
  - Shows case information (number, type, status)

✅ Create Case
  - Create new case
  - Validates radicado format
  - Shows success message

✅ View Case Details
  - View case details
  - Shows case number

✅ View Case Acts (Autos)
  - View acts list
  - Shows date and type
  - Shows empty state

✅ Mark as Viewed
  - Automatically marks case as viewed

✅ Search & Filter
  - Search cases by number

✅ Error Handling
  - Shows 404 for nonexistent case
```

**Ejecutar:**

```bash
cd apps/web
npx playwright test cases.spec.ts
```

### Ejecutar Todos los E2E Tests

```bash
cd apps/web

# Todos los tests E2E
npx playwright test

# Specific browser
npx playwright test --project=chromium

# Headed mode (ver navegador)
npx playwright test --headed

# Debug mode
npx playwright test --debug

# UI mode
npx playwright test --ui

# Generate report
npx playwright show-report
```

---

## 🚀 Ejecutar Tests

### Backend (Laravel)

```bash
cd apps/api_php

# Configurar DB de test (primera vez)
cp .env .env.testing
# Editar .env.testing:
# DB_DATABASE=arconte_test
# DB_CONNECTION=pgsql

# Crear DB de test
createdb arconte_test

# Ejecutar migraciones de test
php artisan migrate --env=testing

# Ejecutar tests
php artisan test

# Con cobertura
php artisan test --coverage --min=80

# Solo un archivo
php artisan test --filter CaseControllerTest

# Solo un método
php artisan test --filter test_user_can_create_case
```

### Frontend (React)

```bash
cd apps/web

# Unit tests
npm run test

# Watch mode (útil para desarrollo)
npm run test:watch

# Con cobertura
npm run test:coverage

# Solo un archivo
npm run test -- NotificationBell.test

# Solo un test
npm run test -- -t "shows badge when there are unread"
```

### E2E (Playwright)

```bash
cd apps/web

# Primera vez: instalar navegadores
npx playwright install

# Ejecutar todos los E2E
npx playwright test

# Solo un archivo
npx playwright test auth.spec.ts

# Solo un test
npx playwright test -g "Login exitoso"

# Con UI (recomendado para desarrollo)
npx playwright test --ui

# Debug mode
npx playwright test --debug

# Generar screenshots on failure
npx playwright test --screenshot=on

# Ver report
npx playwright show-report
```

---

## 📈 Cobertura

### Backend Coverage

```bash
cd apps/api_php
php artisan test --coverage --min=80

# HTML report
php artisan test --coverage-html coverage/

# Abrir report
open coverage/index.html  # macOS
xdg-open coverage/index.html  # Linux
start coverage/index.html  # Windows
```

**Objetivo:** 80% coverage mínimo

### Frontend Coverage

```bash
cd apps/web
npm run test:coverage

# HTML report generado automáticamente en coverage/
open coverage/index.html
```

**Objetivo:** 70% coverage mínimo

---

## 🔄 CI/CD

### GitHub Actions

Crear `.github/workflows/tests.yml`:

```yaml
name: Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  backend-tests:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: arconte
          POSTGRES_PASSWORD: arconte
          POSTGRES_DB: arconte_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3

      - name: Setup PHP
        uses: shivammathur/setup-php@v2
        with:
          php-version: '8.4'
          extensions: pgsql, pdo_pgsql

      - name: Install Dependencies
        working-directory: apps/api_php
        run: composer install --prefer-dist --no-progress

      - name: Run Migrations
        working-directory: apps/api_php
        env:
          DB_CONNECTION: pgsql
          DB_HOST: localhost
          DB_PORT: 5432
          DB_DATABASE: arconte_test
          DB_USERNAME: arconte
          DB_PASSWORD: arconte
        run: php artisan migrate --force

      - name: Run Tests
        working-directory: apps/api_php
        run: php artisan test --coverage --min=80

  frontend-tests:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install Dependencies
        working-directory: apps/web
        run: npm ci

      - name: Run Unit Tests
        working-directory: apps/web
        run: npm run test:coverage

      - name: Install Playwright
        working-directory: apps/web
        run: npx playwright install --with-deps

      - name: Run E2E Tests
        working-directory: apps/web
        run: npx playwright test

      - name: Upload Playwright Report
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: apps/web/playwright-report/
```

---

## 📝 Mejores Prácticas

### Backend

1. **Usar RefreshDatabase** en todos los tests
2. **Factory para datos** (no crear manualmente)
3. **Test de autorización** siempre (user vs other user)
4. **Nombres descriptivos** (`test_user_can_create_case_with_valid_radicado`)

### Frontend

1. **Mock de APIs** con vi.mock()
2. **Testing Library** queries (getByRole, findByText)
3. **User events** sobre fireEvent cuando sea posible
4. **Cleanup** automático (vitest lo hace)
5. **Fake timers** para polling

### E2E

1. **Selectores estables** (data-testid, roles, text)
2. **Wait for conditions** (waitForLoadState, waitForSelector)
3. **Cleanup entre tests** (beforeEach limpia cookies/localStorage)
4. **Screenshots on failure** (--screenshot=on)

---

## 🐛 Troubleshooting

### Backend Tests Failing

```bash
# Limpiar cache
php artisan cache:clear
php artisan config:clear

# Recrear DB de test
dropdb arconte_test
createdb arconte_test
php artisan migrate --env=testing

# Verificar .env.testing
cat .env.testing | grep DB_
```

### Frontend Tests Failing

```bash
# Limpiar cache
rm -rf node_modules/.vite

# Reinstalar
npm ci

# Verificar mocks
# Asegurar que vi.mock() está antes de imports
```

### E2E Tests Failing

```bash
# Reinstalar navegadores
npx playwright install --with-deps

# Verificar servicios corriendo
curl http://localhost:8000/api/health
curl http://localhost:3000

# Debug mode
npx playwright test --debug

# Screenshots
npx playwright test --screenshot=on
```

---

## 📚 Referencias

- **Laravel Testing:** https://laravel.com/docs/11.x/testing
- **PHPUnit:** https://phpunit.de/documentation.html
- **Vitest:** https://vitest.dev/
- **Testing Library:** https://testing-library.com/docs/react-testing-library/intro
- **Playwright:** https://playwright.dev/

---

## 🎯 Próximos Tests

- [ ] DocumentController tests
- [ ] ReminderController tests
- [ ] NotificationCenter component tests
- [ ] CaseList component tests
- [ ] API client tests
- [ ] Mutation tests (Stryker)

---

*Última actualización: 2025-10-17*
*Autor: Claude Code (Anthropic)*
*Versión: 1.0*
