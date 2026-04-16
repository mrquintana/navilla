import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';

test.describe('Health Status', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'user2');
    await page.goto('/health');
  });

  test('renders health status page', async ({ page }) => {
    await expect(
      page.getByRole('heading', { level: 1, name: /my health|mi salud/i }),
    ).toBeVisible();
  });

  test('shows exposure overview section', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /exposure overview|resumen de exposición/i }),
    ).toBeVisible();
  });

  test('shows my results section', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /^my results$|^mis resultados$/i }),
    ).toBeVisible();
  });

  test('shows log test visit button on tests tab', async ({ page }) => {
    await page.getByRole('tab', { name: /tests|pruebas/i }).click();
    await expect(
      page.getByRole('button', { name: /log test visit|registrar visita/i }).first(),
    ).toBeVisible();
  });

  test('log test visit button opens visit modal', async ({ page }) => {
    await page.getByRole('tab', { name: /tests|pruebas/i }).click();
    await page
      .getByRole('button', { name: /log test visit|registrar visita/i })
      .first()
      .click();
    await page
      .getByRole('button', { name: /enter manually|ingresar manualmente/i })
      .click();
    await expect(page.locator('input[type="date"], #visit-date').first()).toBeVisible({ timeout: 5000 });
  });
});
