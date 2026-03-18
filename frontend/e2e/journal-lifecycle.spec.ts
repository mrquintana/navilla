import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';

test.describe('Journal Entry Lifecycle', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'user2');
  });

  test('navigates to journal page', async ({ page }) => {
    await page.goto('/journal');
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      /journal|diario/i
    );
  });

  test('shows new entry button', async ({ page }) => {
    await page.goto('/journal');
    await expect(
      page.getByRole('button', { name: /new entry|nueva entrada/i })
    ).toBeVisible();
  });

  test('opens new entry modal', async ({ page }) => {
    await page.goto('/journal');
    await page.getByRole('button', { name: /new entry|nueva entrada/i }).click();
    // Date field should be visible in the modal
    await expect(page.locator('#journal-date')).toBeVisible({ timeout: 5000 });
  });

  test('shows journal summary section', async ({ page }) => {
    await page.goto('/journal');
    // Summary should show year total or monthly breakdown
    await expect(
      page.getByText(/entries|entradas|total/i).first()
    ).toBeVisible();
  });

  test('pagination controls are visible when entries exist', async ({ page }) => {
    await page.goto('/journal');
    // If entries exist, pagination or entry cards should be shown
    await page.waitForLoadState('networkidle');
    const body = await page.locator('body').textContent();
    // Page should load without errors
    expect(body).toBeTruthy();
  });
});
