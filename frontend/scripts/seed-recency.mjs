#!/usr/bin/env node
/**
 * Seed Recency Bucket Test Data
 *
 * Creates 5 test users connected to @migue1990, each with health statuses
 * at different dates to cover all 4 recency buckets.
 *
 * Uses Supabase Admin API + backend REST calls (no Playwright).
 *
 * Env vars:
 *   SUPABASE_URL          — e.g. https://xxx.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY — service role key
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node frontend/scripts/seed-recency.mjs
 */

const BASE_URL = 'https://api.navilla.app';
const PASSWORD = 'Test1234';
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// ─── Helpers ────────────────────────────────────────────────────────────────────

const log = (msg) => console.log(`[seed-recency] ${msg}`);

const daysAgo = (days) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
};

const daysAgoISO = (days) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
};

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

// ─── Supabase Admin helpers ─────────────────────────────────────────────────────

async function createUserViaAdmin(email) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SUPABASE_KEY}`,
      apikey: SUPABASE_KEY,
    },
    body: JSON.stringify({
      email,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { display_name: email.split('@')[0] },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    if (err.msg?.includes('already been registered')) {
      log(`  skip ${email} (already exists)`);
      return 'exists';
    }
    throw new Error(`Admin create failed for ${email}: ${JSON.stringify(err)}`);
  }
  log(`  created ${email}`);
  return 'created';
}

async function loginAndGetToken(email) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_KEY,
    },
    body: JSON.stringify({ email, password: PASSWORD }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Login failed for ${email}: ${JSON.stringify(err)}`);
  }
  const data = await res.json();
  return data.access_token;
}

// ─── Backend API helpers ────────────────────────────────────────────────────────

async function api(method, path, token, body = null) {
  const opts = {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(`${BASE_URL}/api${path}`, opts);
  const text = await res.text();

  if (!res.ok) {
    // 409 Conflict is fine for duplicate connections/statuses
    if (res.status === 409) {
      log(`  409 conflict on ${method} ${path} — skipping`);
      return null;
    }
    throw new Error(`API ${method} ${path} → ${res.status}: ${text}`);
  }
  return text ? JSON.parse(text) : null;
}

async function updateProfile(token, profile) {
  return api('PUT', '/users/me', token, profile);
}

async function optInToExposureNetwork(token) {
  return api('POST', '/reciprocity/opt-in', token);
}

async function sendConnectionRequest(token, identifier) {
  return api('POST', '/connections', token, { identifier });
}

async function getPendingIncoming(token) {
  return api('GET', '/connections/pending/incoming', token);
}

async function acceptConnection(token, connectionId) {
  return api('POST', `/connections/${connectionId}/accept`, token);
}

async function reportHealthStatus(token, condition, status, testDate) {
  return api('POST', '/health-status', token, { condition, status, testDate });
}

async function clearHealthStatus(token, statusId, clearedDate) {
  return api('POST', `/health-status/${statusId}/clear`, token,
    clearedDate ? { clearedDate } : null);
}

// ─── Supabase PostgREST: backdate reported_at ───────────────────────────────────

async function backdateReportedAt(statusId, isoDate) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/health_status?id=eq.${statusId}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SUPABASE_KEY}`,
        apikey: SUPABASE_KEY,
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({ reported_at: isoDate }),
    }
  );
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Backdate failed for ${statusId}: ${err}`);
  }
}

async function backdateClearedAt(statusId, isoDate) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/health_status?id=eq.${statusId}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SUPABASE_KEY}`,
        apikey: SUPABASE_KEY,
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({ cleared_at: isoDate }),
    }
  );
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Backdate cleared_at failed for ${statusId}: ${err}`);
  }
}

// ─── Test users ─────────────────────────────────────────────────────────────────

const TEST_USERS = [
  {
    email: 'user_recency_01@navilla.app',
    username: 'user_recency_01',
    displayName: 'Recency User 01',
    condition: 'CHLAMYDIA',
    status: 'positive',
    daysAgo: 10,      // → 0-30d bucket
    clear: false,
  },
  {
    email: 'user_recency_02@navilla.app',
    username: 'user_recency_02',
    displayName: 'Recency User 02',
    condition: 'GONORRHEA',
    status: 'positive',
    daysAgo: 60,      // → 31-90d bucket
    clear: false,
  },
  {
    email: 'user_recency_03@navilla.app',
    username: 'user_recency_03',
    displayName: 'Recency User 03',
    condition: 'SYPHILIS',
    status: 'positive',
    daysAgo: 200,     // → 91-365d bucket
    clear: false,
  },
  {
    email: 'user_recency_04@navilla.app',
    username: 'user_recency_04',
    displayName: 'Recency User 04',
    condition: 'HIV',
    status: 'positive',
    daysAgo: 400,     // → 365d+ bucket
    clear: false,
  },
  {
    email: 'user_recency_05@navilla.app',
    username: 'user_recency_05',
    displayName: 'Recency User 05',
    condition: 'CHLAMYDIA',
    status: 'positive',
    daysAgo: 15,      // reported 15 days ago, then cleared → resolved + recent
    clear: true,
  },
];

