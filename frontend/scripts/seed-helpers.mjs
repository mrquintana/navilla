/**
 * Seed Helpers — Playwright interaction functions for the seed runner
 */

import { DEFAULT_PASSWORD } from './seed-config.mjs';

// ─── Logging ────────────────────────────────────────────────────────────────────

export const log = (msg) => console.log(`[seed] ${msg}`);

export const logPageState = async (page, label) => {
  const url = page.url();
  const title = await page.title().catch(() => 'unknown');
  const h1 = await page.locator('h1').first().textContent().catch(() => '');
  log(`${label} | url=${url} | title="${title}" | h1="${h1?.trim() ?? ''}"`);
};

// ─── Timing ─────────────────────────────────────────────────────────────────────

export const delay = (ms) => new Promise((r) => setTimeout(r, ms));

// ─── Select helpers ─────────────────────────────────────────────────────────────

const selectOptionSafe = async (selectLocator, desiredValue, fallbackValue) => {
  const values = await selectLocator.evaluate((el) =>
    Array.from(el.options).map((opt) => opt.value).filter(Boolean)
  );
  const value = values.includes(desiredValue)
    ? desiredValue
    : (fallbackValue && values.includes(fallbackValue) ? fallbackValue : values[0]);
  if (!value) throw new Error('No selectable options found');
  await selectLocator.selectOption(value);
};

// ─── Auth: logout ───────────────────────────────────────────────────────────────

export async function ensureLoggedOut(page, baseUrl) {
  await page.goto(`${baseUrl}/profile`, { waitUntil: 'domcontentloaded' });

  // Try sign-out on profile page
  const signOut = page.getByRole('button', { name: /sign out|cerrar/i });
  if (await signOut.isVisible().catch(() => false)) {
    await signOut.click();
    await page.waitForTimeout(800);
    return;
  }

  // Try header profile menu
  const profileMenu = page.getByRole('button', { name: /profile/i }).first();
  if (await profileMenu.isVisible().catch(() => false)) {
    await profileMenu.click();
    const menuSignOut = page.getByRole('menuitem', { name: /sign out|cerrar/i });
    if (await menuSignOut.isVisible().catch(() => false)) {
      await menuSignOut.click();
      await page.waitForTimeout(800);
    }
  }
}

// ─── Auth: login ────────────────────────────────────────────────────────────────

