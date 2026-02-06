import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';

test.describe('Connections', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'user2');
    await page.goto('/connections');
  });

  test('renders connections page with tabs', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /connections|conexiones/i })).toBeVisible();
  });

  test('shows add connection form', async ({ page }) => {
    const addButton = page.getByRole('button', { name: /add connection|agregar/i });
    await expect(addButton).toBeVisible();
    await addButton.click();

    await expect(page.getByPlaceholder(/email|correo|username|usuario/i)).toBeVisible();
  });

  test('shows send request button in add form', async ({ page }) => {
    const addButton = page.getByRole('button', { name: /add connection|agregar/i });
    await addButton.click();

    await page.getByPlaceholder(/email|correo|username|usuario/i).fill('friend@example.com');
    await expect(page.getByRole('button', { name: /send|enviar/i })).toBeVisible();
  });

  test('shows confirmed connections section', async ({ page }) => {
    await expect(page.getByText(/confirmed|confirmad/i)).toBeVisible();
  });

  test('shows pending sections', async ({ page }) => {
    await expect(page.getByText(/pending incoming|solicitudes recibidas/i)).toBeVisible();
    await expect(page.getByText(/pending sent|solicitudes enviadas/i)).toBeVisible();
  });
});
