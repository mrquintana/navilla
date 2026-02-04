import { chromium } from '@playwright/test';

const DEFAULT_SIZE = 70;
const MAX_SIZE = 200;
const DEFAULT_REQUESTS = 20;
const DEFAULT_PASSWORD = 'Test1234';

const args = process.argv.slice(2);
const getArg = (name, fallback) => {
  const prefix = `--${name}=`;
  const arg = args.find((item) => item.startsWith(prefix));
  if (!arg) return fallback;
  return arg.slice(prefix.length);
};

const size = Math.min(MAX_SIZE, parseInt(getArg('size', DEFAULT_SIZE), 10));
const directRequests = Math.max(0, Math.min(size - 1, parseInt(getArg('requests', DEFAULT_REQUESTS), 10)));
const baseUrl = getArg('baseUrl', process.env.SEED_BASE_URL || 'http://localhost:5173');
const password = getArg('password', DEFAULT_PASSWORD);

if (Number.isNaN(size) || size < 2) {
  throw new Error('Size must be at least 2');
}

const firstNames = ['Miguel', 'Ana', 'Carlos', 'Sofia', 'Diego', 'Lucia', 'Pedro', 'Maria', 'Jose', 'Valeria', 'Javier', 'Camila', 'Andres', 'Elena', 'Marco', 'Daniela', 'Rafael', 'Isabel', 'Luis', 'Paula'];
const lastNames = ['Ramirez', 'Lopez', 'Hernandez', 'Garcia', 'Martinez', 'Gomez', 'Diaz', 'Sanchez', 'Torres', 'Vargas', 'Castillo', 'Ruiz', 'Mendoza', 'Morales', 'Ortega', 'Navarro', 'Flores', 'Delgado', 'Reyes', 'Cruz'];
const locations = ['CDMX', 'Guadalajara', 'Monterrey', 'Bogotá', 'Medellín', 'Lima', 'Buenos Aires', 'Madrid', 'Barcelona', 'Miami', 'Austin', 'Los Angeles', 'San Diego'];
const countries = ['MX', 'CO', 'PE', 'AR', 'ES', 'US', 'CL', 'EC'];
const sexes = ['male', 'female', 'other'];

