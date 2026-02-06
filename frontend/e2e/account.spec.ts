import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';

test.describe('Account Deletion', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'user2');
    await page.goto('/profile');
  });

  test('shows danger zone section', async ({ page }) => {
    await expect(page.getByText(/danger zone|zona de peligro/i)).toBeVisible();
  });

  test('shows delete account button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /delete account|eliminar cuenta/i })).toBeVisible();
  });

  test('opens confirmation modal on click', async ({ page }) => {
    await page.getByRole('button', { name: /delete account|eliminar cuenta/i }).click();
    await expect(page.getByRole('heading', { name: /delete account|eliminar cuenta/i })).toBeVisible();
    await expect(page.getByText(/type delete to confirm|escribe delete/i)).toBeVisible();
  });

  test('requires typing DELETE to confirm', async ({ page }) => {
    await page.getByRole('button', { name: /delete account|eliminar cuenta/i }).click();

    const confirmButton = page.getByRole('button', { name: /permanently delete|eliminar.*permanentemente/i });
    await expect(confirmButton).toBeDisabled();

    await page.getByPlaceholder('DELETE').fill('DELETE');
    await expect(confirmButton).toBeEnabled();
  });

  test('cancel closes the modal', async ({ page }) => {
    await page.getByRole('button', { name: /delete account|eliminar cuenta/i }).click();
    await expect(page.getByText(/type delete to confirm|escribe delete/i)).toBeVisible();

    await page.getByRole('button', { name: /^cancel$|^cancelar$/i }).click();
    await expect(page.getByText(/type delete to confirm|escribe delete/i)).not.toBeVisible();
  });

  test('does not enable button with wrong text', async ({ page }) => {
    await page.getByRole('button', { name: /delete account|eliminar cuenta/i }).click();

    await page.getByPlaceholder('DELETE').fill('delete');
    const confirmButton = page.getByRole('button', { name: /permanently delete|eliminar.*permanentemente/i });
    await expect(confirmButton).toBeDisabled();
  });

  test('deletes account and redirects to home', async ({ page }) => {
    await page.getByRole('button', { name: /delete account|eliminar cuenta/i }).click();
    await page.getByPlaceholder('DELETE').fill('DELETE');
    await page.getByRole('button', { name: /permanently delete|eliminar.*permanentemente/i }).click();

    // Should redirect to home after deletion
    await expect(page).toHaveURL('/', { timeout: 10000 });
  });
});
