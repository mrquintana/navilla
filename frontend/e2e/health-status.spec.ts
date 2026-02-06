import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';

test.describe('Health Status', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'user2');
    await page.goto('/health');
  });

  test('renders health status page', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /health status|estado de salud/i })).toBeVisible();
  });

  test('shows exposure overview section', async ({ page }) => {
    await expect(page.getByText(/exposure overview|resumen de exposición/i)).toBeVisible();
  });

  test('shows my results section', async ({ page }) => {
    await expect(page.getByText(/my confirmed results|mis resultados/i)).toBeVisible();
  });

  test('shows add result button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /add result|agregar resultado/i })).toBeVisible();
  });

  test('add result button opens report form', async ({ page }) => {
    await page.getByRole('button', { name: /add result|agregar resultado/i }).click();
    await expect(page.getByText(/condition|condición/i)).toBeVisible();
  });
});
