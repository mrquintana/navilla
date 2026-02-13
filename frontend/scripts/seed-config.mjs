/**
 * Seed Configuration — user definitions, network topology, health assignments
 *
 * Supports --size=N flag (default 131, minimum 20).
 * Topology scales proportionally.
 */

// ─── Password ──────────────────────────────────────────────────────────────────
export const DEFAULT_PASSWORD = 'Test1234';

// ─── Size from CLI ─────────────────────────────────────────────────────────────
const sizeArg = process.argv.find((a) => a.startsWith('--size='));
const requestedSize = sizeArg ? parseInt(sizeArg.split('=')[1], 10) : 131;
export const TOTAL_USERS = Math.max(20, requestedSize);

// ─── Name / location pools ─────────────────────────────────────────────────────
const firstNames = [
  'Miguel','Ana','Carlos','Sofia','Diego','Lucia','Pedro','Maria','Jose',
  'Valeria','Javier','Camila','Andres','Elena','Marco','Daniela','Rafael',
  'Isabel','Luis','Paula',
];
const lastNames = [
  'Ramirez','Lopez','Hernandez','Garcia','Martinez','Gomez','Diaz','Sanchez',
  'Torres','Vargas','Castillo','Ruiz','Mendoza','Morales','Ortega','Navarro',
  'Flores','Delgado','Reyes','Cruz',
];
const locations = [
  'CDMX','Guadalajara','Monterrey','Bogota','Medellin','Lima','Buenos Aires',
  'Madrid','Barcelona','Miami','Austin','Los Angeles','San Diego',
];
const countries = ['MX','CO','PE','AR','ES','US','CL','EC'];
const sexes = ['male','female','other'];

