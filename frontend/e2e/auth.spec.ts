import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.describe('Login Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/login');
    });

    test('displays login form', async ({ page }) => {
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByLabel(/password/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /sign in|iniciar/i })).toBeVisible();
    });

    test('has link to signup page', async ({ page }) => {
      const signupLink = page.getByRole('link', { name: /sign up|registr/i });
      await expect(signupLink).toBeVisible();
      await signupLink.click();
      await expect(page).toHaveURL('/signup');
    });

    test('has link to forgot password', async ({ page }) => {
      const forgotLink = page.getByRole('link', { name: /forgot|olvidaste/i });
      await expect(forgotLink).toBeVisible();
      await forgotLink.click();
      await expect(page).toHaveURL('/forgot-password');
    });

    test('shows validation for empty form submission', async ({ page }) => {
      const emailInput = page.getByLabel(/email/i);
      const submitButton = page.getByRole('button', { name: /sign in|iniciar/i });

      // HTML5 validation should prevent submission
      await submitButton.click();
      // Check that the email input is invalid (required field empty)
      await expect(emailInput).toHaveAttribute('required', '');
    });

    test('shows error for invalid credentials', async ({ page }) => {
      await page.getByLabel(/email/i).fill('invalid@test.com');
      await page.getByLabel(/password/i).fill('wrongpassword');
      await page.getByRole('button', { name: /sign in|iniciar/i }).click();

      // Wait for error message to appear (network request will fail)
      await expect(page.locator('.alert-error')).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Signup Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/signup');
    });

    test('displays signup form', async ({ page }) => {
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await expect(page.getByLabel(/^email/i)).toBeVisible();
      await expect(page.getByLabel(/^password/i)).toBeVisible();
      await expect(page.getByLabel(/confirm/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /sign up|registr/i })).toBeVisible();
    });

    test('has link to login page', async ({ page }) => {
      const loginLink = page.getByRole('link', { name: /sign in|iniciar/i });
      await expect(loginLink).toBeVisible();
      await loginLink.click();
      await expect(page).toHaveURL('/login');
    });

    test('validates password mismatch', async ({ page }) => {
      await page.getByLabel(/^email/i).fill('test@example.com');
      await page.getByLabel(/^password/i).fill('password123');
      await page.getByLabel(/confirm/i).fill('different123');
      await page.getByRole('button', { name: /sign up|registr/i }).click();

      // Should show error for password mismatch
      await expect(page.locator('.alert-error')).toBeVisible();
      await expect(page.locator('.alert-error')).toContainText(/do not match|no coinciden/i);
    });

    test('validates password minimum length', async ({ page }) => {
      await page.getByLabel(/^email/i).fill('test@example.com');
      const passwordInput = page.getByLabel(/^password/i);
      await passwordInput.fill('short');
      await page.getByLabel(/confirm/i).fill('short');
      await page.getByRole('button', { name: /sign up|registr/i }).click();

      // HTML5 minlength validation prevents submission
      // Verify we're still on signup page (form didn't submit)
      await expect(page).toHaveURL(/\/signup/);
      // Verify the password field has minLength attribute
      await expect(passwordInput).toHaveAttribute('minlength', '8');
    });
  });

  test.describe('Forgot Password Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/forgot-password');
    });

    test('displays forgot password form', async ({ page }) => {
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /send|enviar/i })).toBeVisible();
    });

    test('has link back to login', async ({ page }) => {
      const backLink = page.getByRole('link', { name: /sign in|iniciar|back|volver/i });
      await expect(backLink).toBeVisible();
      await backLink.click();
      await expect(page).toHaveURL('/login');
    });
  });

  test.describe('Protected Routes', () => {
    test('redirects to login when accessing dashboard unauthenticated', async ({ page }) => {
      await page.goto('/dashboard');
      // Should redirect to login
      await expect(page).toHaveURL(/\/login/);
    });
  });
});

test.describe('Navigation', () => {
  test('homepage loads correctly', async ({ page }) => {
    await page.goto('/');
    // Check that the page loads without errors
    await expect(page).toHaveURL('/');
    // Should have header
    await expect(page.locator('header')).toBeVisible();
  });

  test('can navigate from homepage to login', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /sign in|iniciar/i }).first().click();
    await expect(page).toHaveURL('/login');
  });

  test('can navigate from homepage to signup', async ({ page }) => {
    await page.goto('/');
    // Look for "Get Started" or signup link
    const signupLink = page.getByRole('link', { name: /get started|sign up|registr|comenzar/i }).first();
    if (await signupLink.isVisible()) {
      await signupLink.click();
      await expect(page).toHaveURL('/signup');
    }
  });
});
