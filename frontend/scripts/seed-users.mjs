#!/usr/bin/env node
/**
 * Seed Script — 5-phase runner for comprehensive demo data
 *
 * Usage:
 *   npm run seed:users                              # Full seed (all phases)
 *   npm run seed:users -- --phase=users             # Only create users
 *   npm run seed:users -- --phase=profiles          # Only update profiles
 *   npm run seed:users -- --phase=connections       # Only connections
 *   npm run seed:users -- --phase=health            # Only health reports
 *   npm run seed:users -- --phase=self-report       # Only migue1990 self-report
 *   npm run seed:users -- --headed                  # Show browser
 *   npm run seed:users -- --baseUrl=http://...      # Target URL
 *   npm run seed:users -- --supabase-url=...        # Supabase Admin API URL
 *   npm run seed:users -- --supabase-key=...        # Service role key
 *   npm run seed:users -- --skip-admin-create       # Skip admin API, use UI signup
 */

import { chromium } from '@playwright/test';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

import {
  USERS, DEFAULT_PASSWORD,
  buildConnectionPlan, buildProfilePlan, buildHealthPlan,
} from './seed-config.mjs';

import {
  log, delay,
  login, ensureLoggedOut, signup, loginSync,
  createUserViaAdmin,
  updateProfile,
  sendConnectionRequest, acceptFirstPending, acceptAllPending, denyFirstPending,
  reportHealth, clearLastHealth,
} from './seed-helpers.mjs';

// ─── CLI arg parsing ────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const getArg = (name, fallback) => {
  const prefix = `--${name}=`;
  const match = args.find((a) => a.startsWith(prefix));
  return match ? match.slice(prefix.length) : fallback;
};
const hasFlag = (name) => args.includes(`--${name}`);

const baseUrl      = getArg('baseUrl', process.env.SEED_BASE_URL || 'http://localhost:5173');
const password     = getArg('password', DEFAULT_PASSWORD);
const phase        = getArg('phase', 'all');
const supabaseUrl  = getArg('supabase-url', process.env.SUPABASE_URL || '');
const supabaseKey  = getArg('supabase-key', process.env.SUPABASE_SERVICE_ROLE_KEY || '');
const skipAdmin    = hasFlag('skip-admin-create');
const headed       = hasFlag('headed');

const validPhases = ['all', 'users', 'profiles', 'connections', 'health', 'self-report'];
if (!validPhases.includes(phase)) {
  console.error(`Invalid phase: ${phase}. Valid: ${validPhases.join(', ')}`);
  process.exit(1);
}

// ─── State file (resumability) ──────────────────────────────────────────────────

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATE_FILE = resolve(__dirname, '.seed-state.json');

function loadState() {
  if (!existsSync(STATE_FILE)) {
    return {
      usersCreated: [],
      profilesUpdated: [],
      connectionsSent: [],
      connectionsAccepted: [],
      connectionsDenied: [],
      healthReported: [],
    };
  }
  return JSON.parse(readFileSync(STATE_FILE, 'utf-8'));
}

