#!/usr/bin/env node
/**
 * Seed Large Network — Sex Worker Simulation
 *
 * Creates a realistic, dense network around @migue1990:
 *   - 30 direct connections (1st degree)
 *   - 50 second-degree connections (partners of partners)
 *   - 25 third-degree connections
 *   - Health statuses spread across conditions, recency buckets, and degrees
 *
 * Uses Supabase Admin API + backend REST (no Playwright).
 *
 * Env vars:
 *   SUPABASE_URL              — e.g. https://xxx.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY — service role key
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node frontend/scripts/seed-network.mjs
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

const log = (msg) => console.log(`[seed-network] ${msg}`);

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

// Names for realistic-looking users (Mexican context)
const FIRST_NAMES = [
  'Carlos', 'Andrés', 'Diego', 'Sofía', 'Valentina', 'Mateo', 'Emilia',
  'Santiago', 'Camila', 'Daniel', 'Lucía', 'Tomás', 'Renata', 'Pablo',
  'Isabela', 'Javier', 'Regina', 'Alejandro', 'Mariana', 'Gabriel',
  'Natalia', 'Fernando', 'Ximena', 'Rafael', 'Daniela', 'Eduardo',
  'Paola', 'Iván', 'Andrea', 'Héctor', 'Fernanda', 'Sergio', 'Karla',
  'Rodrigo', 'Mónica', 'Arturo', 'Laura', 'Óscar', 'Claudia', 'Ricardo',
  'Patricia', 'Luis', 'Carmen', 'Miguel', 'Ana', 'Roberto', 'Diana',
  'Jorge', 'Rosa', 'Manuel', 'Teresa', 'Francisco', 'Gloria', 'Enrique',
  'Adriana', 'Gustavo', 'Verónica', 'Raúl', 'Leticia', 'César',
  'Silvia', 'Alberto', 'Martha', 'Alfredo', 'Julieta', 'Ignacio',
  'Yolanda', 'Víctor', 'Elisa', 'Hugo', 'Lorena', 'Marco', 'Alma',
  'Ramón', 'Brenda', 'Guillermo', 'Cecilia', 'Armando', 'Irene',
  'Ernesto', 'Beatriz', 'Rubén', 'Catalina', 'Saúl', 'Alicia',
  'Octavio', 'Rocío', 'Salvador', 'Estela', 'Gerardo', 'Liliana',
  'Mauricio', 'Nora', 'Aurelio', 'Elvira', 'Adrián', 'Graciela',
  'Esteban', 'Pilar', 'René', 'Soledad', 'Wilfredo', 'Dolores',
  'Fabian', 'Josefina',
];

const LOCATIONS = ['CDMX', 'Guadalajara', 'Monterrey', 'Puebla', 'Querétaro', 'Cancún', 'Tijuana', 'Mérida'];

const CONDITIONS = [
  'CHLAMYDIA', 'GONORRHEA', 'SYPHILIS', 'HIV', 'HSV1', 'HSV2',
  'HPV', 'HEPATITIS_B', 'HEPATITIS_C', 'TRICHOMONIASIS',
];

// ─── User generation ────────────────────────────────────────────────────────────

function generateUsers(prefix, count, startIdx = 0) {
  return Array.from({ length: count }, (_, i) => {
    const idx = startIdx + i;
    const name = FIRST_NAMES[idx % FIRST_NAMES.length];
    return {
      email: `${prefix}_${String(idx + 1).padStart(3, '0')}@navilla.app`,
      username: `${prefix}_${String(idx + 1).padStart(3, '0')}`,
      firstName: name,
      lastName: String.fromCharCode(65 + (idx % 26)) + '.',
      location: LOCATIONS[idx % LOCATIONS.length],
    };
  });
}

// 30 direct connections to migue1990
const TIER1 = generateUsers('net_t1', 30, 0);

// 50 second-degree users (connected to tier1, not to migue)
const TIER2 = generateUsers('net_t2', 50, 30);

// 25 third-degree users (connected to tier2, not to tier1 or migue)
const TIER3 = generateUsers('net_t3', 25, 80);

const ALL_USERS = [...TIER1, ...TIER2, ...TIER3];

// ─── Connection topology ────────────────────────────────────────────────────────
// Each tier1 user connects to 2-4 tier2 users (partners of partners)
// Each tier2 user connects to 1-2 tier3 users

function buildConnections() {
  const edges = [];

  // Tier1 → Tier2 connections (each tier1 has 2-4 tier2 partners)
  let t2idx = 0;
  for (let i = 0; i < TIER1.length; i++) {
    const partnerCount = 2 + (i % 3); // 2, 3, or 4
    for (let j = 0; j < partnerCount && t2idx < TIER2.length; j++) {
      edges.push({ from: TIER1[i], to: TIER2[t2idx] });
      t2idx++;
      if (t2idx >= TIER2.length) t2idx = 0; // wrap around for extra edges
    }
  }

  // Some tier2 cross-connections (partners who share other partners)
  for (let i = 0; i < 10; i++) {
    const a = TIER2[i];
    const b = TIER2[TIER2.length - 1 - i];
    if (a.email !== b.email) edges.push({ from: a, to: b });
  }

  // Tier2 → Tier3 connections
  let t3idx = 0;
  for (let i = 0; i < TIER2.length; i++) {
    if (i % 2 === 0 && t3idx < TIER3.length) {
      edges.push({ from: TIER2[i], to: TIER3[t3idx] });
      t3idx++;
    }
  }

  return edges;
}

// ─── Health status assignments ──────────────────────────────────────────────────
// Spread conditions across degrees and recency buckets for maximum permutation

const HEALTH_ASSIGNMENTS = [
  // === 1st DEGREE (direct connections) — high urgency ===
  // Recent active — should be amber/high priority
  { userIdx: 0, tier: 1, condition: 'CHLAMYDIA', daysAgo: 5, clear: false },
  { userIdx: 1, tier: 1, condition: 'GONORRHEA', daysAgo: 8, clear: false },
  { userIdx: 2, tier: 1, condition: 'SYPHILIS', daysAgo: 12, clear: false },
  { userIdx: 3, tier: 1, condition: 'HPV', daysAgo: 20, clear: false },
  { userIdx: 4, tier: 1, condition: 'CHLAMYDIA', daysAgo: 3, clear: false },  // 2nd chlamydia case
  { userIdx: 5, tier: 1, condition: 'HSV2', daysAgo: 25, clear: false },

  // 1st degree, medium recency (31-90d)
  { userIdx: 6, tier: 1, condition: 'GONORRHEA', daysAgo: 45, clear: false },
  { userIdx: 7, tier: 1, condition: 'TRICHOMONIASIS', daysAgo: 60, clear: false },
  { userIdx: 8, tier: 1, condition: 'CHLAMYDIA', daysAgo: 75, clear: false },  // 3rd chlamydia case

  // 1st degree, older (91-365d)
  { userIdx: 9, tier: 1, condition: 'HIV', daysAgo: 120, clear: false },
  { userIdx: 10, tier: 1, condition: 'HEPATITIS_B', daysAgo: 200, clear: false },

  // 1st degree, resolved
  { userIdx: 11, tier: 1, condition: 'CHLAMYDIA', daysAgo: 40, clear: true },
  { userIdx: 12, tier: 1, condition: 'GONORRHEA', daysAgo: 90, clear: true },
  { userIdx: 13, tier: 1, condition: 'SYPHILIS', daysAgo: 180, clear: true },

  // 1st degree, very old
  { userIdx: 14, tier: 1, condition: 'HSV1', daysAgo: 400, clear: false },

  // === 2nd DEGREE — medium urgency ===
  // Recent
  { userIdx: 0, tier: 2, condition: 'CHLAMYDIA', daysAgo: 7, clear: false },
  { userIdx: 1, tier: 2, condition: 'GONORRHEA', daysAgo: 14, clear: false },
  { userIdx: 2, tier: 2, condition: 'HIV', daysAgo: 10, clear: false },
  { userIdx: 3, tier: 2, condition: 'SYPHILIS', daysAgo: 18, clear: false },
  { userIdx: 4, tier: 2, condition: 'HPV', daysAgo: 22, clear: false },

  // 2nd degree, medium recency
  { userIdx: 5, tier: 2, condition: 'HSV2', daysAgo: 50, clear: false },
  { userIdx: 6, tier: 2, condition: 'TRICHOMONIASIS', daysAgo: 55, clear: false },
  { userIdx: 7, tier: 2, condition: 'CHLAMYDIA', daysAgo: 65, clear: false },
  { userIdx: 8, tier: 2, condition: 'HEPATITIS_C', daysAgo: 70, clear: false },
  { userIdx: 9, tier: 2, condition: 'GONORRHEA', daysAgo: 80, clear: false },

  // 2nd degree, older
  { userIdx: 10, tier: 2, condition: 'SYPHILIS', daysAgo: 150, clear: false },
  { userIdx: 11, tier: 2, condition: 'HIV', daysAgo: 250, clear: false },
  { userIdx: 12, tier: 2, condition: 'HEPATITIS_B', daysAgo: 300, clear: false },

  // 2nd degree, resolved
  { userIdx: 13, tier: 2, condition: 'CHLAMYDIA', daysAgo: 30, clear: true },
  { userIdx: 14, tier: 2, condition: 'GONORRHEA', daysAgo: 100, clear: true },
  { userIdx: 15, tier: 2, condition: 'SYPHILIS', daysAgo: 60, clear: true },

  // 2nd degree, very old
  { userIdx: 16, tier: 2, condition: 'HSV1', daysAgo: 500, clear: false },
  { userIdx: 17, tier: 2, condition: 'HPV', daysAgo: 450, clear: false },

  // === 3rd DEGREE — lower urgency ===
  { userIdx: 0, tier: 3, condition: 'CHLAMYDIA', daysAgo: 15, clear: false },
  { userIdx: 1, tier: 3, condition: 'GONORRHEA', daysAgo: 30, clear: false },
  { userIdx: 2, tier: 3, condition: 'HIV', daysAgo: 60, clear: false },
  { userIdx: 3, tier: 3, condition: 'SYPHILIS', daysAgo: 100, clear: false },
  { userIdx: 4, tier: 3, condition: 'HPV', daysAgo: 200, clear: false },
  { userIdx: 5, tier: 3, condition: 'HSV2', daysAgo: 350, clear: false },
  { userIdx: 6, tier: 3, condition: 'HEPATITIS_B', daysAgo: 400, clear: false },
  { userIdx: 7, tier: 3, condition: 'TRICHOMONIASIS', daysAgo: 20, clear: false },

  // 3rd degree, resolved
  { userIdx: 8, tier: 3, condition: 'CHLAMYDIA', daysAgo: 45, clear: true },
  { userIdx: 9, tier: 3, condition: 'GONORRHEA', daysAgo: 90, clear: true },
];

// ─── Supabase Admin helpers ─────────────────────────────────────────────────────

async function createUserViaAdmin(email, displayName) {
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
      user_metadata: { display_name: displayName },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    if (err.msg?.includes('already been registered')) {
      return 'exists';
    }
    throw new Error(`Admin create failed for ${email}: ${JSON.stringify(err)}`);
  }
  return 'created';
}

async function loginAndGetToken(email, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_KEY,
      },
      body: JSON.stringify({ email, password: PASSWORD }),
    });

    if (res.ok) {
      const data = await res.json();
      return data.access_token;
    }

    const err = await res.json().catch(() => ({}));
    if (res.status === 429 && attempt < retries) {
      const wait = attempt * 3000; // 3s, 6s, 9s
      log(`  rate-limited on ${email}, retry in ${wait / 1000}s...`);
      await delay(wait);
      continue;
    }
    throw new Error(`Login failed for ${email}: ${JSON.stringify(err)}`);
  }
}

// ─── Backend API helpers ────────────────────────────────────────────────────────

async function apiCall(method, path, token, body = null) {
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
    if (res.status === 409) return null; // conflict = already exists
    if (res.status === 400 && text.includes('already')) return null;
    throw new Error(`API ${method} ${path} → ${res.status}: ${text}`);
  }
  return text ? JSON.parse(text) : null;
}

async function updateProfile(token, profile) {
  return apiCall('PUT', '/users/me', token, profile);
}

async function optIn(token) {
  return apiCall('POST', '/reciprocity/opt-in', token);
}

async function sendConnectionRequest(token, identifier) {
  return apiCall('POST', '/connections', token, { identifier });
}

async function getPendingIncoming(token) {
  return apiCall('GET', '/connections/pending/incoming', token);
}

async function acceptConnection(token, connectionId) {
  return apiCall('POST', `/connections/${connectionId}/accept`, token);
}

async function reportHealth(token, condition, status, testDate) {
  return apiCall('POST', '/health-status', token, { condition, status, testDate });
}

async function clearHealth(token, statusId, clearedDate) {
  return apiCall('POST', `/health-status/${statusId}/clear`, token,
    clearedDate ? { clearedDate } : null);
}

// ─── Supabase PostgREST: backdate timestamps ─────────────────────────────────

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
    throw new Error(`Backdate reported_at failed for ${statusId}: ${err}`);
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

// ─── Main ───────────────────────────────────────────────────────────────────────

const MIGUE = { email: 'migue1990@gmail.com' };

async function main() {
  const startTime = Date.now();

  // ── Phase 1: Create all users ──
  log('=== Phase 1: Create 105 users via Supabase Admin ===');
  let created = 0, skipped = 0;
  for (const u of ALL_USERS) {
    const result = await createUserViaAdmin(u.email, `${u.firstName} ${u.lastName}`);
    if (result === 'created') created++;
    else skipped++;
  }
  log(`  ${created} created, ${skipped} already existed`);

  // ── Phase 2: Login + profile + opt-in (sequential to avoid rate limits) ──
  log('');
  log('=== Phase 2: Login + profile + opt-in ===');
  const tokens = {};
  let setupOk = 0;

  for (let i = 0; i < ALL_USERS.length; i++) {
    const u = ALL_USERS[i];
    try {
      const token = await loginAndGetToken(u.email);
      tokens[u.email] = token;

      await updateProfile(token, {
        username: u.username,
        firstName: u.firstName,
        lastName: u.lastName,
        profileVisibility: 'PUBLIC',
        searchableByEmail: true,
        country: 'MX',
        location: u.location,
      });

      await optIn(token).catch(() => {});
      setupOk++;
      if ((setupOk % 20) === 0) log(`  ${setupOk}/${ALL_USERS.length} users set up`);
    } catch (err) {
      log(`  WARN: ${u.email}: ${err.message}`);
    }
    await delay(1200); // 1.2s between logins to stay under rate limit
  }
  log(`  total: ${setupOk}/${ALL_USERS.length} users set up`);

  // ── Phase 3: Tier1 → migue1990 connections ──
  log('');
  log('=== Phase 3: 30 direct connections to migue1990 ===');

  for (const u of TIER1) {
    if (!tokens[u.email]) continue;
    try {
      await sendConnectionRequest(tokens[u.email], MIGUE.email);
    } catch (err) {
      if (!err.message.includes('409')) log(`  WARN: ${u.username} → migue: ${err.message}`);
    }
    await delay(200);
  }

  // Accept all as migue
  const migueToken = await loginAndGetToken(MIGUE.email);
  await optIn(migueToken).catch(() => {});

  const pending = await getPendingIncoming(migueToken);
  log(`  migue has ${pending?.length ?? 0} pending — accepting...`);
  for (const conn of (pending ?? [])) {
    await acceptConnection(migueToken, conn.id);
    await delay(150);
  }
  log(`  ${pending?.length ?? 0} connections confirmed`);

  // ── Phase 4: Tier1 ↔ Tier2 and Tier2 ↔ Tier3 connections ──
  log('');
  log('=== Phase 4: 2nd + 3rd degree connections ===');

  const edges = buildConnections();
  let edgeOk = 0, edgeFail = 0;

  for (const edge of edges) {
    if (!tokens[edge.from.email] || !tokens[edge.to.email]) {
      edgeFail++;
      continue;
    }

    try {
      await sendConnectionRequest(tokens[edge.from.email], edge.to.email);
    } catch {
      // ignore conflicts
    }
    await delay(100);
  }

  // Now each "to" user accepts incoming
  log('  accepting 2nd/3rd degree connections...');
  const acceptedUsers = new Set();
  for (const edge of edges) {
    if (acceptedUsers.has(edge.to.email)) continue;
    if (!tokens[edge.to.email]) continue;
    acceptedUsers.add(edge.to.email);

    try {
      const inc = await getPendingIncoming(tokens[edge.to.email]);
      for (const conn of (inc ?? [])) {
        await acceptConnection(tokens[edge.to.email], conn.id);
        edgeOk++;
        await delay(100);
      }
    } catch (err) {
      log(`  WARN accept for ${edge.to.username}: ${err.message}`);
    }
  }
  log(`  ${edgeOk} 2nd/3rd degree connections confirmed`);

  // ── Phase 5: Report health statuses with backdated timestamps ──
  log('');
  log('=== Phase 5: Health statuses (40 assignments) ===');

  const tierArrays = { 1: TIER1, 2: TIER2, 3: TIER3 };
  let healthOk = 0;

  for (const ha of HEALTH_ASSIGNMENTS) {
    const user = tierArrays[ha.tier][ha.userIdx];
    if (!user || !tokens[user.email]) {
      log(`  skip: tier${ha.tier}[${ha.userIdx}] — no token`);
      continue;
    }

    const token = tokens[user.email];
    const testDate = daysAgo(ha.daysAgo);

    try {
      const result = await reportHealth(token, ha.condition, 'positive', testDate);
      if (!result) {
        log(`  skip ${user.username} ${ha.condition} (duplicate)`);
        continue;
      }

      // Backdate reported_at
      await backdateReportedAt(result.id, daysAgoISO(ha.daysAgo));

      if (ha.clear) {
        const clearedDate = daysAgo(ha.daysAgo - 7);
        await clearHealth(token, result.id, clearedDate);
        await backdateClearedAt(result.id, daysAgoISO(ha.daysAgo - 7));
      }

      healthOk++;
      const label = ha.clear ? 'CLEARED' : 'ACTIVE';
      log(`  ${user.username}: ${ha.condition} ${label} (${ha.daysAgo}d ago) — tier ${ha.tier}`);
    } catch (err) {
      log(`  WARN ${user.username} ${ha.condition}: ${err.message}`);
    }
    await delay(200);
  }
  log(`  ${healthOk} health statuses created`);

  // ── Phase 6: Trigger exposure recompute ──
  log('');
  log('=== Phase 6: Trigger exposure recompute ===');
  await apiCall('POST', '/exposures/recompute', migueToken);
  log('  exposure snapshot recomputed');

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  log('');
  log(`=== Done in ${elapsed}s ===`);
  log('');
  log('Network summary for migue1990:');
  log(`  1st degree: ${TIER1.length} direct connections`);
  log(`  2nd degree: ${TIER2.length} users`);
  log(`  3rd degree: ${TIER3.length} users`);
  log(`  Total network: ${ALL_USERS.length + 1} nodes`);
  log('');
  log('Expected exposure permutations:');
  log('  HIGH priority (amber): Chlamydia (3+ cases, 1st degree, recent)');
  log('  HIGH priority (amber): Gonorrhea (2 cases, 1st degree, recent)');
  log('  HIGH priority (amber): Syphilis (1st degree, recent active)');
  log('  HIGH priority (amber): HPV (1st degree, recent)');
  log('  MEDIUM priority (indigo): HSV-2, Trichomoniasis, HIV');
  log('  LOW priority (stone): HSV-1, Hepatitis B/C (old, distant)');
}

main().catch((err) => {
  console.error('[seed-network] FATAL:', err.message);
  process.exit(1);
});
