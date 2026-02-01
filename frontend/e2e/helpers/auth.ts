import { Page, expect } from '@playwright/test';
import { TestUser, testUsers } from '../fixtures/test-users';

/**
 * Login a test user
 */
export async function login(page: Page, user: TestUser | string): Promise<void> {
  const testUser = typeof user === 'string' ? testUsers[user] : user;

  await page.goto('/login');
  await page.getByLabel(/email/i).fill(testUser.email);
  await page.getByLabel(/password/i).fill(testUser.password);
  await page.getByRole('button', { name: /sign in|iniciar/i }).click();

  // Wait for redirect to dashboard
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
}

/**
 * Logout the current user
 */
export async function logout(page: Page): Promise<void> {
  // Click the sign out button/link in the header
  const signOutButton = page.getByRole('button', { name: /sign out|cerrar/i });
  const signOutLink = page.getByRole('link', { name: /sign out|cerrar/i });

  if (await signOutButton.isVisible()) {
    await signOutButton.click();
  } else if (await signOutLink.isVisible()) {
    await signOutLink.click();
  }

  // Wait for redirect to home or login
  await expect(page).toHaveURL(/\/(login)?$/, { timeout: 5000 });
}

/**
 * Check if user is logged in
 */
export async function isLoggedIn(page: Page): Promise<boolean> {
  await page.goto('/dashboard');
  const url = page.url();
  return !url.includes('/login');
}

/**
 * Login and return to a specific page
 */
export async function loginAndGoTo(
  page: Page,
  user: TestUser | string,
  path: string
): Promise<void> {
  await login(page, user);
  if (!page.url().endsWith(path)) {
    await page.goto(path);
  }
}
