export interface TestUser {
  email: string;
  password: string;
  displayName: string;
  confirmedCount: number;
}

const TEST_PASSWORD = 'TestPassword123!';

export const testUsers = {
  /** 1 confirmed connection — below privacy threshold */
  user1: {
    email: 'testuser1@navilla.app',
    password: TEST_PASSWORD,
    displayName: 'Test User 1',
    confirmedCount: 1,
  },
  /** 3 confirmed connections — meets privacy threshold */
  user2: {
    email: 'testuser2@navilla.app',
    password: TEST_PASSWORD,
    displayName: 'Test User 2',
    confirmedCount: 3,
  },
  /** 0 confirmed connections — brand new user */
  user7: {
    email: 'testuser7@navilla.app',
    password: TEST_PASSWORD,
    displayName: 'Test User 7',
    confirmedCount: 0,
  },
} satisfies Record<string, TestUser>;