const MIGUE = { email: 'migue1990@gmail.com' };

// ─── Main ───────────────────────────────────────────────────────────────────────

async function main() {
  log('=== Phase 1: Create test users via Supabase Admin ===');
  for (const u of TEST_USERS) {
    await createUserViaAdmin(u.email);
  }

  log('');
  log('=== Phase 2: Login + update profile + opt into exposure network ===');
  const tokens = {};
  for (const u of TEST_USERS) {
    const token = await loginAndGetToken(u.email);
    tokens[u.email] = token;

    // PUT /api/users/me triggers user record creation (getOrCreate)
    await updateProfile(token, {
      username: u.username,
      firstName: u.displayName.split(' ')[0],
      lastName: u.displayName.split(' ').slice(1).join(' '),
      profileVisibility: 'PUBLIC',
      searchableByEmail: true,
      country: 'MX',
      location: 'CDMX',
    });
    log(`  profile updated: ${u.username}`);

    await optInToExposureNetwork(token);
    log(`  opted in: ${u.username}`);
    await delay(300);
  }

  log('');
  log('=== Phase 3: Each user sends connection request to @migue1990 ===');
  for (const u of TEST_USERS) {
    await sendConnectionRequest(tokens[u.email], MIGUE.email);
    log(`  ${u.username} → migue1990 request sent`);
    await delay(300);
  }

  log('');
  log('=== Phase 4: Login as migue1990 + accept all connections ===');
  const migueToken = await loginAndGetToken(MIGUE.email);

  // Ensure migue is opted in too
  await optInToExposureNetwork(migueToken).catch(() => {
    log('  migue1990 already opted in');
  });

  const pending = await getPendingIncoming(migueToken);
  log(`  found ${pending?.length ?? 0} pending incoming requests`);

  if (pending && pending.length > 0) {
    for (const conn of pending) {
      await acceptConnection(migueToken, conn.id);
      log(`  accepted connection ${conn.id}`);
      await delay(300);
    }
  }

  log('');
  log('=== Phase 5: Report health statuses + backdate reported_at ===');
  for (const u of TEST_USERS) {
    const token = tokens[u.email];
    const testDate = daysAgo(u.daysAgo);

    const result = await reportHealthStatus(token, u.condition, u.status, testDate);
    if (!result) {
      log(`  skipped health status for ${u.username} (already exists)`);
      continue;
    }

    log(`  ${u.username}: ${u.condition} ${u.status} (testDate: ${testDate})`);

    // Backdate reported_at so recency bucket computation works correctly
    const backdatedISO = daysAgoISO(u.daysAgo);
    await backdateReportedAt(result.id, backdatedISO);
    log(`  backdated reported_at → ${backdatedISO}`);

    // For user 5: clear the status (resolved) + backdate cleared_at
    if (u.clear) {
      const clearedDate = daysAgo(u.daysAgo - 5); // cleared 5 days after report
      await clearHealthStatus(token, result.id, clearedDate);
      // Backdate cleared_at to match
      const clearedISO = daysAgoISO(u.daysAgo - 5);
      await backdateClearedAt(result.id, clearedISO);
      log(`  cleared + backdated cleared_at → ${clearedISO}`);
    }

    await delay(300);
  }

  log('');
  log('=== Phase 6: Trigger exposure recompute ===');
  // Use migue's token (or any authenticated user)
  await api('POST', '/exposures/recompute', migueToken);
  log('  exposure recompute triggered');

  log('');
  log('=== Done! ===');
  log('Expected recency buckets for migue1990:');
  log('  user_recency_01: Chlamydia POSITIVE  →  0-30d bucket');
  log('  user_recency_02: Gonorrhea POSITIVE  → 31-90d bucket');
  log('  user_recency_03: Syphilis POSITIVE   → 91-365d bucket');
  log('  user_recency_04: HIV POSITIVE        → 365d+ bucket');
  log('  user_recency_05: Chlamydia CLEARED   → resolved + recent');
}

main().catch((err) => {
  console.error('[seed-recency] FATAL:', err.message);
  process.exit(1);
});
