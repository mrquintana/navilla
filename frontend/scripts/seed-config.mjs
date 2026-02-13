/**
 * Seed Configuration — user definitions, network topology, health assignments
 */

// ─── Password ──────────────────────────────────────────────────────────────────
export const DEFAULT_PASSWORD = 'Test1234';

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

// ─── All 131 users ──────────────────────────────────────────────────────────────
export const TOTAL_USERS = 131;
export const USERS = Array.from({ length: TOTAL_USERS }, (_, i) => makeUser(i));

// ─── Tier assignments (indices into USERS) ──────────────────────────────────────
//  index 0       = migue1990
//  1..25         = tier 1  (25 direct confirmed connections)
//  26..80        = tier 2  (55 users)
//  81..105       = tier 3  (25 users)
//  106..115      = tier 4  (10 users)
//  116..120      = tier 5  (5 users)
//  121..125      = pending incoming to migue1990
//  126..128      = pending sent by migue1990
//  129..130      = denied by migue1990

export const TIER1_RANGE  = [1, 25];    // indices 1-25
export const TIER2_RANGE  = [26, 80];   // indices 26-80
export const TIER3_RANGE  = [81, 105];  // indices 81-105
export const TIER4_RANGE  = [106, 115]; // indices 106-115
export const TIER5_RANGE  = [116, 120]; // indices 116-120
export const PENDING_IN   = [121, 125]; // indices 121-125
export const PENDING_OUT  = [126, 128]; // indices 126-128
export const DENIED       = [129, 130]; // indices 129-130

const range = ([lo, hi]) => Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);

export const tier1Indices  = range(TIER1_RANGE);
export const tier2Indices  = range(TIER2_RANGE);
export const tier3Indices  = range(TIER3_RANGE);
export const tier4Indices  = range(TIER4_RANGE);
export const tier5Indices  = range(TIER5_RANGE);
export const pendingInIndices  = range(PENDING_IN);
export const pendingOutIndices = range(PENDING_OUT);
export const deniedIndices     = range(DENIED);

// ─── Connection topology ────────────────────────────────────────────────────────
// Returns array of [senderIndex, receiverIndex, action] tuples.
// action = 'confirm' | 'pending' | 'deny'

export function buildConnectionPlan() {
  const plan = [];

  // 3a: migue1990 → tier-1, each accepted → CONFIRMED
  for (const t1 of tier1Indices) {
    plan.push([0, t1, 'confirm']);
  }

  // 3b: tier-1 → tier-2 (each tier-2 connected to 1-2 tier-1 users)
  for (let i = 0; i < tier2Indices.length; i++) {
    const t2 = tier2Indices[i];
    const t1Primary = tier1Indices[i % tier1Indices.length];
    plan.push([t1Primary, t2, 'confirm']);
    // Every 3rd tier-2 user gets a second tier-1 link
    if (i % 3 === 0 && i > 0) {
      const t1Secondary = tier1Indices[(i + 7) % tier1Indices.length];
      plan.push([t1Secondary, t2, 'confirm']);
    }
  }

  // 3c: tier-2 → tier-3
  for (let i = 0; i < tier3Indices.length; i++) {
    const t3 = tier3Indices[i];
    const t2 = tier2Indices[i % tier2Indices.length];
    plan.push([t2, t3, 'confirm']);
  }

  // 3c cont: tier-3 → tier-4
  for (let i = 0; i < tier4Indices.length; i++) {
    const t4 = tier4Indices[i];
    const t3 = tier3Indices[i % tier3Indices.length];
    plan.push([t3, t4, 'confirm']);
  }

  // 3c cont: tier-4 → tier-5
  for (let i = 0; i < tier5Indices.length; i++) {
    const t5 = tier5Indices[i];
    const t4 = tier4Indices[i % tier4Indices.length];
    plan.push([t4, t5, 'confirm']);
  }

  // 3d: cross-links between tier-2 users for graph richness
  for (let i = 0; i < tier2Indices.length - 10; i += 5) {
    plan.push([tier2Indices[i], tier2Indices[i + 3], 'confirm']);
  }

  // 3e: pending incoming — user121-125 send to migue1990
  for (const pi of pendingInIndices) {
    plan.push([pi, 0, 'pending']);
  }

  // 3f: pending sent — migue1990 sends to user126-128
  for (const po of pendingOutIndices) {
    plan.push([0, po, 'pending']);
  }

  // 3g: denied — user129-130 send to migue1990, migue1990 denies
  for (const d of deniedIndices) {
    plan.push([d, 0, 'deny']);
  }

  return plan;
}

