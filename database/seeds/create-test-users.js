#!/usr/bin/env node
/**
 * Create Test Users for E2E Testing
 *
 * This script creates 10 test users in Supabase Auth for E2E testing.
 *
 * Usage:
 *   1. Set environment variables:
 *      export SUPABASE_URL=https://your-project.supabase.co
 *      export SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
 *
 *   2. Run:
 *      node create-test-users.js
 *
 * Note: Requires the service_role key (not anon key) to create users.
 */

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: Missing environment variables');
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const TEST_PASSWORD = 'TestPassword123!';

const testUsers = [
  { email: 'testuser1@navilla.app', name: 'Test User 1' },
  { email: 'testuser2@navilla.app', name: 'Test User 2' },
  { email: 'testuser3@navilla.app', name: 'Test User 3' },
  { email: 'testuser4@navilla.app', name: 'Test User 4' },
  { email: 'testuser5@navilla.app', name: 'Test User 5' },
  { email: 'testuser6@navilla.app', name: 'Test User 6' },
  { email: 'testuser7@navilla.app', name: 'Test User 7' },
  { email: 'testuser8@navilla.app', name: 'Test User 8' },
  { email: 'testuser9@navilla.app', name: 'Test User 9' },
  { email: 'testuser10@navilla.app', name: 'Test User 10' },
];

async function createUser(email, name) {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      apikey: SUPABASE_SERVICE_ROLE_KEY,
    },
    body: JSON.stringify({
      email,
      password: TEST_PASSWORD,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        display_name: name,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    if (error.msg?.includes('already been registered')) {
      console.log(`  ⏭️  ${email} already exists`);
      return null;
    }
    throw new Error(`Failed to create ${email}: ${JSON.stringify(error)}`);
  }

  return response.json();
}

async function main() {
  console.log('Creating test users...\n');

  const createdUsers = [];

  for (const user of testUsers) {
    try {
      const result = await createUser(user.email, user.name);
      if (result) {
        console.log(`  ✅ Created ${user.email} (ID: ${result.id})`);
        createdUsers.push({ ...user, id: result.id });
      }
    } catch (error) {
      console.error(`  ❌ Error creating ${user.email}:`, error.message);
    }
  }

  console.log('\n----------------------------------------');
  console.log('Test users created successfully!\n');
  console.log('Password for all users:', TEST_PASSWORD);
  console.log('\nNext step: Run the SQL script to create connections:');
  console.log('  database/seeds/test-users.sql');
  console.log('\nOr use these IDs to update the SQL script:');
  console.log('----------------------------------------\n');

  if (createdUsers.length > 0) {
    console.log('User IDs:');
    createdUsers.forEach((u, i) => {
      console.log(`  user${i + 1}_id = '${u.id}'`);
    });
  }
}

main().catch(console.error);
