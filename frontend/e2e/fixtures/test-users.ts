/**
 * Test users for E2E testing
 *
 * These users should be pre-seeded in the AWS test environment.
 * Each user has specific connection relationships for testing different scenarios.
 *
 * Network Graph:
 *   user1 <-> user2 <-> user3 <-> user4
 *             |
 *             v
 *           user5 <-> user6
 *
 *   user7 (isolated - no connections)
 *   user8 <-> user9 (separate network)
 *   user10 (has pending requests)
 */

export interface TestUser {
  email: string;
  password: string;
  displayName: string;
  description: string;
}

// Base password for all test users (change for your environment)
const TEST_PASSWORD = 'TestPassword123!';

export const testUsers: Record<string, TestUser> = {
  // Primary test network
  user1: {
    email: 'testuser1@navilla.app',
    password: TEST_PASSWORD,
    displayName: 'Test User 1',
    description: 'First degree connection to user2',
  },
  user2: {
    email: 'testuser2@navilla.app',
    password: TEST_PASSWORD,
    displayName: 'Test User 2',
    description: 'Hub user - connected to user1, user3, user5',
  },
  user3: {
    email: 'testuser3@navilla.app',
    password: TEST_PASSWORD,
    displayName: 'Test User 3',
    description: 'Second degree from user1, connected to user2 and user4',
  },
  user4: {
    email: 'testuser4@navilla.app',
    password: TEST_PASSWORD,
    displayName: 'Test User 4',
    description: 'Third degree from user1, connected only to user3',
  },
  user5: {
    email: 'testuser5@navilla.app',
    password: TEST_PASSWORD,
    displayName: 'Test User 5',
    description: 'Branch from user2, connected to user2 and user6',
  },
  user6: {
    email: 'testuser6@navilla.app',
    password: TEST_PASSWORD,
    displayName: 'Test User 6',
    description: 'Connected only to user5',
  },

  // Isolated user
  user7: {
    email: 'testuser7@navilla.app',
    password: TEST_PASSWORD,
    displayName: 'Test User 7',
    description: 'Isolated user - no connections',
  },

  // Separate network
  user8: {
    email: 'testuser8@navilla.app',
    password: TEST_PASSWORD,
    displayName: 'Test User 8',
    description: 'Separate network with user9',
  },
  user9: {
    email: 'testuser9@navilla.app',
    password: TEST_PASSWORD,
    displayName: 'Test User 9',
    description: 'Separate network with user8',
  },

  // Pending requests user
  user10: {
    email: 'testuser10@navilla.app',
    password: TEST_PASSWORD,
    displayName: 'Test User 10',
    description: 'Has pending incoming requests',
  },
};

/**
 * Expected connection states for testing
 */
export const expectedConnections = {
  user1: {
    confirmed: ['user2'],
    pending_sent: [],
    pending_incoming: [],
  },
  user2: {
    confirmed: ['user1', 'user3', 'user5'],
    pending_sent: [],
    pending_incoming: [],
  },
  user3: {
    confirmed: ['user2', 'user4'],
    pending_sent: [],
    pending_incoming: [],
  },
  user7: {
    confirmed: [],
    pending_sent: [],
    pending_incoming: [],
  },
};

/**
 * Exposure scenarios for testing
 */
export const exposureScenarios = {
  // When user3 reports positive, user2 has direct exposure, user1 has 2nd degree
  directExposure: {
    reporter: 'user3',
    directlyExposed: ['user2', 'user4'],
    secondDegree: ['user1', 'user5'],
    thirdDegree: ['user6'],
    notExposed: ['user7', 'user8', 'user9', 'user10'],
  },
};
