import { test, expect } from '@playwright/test';
import { login, logout } from './helpers/auth';
import { testUsers } from './fixtures/test-users';

test.describe('E2E Smoke', () => {
  test('homepage loads', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('header')).toBeVisible();
  });

  test('signup step 1 renders and moves to step 2', async ({ page }) => {
    await page.goto('/signup');

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByLabel(/^email/i)).toBeVisible();
    await expect(page.getByLabel(/^password/i)).toBeVisible();
    await expect(page.getByLabel(/confirm/i)).toBeVisible();

    await page.getByLabel(/^email/i).fill('e2e-smoke@example.com');
    await page.getByLabel(/^password/i).fill('TestPassword123!');
    await page.getByLabel(/confirm/i).fill('TestPassword123!');

    await page.getByRole('button', { name: /next|siguiente/i }).click();

    await expect(page.getByLabel(/username/i)).toBeVisible();
    await expect(page.getByLabel(/date of birth/i)).toBeVisible();
    await expect(page.getByLabel(/sex/i)).toBeVisible();
  });

  test('login shows dashboard cards', async ({ page }) => {
    await login(page, 'user2');

    await expect(page.getByRole('heading', { level: 1 })).toContainText(/hey|welcome/i);
    await expect(page.getByText(/your connections/i)).toBeVisible();
    await expect(page.getByText(/your status/i)).toBeVisible();
  });

  test('logout returns to login', async ({ page }) => {
    await login(page, testUsers.user1);
    await logout(page);
  });
});
