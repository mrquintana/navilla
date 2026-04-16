import { test, expect } from '@playwright/test';

test.describe('How It Works', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/how-it-works');
  });

  test('renders page title', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1, name: /how it works|cómo funciona/i })).toBeVisible();
  });

  test('shows "What is Navilla?" overview section', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /what is navilla|qué es navilla/i }),
    ).toBeVisible();
  });

  test('shows Encounter Journal section', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /encounter journal|diario de encuentros/i }),
    ).toBeVisible();
  });

  test('shows Partner Tracking section', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /partner tracking|seguimiento de parejas/i }),
    ).toBeVisible();
  });

  test('shows Health Log section', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /^health log$|^registro de salud$/i }),
    ).toBeVisible();
  });

  test('shows Exposure Network section', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /exposure network|red de exposición/i }),
    ).toBeVisible();
  });

  test('shows Free Tools section', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /free tools|herramientas gratuitas/i }),
    ).toBeVisible();
  });

  test('shows Privacy & Security section', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /privacy.*security|privacidad.*seguridad/i }),
    ).toBeVisible();
  });

  test('shows Your Data Rights section', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /your data rights|tus derechos/i }),
    ).toBeVisible();
  });

  test('has Get Started CTA link', async ({ page }) => {
    const link = page.getByRole('link', { name: /get started|comenzar|empezar/i });
    await expect(link.first()).toBeVisible();
  });

  test('is accessible without authentication', async ({ page }) => {
    // Already on the page without logging in - should work
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});
