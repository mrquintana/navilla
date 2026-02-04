-- Dev Seed: 7 Users + Connections + Health Status
-- KIS approach: assumes users already exist in auth.users AND public.users (created via app login).
--
-- Users:
--   testuser1@navilla.app ... testuser7@navilla.app
--
-- What this seeds:
--   Connections (CONFIRMED):
--     1-2, 2-3, 3-4, 2-5, 5-6, 6-7
--   Pending:
--     7 -> 1
--   Health status:
--     user3: CHLAMYDIA POSITIVE
--     user5: GONORRHEA POSITIVE
--     user7: HIV POSITIVE
--
-- Expected exposure examples (max depth 3):
--   user1 sees CHLAMYDIA (2nd degree) and GONORRHEA (3rd degree).

WITH auth_users AS (
    SELECT id, email
    FROM auth.users
    WHERE email IN (
        'testuser1@navilla.app',
        'testuser2@navilla.app',
        'testuser3@navilla.app',
        'testuser4@navilla.app',
        'testuser5@navilla.app',
        'testuser6@navilla.app',
        'testuser7@navilla.app'
    )
),
users_map AS (
    SELECT a.email, u.email_hash AS user_hash
    FROM auth_users a
    JOIN public.users u ON u.supabase_id = a.id
)
INSERT INTO connections (user_a_hash, user_b_hash, status, requested_at, responded_at, confirmed_at)
SELECT m1.user_hash, m2.user_hash, 'CONFIRMED',
       NOW() - INTERVAL '14 days', NOW() - INTERVAL '13 days', NOW() - INTERVAL '13 days'
FROM users_map m1
JOIN users_map m2 ON m2.email = 'testuser2@navilla.app'
WHERE m1.email = 'testuser1@navilla.app'
ON CONFLICT DO NOTHING;

INSERT INTO connections (user_a_hash, user_b_hash, status, requested_at, responded_at, confirmed_at)
SELECT m1.user_hash, m2.user_hash, 'CONFIRMED',
       NOW() - INTERVAL '12 days', NOW() - INTERVAL '11 days', NOW() - INTERVAL '11 days'
FROM users_map m1
JOIN users_map m2 ON m2.email = 'testuser3@navilla.app'
WHERE m1.email = 'testuser2@navilla.app'
ON CONFLICT DO NOTHING;

INSERT INTO connections (user_a_hash, user_b_hash, status, requested_at, responded_at, confirmed_at)
SELECT m1.user_hash, m2.user_hash, 'CONFIRMED',
       NOW() - INTERVAL '10 days', NOW() - INTERVAL '9 days', NOW() - INTERVAL '9 days'
FROM users_map m1
JOIN users_map m2 ON m2.email = 'testuser4@navilla.app'
WHERE m1.email = 'testuser3@navilla.app'
ON CONFLICT DO NOTHING;

INSERT INTO connections (user_a_hash, user_b_hash, status, requested_at, responded_at, confirmed_at)
SELECT m1.user_hash, m2.user_hash, 'CONFIRMED',
       NOW() - INTERVAL '8 days', NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days'
FROM users_map m1
JOIN users_map m2 ON m2.email = 'testuser5@navilla.app'
WHERE m1.email = 'testuser2@navilla.app'
ON CONFLICT DO NOTHING;

INSERT INTO connections (user_a_hash, user_b_hash, status, requested_at, responded_at, confirmed_at)
SELECT m1.user_hash, m2.user_hash, 'CONFIRMED',
       NOW() - INTERVAL '6 days', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'
FROM users_map m1
JOIN users_map m2 ON m2.email = 'testuser6@navilla.app'
WHERE m1.email = 'testuser5@navilla.app'
ON CONFLICT DO NOTHING;

INSERT INTO connections (user_a_hash, user_b_hash, status, requested_at, responded_at, confirmed_at)
SELECT m1.user_hash, m2.user_hash, 'CONFIRMED',
       NOW() - INTERVAL '4 days', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'
FROM users_map m1
JOIN users_map m2 ON m2.email = 'testuser7@navilla.app'
WHERE m1.email = 'testuser6@navilla.app'
ON CONFLICT DO NOTHING;

-- Pending request from user7 to user1
INSERT INTO connections (user_a_hash, user_b_hash, status, requested_at, responded_at, confirmed_at)
SELECT m1.user_hash, m2.user_hash, 'PENDING',
       NOW() - INTERVAL '1 day', NULL, NULL
FROM users_map m1
JOIN users_map m2 ON m2.email = 'testuser1@navilla.app'
WHERE m1.email = 'testuser7@navilla.app'
ON CONFLICT DO NOTHING;

-- Health statuses (uppercase enum names stored as VARCHAR)
INSERT INTO health_status (user_hash, condition_type, status, test_date, reported_at, verified, cleared_at)
SELECT user_hash, 'CHLAMYDIA', 'POSITIVE', CURRENT_DATE - 20, NOW() - INTERVAL '20 days', false, NULL
FROM users_map
WHERE email = 'testuser3@navilla.app'
ON CONFLICT (user_hash, condition_type) DO UPDATE
SET status = EXCLUDED.status,
    test_date = EXCLUDED.test_date,
    reported_at = EXCLUDED.reported_at,
    verified = EXCLUDED.verified,
    cleared_at = EXCLUDED.cleared_at;

INSERT INTO health_status (user_hash, condition_type, status, test_date, reported_at, verified, cleared_at)
SELECT user_hash, 'GONORRHEA', 'POSITIVE', CURRENT_DATE - 15, NOW() - INTERVAL '15 days', false, NULL
FROM users_map
WHERE email = 'testuser5@navilla.app'
ON CONFLICT (user_hash, condition_type) DO UPDATE
SET status = EXCLUDED.status,
    test_date = EXCLUDED.test_date,
    reported_at = EXCLUDED.reported_at,
    verified = EXCLUDED.verified,
    cleared_at = EXCLUDED.cleared_at;

INSERT INTO health_status (user_hash, condition_type, status, test_date, reported_at, verified, cleared_at)
SELECT user_hash, 'HIV', 'POSITIVE', CURRENT_DATE - 40, NOW() - INTERVAL '40 days', false, NULL
FROM users_map
WHERE email = 'testuser7@navilla.app'
ON CONFLICT (user_hash, condition_type) DO UPDATE
SET status = EXCLUDED.status,
    test_date = EXCLUDED.test_date,
    reported_at = EXCLUDED.reported_at,
    verified = EXCLUDED.verified,
    cleared_at = EXCLUDED.cleared_at;
