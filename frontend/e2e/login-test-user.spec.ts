import { test, expect } from '@playwright/test';

/**
 * Test that verifies actual login with test users works
 */
test.describe('Test User Login', () => {
  test('testuser1 can login and see dashboard', async ({ page }) => {
    await page.goto('/login');

    // Fill login form
    await page.getByLabel(/email/i).fill('testuser1@navilla.app');
    await page.getByLabel(/password/i).fill('TestPassword123');
    await page.getByRole('button', { name: /sign in|iniciar/i }).click();

    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });

    // Should see welcome message (old: "Welcome back" or new: "Hey")
    await expect(page.getByText(/welcome|hey|hola|bienvenido/i)).toBeVisible();

    // Should see connection count card (old: "Connections" or new: "Your Connections")
    await expect(page.getByText(/connections|conexiones/i).first()).toBeVisible();
  });

  test('testuser7 (isolated user) sees zero connections', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel(/email/i).fill('testuser7@navilla.app');
    await page.getByLabel(/password/i).fill('TestPassword123');
    await page.getByRole('button', { name: /sign in|iniciar/i }).click();

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });

    // Should see 0 connections (isolated user)
    const connectionCard = page.locator('text=0').first();
    await expect(connectionCard).toBeVisible();
  });
});
