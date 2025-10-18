/**
 * Test E2E: Authentication Flow
 *
 * Previene regresiones del bug "Login redirige al dashboard después de logout"
 *
 * Casos de prueba:
 * 1. Login sin sesión → NO debe redirigir prematuramente al dashboard
 * 2. Login exitoso → debe redirigir al dashboard
 * 3. Logout → debe terminar en /login
 * 4. Refresh en /login después de logout → debe permanecer en /login
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.VITE_APP_URL || 'http://localhost:3000';
const API_URL = process.env.VITE_API_URL || 'http://localhost:8000/api';

// Credenciales de prueba (deben existir en la BD de test)
const TEST_USER = {
  email: 'admin@juridica.test',
  password: 'admin123',
};

test.describe('Authentication Flow', () => {

  test.beforeEach(async ({ page, context }) => {
    // Limpiar cookies y localStorage antes de cada test
    await context.clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('Case 1: /login sin sesión NO redirige a /dashboard', async ({ page }) => {
    // Arrange: Ir directamente a /login sin autenticación
    await page.goto(`${BASE_URL}/login`);

    // Act: Esperar que la página cargue completamente
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000); // Dar tiempo a que guards se ejecuten

    // Assert: Debe permanecer en /login
    expect(page.url()).toBe(`${BASE_URL}/login`);

    // Assert: Debe mostrar el formulario de login
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('Case 2: Login exitoso redirige a /dashboard', async ({ page }) => {
    // Arrange: Ir a la página de login
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');

    // Act: Rellenar formulario y hacer login
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);

    // Click en el botón de login y esperar navegación
    await Promise.all([
      page.waitForURL(`${BASE_URL}/dashboard`),
      page.click('button[type="submit"]'),
    ]);

    // Assert: Debe estar en /dashboard
    expect(page.url()).toBe(`${BASE_URL}/dashboard`);

    // Assert: Debe mostrar elementos del dashboard (ajustar según tu UI)
    await expect(page.locator('text=/Dashboard|Inicio/i')).toBeVisible();
  });

  test('Case 3: Logout termina en /login', async ({ page }) => {
    // Arrange: Primero hacer login
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(`${BASE_URL}/dashboard`);

    // Act: Hacer logout (puede ser botón, menú, o ruta directa)
    // Opción 1: Si tienes botón de logout en el dashboard
    // await page.click('button:has-text("Cerrar sesión")');

    // Opción 2: Navegar directamente a /logout
    await page.goto(`${BASE_URL}/logout`);

    // Esperar a que se complete la redirección
    await page.waitForURL(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');

    // Assert: Debe estar en /login
    expect(page.url()).toBe(`${BASE_URL}/login`);

    // Assert: Debe mostrar formulario de login
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('Case 4: Refresh en /login después de logout permanece en /login', async ({ page }) => {
    // Arrange: Login y logout completo
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(`${BASE_URL}/dashboard`);

    // Logout
    await page.goto(`${BASE_URL}/logout`);
    await page.waitForURL(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');

    // Act: Hacer refresh de la página de login
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000); // Dar tiempo a que guards se ejecuten

    // Assert: Debe PERMANECER en /login (no redirigir al dashboard)
    expect(page.url()).toBe(`${BASE_URL}/login`);

    // Assert: Debe mostrar formulario de login
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('Case 5: Cookies se borran correctamente en logout', async ({ page, context }) => {
    // Arrange: Login
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(`${BASE_URL}/dashboard`);

    // Verificar que hay cookies de sesión
    const cookiesBeforeLogout = await context.cookies();
    const sessionCookie = cookiesBeforeLogout.find(c =>
      c.name.includes('laravel_session') || c.name.includes('XSRF-TOKEN')
    );
    expect(sessionCookie).toBeDefined();

    // Act: Logout
    await page.goto(`${BASE_URL}/logout`);
    await page.waitForURL(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');

    // Assert: Cookies deben estar borradas
    const cookiesAfterLogout = await context.cookies();
    const sessionCookieAfter = cookiesAfterLogout.find(c =>
      c.name.includes('laravel_session') || c.name.includes('XSRF-TOKEN')
    );

    // Pueden existir pero deben estar expiradas o vacías
    if (sessionCookieAfter) {
      expect(sessionCookieAfter.value).toBe('');
    }
  });

  test('Case 6: /auth/me retorna 401 después de logout', async ({ page, context }) => {
    // Arrange: Login
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(`${BASE_URL}/dashboard`);

    // Act: Logout
    await page.goto(`${BASE_URL}/logout`);
    await page.waitForURL(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');

    // Assert: Llamar a /auth/me debe devolver 401
    const cookies = await context.cookies();
    const response = await page.request.get(`${API_URL}/auth/me`, {
      headers: {
        'Accept': 'application/json',
        'Cookie': cookies.map(c => `${c.name}=${c.value}`).join('; '),
      },
    });

    expect(response.status()).toBe(401);
  });

  test('Case 7: Acceso directo a /dashboard sin sesión redirige a /login', async ({ page }) => {
    // Act: Intentar acceder a /dashboard sin autenticación
    await page.goto(`${BASE_URL}/dashboard`);

    // Esperar redirección
    await page.waitForURL(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');

    // Assert: Debe estar en /login
    expect(page.url()).toBe(`${BASE_URL}/login`);
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('Case 8: Headers no-cache en /auth/me', async ({ page }) => {
    // Arrange: Login para tener cookies válidas
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(`${BASE_URL}/dashboard`);

    // Act: Interceptar petición a /auth/me
    let meResponse: any = null;
    page.on('response', async (response) => {
      if (response.url().includes('/auth/me')) {
        meResponse = response;
      }
    });

    // Forzar una llamada a /auth/me (puede ser navegando a otra ruta protegida)
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Assert: Headers deben incluir no-cache
    expect(meResponse).not.toBeNull();
    const headers = await meResponse.headers();
    expect(headers['cache-control']).toContain('no-store');
    expect(headers['cache-control']).toContain('no-cache');
    expect(headers['pragma']).toBe('no-cache');
  });
});
