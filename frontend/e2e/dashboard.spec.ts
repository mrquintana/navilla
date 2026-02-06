import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';

test.describe('Dashboard', () => {
  test.describe('Logged-in user with connections (user2)', () => {
    test.beforeEach(async ({ page }) => {
      await login(page, 'user2');
    });

    test('shows welcome heading', async ({ page }) => {
      await expect(page.getByRole('heading', { level: 1 })).toContainText(/hey|hola/i);
    });

    test('shows connection count', async ({ page }) => {
      await expect(page.getByText(/your connections|tus conexiones/i)).toBeVisible();
    });

    test('shows exposure status card', async ({ page }) => {
      await expect(page.getByText(/your status|tu estado/i)).toBeVisible();
    });

    test('shows profile card', async ({ page }) => {
      await expect(page.getByText(/profile|perfil/i).first()).toBeVisible();
    });

    test('shows network size', async ({ page }) => {
      await expect(page.getByText(/network size|tamaño de red/i)).toBeVisible();
    });

    test('shows "What does this mean?" link to how-it-works', async ({ page }) => {
      const helpLink = page.getByRole('link', { name: /what does this mean|qué significa/i });
      await expect(helpLink).toBeVisible();
      await helpLink.click();
      await expect(page).toHaveURL(/\/how-it-works/);
    });

    test('manage connections link works', async ({ page }) => {
      const link = page.getByRole('link', { name: /manage connections|gestionar/i });
      await expect(link).toBeVisible();
      await link.click();
      await expect(page).toHaveURL(/\/connections/);
    });

    test('view health status link works', async ({ page }) => {
      const link = page.getByRole('link', { name: /view health status|ver estado/i });
      await expect(link).toBeVisible();
      await link.click();
      await expect(page).toHaveURL(/\/health/);
    });

    test('edit profile link works', async ({ page }) => {
      const link = page.getByRole('link', { name: /edit profile|editar perfil/i });
      await expect(link).toBeVisible();
      await link.click();
      await expect(page).toHaveURL(/\/profile/);
    });
  });

  test.describe('User below threshold (user1 — 1 connection)', () => {
    test.beforeEach(async ({ page }) => {
      await login(page, 'user1');
    });

    test('shows threshold progress indicator', async ({ page }) => {
      await expect(page.getByText('1 / 3')).toBeVisible();
    });

    test('shows threshold message', async ({ page }) => {
      await expect(page.getByText(/connections needed|conexiones necesarias/i)).toBeVisible();
    });
  });

  test.describe('New user with no connections (user7)', () => {
    test.beforeEach(async ({ page }) => {
      await login(page, 'user7');
    });

    test('shows zero connection count', async ({ page }) => {
      // The large bold connection count number
      const countDisplay = page.locator('.text-4xl.font-bold');
      await expect(countDisplay).toContainText('0');
    });

    test('shows threshold progress indicator', async ({ page }) => {
      await expect(page.getByText('0 / 3')).toBeVisible();
    });
  });
});