// ─── Profile visibility assignments ─────────────────────────────────────────────
// Returns Map<index, { visibility, displayNamePublic, searchableByEmail }>
export function buildProfilePlan() {
  const plan = new Map();

  // migue1990 is PUBLIC
  plan.set(0, { visibility: 'PUBLIC', displayNamePublic: true, searchableByEmail: true });

  // ~16 PUBLIC (indices 1-16)
  for (let i = 1; i <= 16; i++) {
    plan.set(i, {
      visibility: 'PUBLIC',
      displayNamePublic: i % 3 !== 0,      // vary
      searchableByEmail: i % 4 !== 0,      // vary
    });
  }

  // ~20 CONNECTIONS_ONLY (indices 17-36)
  for (let i = 17; i <= 36; i++) {
    plan.set(i, { visibility: 'CONNECTIONS_ONLY', displayNamePublic: false, searchableByEmail: false });
  }

  // rest PRIVATE
  for (let i = 37; i < TOTAL_USERS; i++) {
    plan.set(i, { visibility: 'PRIVATE', displayNamePublic: false, searchableByEmail: false });
  }

  return plan;
}

// ─── Health assignments ─────────────────────────────────────────────────────────
// Returns array of { userIndex, condition, status, daysAgo, cleared }

const daysAgoDate = (days) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
};

export function buildHealthPlan() {
  return [
    // ── 1st degree (direct connections of migue1990) ──
    { userIndex: 3,   condition: 'CHLAMYDIA',     status: 'POSITIVE', date: daysAgoDate(14), cleared: false },
    { userIndex: 7,   condition: 'HIV',            status: 'POSITIVE', date: daysAgoDate(21), cleared: false },
    { userIndex: 12,  condition: 'GONORRHEA',      status: 'POSITIVE', date: daysAgoDate(7),  cleared: false },
    { userIndex: 18,  condition: 'CHLAMYDIA',      status: 'POSITIVE', date: daysAgoDate(30), cleared: false },

    // ── 1st degree negative test ──
    { userIndex: 5,   condition: 'HIV',            status: 'NEGATIVE', date: daysAgoDate(10), cleared: false },

    // ── 2nd degree ──
    { userIndex: 30,  condition: 'SYPHILIS',       status: 'POSITIVE', date: daysAgoDate(18), cleared: false },
    { userIndex: 40,  condition: 'HPV',            status: 'POSITIVE', date: daysAgoDate(25), cleared: false },
    { userIndex: 50,  condition: 'HSV1',           status: 'POSITIVE', date: daysAgoDate(12), cleared: false },
    { userIndex: 60,  condition: 'HSV2',           status: 'POSITIVE', date: daysAgoDate(10), cleared: false },
    { userIndex: 70,  condition: 'CHLAMYDIA',      status: 'POSITIVE', date: daysAgoDate(35), cleared: false },
    { userIndex: 75,  condition: 'GONORRHEA',      status: 'POSITIVE', date: daysAgoDate(20), cleared: true },

    // ── 3rd degree ──
    { userIndex: 85,  condition: 'HEPATITIS_B',    status: 'POSITIVE', date: daysAgoDate(45), cleared: false },
    { userIndex: 90,  condition: 'HEPATITIS_C',    status: 'POSITIVE', date: daysAgoDate(60), cleared: false },
    { userIndex: 95,  condition: 'TRICHOMONIASIS', status: 'POSITIVE', date: daysAgoDate(15), cleared: false },
    { userIndex: 100, condition: 'GONORRHEA',      status: 'POSITIVE', date: daysAgoDate(28), cleared: false },
    { userIndex: 92,  condition: 'SYPHILIS',       status: 'POSITIVE', date: daysAgoDate(40), cleared: true },

    // ── migue1990 self-report ──
    { userIndex: 0,   condition: 'HPV',            status: 'NEGATIVE', date: daysAgoDate(7),  cleared: false },
  ];
}
