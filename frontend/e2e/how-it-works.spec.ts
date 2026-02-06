import { test, expect } from '@playwright/test';

test.describe('How It Works', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/how-it-works');
  });

  test('renders page title', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1, name: /how it works|cómo funciona/i })).toBeVisible();
  });

  test('shows "What we show you" section', async ({ page }) => {
    await expect(page.getByText(/what we show you|lo que te mostramos/i)).toBeVisible();
  });

  test('shows "What we never show you" section', async ({ page }) => {
    await expect(page.getByText(/what we never show you|lo que nunca te mostramos/i)).toBeVisible();
  });

  test('shows "Where data comes from" section', async ({ page }) => {
    await expect(page.getByText(/where data comes from|de dónde vienen los datos/i)).toBeVisible();
  });

  test('shows "How connections work" section', async ({ page }) => {
    await expect(page.getByText(/how connections work|cómo funcionan las conexiones/i)).toBeVisible();
  });

  test('shows "How exposure is calculated" section', async ({ page }) => {
    await expect(page.getByText(/how exposure is calculated|cómo se calcula la exposición/i)).toBeVisible();
  });

  test('shows "Accuracy and limitations" section', async ({ page }) => {
    await expect(page.getByText(/accuracy and limitations|precisión y limitaciones/i)).toBeVisible();
  });

  test('shows "What you can do" section', async ({ page }) => {
    await expect(page.getByText(/what you can do|lo que puedes hacer/i)).toBeVisible();
  });

  test('shows "Your data rights" section', async ({ page }) => {
    await expect(page.getByText(/your data rights|tus derechos/i)).toBeVisible();
  });

  test('has link to dashboard', async ({ page }) => {
    const link = page.getByRole('link', { name: /go to dashboard|ir al panel/i });
    await expect(link).toBeVisible();
  });

  test('has back link', async ({ page }) => {
    const link = page.getByRole('link', { name: /back|atrás/i });
    await expect(link).toBeVisible();
  });

  test('is accessible without authentication', async ({ page }) => {
    // Already on the page without logging in - should work
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});
