import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';

test.describe('Health Log', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'user2');
  });

  test('navigates to health log page', async ({ page }) => {
    await page.goto('/health');
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      /health|salud/i
    );
  });

  test('shows test summary section', async ({ page }) => {
    await page.goto('/health');
    await page.getByRole('tab', { name: /tests|pruebas/i }).click();
    await expect(
      page.getByText(/days since last test|días desde la última prueba/i).first()
    ).toBeVisible();
  });

  test('shows log test visit button', async ({ page }) => {
    await page.goto('/health');
    await page.getByRole('tab', { name: /tests|pruebas/i }).click();
    await expect(
      page.getByRole('button', { name: /log test visit|registrar visita/i }).first()
    ).toBeVisible();
  });

  test('opens test visit modal', async ({ page }) => {
    await page.goto('/health');
    await page.getByRole('tab', { name: /tests|pruebas/i }).click();
    await page
      .getByRole('button', { name: /log test visit|registrar visita/i })
      .first()
      .click();
    // Modal opens on a path chooser; pick manual entry to reveal the form
    await page
      .getByRole('button', { name: /enter manually|ingresar manualmente/i })
      .click();
    await expect(
      page.locator('input[type="date"], #visit-date').first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('shows visit history section', async ({ page }) => {
    await page.goto('/health');
    await page.getByRole('tab', { name: /tests|pruebas/i }).click();
    await expect(
      page.getByText(/visit history|historial de visitas/i).first()
    ).toBeVisible();
  });
});

