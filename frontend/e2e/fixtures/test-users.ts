export interface TestUser {
  email: string;
  password: string;
  displayName: string;
}

const TEST_PASSWORD = 'TestPassword123!';

export const testUsers = {
  user1: {
    email: 'testuser1@navilla.app',
    password: TEST_PASSWORD,
    displayName: 'Test User 1',
  },
  user2: {
    email: 'testuser2@navilla.app',
    password: TEST_PASSWORD,
    displayName: 'Test User 2',
  },
  user7: {
    email: 'testuser7@navilla.app',
    password: TEST_PASSWORD,
    displayName: 'Test User 7',
  },
} satisfies Record<string, TestUser>;