// ─── Helpers ────────────────────────────────────────────────────────────────────
const makeDob = (age) => {
  const today = new Date();
  const year = today.getFullYear() - age;
  const month = String(1 + (age % 12)).padStart(2, '0');
  const day = String(1 + (age % 28)).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const pad3 = (n) => String(n).padStart(3, '0');

// ─── User factory ───────────────────────────────────────────────────────────────
const makeUser = (index) => {
  if (index === 0) {
    return {
      email: 'migue1990@gmail.com',
      username: 'migue1990',
      fullName: 'Miguel Ramos',
      displayName: 'Migue',
      dob: '1990-05-12',
      sex: 'male',
      country: 'MX',
      location: 'Guadalajara',
    };
  }
  const n = pad3(index);
  const first = firstNames[index % firstNames.length];
  const last = lastNames[index % lastNames.length];
  const age = 22 + (index % 22);
  return {
    email: `user${n}@navilla.app`,
    username: `user${n}`,
    fullName: `${first} ${last}`,
    displayName: `${first} ${last.charAt(0)}.`,
    dob: makeDob(age),
    sex: sexes[index % sexes.length],
    country: countries[index % countries.length],
    location: locations[index % locations.length],
  };
};

// ─── All users ──────────────────────────────────────────────────────────────────
export const USERS = Array.from({ length: TOTAL_USERS }, (_, i) => makeUser(i));

// ─── Tier assignments — scale with TOTAL_USERS ─────────────────────────────────
//
// Layout (proportional):
//   index 0          = migue1990
//   tier 1           = ~20% direct confirmed
//   tier 2           = ~40% second-degree
//   tier 3           = ~15% third-degree
//   tier 4           = ~7%  fourth-degree (only if size >= 80)
//   tier 5           = ~3%  fifth-degree  (only if size >= 100)
//   pending-in       = 3-5
//   pending-out      = 2-3
//   denied           = 1-2
//
// We reserve the last 6-10 slots for pending/denied, then distribute the rest.

const PENDING_IN_COUNT  = Math.min(5, Math.max(2, Math.floor(TOTAL_USERS * 0.04)));
const PENDING_OUT_COUNT = Math.min(3, Math.max(1, Math.floor(TOTAL_USERS * 0.025)));
const DENIED_COUNT      = Math.min(2, Math.max(1, Math.floor(TOTAL_USERS * 0.015)));
const SPECIAL_COUNT     = PENDING_IN_COUNT + PENDING_OUT_COUNT + DENIED_COUNT;
const NETWORK_COUNT     = TOTAL_USERS - 1 - SPECIAL_COUNT; // exclude migue1990 + specials

const t1Count = Math.max(3, Math.round(NETWORK_COUNT * 0.20));
const t2Count = Math.max(3, Math.round(NETWORK_COUNT * 0.42));
const t3Count = Math.max(2, Math.round(NETWORK_COUNT * 0.18));
const t4Count = TOTAL_USERS >= 80 ? Math.max(2, Math.round(NETWORK_COUNT * 0.10)) : 0;
const t5Count = TOTAL_USERS >= 100 ? Math.max(2, Math.round(NETWORK_COUNT * 0.05)) : 0;
// Absorb rounding into tier 2
const t2Adjusted = NETWORK_COUNT - t1Count - t3Count - t4Count - t5Count;

let idx = 1;
export const TIER1_RANGE  = [idx, idx + t1Count - 1]; idx += t1Count;
export const TIER2_RANGE  = [idx, idx + t2Adjusted - 1]; idx += t2Adjusted;
export const TIER3_RANGE  = t3Count > 0 ? [idx, idx + t3Count - 1] : null; idx += t3Count;
export const TIER4_RANGE  = t4Count > 0 ? [idx, idx + t4Count - 1] : null; idx += t4Count;
export const TIER5_RANGE  = t5Count > 0 ? [idx, idx + t5Count - 1] : null; idx += t5Count;
export const PENDING_IN   = [idx, idx + PENDING_IN_COUNT - 1]; idx += PENDING_IN_COUNT;
export const PENDING_OUT  = [idx, idx + PENDING_OUT_COUNT - 1]; idx += PENDING_OUT_COUNT;
export const DENIED       = [idx, idx + DENIED_COUNT - 1];

const range = (r) => r ? Array.from({ length: r[1] - r[0] + 1 }, (_, i) => r[0] + i) : [];

export const tier1Indices      = range(TIER1_RANGE);
export const tier2Indices      = range(TIER2_RANGE);
export const tier3Indices      = range(TIER3_RANGE);
export const tier4Indices      = range(TIER4_RANGE);
export const tier5Indices      = range(TIER5_RANGE);
export const pendingInIndices  = range(PENDING_IN);
export const pendingOutIndices = range(PENDING_OUT);
export const deniedIndices     = range(DENIED);

// ─── Connection topology ────────────────────────────────────────────────────────

export function buildConnectionPlan() {
  const plan = [];

  // migue1990 → tier-1, each accepted → CONFIRMED
  for (const t1 of tier1Indices) {
    plan.push([0, t1, 'confirm']);
  }

  // tier-1 → tier-2
  for (let i = 0; i < tier2Indices.length; i++) {
    const t2 = tier2Indices[i];
    const t1Primary = tier1Indices[i % tier1Indices.length];
    plan.push([t1Primary, t2, 'confirm']);
    if (i % 3 === 0 && i > 0) {
      const t1Secondary = tier1Indices[(i + 7) % tier1Indices.length];
      plan.push([t1Secondary, t2, 'confirm']);
    }
  }

  // tier-2 → tier-3
  for (let i = 0; i < tier3Indices.length; i++) {
    const t3 = tier3Indices[i];
    const t2 = tier2Indices[i % tier2Indices.length];
    plan.push([t2, t3, 'confirm']);
  }

  // tier-3 → tier-4
  for (let i = 0; i < tier4Indices.length; i++) {
    const t4 = tier4Indices[i];
    const t3 = tier3Indices[i % tier3Indices.length];
    plan.push([t3, t4, 'confirm']);
  }

  // tier-4 → tier-5
  for (let i = 0; i < tier5Indices.length; i++) {
    const t5 = tier5Indices[i];
    const t4 = tier4Indices[i % tier4Indices.length];
    plan.push([t4, t5, 'confirm']);
  }

  // Cross-links between tier-2 users
  for (let i = 0; i < tier2Indices.length - 5; i += 5) {
    plan.push([tier2Indices[i], tier2Indices[i + 3], 'confirm']);
  }

  // Pending incoming
  for (const pi of pendingInIndices) {
    plan.push([pi, 0, 'pending']);
  }

  // Pending sent
  for (const po of pendingOutIndices) {
    plan.push([0, po, 'pending']);
  }

  // Denied
  for (const d of deniedIndices) {
    plan.push([d, 0, 'deny']);
  }

  return plan;
}

// ─── Profile visibility assignments ─────────────────────────────────────────────

export function buildProfilePlan() {
  const plan = new Map();
  plan.set(0, { visibility: 'PUBLIC', displayNamePublic: true, searchableByEmail: true });

  const publicEnd = Math.min(Math.round(TOTAL_USERS * 0.12), tier1Indices.length);
  for (let i = 1; i <= publicEnd; i++) {
    plan.set(i, {
      visibility: 'PUBLIC',
      displayNamePublic: i % 3 !== 0,
      searchableByEmail: i % 4 !== 0,
    });
  }

  const connOnlyEnd = publicEnd + Math.round(TOTAL_USERS * 0.15);
  for (let i = publicEnd + 1; i <= connOnlyEnd && i < TOTAL_USERS; i++) {
    plan.set(i, { visibility: 'CONNECTIONS_ONLY', displayNamePublic: false, searchableByEmail: false });
  }

  for (let i = connOnlyEnd + 1; i < TOTAL_USERS; i++) {
    plan.set(i, { visibility: 'PRIVATE', displayNamePublic: false, searchableByEmail: false });
  }

  return plan;
}

// ─── Health assignments ─────────────────────────────────────────────────────────

const daysAgoDate = (days) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
};

