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

  test('shows reminder settings section', async ({ page }) => {
    await page.goto('/notifications');
    await expect(
      page.getByText(/quiet hours|horas silenciosas|reminder settings|configuración/i).first()
    ).toBeVisible();
  });

  test('shows email digest toggle', async ({ page }) => {
    await page.goto('/notifications');
    await expect(
      page.getByText(/email digest|resumen por correo/i).first()
    ).toBeVisible();
  });
});
