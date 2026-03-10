import { env } from './env';
export const E2E_MODE = env.get('VITE_E2E_MODE') === 'true';

export interface E2eUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  username: string;
  confirmedCount: number;
}

const E2E_PASSWORD = 'TestPassword123!';
const E2E_USERS: E2eUser[] = [
  {
    id: 'e2e-user-1',
    email: 'testuser1@navilla.app',
    firstName: 'Test',
    lastName: 'User 1',
    username: 'testuser1',
    confirmedCount: 1,
  },
  {
    id: 'e2e-user-2',
    email: 'testuser2@navilla.app',
    firstName: 'Test',
    lastName: 'User 2',
    username: 'testuser2',
    confirmedCount: 3,
  },
  {
    id: 'e2e-user-7',
    email: 'testuser7@navilla.app',
    firstName: 'Test',
    lastName: 'User 7',
    username: 'testuser7',
    confirmedCount: 0,
  },
];

const USERS_BY_EMAIL = new Map(E2E_USERS.map((user) => [user.email.toLowerCase(), user]));

export function getE2eUserByEmail(email: string): E2eUser | undefined {
  return USERS_BY_EMAIL.get(email.toLowerCase());
}

export function verifyE2ePassword(password: string): boolean {
  return password === E2E_PASSWORD;
}

export function makeE2eAccessToken(email: string): string {
  return `e2e:${email.toLowerCase()}`;
}

export function getE2eUserFromToken(token: string): E2eUser | undefined {
  if (!token.startsWith('e2e:')) {
    return undefined;
  }
  return getE2eUserByEmail(token.slice('e2e:'.length));
}
