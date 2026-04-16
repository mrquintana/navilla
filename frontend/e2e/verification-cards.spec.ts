import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';

test.describe('Verification Cards', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'user2');
  });

  test('navigates to verification card page', async ({ page }) => {
    await page.goto('/verification-card');
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      /verification|verificación/i
    );
  });

  test('shows create card button', async ({ page }) => {
    await page.goto('/verification-card');
    await expect(
      page.getByRole('button', { name: /create|crear|new|nueva/i })
    ).toBeVisible();
  });

  test('opens card creation modal', async ({ page }) => {
    await page.goto('/verification-card');
    await page.getByRole('button', { name: /create|crear|new|nueva/i }).first().click();
    // Modal opens — Included Conditions legend is the unique anchor we target
    await expect(
      page.getByText(/included conditions|condiciones incluidas/i),
    ).toBeVisible();
  });

  test('public card route renders for invalid token', async ({ page }) => {
    await page.goto('/v/invalid-token-abc123');
    // Should show error or expired state, not crash
    await expect(page.locator('body')).not.toBeEmpty();
  });
});