const makeDob = (age) => {
  const today = new Date();
  const year = today.getFullYear() - age;
  const month = String(1 + (age % 12)).padStart(2, '0');
  const day = String(1 + (age % 28)).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

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

  const n = String(index).padStart(3, '0');
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

const users = Array.from({ length: size }, (_, idx) => makeUser(idx));

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const logStep = (message) => {
  console.log(`[seed] ${message}`);
};

const logPageState = async (page, label) => {
  const url = page.url();
  const title = await page.title().catch(() => 'unknown');
  const h1 = await page.locator('h1').first().textContent().catch(() => '');
  logStep(`${label} | url=${url} | title="${title}" | h1="${h1?.trim() ?? ''}"`);
};

const attemptSignOutFromProfile = async (page) => {
  const signOut = page.getByRole('button', { name: /sign out|cerrar/i });
  if (await signOut.isVisible().catch(() => false)) {
    await signOut.click();
    await page.waitForTimeout(800);
    return true;
  }
  return false;
};

const attemptSignOutFromMenu = async (page) => {
  const profileMenu = page.getByRole('button', { name: /profile/i }).first();
  if (await profileMenu.isVisible().catch(() => false)) {
    await profileMenu.click();
    const signOut = page.getByRole('menuitem', { name: /sign out|cerrar/i });
    if (await signOut.isVisible().catch(() => false)) {
      await signOut.click();
      await page.waitForTimeout(800);
      return true;
    }
  }
  return false;
};

const ensureLoggedOut = async (page) => {
  await page.goto(`${baseUrl}/profile`, { waitUntil: 'domcontentloaded' });
  await logPageState(page, 'ensureLoggedOut: visit /profile');

  if (await attemptSignOutFromProfile(page)) {
    logStep('Signed out via profile settings');
    return;
  }

  if (await attemptSignOutFromMenu(page)) {
    logStep('Signed out via header menu');
    return;
  }
};

const ensureSignupPage = async (page) => {
  await page.goto(`${baseUrl}/signup`, { waitUntil: 'domcontentloaded' });
  await logPageState(page, 'After goto /signup');
  const emailField = page.getByLabel(/^email/i);
  if (await emailField.isVisible({ timeout: 5000 }).catch(() => false)) {
    return;
  }

  await ensureLoggedOut(page);
  await page.goto(`${baseUrl}/signup`, { waitUntil: 'domcontentloaded' });
  await logPageState(page, 'Retry goto /signup');

  if (!(await emailField.isVisible({ timeout: 8000 }).catch(() => false))) {
    throw new Error('Signup page not available. Check routing or auth redirects.');
  }
};

const ensureLoginPage = async (page) => {
  await page.goto(`${baseUrl}/login`, { waitUntil: 'domcontentloaded' });
  await logPageState(page, 'After goto /login');
  const emailField = page.getByLabel(/email/i);
  if (await emailField.isVisible({ timeout: 5000 }).catch(() => false)) {
    return;
  }

  await ensureLoggedOut(page);
  await page.goto(`${baseUrl}/login`, { waitUntil: 'domcontentloaded' });
  await logPageState(page, 'Retry goto /login');

  if (!(await emailField.isVisible({ timeout: 8000 }).catch(() => false))) {
    throw new Error('Login page not available. Check routing or auth redirects.');
  }
};

const selectOptionSafe = async (selectLocator, desiredValue, fallbackValue) => {
  const values = await selectLocator.evaluate((el) =>
    Array.from(el.options).map((opt) => opt.value).filter(Boolean)
  );
  const value = values.includes(desiredValue)
    ? desiredValue
    : (fallbackValue && values.includes(fallbackValue) ? fallbackValue : values[0]);

  if (!value) {
    throw new Error('No selectable options found');
  }
  if (value !== desiredValue) {
    logStep(`Country fallback used: ${value} (requested ${desiredValue})`);
  }
  await selectLocator.selectOption(value);
};

const signupUser = async (page, user) => {
  await ensureLoggedOut(page);
  await ensureSignupPage(page);

  const emailField = page.getByLabel(/^email/i);
  await emailField.fill(user.email);
  await page.getByLabel(/^password/i).fill(password);
  await page.getByLabel(/confirm/i).fill(password);
  await page.getByRole('button', { name: /next|siguiente/i }).click();

  await page.getByLabel(/username/i).fill(user.username);
  await page.getByLabel(/full name/i).fill(user.fullName);
  await page.getByLabel(/date of birth/i).fill(user.dob);
  await page.getByLabel(/sex/i).selectOption(user.sex);
  const countrySelect = page.getByLabel(/country/i);
  await selectOptionSafe(countrySelect, user.country, 'MX');
  await page.getByLabel(/city|region|location/i).fill(user.location);

  await page.getByRole('button', { name: /sign up|registr/i }).click();
  await page.waitForTimeout(1500);
  await logPageState(page, `After signup ${user.email}`);
};

const login = async (page, email) => {
  await ensureLoginPage(page);
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole('button', { name: /sign in|iniciar/i }).click();
  await page.waitForTimeout(1200);
  await logPageState(page, `After login ${email}`);
};

const logout = async (page) => {
  await ensureLoggedOut(page);
};

const ensureProfilePage = async (page, user) => {
  await page.goto(`${baseUrl}/profile`);
  await logPageState(page, `Visit profile for ${user.email}`);

  const visibilityLabel = page.getByLabel(/profile visibility|visibilidad/i);
  if (await visibilityLabel.isVisible({ timeout: 8000 }).catch(() => false)) {
    return visibilityLabel;
  }

  const currentUrl = page.url();
  if (currentUrl.includes('/login')) {
    await login(page, user.email);
    await page.goto(`${baseUrl}/profile`);
    await logPageState(page, `Profile after login ${user.email}`);
  }

  if (await visibilityLabel.isVisible({ timeout: 8000 }).catch(() => false)) {
    return visibilityLabel;
  }

  throw new Error(`Profile not available for ${user.email}. Current URL: ${page.url()}`);
};

const updateProfilePreferences = async (page, user, index) => {
  await ensureProfilePage(page, user);

  const displayNameInput = page.getByLabel(/^display name$/i);
  await displayNameInput.fill(user.displayName);

  const showAgeCheckbox = page.getByLabel(/show my age|mostrar mi edad/i);
  if (await showAgeCheckbox.isVisible()) {
    const showAge = index % 2 === 0;
    const checked = await showAgeCheckbox.isChecked();
    if (checked !== showAge) {
      await showAgeCheckbox.click();
    }
  }

  const visibilityLabel = page.getByLabel(/profile visibility|visibilidad/i);
  const visibilityOptions = ['PUBLIC', 'CONNECTIONS_ONLY', 'PRIVATE'];
  const visibility = visibilityOptions[index % visibilityOptions.length];
  await visibilityLabel.selectOption(visibility);

  if (visibility === 'PUBLIC') {
    const displayNamePublic = page.getByLabel(/show display name|mostrar nombre/i).first();
    const emailSearch = page.getByLabel(/email search|búsqueda por correo/i).first();
    if (await displayNamePublic.isVisible()) {
      if ((index % 3) === 0) await displayNamePublic.click();
    }
    if (await emailSearch.isVisible()) {
      if ((index % 4) === 0) await emailSearch.click();
    }
  }

  await page.getByRole('button', { name: /save|guardar/i }).click();
  await page.waitForTimeout(1000);
};

const sendConnectionRequest = async (page, fromEmail, toEmail) => {
  await login(page, fromEmail);
  await page.goto(`${baseUrl}/connections`);
  await page.getByPlaceholder(/email or username|correo|usuario/i).fill(toEmail);
  await page.getByRole('button', { name: /send request|enviar/i }).click();
  await page.waitForTimeout(800);
  await logout(page);
};

const acceptFirstPending = async (page, recipientEmail) => {
  await login(page, recipientEmail);
  await page.goto(`${baseUrl}/connections`);
  const accept = page.getByRole('button', { name: /accept|aceptar/i }).first();
  if (await accept.isVisible()) {
    await accept.click();
  }
  await page.waitForTimeout(800);
  await logout(page);
};

const reportHealthStatus = async (page, email, condition) => {
  await login(page, email);
  await page.goto(`${baseUrl}/health`);

  const toggle = page.getByRole('button', { name: /open|abrir/i });
  if (await toggle.isVisible()) {
    await toggle.click();
  }

  await page.getByLabel(/condition/i).selectOption(condition);
  await page.getByLabel(/status/i).selectOption('positive');
  await page.getByLabel(/test date/i).fill(makeDob(20));
  await page.getByRole('button', { name: /report|actualizar/i }).click();
  await page.waitForTimeout(1000);
  await logout(page);
};

const run = async () => {
  logStep(`Base URL: ${baseUrl}`);
  logStep(`Creating ${size} users with password: ${password}`);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  for (let i = 0; i < users.length; i += 1) {
    logStep(`Signing up ${users[i].email}`);
    await signupUser(page, users[i]);
    await updateProfilePreferences(page, users[i], i);
    await logout(page);
    await delay(300);
  }

  const migueEmail = users[0].email;
  const directUsers = users.slice(1, 1 + directRequests);

  logStep(`Sending ${directUsers.length} direct requests to ${migueEmail}`);
  for (const user of directUsers) {
    await sendConnectionRequest(page, user.email, migueEmail);
  }

  const secondStart = 1 + directRequests;
  const secondUsers = users.slice(secondStart, secondStart + directRequests);
  const thirdUsers = users.slice(secondStart + directRequests, secondStart + directRequests * 2);

  logStep('Creating confirmed 2nd-degree links');
  for (let i = 0; i < directUsers.length && i < secondUsers.length; i += 1) {
    await sendConnectionRequest(page, directUsers[i].email, secondUsers[i].email);
    await acceptFirstPending(page, secondUsers[i].email);
  }

  logStep('Creating confirmed 3rd-degree links');
  for (let i = 0; i < secondUsers.length && i < thirdUsers.length; i += 1) {
    await sendConnectionRequest(page, secondUsers[i].email, thirdUsers[i].email);
    await acceptFirstPending(page, thirdUsers[i].email);
  }

  logStep('Creating a circular connection among remaining users');
  const remaining = users.slice(1 + directRequests * 3, size);
  for (let i = 0; i < remaining.length; i += 1) {
    const current = remaining[i];
    const next = remaining[(i + 1) % remaining.length];
    await sendConnectionRequest(page, current.email, next.email);
    await acceptFirstPending(page, next.email);
  }

  logStep('Reporting health statuses for exposure visibility');
  const conditions = ['chlamydia', 'gonorrhea', 'syphilis', 'hiv', 'hpv'];
  for (let i = 0; i < thirdUsers.length; i += 2) {
    const user = thirdUsers[i];
    const condition = conditions[i % conditions.length];
    await reportHealthStatus(page, user.email, condition);
  }

  await browser.close();
  logStep('Done. Log in as migue1990@gmail.com to accept or deny incoming requests.');
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