function saveState(state) {
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

// ─── Phase 1: Create Users ─────────────────────────────────────────────────────

async function phaseUsers(browser, state) {
  log('═══ Phase 1: Create Users ═══');
  const page = await browser.newPage();
  const useAdmin = supabaseUrl && supabaseKey && !skipAdmin;

  for (let i = 0; i < USERS.length; i++) {
    const user = USERS[i];
    if (state.usersCreated.includes(user.email)) {
      log(`  skip ${user.email} (already created)`);
      continue;
    }

    try {
      if (useAdmin) {
        // Create via Admin API, then login-sync to create public.users record
        await createUserViaAdmin(supabaseUrl, supabaseKey, user, password);
        await loginSync(page, baseUrl, user, password);
      } else {
        // Full UI signup
        await signup(page, baseUrl, user, password);
      }

      state.usersCreated.push(user.email);
      saveState(state);
      log(`  [${i + 1}/${USERS.length}] ${user.email} done`);
    } catch (err) {
      // Check if "already registered" in the error
      if (err.message?.includes('already') || err.message?.includes('registered')) {
        log(`  skip ${user.email} (already registered)`);
        state.usersCreated.push(user.email);
        saveState(state);
        continue;
      }
      log(`  ERROR creating ${user.email}: ${err.message}`);
      // Try to continue with next user
    }

    await ensureLoggedOut(page, baseUrl);
    await delay(200);
  }

  await page.close();
  log(`Phase 1 complete: ${state.usersCreated.length}/${USERS.length} users`);
}

// ─── Phase 2: Update Profiles ───────────────────────────────────────────────────

async function phaseProfiles(browser, state) {
  log('═══ Phase 2: Update Profiles ═══');
  const page = await browser.newPage();
  const profilePlan = buildProfilePlan();

  for (let i = 0; i < USERS.length; i++) {
    const user = USERS[i];
    if (state.profilesUpdated.includes(user.email)) {
      log(`  skip ${user.email} profile (already updated)`);
      continue;
    }

    const opts = profilePlan.get(i) || { visibility: 'PRIVATE', displayNamePublic: false, searchableByEmail: false };

    try {
      await login(page, baseUrl, user.email, password);
      await updateProfile(page, baseUrl, user, opts);
      await ensureLoggedOut(page, baseUrl);

      state.profilesUpdated.push(user.email);
      saveState(state);
      log(`  [${i + 1}/${USERS.length}] ${user.email} → ${opts.visibility}`);
    } catch (err) {
      log(`  ERROR updating profile ${user.email}: ${err.message}`);
    }

    await delay(200);
  }

  await page.close();
  log(`Phase 2 complete: ${state.profilesUpdated.length}/${USERS.length} profiles`);
}

// ─── Phase 3: Create Connections ────────────────────────────────────────────────

async function phaseConnections(browser, state) {
  log('═══ Phase 3: Create Connections ═══');
  const page = await browser.newPage();
  const connPlan = buildConnectionPlan();

  // Key for dedup
  const sentKey = (from, to) => `${from}:${to}`;
  const sentSet = new Set(state.connectionsSent.map(([f, t]) => sentKey(f, t)));
  const acceptedSet = new Set(state.connectionsAccepted.map(([f, t]) => sentKey(f, t)));
  const deniedSet = new Set(state.connectionsDenied.map(([f, t]) => sentKey(f, t)));

  for (let ci = 0; ci < connPlan.length; ci++) {
    const [senderIdx, receiverIdx, action] = connPlan[ci];
    const sender = USERS[senderIdx];
    const receiver = USERS[receiverIdx];
    const key = sentKey(sender.email, receiver.email);

    // Phase 3a-d: CONFIRM = send + accept
    if (action === 'confirm') {
      // Send
      if (!sentSet.has(key)) {
        try {
          await login(page, baseUrl, sender.email, password);
          await sendConnectionRequest(page, baseUrl, receiver.email);
          await ensureLoggedOut(page, baseUrl);

          state.connectionsSent.push([sender.email, receiver.email]);
          sentSet.add(key);
          saveState(state);
          log(`  [${ci + 1}/${connPlan.length}] sent ${sender.email} → ${receiver.email}`);
        } catch (err) {
          log(`  ERROR send ${sender.email} → ${receiver.email}: ${err.message}`);
          continue;
        }
        await delay(200);
      }

      // Accept
      if (!acceptedSet.has(key)) {
        try {
          await login(page, baseUrl, receiver.email, password);
          await acceptFirstPending(page, baseUrl);
          await ensureLoggedOut(page, baseUrl);

          state.connectionsAccepted.push([sender.email, receiver.email]);
          acceptedSet.add(key);
          saveState(state);
          log(`  [${ci + 1}/${connPlan.length}] accepted ${receiver.email} ← ${sender.email}`);
        } catch (err) {
          log(`  ERROR accept ${receiver.email} ← ${sender.email}: ${err.message}`);
        }
        await delay(200);
      }
    }

    // Phase 3e-f: PENDING = send only (don't accept)
    if (action === 'pending') {
      if (!sentSet.has(key)) {
        try {
          await login(page, baseUrl, sender.email, password);
          await sendConnectionRequest(page, baseUrl, receiver.email);
          await ensureLoggedOut(page, baseUrl);

          state.connectionsSent.push([sender.email, receiver.email]);
          sentSet.add(key);
          saveState(state);
          log(`  [${ci + 1}/${connPlan.length}] pending ${sender.email} → ${receiver.email}`);
        } catch (err) {
          log(`  ERROR pending ${sender.email} → ${receiver.email}: ${err.message}`);
        }
        await delay(200);
      }
    }

    // Phase 3g: DENY = send then deny
    if (action === 'deny') {
      if (!sentSet.has(key)) {
        try {
          await login(page, baseUrl, sender.email, password);
          await sendConnectionRequest(page, baseUrl, receiver.email);
          await ensureLoggedOut(page, baseUrl);

          state.connectionsSent.push([sender.email, receiver.email]);
          sentSet.add(key);
          saveState(state);
          log(`  [${ci + 1}/${connPlan.length}] sent (to deny) ${sender.email} → ${receiver.email}`);
        } catch (err) {
          log(`  ERROR send-to-deny ${sender.email} → ${receiver.email}: ${err.message}`);
          continue;
        }
        await delay(200);
      }

      if (!deniedSet.has(key)) {
        try {
          await login(page, baseUrl, receiver.email, password);
          await denyFirstPending(page, baseUrl);
          await ensureLoggedOut(page, baseUrl);

          state.connectionsDenied.push([sender.email, receiver.email]);
          deniedSet.add(key);
          saveState(state);
          log(`  [${ci + 1}/${connPlan.length}] denied ${receiver.email} ← ${sender.email}`);
        } catch (err) {
          log(`  ERROR deny ${receiver.email} ← ${sender.email}: ${err.message}`);
        }
        await delay(200);
      }
    }
  }

  await page.close();
  log(`Phase 3 complete: ${state.connectionsSent.length} sent, ${state.connectionsAccepted.length} accepted, ${state.connectionsDenied.length} denied`);
}

// ─── Phase 4: Report Health ─────────────────────────────────────────────────────

async function phaseHealth(browser, state) {
  log('═══ Phase 4: Report Health ═══');
  const page = await browser.newPage();
  const healthPlan = buildHealthPlan();

  // Filter out migue1990 self-report (handled in phase 5)
  const otherHealth = healthPlan.filter((h) => h.userIndex !== 0);

  const reportedKey = (email, condition) => `${email}:${condition}`;
  const reportedSet = new Set(state.healthReported.map(([e, c]) => reportedKey(e, c)));

  for (let hi = 0; hi < otherHealth.length; hi++) {
    const h = otherHealth[hi];
    const user = USERS[h.userIndex];
    const key = reportedKey(user.email, h.condition);

    if (reportedSet.has(key)) {
      log(`  skip ${user.email} ${h.condition} (already reported)`);
      continue;
    }

    try {
      await login(page, baseUrl, user.email, password);
      await reportHealth(page, baseUrl, h.condition, h.status, h.date);

      // If condition should be cleared, clear it
      if (h.cleared) {
        await clearLastHealth(page, baseUrl);
        log(`  [${hi + 1}/${otherHealth.length}] ${user.email} ${h.condition} (cleared)`);
      } else {
        log(`  [${hi + 1}/${otherHealth.length}] ${user.email} ${h.condition} ${h.status}`);
      }

      await ensureLoggedOut(page, baseUrl);

      state.healthReported.push([user.email, h.condition]);
      reportedSet.add(key);
      saveState(state);
    } catch (err) {
      log(`  ERROR health ${user.email} ${h.condition}: ${err.message}`);
    }

    await delay(200);
  }

  await page.close();
  log(`Phase 4 complete: ${state.healthReported.length} health records`);
}

// ─── Phase 5: Self-Report (migue1990) ───────────────────────────────────────────

async function phaseSelfReport(browser, state) {
  log('═══ Phase 5: Self-Report (migue1990) ═══');
  const page = await browser.newPage();
  const healthPlan = buildHealthPlan();
  const selfReport = healthPlan.find((h) => h.userIndex === 0);

  if (!selfReport) {
    log('  No self-report configured, skipping');
    await page.close();
    return;
  }

  const key = `${USERS[0].email}:${selfReport.condition}`;
  const reportedSet = new Set(state.healthReported.map(([e, c]) => `${e}:${c}`));

  if (reportedSet.has(key)) {
    log('  skip migue1990 self-report (already done)');
    await page.close();
    return;
  }

  try {
    await login(page, baseUrl, USERS[0].email, password);
    await reportHealth(page, baseUrl, selfReport.condition, selfReport.status, selfReport.date);
    await ensureLoggedOut(page, baseUrl);

    state.healthReported.push([USERS[0].email, selfReport.condition]);
    saveState(state);
    log(`  migue1990 self-reported ${selfReport.condition} ${selfReport.status}`);
  } catch (err) {
    log(`  ERROR self-report: ${err.message}`);
  }

  await page.close();
  log('Phase 5 complete');
}

// ─── Main runner ────────────────────────────────────────────────────────────────

async function run() {
  log(`Base URL: ${baseUrl}`);
  log(`Total users: ${USERS.length}`);
  log(`Phase: ${phase}`);
  log(`Headed: ${headed}`);
  if (supabaseUrl && !skipAdmin) log(`Supabase Admin API: ${supabaseUrl}`);

  const state = loadState();
  const browser = await chromium.launch({ headless: !headed });

  try {
    const phases = phase === 'all'
      ? ['users', 'profiles', 'connections', 'health', 'self-report']
      : [phase];

    for (const p of phases) {
      switch (p) {
        case 'users':       await phaseUsers(browser, state); break;
        case 'profiles':    await phaseProfiles(browser, state); break;
        case 'connections': await phaseConnections(browser, state); break;
        case 'health':      await phaseHealth(browser, state); break;
        case 'self-report': await phaseSelfReport(browser, state); break;
      }
    }

    log('═══ Seed Complete ═══');
    log(`Users: ${state.usersCreated.length}`);
    log(`Profiles: ${state.profilesUpdated.length}`);
    log(`Connections sent: ${state.connectionsSent.length}`);
    log(`Connections accepted: ${state.connectionsAccepted.length}`);
    log(`Connections denied: ${state.connectionsDenied.length}`);
    log(`Health records: ${state.healthReported.length}`);
    log('Login as migue1990@gmail.com to verify the demo data.');
  } finally {
    await browser.close();
  }
}

run().catch((err) => {
  console.error('[seed] Fatal error:', err);
  process.exit(1);
});
