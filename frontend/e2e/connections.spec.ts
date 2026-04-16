import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';

test.describe('Connections', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'user2');
    await page.goto('/connections');
  });

  test('renders connections page with heading', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1, name: /connections|conexiones/i })).toBeVisible();
  });

  test('shows add connection section', async ({ page }) => {
    await expect(page.getByText(/add connection|agregar conexión/i)).toBeVisible();
  });

  test('shows identifier input', async ({ page }) => {
    await expect(page.getByPlaceholder(/email|correo|username|usuario/i)).toBeVisible();
  });

  test('shows confirmed connections section', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /confirmed connections|conexiones confirmadas/i }),
    ).toBeVisible();
  });

  test('shows pending sections', async ({ page }) => {
    await expect(page.getByText(/pending incoming|solicitudes recibidas/i)).toBeVisible();
    await expect(page.getByText(/pending sent|solicitudes enviadas/i)).toBeVisible();
  });
});