export function buildHealthPlan() {
  const plan = [];

  // 1st degree — pick from tier-1 indices that exist
  const t1 = tier1Indices;
  if (t1.length >= 4) {
    plan.push({ userIndex: t1[2],  condition: 'CHLAMYDIA',  status: 'POSITIVE', date: daysAgoDate(14), cleared: false });
    plan.push({ userIndex: t1[6] ?? t1[t1.length - 1], condition: 'HIV', status: 'POSITIVE', date: daysAgoDate(21), cleared: false });
    plan.push({ userIndex: t1[Math.min(11, t1.length - 1)], condition: 'GONORRHEA', status: 'POSITIVE', date: daysAgoDate(7), cleared: false });
    plan.push({ userIndex: t1[Math.min(17, t1.length - 2)], condition: 'CHLAMYDIA', status: 'POSITIVE', date: daysAgoDate(30), cleared: false });
  }

  // 1st degree negative
  if (t1.length >= 5) {
    plan.push({ userIndex: t1[4], condition: 'HIV', status: 'NEGATIVE', date: daysAgoDate(10), cleared: false });
  }

  // 2nd degree — pick from tier-2 indices
  const t2 = tier2Indices;
  if (t2.length >= 5) {
    plan.push({ userIndex: t2[Math.floor(t2.length * 0.1)], condition: 'SYPHILIS', status: 'POSITIVE', date: daysAgoDate(18), cleared: false });
    plan.push({ userIndex: t2[Math.floor(t2.length * 0.3)], condition: 'HPV',      status: 'POSITIVE', date: daysAgoDate(25), cleared: false });
    plan.push({ userIndex: t2[Math.floor(t2.length * 0.5)], condition: 'HSV1',     status: 'POSITIVE', date: daysAgoDate(12), cleared: false });
    plan.push({ userIndex: t2[Math.floor(t2.length * 0.7)], condition: 'HSV2',     status: 'POSITIVE', date: daysAgoDate(10), cleared: false });
    plan.push({ userIndex: t2[Math.floor(t2.length * 0.9)], condition: 'CHLAMYDIA', status: 'POSITIVE', date: daysAgoDate(35), cleared: false });
  }
  if (t2.length >= 8) {
    plan.push({ userIndex: t2[t2.length - 1], condition: 'GONORRHEA', status: 'POSITIVE', date: daysAgoDate(20), cleared: true });
  }

  // 3rd degree — pick from tier-3 indices
  // These are solo-reporter conditions designed to show all 4 exposure combos:
  //   HEPATITIS_B  → Active - Older   (solo, not cleared, >30 days)
  //   HEPATITIS_C  → Resolved - Older (solo, cleared, >30 days)
  //   TRICHOMONIASIS → Resolved - Recent (solo, cleared, <30 days)
  const t3 = tier3Indices;
  if (t3.length >= 3) {
    plan.push({ userIndex: t3[0], condition: 'HEPATITIS_B',    status: 'POSITIVE', date: daysAgoDate(45), cleared: false });
    plan.push({ userIndex: t3[Math.floor(t3.length * 0.4)], condition: 'HEPATITIS_C', status: 'POSITIVE', date: daysAgoDate(60), cleared: true });
    plan.push({ userIndex: t3[Math.floor(t3.length * 0.7)], condition: 'TRICHOMONIASIS', status: 'POSITIVE', date: daysAgoDate(10), cleared: true });
  }
  if (t3.length >= 5) {
    plan.push({ userIndex: t3[t3.length - 1], condition: 'GONORRHEA', status: 'POSITIVE', date: daysAgoDate(28), cleared: false });
    plan.push({ userIndex: t3[Math.floor(t3.length * 0.5)], condition: 'SYPHILIS', status: 'POSITIVE', date: daysAgoDate(40), cleared: true });
  }

  // migue1990 self-report
  plan.push({ userIndex: 0, condition: 'HPV', status: 'NEGATIVE', date: daysAgoDate(7), cleared: false });

  return plan;
}
