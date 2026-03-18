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
    await expect(
      page.getByText(/last tested|última prueba|days since|días desde/i).first()
    ).toBeVisible();
  });

  test('shows log test visit button', async ({ page }) => {
    await page.goto('/health');
    await expect(
      page.getByRole('button', { name: /log.*visit|registrar.*visita|add.*test|nueva.*prueba/i })
    ).toBeVisible();
  });

  test('opens test visit modal', async ({ page }) => {
    await page.goto('/health');
    await page
      .getByRole('button', { name: /log.*visit|registrar.*visita|add.*test|nueva.*prueba/i })
      .click();
    // Modal should show date picker and result fields
    await expect(
      page.locator('input[type="date"], #visit-date').first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('shows visit history section', async ({ page }) => {
    await page.goto('/health');
    await expect(
      page.getByText(/visit history|historial|recent visits|visitas recientes/i).first()
    ).toBeVisible();
  });
});

test.describe('Health Log — Labs', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'user2');
  });

  test('shows lab section on health page', async ({ page }) => {
    await page.goto('/health');
    await expect(
      page.getByText(/lab|laboratorio/i).first()
    ).toBeVisible();
  });
});