export async function login(page, baseUrl, email, password = DEFAULT_PASSWORD) {
  await page.goto(`${baseUrl}/login`, { waitUntil: 'domcontentloaded' });
  const emailField = page.getByLabel(/email/i);

  if (!(await emailField.isVisible({ timeout: 3000 }).catch(() => false))) {
    // Might already be logged in — log out first
    await ensureLoggedOut(page, baseUrl);
    await page.goto(`${baseUrl}/login`, { waitUntil: 'domcontentloaded' });
    await emailField.waitFor({ timeout: 8000 });
  }

  await emailField.fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole('button', { name: /sign in|iniciar/i }).click();

  // Wait until we leave the login page (redirect to dashboard/profile/etc.)
  await page.waitForURL((url) => !url.pathname.endsWith('/login'), { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(500);
}

// ─── Auth: signup ───────────────────────────────────────────────────────────────

export async function signup(page, baseUrl, user, password = DEFAULT_PASSWORD) {
  await ensureLoggedOut(page, baseUrl);
  await page.goto(`${baseUrl}/signup`, { waitUntil: 'domcontentloaded' });
  const emailField = page.getByLabel(/^email/i);

  if (!(await emailField.isVisible({ timeout: 5000 }).catch(() => false))) {
    await ensureLoggedOut(page, baseUrl);
    await page.goto(`${baseUrl}/signup`, { waitUntil: 'domcontentloaded' });
    await emailField.waitFor({ timeout: 8000 });
  }

  // Step 1
  await emailField.fill(user.email);
  await page.getByLabel(/^password/i).fill(password);
  await page.getByLabel(/confirm/i).fill(password);
  await page.getByRole('button', { name: /next|siguiente/i }).click();

  // Step 2
  await page.getByLabel(/username/i).fill(user.username);
  await page.getByLabel(/full name/i).fill(user.fullName);
  await page.getByLabel(/date of birth/i).fill(user.dob);
  await page.getByLabel(/sex/i).selectOption(user.sex);
  await selectOptionSafe(page.getByLabel(/country/i), user.country, 'MX');
  await page.getByLabel(/city|region|location/i).fill(user.location);

  await page.getByRole('button', { name: /sign up|registr/i }).click();
  await page.waitForTimeout(1500);
}

// ─── Auth: admin user creation (Supabase Admin API) ─────────────────────────────

export async function createUserViaAdmin(supabaseUrl, supabaseKey, user, password = DEFAULT_PASSWORD) {
  const res = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${supabaseKey}`,
      apikey: supabaseKey,
    },
    body: JSON.stringify({
      email: user.email,
      password,
      email_confirm: true,
      user_metadata: { display_name: user.displayName },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    if (err.msg?.includes('already been registered')) {
      log(`  skip ${user.email} (already exists)`);
      return 'exists';
    }
    throw new Error(`Admin create failed for ${user.email}: ${JSON.stringify(err)}`);
  }
  log(`  created ${user.email} via admin API`);
  return 'created';
}

// ─── Auth: login-sync (trigger public.users record) ─────────────────────────────

export async function loginSync(page, baseUrl, user, password = DEFAULT_PASSWORD) {
  await login(page, baseUrl, user.email, password);
  // After first login, the app creates the public.users record.
  // Navigate to profile to trigger any lazy init.
  await page.goto(`${baseUrl}/profile`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(800);
}

// ─── Profile: update ────────────────────────────────────────────────────────────

export async function updateProfile(page, baseUrl, user, profileOpts) {
  await page.goto(`${baseUrl}/profile`, { waitUntil: 'domcontentloaded' });

  // Click Edit — retry login if we got redirected
  const editBtn = page.getByRole('button', { name: /edit/i });
  if (!(await editBtn.isVisible({ timeout: 5000 }).catch(() => false))) {
    // Likely landed on login page — re-login and retry
    if (page.url().includes('/login')) {
      log(`  retrying login for ${user.email} (session lost)`);
      await login(page, baseUrl, user.email);
      await page.goto(`${baseUrl}/profile`, { waitUntil: 'domcontentloaded' });
    }
    await editBtn.waitFor({ timeout: 10000 });
  }
  await editBtn.click();
  await page.waitForTimeout(300);

  // Display name
  const displayNameInput = page.locator('#displayName');
  await displayNameInput.fill(user.displayName);

  // Visibility
  const visSelect = page.locator('#profileVisibility');
  await visSelect.selectOption(profileOpts.visibility);
  await page.waitForTimeout(200);

  // PUBLIC-only checkboxes
  if (profileOpts.visibility === 'PUBLIC') {
    const dnPublic = page.locator('#displayNamePublic');
    const emailSearch = page.locator('#searchableByEmail');

    const dnChecked = await dnPublic.isChecked();
    if (dnChecked !== profileOpts.displayNamePublic) {
      await dnPublic.click();
    }

    const esChecked = await emailSearch.isChecked();
    if (esChecked !== profileOpts.searchableByEmail) {
      await emailSearch.click();
    }
  }

  // Show age (toggle every other user)
  const showAge = page.locator('#showAge');
  if (await showAge.isVisible().catch(() => false)) {
    const checked = await showAge.isChecked();
    const desired = user.email === 'migue1990@gmail.com' || Math.random() > 0.5;
    if (checked !== desired) {
      await showAge.click();
    }
  }

  // Save
  await page.getByRole('button', { name: /save|guardar/i }).click();
  await page.waitForTimeout(800);
}

// ─── Connections: send request ──────────────────────────────────────────────────

export async function sendConnectionRequest(page, baseUrl, toEmailOrUsername) {
  await page.goto(`${baseUrl}/connections`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(500);
  const input = page.getByPlaceholder(/email or username/i);
  if (!(await input.isVisible({ timeout: 3000 }).catch(() => false))) {
    // Session may have expired — page redirected to login
    if (page.url().includes('/login')) {
      throw new Error('Session lost — redirected to login');
    }
    await input.waitFor({ timeout: 8000 });
  }
  await input.fill(toEmailOrUsername);
  await page.getByRole('button', { name: /send request|enviar/i }).click();
  await page.waitForTimeout(800);
}

// ─── Connections: accept first pending ──────────────────────────────────────────

export async function acceptFirstPending(page, baseUrl) {
  await page.goto(`${baseUrl}/connections`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(500);
  const accept = page.getByRole('button', { name: /accept|aceptar/i }).first();
  if (await accept.isVisible({ timeout: 3000 }).catch(() => false)) {
    await accept.click();
    await page.waitForTimeout(800);
  }
}

// ─── Connections: accept specific pending (by matching text nearby) ─────────────

export async function acceptAllPending(page, baseUrl) {
  await page.goto(`${baseUrl}/connections`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(500);
  // Click all visible accept buttons
  let count = 0;
  while (true) {
    const accept = page.getByRole('button', { name: /accept|aceptar/i }).first();
    if (!(await accept.isVisible({ timeout: 1500 }).catch(() => false))) break;
    await accept.click();
    await page.waitForTimeout(600);
    count++;
  }
  return count;
}

// ─── Connections: deny first pending ────────────────────────────────────────────

export async function denyFirstPending(page, baseUrl) {
  await page.goto(`${baseUrl}/connections`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(500);
  const deny = page.getByRole('button', { name: /deny/i }).first();
  if (await deny.isVisible({ timeout: 3000 }).catch(() => false)) {
    await deny.click();
    await page.waitForTimeout(800);
  }
}

// ─── Health: report a condition ─────────────────────────────────────────────────

export async function reportHealth(page, baseUrl, condition, status, date) {
  await page.goto(`${baseUrl}/health`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(500);

  // Click "Add result"
  const addBtn = page.getByRole('button', { name: /add result/i });
  if (!(await addBtn.isVisible({ timeout: 3000 }).catch(() => false))) {
    if (page.url().includes('/login')) {
      throw new Error('Session lost — redirected to login');
    }
    await addBtn.waitFor({ timeout: 8000 });
  }
  await addBtn.click();
  await page.waitForTimeout(500);

  // Fill modal
  const dialog = page.locator('[role="dialog"]');
  await dialog.waitFor({ timeout: 5000 });

  // Condition select (first select in dialog)
  const conditionSelect = dialog.locator('select').nth(0);
  await conditionSelect.selectOption(condition);

  // Status select (second select in dialog)
  const statusSelect = dialog.locator('select').nth(1);
  await statusSelect.selectOption(status.toLowerCase());

  // Test date
  const dateInput = dialog.locator('input[type="date"]');
  await dateInput.fill(date);

  // Submit
  await page.getByRole('button', { name: /report health status/i }).click();
  await page.waitForTimeout(1000);
}

// ─── Health: clear the most recent entry ────────────────────────────────────────

export async function clearLastHealth(page, baseUrl) {
  await page.goto(`${baseUrl}/health`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(500);

  const clearBtn = page.getByRole('button', { name: /clear/i }).first();
  if (await clearBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await clearBtn.click();
    await page.waitForTimeout(800);
  }
}
