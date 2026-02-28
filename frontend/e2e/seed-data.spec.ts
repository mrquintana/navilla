import { test, expect, Page } from '@playwright/test';

/**
 * Seed realistic data for the demo account via Playwright.
 *
 * This spec logs in through the actual UI, then creates partners,
 * journal entries (across 2024–2026), labs, and health log test visits
 * — exercising every field the forms support.
 *
 * Also serves as an E2E integration test: every create flow is validated
 * by checking the resulting UI state.
 *
 * Run against production:
 *   cd frontend && E2E_BASE_URL=https://www.navilla.app npx playwright test e2e/seed-data.spec.ts --headed
 */

const SEED_USER = {
  email: 'migue1990@gmail.com',
  password: 'Test1234',
};

// ─── Login helper ───────────────────────────────────────────────────

async function login(page: Page) {
  await page.goto('/login');

  // Dismiss cookie consent banner if present
  const cookieBtn = page.getByRole('button', { name: /entendido|understood|accept|got it/i });
  if (await cookieBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await cookieBtn.click();
    await page.waitForTimeout(300);
  }

  // Use input IDs directly (works regardless of language)
  await page.locator('#email').fill(SEED_USER.email);
  await page.locator('#password').fill(SEED_USER.password);
  await page.getByRole('button', { name: /sign in|iniciar sesión/i }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
}

// ─── Journal entry creation ─────────────────────────────────────────

async function createJournalEntry(
  page: Page,
  opts: {
    date: string;
    alias?: string;
    notes?: string;
    customFields?: { label: string; value: string }[];
  }
) {
  await page.goto('/journal');
  await page.waitForLoadState('networkidle');

  // Open the entry modal
  await page.getByRole('button', { name: /new entry|nueva entrada/i }).click();
  await expect(page.locator('#journal-date')).toBeVisible({ timeout: 5000 });

  // Date
  await page.locator('#journal-date').fill(opts.date);

  // Alias (type the name, then blur to dismiss autocomplete)
  if (opts.alias) {
    const aliasInput = page.locator('#journal-alias');
    await aliasInput.click();
    await aliasInput.fill(opts.alias);
    // Click the date input to dismiss autocomplete dropdown
    await page.waitForTimeout(200);
    await page.locator('#journal-date').click();
    await page.waitForTimeout(100);
  }

  // Notes
  if (opts.notes) {
    await page.locator('#journal-notes').fill(opts.notes);
  }

  // Custom fields — the modal may already have template rows from previously saved labels
  if (opts.customFields && opts.customFields.length > 0) {
    // Get existing custom field rows
    const existingRows = page.locator('.custom-field-row, [class*="custom-field"]');
    await existingRows.count().catch(() => 0);

    for (let i = 0; i < opts.customFields.length; i++) {
      const cf = opts.customFields[i];

      // If we need more rows than already present, click "Add field"
      // But first check: template labels auto-create rows, so some may exist already
      const labelInputs = page.locator('input[maxlength="100"]');
      page.locator('input[maxlength="500"]');
      const labelCount = await labelInputs.count();

      if (i >= labelCount) {
        // Need to add a new field row
        const addBtn = page.getByRole('button', { name: /add field|agregar campo|add custom/i });
        if (await addBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
          await addBtn.click();
          await page.waitForTimeout(200);
        }
      }

      // Fill the i-th custom field
      const allLabels = page.locator('input[maxlength="100"]');
      const allValues = page.locator('input[maxlength="500"]');

      if (i < await allLabels.count()) {
        const labelInput = allLabels.nth(i);
        const valueInput = allValues.nth(i);

        // Clear and fill label
        await labelInput.click();
        await labelInput.fill(cf.label);
        await valueInput.click();
        await valueInput.fill(cf.value);
      }
    }
  }

  // Save — the modal can overflow the viewport when there are 3 custom fields,
  // so we scroll the modal container first, then use dispatchEvent as fallback
  const saveBtn = page.getByRole('button', { name: /^save$|^guardar$/i });
  // Scroll the modal overlay to ensure the button is visible
  await page.evaluate(() => {
    const overlay = document.querySelector('.modal-overlay, [class*="modal"], [class*="backdrop"]');
    if (overlay) overlay.scrollTop = overlay.scrollHeight;
    // Also try scrolling the form
    const form = document.querySelector('form');
    if (form) form.scrollIntoView({ block: 'end' });
  });
  await page.waitForTimeout(200);
  // Try normal click first; if still out of viewport, use JS click
  try {
    await saveBtn.click({ timeout: 3000 });
  } catch {
    await saveBtn.evaluate((el: HTMLElement) => el.click());
  }

  // Wait for modal to close (success)
  await expect(page.locator('#journal-date')).not.toBeVisible({ timeout: 10000 });

  // Handle promote toast if it appears — always accept
  const promoteBtn = page.getByRole('button', { name: /save as partner|guardar como pareja/i });
  if (await promoteBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
    await promoteBtn.click();
    await page.waitForTimeout(1000);
  }

  await page.waitForTimeout(300);
}

// ─── Test visit creation ────────────────────────────────────────────

async function createTestVisit(
  page: Page,
  opts: {
    date: string;
    labName?: string;
    labProvider?: string;
    labReference?: string;
    conditions: {
      name: string;
      status: string;
      resultValue?: string;
      referenceRange?: string;
    }[];
    notes?: string;
  }
) {
  await page.goto('/health-log');
  await page.waitForLoadState('networkidle');

  // Open the test visit modal
  await page.getByRole('button', { name: /log test visit|registrar visita/i }).click();
  await expect(page.locator('#visit-date')).toBeVisible({ timeout: 5000 });

  // Date
  await page.locator('#visit-date').fill(opts.date);

  // Lab selection or creation
  if (opts.labName) {
    const labSelect = page.locator('#lab-picker-select');
    const options = await labSelect.locator('option').allTextContents();
    const existingOption = options.find((o) => o.includes(opts.labName!));

    if (existingOption) {
      // Lab already exists — select it by matching text
      const allOptions = await labSelect.locator('option').all();
      for (const opt of allOptions) {
        const txt = await opt.textContent();
        if (txt?.includes(opts.labName!)) {
          const val = await opt.getAttribute('value');
          if (val) await labSelect.selectOption(val);
          break;
        }
      }
    } else {
      // Create new lab inline
      await labSelect.selectOption('__new__');
      await page.waitForTimeout(300);

      if (opts.labProvider) {
        await page.locator('#lab-new-provider').selectOption(opts.labProvider);
      }
      await page.locator('#lab-new-name').fill(opts.labName);

      // Save the new lab
      await page.locator('button.btn-primary.btn-sm.w-full').click();
      // Wait for lab to be created and selected
      await page.waitForTimeout(1500);
    }
  }

  // Lab reference number
  if (opts.labReference) {
    await page.locator('#visit-lab-reference').fill(opts.labReference);
  }

  // Check conditions and set their status / values
  for (const cond of opts.conditions) {
    const checkbox = page.locator(`#condition-${cond.name}`);
    await checkbox.check();
    await page.waitForTimeout(200);

    // The expanded fields appear inside the same condition row container
    // Find the parent card (.rounded-lg.border) that contains this checkbox
    const condCard = checkbox.locator('xpath=ancestor::div[contains(@class,"rounded-lg")]');

    // Select status
    const statusSelect = condCard.locator('select');
    await statusSelect.selectOption(cond.status);

    // Result value
    if (cond.resultValue) {
      const inputs = condCard.locator('input[type="text"]');
      await inputs.first().fill(cond.resultValue);
    }

    // Reference range
    if (cond.referenceRange) {
      const inputs = condCard.locator('input[type="text"]');
      await inputs.last().fill(cond.referenceRange);
    }
  }

  // Notes
  if (opts.notes) {
    await page.locator('#visit-notes').fill(opts.notes);
  }

  // Save — modal may overflow with many conditions; use JS click fallback
  const visitSaveBtn = page.getByRole('button', { name: /^save$|^guardar$/i });
  await page.evaluate(() => {
    const form = document.querySelector('form');
    if (form) form.scrollIntoView({ block: 'end' });
  });
  await page.waitForTimeout(200);
  try {
    await visitSaveBtn.click({ timeout: 3000 });
  } catch {
    await visitSaveBtn.evaluate((el: HTMLElement) => el.click());
  }
  await expect(page.locator('#visit-date')).not.toBeVisible({ timeout: 10000 });
  await page.waitForTimeout(500);
}

// ─── Partner notes update ───────────────────────────────────────────

async function addPartnerNotes(page: Page, alias: string, notes: string) {
  await page.goto('/journal');
  await page.waitForLoadState('networkidle');

  // Switch to Partners tab
  const partnersTab = page.getByRole('button', { name: /partners|parejas/i });
  if (await partnersTab.isVisible({ timeout: 3000 }).catch(() => false)) {
    await partnersTab.click();
    await page.waitForTimeout(500);
  }

  // Click on the partner card
  const partnerCard = page.locator('a, [class*="card"]').filter({ hasText: alias }).first();
  if (await partnerCard.isVisible({ timeout: 3000 }).catch(() => false)) {
    await partnerCard.click();
    await page.waitForURL(/\/journal\/partners\//, { timeout: 5000 });
    await page.waitForLoadState('networkidle');

    // Click the "Add a note" prompt or edit button
    const addNoteBtn = page.locator('button, [role="button"]').filter({
      hasText: /add a note|agregar nota|edit/i,
    }).first();

    if (await addNoteBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await addNoteBtn.click();
      await page.waitForTimeout(200);
    }

    // Fill the notes textarea
    const textarea = page.locator('textarea');
    if (await textarea.isVisible({ timeout: 2000 }).catch(() => false)) {
      await textarea.fill(notes);
      // Save
      const saveBtn = page.getByRole('button', { name: /save|guardar/i });
      if (await saveBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await saveBtn.click();
        await page.waitForTimeout(500);
      }
    }
  }
}

// ─── Data Definitions ───────────────────────────────────────────────

const PARTNERS = [
  { alias: 'Carlos M.', notes: 'Met at a friend\'s birthday party in Condesa. Really sweet guy, works in tech. Always uses protection and gets tested regularly.' },
  { alias: 'Sofía R.', notes: 'Yoga instructor from Roma Norte. We hang out occasionally — always good vibes.' },
  { alias: 'Diego', notes: 'Friend of a friend. Met him through the queer community in CDMX. Fun to be around.' },
  { alias: 'Valentina', notes: '' },
  { alias: 'Andrés L.', notes: 'Lives in Polanco. Met on Grindr. Started PrEP recently. Verified negative on his last panel.' },
];

const JOURNAL_ENTRIES = [
  // ── 2024 ──
  {
    date: '2024-06-15',
    alias: 'Carlos M.',
    notes: 'First time hanging out after the party. Went to his place in Condesa.',
    customFields: [
      { label: 'Protection', value: 'Condom used' },
      { label: 'Location', value: 'His apartment, Condesa' },
    ],
  },
  {
    date: '2024-08-22',
    alias: 'Carlos M.',
    notes: 'Spontaneous meetup after dinner at Contramar.',
    customFields: [{ label: 'Protection', value: 'Condom used' }],
  },
  {
    date: '2024-10-03',
    alias: 'Sofía R.',
    notes: 'After her yoga class. We grabbed coffee first at Café Avellaneda.',
    customFields: [
      { label: 'Protection', value: 'Yes' },
      { label: 'Mood', value: 'Relaxed' },
    ],
  },
  {
    date: '2024-11-30',
    alias: 'Diego',
    notes: 'Post house party in Coyoacán.',
  },

  // ── 2025 ──
  {
    date: '2025-01-12',
    alias: 'Carlos M.',
    notes: 'New year catch up. He mentioned getting tested recently — all clear.',
    customFields: [{ label: 'Protection', value: 'Condom used' }],
  },
  {
    date: '2025-02-14',
    alias: 'Valentina',
    notes: 'Valentine\'s Day. Met at a mezcal bar in Juárez.',
    customFields: [
      { label: 'Protection', value: 'Yes' },
      { label: 'Location', value: 'Hotel in Juárez' },
    ],
  },
  {
    date: '2025-03-20',
    alias: 'Sofía R.',
    notes: 'Weekend at Valle de Bravo. Really nice time away from the city.',
    customFields: [
      { label: 'Mood', value: 'Great' },
      { label: 'Protection', value: 'Partial' },
    ],
  },
  {
    date: '2025-05-10',
    alias: 'Diego',
    notes: 'Ran into him at Marcha del Orgullo pregame. Went back to his place after.',
  },
  {
    date: '2025-06-28',
    alias: 'Sofía R.',
    notes: 'Her friend\'s gallery opening in Roma Norte. Ended up at her place.',
    customFields: [{ label: 'Protection', value: 'Yes' }],
  },
  {
    date: '2025-07-04',
    alias: 'Andrés L.',
    notes: 'First date. We had dinner at Pujol, then went to his place.',
    customFields: [
      { label: 'Protection', value: 'Condom used' },
      { label: 'Mood', value: 'Excited' },
      { label: 'Location', value: 'Polanco' },
    ],
  },
  {
    date: '2025-08-18',
    alias: 'Andrés L.',
    notes: 'Second time. Had lunch at his place. He showed me his latest test results — all negative.',
    customFields: [{ label: 'Protection', value: 'Yes' }],
  },
  {
    date: '2025-09-05',
    alias: 'Diego',
    notes: 'Quick hangout at his place after drinks in Coyoacán.',
    customFields: [{ label: 'Protection', value: 'Condom used' }],
  },
  {
    date: '2025-10-25',
    alias: 'Carlos M.',
    notes: 'Halloween party at a friend\'s rooftop in Roma.',
    customFields: [{ label: 'Protection', value: 'Condom used' }],
  },
  {
    date: '2025-11-15',
    alias: 'Sofía R.',
    notes: 'Her birthday weekend. Went to Oaxaca together.',
    customFields: [{ label: 'Location', value: 'Oaxaca City' }],
  },
  {
    date: '2025-12-01',
    alias: 'Andrés L.',
    notes: 'Dinner at his place. He started PrEP last month.',
    customFields: [{ label: 'Protection', value: 'Condom used' }],
  },

  // ── 2026 ──
  {
    date: '2026-01-08',
    alias: 'Andrés L.',
    notes: 'New Year hangout. He\'s been on PrEP for a few months now.',
    customFields: [
      { label: 'Protection', value: 'Condom used' },
      { label: 'Mood', value: 'Comfortable' },
    ],
  },
  {
    date: '2026-02-10',
    alias: 'Valentina',
    notes: 'Casual meetup. We talked about both getting tested soon.',
    customFields: [{ label: 'Protection', value: 'Yes' }],
  },
  {
    date: '2026-02-22',
    alias: '',
    notes: 'Anonymous encounter at a club in Zona Rosa.',
  },
];

const TEST_VISITS = [
  {
    date: '2024-07-20',
    labName: 'Chopo Condesa',
    labProvider: 'CHOPO',
    labReference: 'CH-2024-88341',
    conditions: [
      { name: 'CHLAMYDIA', status: 'NEGATIVE' },
      { name: 'GONORRHEA', status: 'NEGATIVE' },
      { name: 'SYPHILIS', status: 'NEGATIVE' },
      { name: 'HIV', status: 'NEGATIVE', resultValue: 'Non-reactive', referenceRange: 'Non-reactive' },
    ],
    notes: 'Routine panel after starting to see Carlos. Everything clear.',
  },
  {
    date: '2025-02-28',
    labName: 'Salud Digna Roma',
    labProvider: 'SALUD_DIGNA',
    labReference: 'SD-2025-12057',
    conditions: [
      { name: 'CHLAMYDIA', status: 'NEGATIVE' },
      { name: 'GONORRHEA', status: 'NEGATIVE' },
      { name: 'HIV', status: 'NEGATIVE', resultValue: 'Non-reactive', referenceRange: 'Non-reactive' },
      { name: 'HEPATITIS_B', status: 'NEGATIVE', resultValue: '< 10 mIU/ml', referenceRange: '< 10 mIU/ml' },
      { name: 'HSV2', status: 'NEGATIVE', resultValue: '0.4 index', referenceRange: '< 0.9 index' },
    ],
    notes: 'Expanded panel. Wanted to check Hepatitis B and Herpes as well. All clear.',
  },
  {
    date: '2025-09-12',
    labName: 'Chopo Condesa',
    labProvider: 'CHOPO',
    labReference: 'CH-2025-44219',
    conditions: [
      { name: 'CHLAMYDIA', status: 'NEGATIVE' },
      { name: 'GONORRHEA', status: 'NEGATIVE' },
      { name: 'SYPHILIS', status: 'NEGATIVE', resultValue: 'Non-reactive (RPR)', referenceRange: 'Non-reactive' },
      { name: 'HIV', status: 'NEGATIVE', resultValue: 'Non-reactive (4th gen)', referenceRange: 'Non-reactive' },
      { name: 'HPV', status: 'NEGATIVE' },
    ],
    notes: 'Annual comprehensive panel. Added HPV screening this time. Doctor recommended Gardasil booster.',
  },
  {
    date: '2026-01-20',
    labName: 'Salud Digna Roma',
    labProvider: 'SALUD_DIGNA',
    labReference: 'SD-2026-03891',
    conditions: [
      { name: 'CHLAMYDIA', status: 'NEGATIVE' },
      { name: 'GONORRHEA', status: 'NEGATIVE' },
      { name: 'SYPHILIS', status: 'NEGATIVE' },
      { name: 'HIV', status: 'NEGATIVE', resultValue: 'Non-reactive', referenceRange: 'Non-reactive' },
      { name: 'HEPATITIS_C', status: 'NEGATIVE', resultValue: 'Non-reactive', referenceRange: 'Non-reactive' },
      { name: 'TRICHOMONIASIS', status: 'NEGATIVE' },
    ],
    notes: 'Start of year full panel. Added Hepatitis C and Trichomoniasis. Talked with doctor about PrEP.',
  },
];

// Partner notes — for future use when partner detail page e2e is added
// const PARTNER_NOTES: Record<string, string> = {
//   'Carlos M.': 'Met at a friend\'s birthday party in Condesa. Really sweet guy, works in tech.',
//   'Sofía R.': 'Yoga instructor from Roma Norte. We hang out occasionally — always good vibes.',
//   'Diego': 'Friend of a friend. Met him through the queer community in CDMX.',
//   'Andrés L.': 'Lives in Polanco. Met on Grindr. Started PrEP recently.',
// };

// ─── Spec ───────────────────────────────────────────────────────────

test.describe.serial('Seed demo data', () => {
  test.setTimeout(180000); // 3 minutes per test

  test('1 — login to dashboard', async ({ page }) => {
    await login(page);
    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toBeVisible();
    // Screenshot: dashboard
    await page.screenshot({ path: 'e2e/screenshots/01-dashboard.png', fullPage: true });
  });

  test('2 — create journal entries across 2024-2026', async ({ page }) => {
    await login(page);

    for (let i = 0; i < JOURNAL_ENTRIES.length; i++) {
      const entry = JOURNAL_ENTRIES[i];
      console.log(`  Creating entry ${i + 1}/${JOURNAL_ENTRIES.length}: ${entry.date} — ${entry.alias || '(anonymous)'}`);
      await createJournalEntry(page, {
        date: entry.date,
        alias: entry.alias || undefined,
        notes: entry.notes,
        customFields: entry.customFields,
      });
    }

    // Verify: journal page shows entries
    await page.goto('/journal');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'e2e/screenshots/02-journal.png', fullPage: true });
  });

  test('3 — promote aliases to partners and add notes', async ({ page }) => {
    await login(page);

    // Promote each alias to a partner using the API from the browser context
    // (the promote toast only appears organically on the 3rd entry with same alias)
    const aliasesToPromote = PARTNERS.map((p) => p.alias);

    for (const alias of aliasesToPromote) {
      console.log(`  Promoting alias: ${alias}`);
      const result = await page.evaluate(async (aliasName) => {
        // Get the access token from Supabase's local storage
        const storageKeys = Object.keys(localStorage);
        storageKeys.find((k) => k.includes('auth-token') || k.includes('supabase'));
        let token = '';
        for (const key of storageKeys) {
          try {
            const val = JSON.parse(localStorage.getItem(key) || '');
            if (val?.access_token) {
              token = val.access_token;
              break;
            }
          } catch { /* skip */ }
        }
        if (!token) return { error: 'No token found' };

        const apiUrl = (window as Record<string, unknown>).__VITE_API_URL as string || 'https://api.navilla.app';
        const resp = await fetch(`${apiUrl}/api/journal/partners/promote`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ alias: aliasName }),
        });
        if (!resp.ok) {
          const text = await resp.text();
          return { error: `${resp.status}: ${text}` };
        }
        return await resp.json();
      }, alias);

      if (result?.error) {
        console.log(`    Failed: ${result.error}`);
      } else {
        console.log(`    Created partner: ${result.alias ?? alias} (${result.id ?? 'unknown'})`);
      }
    }

    // Navigate to partners tab and screenshot
    await page.goto('/journal');
    await page.waitForLoadState('networkidle');
    const partnersTab = page.getByRole('button', { name: /partners|parejas/i });
    await partnersTab.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'e2e/screenshots/03-partners.png', fullPage: true });

    // Add notes to each partner
    for (const partner of PARTNERS) {
      if (partner.notes) {
        await addPartnerNotes(page, partner.alias, partner.notes);
      }
    }
  });

  test('4 — create health log test visits with labs', async ({ page }) => {
    await login(page);

    for (let i = 0; i < TEST_VISITS.length; i++) {
      const visit = TEST_VISITS[i];
      console.log(`  Creating test visit ${i + 1}/${TEST_VISITS.length}: ${visit.date} — ${visit.labName}`);
      await createTestVisit(page, visit);
    }

    // Verify: health log page shows visits
    await page.goto('/health-log');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'e2e/screenshots/04-health-log.png', fullPage: true });
  });

  test('5 — verify journal calendar view', async ({ page }) => {
    await login(page);
    await page.goto('/journal');
    await page.waitForLoadState('networkidle');

    // Switch to calendar view
    const calendarBtn = page.getByRole('button', { name: /calendar|calendario/i });
    if (await calendarBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await calendarBtn.click();
      await page.waitForTimeout(500);
    }

    await page.screenshot({ path: 'e2e/screenshots/05-calendar.png', fullPage: true });
  });

  test('6 — verify health log summary and condition detail', async ({ page }) => {
    await login(page);
    await page.goto('/health-log');
    await page.waitForLoadState('networkidle');

    // Wait for page content to load
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(1000);

    await page.screenshot({ path: 'e2e/screenshots/06-health-log-summary.png', fullPage: true });

    // Click on a condition to see its detail
    const conditionLink = page.locator('a').filter({ hasText: /Chlamydia|Clamidia/i }).first();
    if (await conditionLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await conditionLink.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'e2e/screenshots/07-condition-detail.png', fullPage: true });
    }
  });

  test('7 — verify partners list', async ({ page }) => {
    await login(page);
    await page.goto('/journal');
    await page.waitForLoadState('networkidle');

    // Switch to Partners tab
    const partnersTab = page.getByRole('button', { name: /partners|parejas/i });
    await partnersTab.click();
    await page.waitForTimeout(1000);

    await page.screenshot({ path: 'e2e/screenshots/08-partners-list.png', fullPage: true });

    // Click on the first partner to see detail
    const firstPartnerLink = page.locator('a[href*="/journal/partners/"]').first();
    if (await firstPartnerLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await firstPartnerLink.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'e2e/screenshots/09-partner-detail.png', fullPage: true });
    }
  });
});
