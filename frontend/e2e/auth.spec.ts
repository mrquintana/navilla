import { test, expect } from '@playwright/test';
import { login, logout } from './helpers/auth';

test.describe('Auth', () => {
  test.describe('Login', () => {
    test('renders login form', async ({ page }) => {
      await page.goto('/login');
      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByLabel(/password/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /sign in|iniciar/i })).toBeVisible();
    });

    test('logs in with valid credentials', async ({ page }) => {
      await login(page, 'user2');
      await expect(page.getByRole('heading', { level: 1 })).toContainText(/hey|hola/i);
    });

    test('shows error with invalid credentials', async ({ page }) => {
      await page.goto('/login');
      await page.getByLabel(/email/i).fill('wrong@example.com');
      await page.getByLabel(/password/i).fill('wrongpassword');
      await page.getByRole('button', { name: /sign in|iniciar/i }).click();
      await expect(page.getByText(/invalid|error|inválid/i)).toBeVisible({ timeout: 5000 });
    });

    test('links to forgot password', async ({ page }) => {
      await page.goto('/login');
      const link = page.getByRole('link', { name: /forgot|olvidaste/i });
      await expect(link).toBeVisible();
      await link.click();
      await expect(page).toHaveURL(/\/forgot-password/);
    });

    test('links to signup', async ({ page }) => {
      await page.goto('/login');
      const link = page.getByRole('link', { name: /sign up|registr/i });
      await expect(link).toBeVisible();
      await link.click();
      await expect(page).toHaveURL(/\/signup/);
    });
  });

  test.describe('Signup', () => {
    test('renders step 1 with account fields', async ({ page }) => {
      await page.goto('/signup');
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await expect(page.getByLabel(/^email/i)).toBeVisible();
      await expect(page.getByLabel(/^password/i)).toBeVisible();
      await expect(page.getByLabel(/confirm/i)).toBeVisible();
    });

    test('advances from step 1 to step 2', async ({ page }) => {
      await page.goto('/signup');
      await page.getByLabel(/^email/i).fill('e2e-new@navilla.app');
      await page.getByLabel(/^password/i).fill('TestPassword123!');
      await page.getByLabel(/confirm/i).fill('TestPassword123!');
      await page.getByRole('button', { name: /next|siguiente/i }).click();

      await expect(page.getByLabel(/username/i)).toBeVisible();
      await expect(page.getByLabel(/date of birth/i)).toBeVisible();
      await expect(page.getByLabel(/sex/i)).toBeVisible();
    });

    test('validates password mismatch', async ({ page }) => {
      await page.goto('/signup');
      await page.getByLabel(/^email/i).fill('e2e-new@navilla.app');
      await page.getByLabel(/^password/i).fill('TestPassword123!');
      await page.getByLabel(/confirm/i).fill('DifferentPassword!');
      await page.getByRole('button', { name: /next|siguiente/i }).click();

      await expect(page.getByText(/match|coincid/i)).toBeVisible();
    });
  });

  test.describe('Logout', () => {
    test('logs out and redirects to login', async ({ page }) => {
      await login(page, 'user1');
      await logout(page);
      await expect(page).toHaveURL(/\/login/);
    });
  });

  test.describe('Forgot Password', () => {
    test('renders forgot password form', async ({ page }) => {
      await page.goto('/forgot-password');
      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /send|enviar/i })).toBeVisible();
    });
  });

  test.describe('Protected Routes', () => {
    test('redirects unauthenticated user from dashboard', async ({ page }) => {
      await page.goto('/dashboard');
      await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
    });

    test('redirects unauthenticated user from profile', async ({ page }) => {
      await page.goto('/profile');
      await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
    });
  });
});
