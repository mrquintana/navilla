import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';

test.describe('Reminders', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'user2');
  });

  test('shows reminders on dashboard', async ({ page }) => {
    // Dashboard should show upcoming reminders section
    await expect(
      page.getByText(/reminders|recordatorios/i).first()
    ).toBeVisible();
  });
});

test.describe('Notifications Page', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'user2');
  });

  test('navigates to notifications page', async ({ page }) => {
    await page.goto('/notifications');
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      /notification|notificacion/i
    );
  });

  test('shows filter buttons', async ({ page }) => {
    await page.goto('/notifications');
    await expect(
      page.getByRole('button', { name: /^all$|^todas$/i }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /^unread$|^no leídas$/i }).first(),
    ).toBeVisible();
  });

  test('shows mark all read button', async ({ page }) => {
    await page.goto('/notifications');
    await expect(
      page.getByRole('button', { name: /mark all read|marcar todo leído/i }).first(),
    ).toBeVisible();
  });
});
