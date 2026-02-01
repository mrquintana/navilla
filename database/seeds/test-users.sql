-- Test Users Seed Script for E2E Testing
-- Run this in the Supabase SQL Editor after creating users in Auth
--
-- IMPORTANT: First create users via Supabase Auth Dashboard or API:
-- - testuser1@navilla.app through testuser10@navilla.app
-- - Password: TestPassword123!
--
-- Then run this script to set up the connection network for testing.

-- ============================================
-- STEP 1: Get User IDs
-- ============================================
-- After creating users in Auth, run this to get their IDs:
-- SELECT id, email FROM auth.users WHERE email LIKE 'testuser%@navilla.app';

-- ============================================
-- STEP 2: Create Users in the users table
-- ============================================
-- The users table will be auto-populated when they first login via /api/users/me
-- But you can pre-populate if needed:

-- Replace these UUIDs with actual user IDs from auth.users
-- Example (these are placeholder UUIDs):

/*
INSERT INTO users (id, email_hash, created_at, updated_at)
SELECT
  id,
  encode(sha256(email::bytea), 'hex'),
  NOW(),
  NOW()
FROM auth.users
WHERE email LIKE 'testuser%@navilla.app'
ON CONFLICT (id) DO NOTHING;
*/

-- ============================================
-- STEP 3: Create Test Connection Network
-- ============================================
-- Network Graph:
--   user1 <-> user2 <-> user3 <-> user4
--               |
--             user5 <-> user6
--   user7 (isolated)
--   user8 <-> user9 (separate network)
--   user10 (has pending incoming requests)

-- Replace {user1_id}, {user2_id}, etc. with actual UUIDs from auth.users

/*
-- Primary network connections (CONFIRMED)
INSERT INTO connections (requester_id, partner_id, status, created_at, updated_at) VALUES
  ('{user1_id}', '{user2_id}', 'CONFIRMED', NOW() - INTERVAL '30 days', NOW() - INTERVAL '29 days'),
  ('{user2_id}', '{user3_id}', 'CONFIRMED', NOW() - INTERVAL '25 days', NOW() - INTERVAL '24 days'),
  ('{user2_id}', '{user5_id}', 'CONFIRMED', NOW() - INTERVAL '20 days', NOW() - INTERVAL '19 days'),
  ('{user3_id}', '{user4_id}', 'CONFIRMED', NOW() - INTERVAL '15 days', NOW() - INTERVAL '14 days'),
  ('{user5_id}', '{user6_id}', 'CONFIRMED', NOW() - INTERVAL '10 days', NOW() - INTERVAL '9 days');

-- Separate network (CONFIRMED)
INSERT INTO connections (requester_id, partner_id, status, created_at, updated_at) VALUES
  ('{user8_id}', '{user9_id}', 'CONFIRMED', NOW() - INTERVAL '20 days', NOW() - INTERVAL '19 days');

-- Pending requests TO user10
INSERT INTO connections (requester_id, partner_id, status, created_at, updated_at) VALUES
  ('{user1_id}', '{user10_id}', 'PENDING', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
  ('{user7_id}', '{user10_id}', 'PENDING', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day');

-- Example denied connection
INSERT INTO connections (requester_id, partner_id, status, created_at, updated_at) VALUES
  ('{user6_id}', '{user7_id}', 'DENIED', NOW() - INTERVAL '5 days', NOW() - INTERVAL '4 days');
*/

-- ============================================
-- STEP 4: Verify Setup
-- ============================================

-- Check all test users exist
-- SELECT id, email FROM auth.users WHERE email LIKE 'testuser%@navilla.app' ORDER BY email;

-- Check connections are set up correctly
-- SELECT
--   c.id,
--   c.status,
--   u1.email as requester,
--   u2.email as partner,
--   c.created_at
-- FROM connections c
-- JOIN auth.users u1 ON c.requester_id = u1.id
-- JOIN auth.users u2 ON c.partner_id = u2.id
-- WHERE u1.email LIKE 'testuser%@navilla.app'
-- ORDER BY c.created_at;
