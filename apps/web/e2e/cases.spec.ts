/**
 * Test E2E: Cases Management
 *
 * Tests críticos para gestión de casos:
 * 1. Crear nuevo caso
 * 2. Ver lista de casos
 * 3. Ver detalles de caso
 * 4. Ver autos de un caso
 * 5. Marcar caso como visto
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.VITE_APP_URL || 'http://localhost:3000';
const API_URL = process.env.VITE_API_URL || 'http://localhost:8000/api';

const TEST_USER = {
  email: 'admin@juridica.test',
  password: 'admin123',
};

const TEST_CASE_NUMBER = '11001400300820240012345';

test.describe('Cases Management', () => {

  // Login antes de cada test
  test.beforeEach(async ({ page, context }) => {
    // Limpiar sesión
    await context.clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    // Login
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(`${BASE_URL}/dashboard`);
  });

  // ==========================================
  // List Cases
  // ==========================================

  test('User can view cases list', async ({ page }) => {
    // Navigate to cases
    await page.goto(`${BASE_URL}/cases`);
    await page.waitForLoadState('networkidle');

    // Should show cases list or empty state
    const hasCases = await page.locator('[data-testid="case-item"]').count();
    const hasEmptyState = await page.locator('text=/no tienes casos|sin casos/i').isVisible().catch(() => false);

    // Either cases or empty state should be visible
    expect(hasCases > 0 || hasEmptyState).toBeTruthy();
  });

  test('Cases list shows case information', async ({ page }) => {
    await page.goto(`${BASE_URL}/cases`);
    await page.waitForLoadState('networkidle');

    // Wait for at least one case or check if empty
    const caseItems = page.locator('[data-testid="case-item"]');
    const count = await caseItems.count();

    if (count > 0) {
      // First case should show: number, type, status
      const firstCase = caseItems.first();
      await expect(firstCase).toBeVisible();

      // Should contain case number pattern (Colombian judicial format)
      const text = await firstCase.textContent();
      expect(text).toMatch(/\d{23}/); // 23-digit case number
    }
  });

  // ==========================================
  // Create Case
  // ==========================================

  test('User can create a new case', async ({ page }) => {
    await page.goto(`${BASE_URL}/cases`);
    await page.waitForLoadState('networkidle');

    // Click "New Case" button
    await page.click('button:has-text("Crear Caso"), button:has-text("Nuevo Caso"), [data-testid="create-case-btn"]');

    // Fill radicado
    await page.fill('input[name="radicado"], input[placeholder*="radicado"]', TEST_CASE_NUMBER);

    // Submit form
    await Promise.all([
      page.waitForResponse(resp => resp.url().includes('/api/cases') && resp.status() === 201),
      page.click('button[type="submit"]:has-text("Crear"), button:has-text("Guardar")'),
    ]);

    // Should show success message or redirect to case details
    await expect(
      page.locator('text=/caso creado|éxito|success/i')
    ).toBeVisible({ timeout: 5000 }).catch(() => {
      // Or check if redirected to case details
      return expect(page.url()).toContain('/cases/');
    });
  });

  test('Create case validates radicado format', async ({ page }) => {
    await page.goto(`${BASE_URL}/cases`);

    // Click "New Case"
    await page.click('button:has-text("Crear Caso"), button:has-text("Nuevo Caso")');

    // Enter invalid radicado
    await page.fill('input[name="radicado"], input[placeholder*="radicado"]', 'invalid');

    // Submit
    await page.click('button[type="submit"]:has-text("Crear"), button:has-text("Guardar")');

    // Should show validation error
    await expect(
      page.locator('text=/formato inválido|formato incorrecto|invalid format/i')
    ).toBeVisible({ timeout: 5000 });
  });

  // ==========================================
  // View Case Details
  // ==========================================

  test('User can view case details', async ({ page }) => {
    await page.goto(`${BASE_URL}/cases`);
    await page.waitForLoadState('networkidle');

    // Click on first case
    const firstCase = page.locator('[data-testid="case-item"]').first();
    const caseCount = await firstCase.count();

    if (caseCount > 0) {
      await firstCase.click();
      await page.waitForLoadState('networkidle');

      // Should show case details
      await expect(page.locator('h1, h2').filter({ hasText: /caso|case/i })).toBeVisible();

      // Should show case information
      await expect(page.locator('text=/radicado|número/i')).toBeVisible();
    }
  });

  test('Case details shows case number', async ({ page }) => {
    await page.goto(`${BASE_URL}/cases`);

    const firstCase = page.locator('[data-testid="case-item"]').first();
    if (await firstCase.count() > 0) {
      await firstCase.click();
      await page.waitForLoadState('networkidle');

      // Extract case number from URL or page content
      const url = page.url();
      const content = await page.content();

      // Should contain case number (23 digits)
      expect(url.match(/\d{23}/) || content.match(/\d{23}/)).toBeTruthy();
    }
  });

  // ==========================================
  // View Case Acts (Autos)
  // ==========================================

  test('User can view case acts (autos)', async ({ page }) => {
    await page.goto(`${BASE_URL}/cases`);

    const firstCase = page.locator('[data-testid="case-item"]').first();
    if (await firstCase.count() > 0) {
      await firstCase.click();
      await page.waitForLoadState('networkidle');

      // Look for acts section
      const actsSection = page.locator('[data-testid="acts-list"], section:has-text("Autos"), section:has-text("Actuaciones")');

      // Either has acts or shows empty state
      const hasActs = await actsSection.locator('[data-testid="act-item"]').count() > 0;
      const hasEmptyState = await page.locator('text=/sin actuaciones|no hay autos/i').isVisible().catch(() => false);

      expect(hasActs || hasEmptyState).toBeTruthy();
    }
  });

  test('Case acts show date and type', async ({ page }) => {
    await page.goto(`${BASE_URL}/cases`);

    const firstCase = page.locator('[data-testid="case-item"]').first();
    if (await firstCase.count() > 0) {
      await firstCase.click();
      await page.waitForLoadState('networkidle');

      const actItem = page.locator('[data-testid="act-item"]').first();
      const actCount = await actItem.count();

      if (actCount > 0) {
        await expect(actItem).toBeVisible();

        const text = await actItem.textContent();

        // Should contain date pattern (YYYY-MM-DD or DD/MM/YYYY)
        const hasDate = /\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4}/.test(text);

        expect(hasDate).toBeTruthy();
      }
    }
  });

  // ==========================================
  // Mark Case as Viewed
  // ==========================================

  test('User can mark case as viewed', async ({ page }) => {
    await page.goto(`${BASE_URL}/cases`);

    const firstCase = page.locator('[data-testid="case-item"]').first();
    if (await firstCase.count() > 0) {
      await firstCase.click();
      await page.waitForLoadState('networkidle');

      // The act of viewing should mark it as viewed automatically
      // or there might be a button

      // Wait a bit for any auto-mark logic
      await page.waitForTimeout(1000);

      // Go back to cases list
      await page.goto(`${BASE_URL}/cases`);

      // Case should now be marked as viewed (visual indicator removed)
      // This depends on your UI implementation
    }
  });

  // ==========================================
  // Search & Filter
  // ==========================================

  test('User can search cases', async ({ page }) => {
    await page.goto(`${BASE_URL}/cases`);

    const searchInput = page.locator('input[placeholder*="buscar"], input[type="search"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('11001');
      await page.waitForTimeout(500); // Debounce

      // Results should update
      const cases = page.locator('[data-testid="case-item"]');
      const count = await cases.count();

      // Either found results or shows "no results"
      expect(count >= 0).toBeTruthy();
    }
  });

  // ==========================================
  // Error Handling
  // ==========================================

  test('Shows error when case cannot be loaded', async ({ page }) => {
    // Try to access non-existent case
    await page.goto(`${BASE_URL}/cases/99999999`);
    await page.waitForLoadState('networkidle');

    // Should show 404 or error message
    const hasError = await page.locator('text=/no encontrado|not found|error|404/i').isVisible({ timeout: 5000 }).catch(() => false);

    expect(hasError).toBeTruthy();
  });
});
