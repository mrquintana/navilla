import { Page, expect } from '@playwright/test';
import { testUsers, type TestUser } from '../fixtures/test-users';

export async function login(page: Page, user: TestUser | keyof typeof testUsers) {
  const testUser = typeof user === 'string' ? testUsers[user] : user;

  await page.goto('/login');
  await page.getByLabel(/email/i).fill(testUser.email);
  await page.getByLabel(/password/i).fill(testUser.password);
  await page.getByRole('button', { name: /sign in|iniciar/i }).click();

  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
}

export async function logout(page: Page) {
  const signOutButton = page.getByRole('button', { name: /sign out|cerrar/i });
  await expect(signOutButton).toBeVisible();
  await signOutButton.click();
  await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
}
