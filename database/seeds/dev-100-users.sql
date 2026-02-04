-- Dev Seed: 100 Users + Connections + Health Status (Exposure Insights)
-- KIS: assumes users already exist in auth.users AND public.users (created via app login).
-- Suggested password for all: TestPassword123!
-- Emails: user001@navilla.app ... user100@navilla.app + migue1990@gmail.com
--
-- Graph:
-- - Ring + extra edges to ensure >=3 connections for most users
-- - migue1990 connected to user001, user002, user003
--
-- Health:
-- - Every 5th user reports a condition (positive), some resolved

WITH auth_users AS (
  SELECT id, email
  FROM auth.users
  WHERE email = 'migue1990@gmail.com'
     OR email ~ '^user\\d{3}@navilla\\.app$'
),
users_map AS (
  SELECT a.email,
         u.email_hash AS user_hash
  FROM auth_users a
  JOIN public.users u ON u.supabase_id = a.id
),
user_series AS (
  SELECT email, user_hash,
         CAST(SUBSTRING(email FROM 5 FOR 3) AS INTEGER) AS n
  FROM users_map
  WHERE email ~ '^user\\d{3}@navilla\\.app$'
),
user_lookup AS (
  SELECT n, user_hash FROM user_series
)
-- Base ring connections: user001 -> user002 -> ... -> user100 -> user001
INSERT INTO connections (user_a_hash, user_b_hash, status, requested_at, responded_at, confirmed_at)
SELECT u1.user_hash, u2.user_hash, 'CONFIRMED',
       NOW() - INTERVAL '20 days', NOW() - INTERVAL '19 days', NOW() - INTERVAL '19 days'
FROM user_lookup u1
JOIN user_lookup u2 ON u2.n = CASE WHEN u1.n = 100 THEN 1 ELSE u1.n + 1 END
WHERE NOT EXISTS (
  SELECT 1 FROM connections c
  WHERE (c.user_a_hash = u1.user_hash AND c.user_b_hash = u2.user_hash)
     OR (c.user_a_hash = u2.user_hash AND c.user_b_hash = u1.user_hash)
);

-- Extra edges to increase degree: userN -> userN+2
INSERT INTO connections (user_a_hash, user_b_hash, status, requested_at, responded_at, confirmed_at)
SELECT u1.user_hash, u2.user_hash, 'CONFIRMED',
       NOW() - INTERVAL '18 days', NOW() - INTERVAL '17 days', NOW() - INTERVAL '17 days'
FROM user_lookup u1
JOIN user_lookup u2 ON u2.n = CASE WHEN u1.n >= 99 THEN u1.n - 98 ELSE u1.n + 2 END
WHERE NOT EXISTS (
  SELECT 1 FROM connections c
  WHERE (c.user_a_hash = u1.user_hash AND c.user_b_hash = u2.user_hash)
     OR (c.user_a_hash = u2.user_hash AND c.user_b_hash = u1.user_hash)
);

-- Connect migue1990 to user001, user002, user003
INSERT INTO connections (user_a_hash, user_b_hash, status, requested_at, responded_at, confirmed_at)
SELECT m.user_hash, u.user_hash, 'CONFIRMED',
       NOW() - INTERVAL '10 days', NOW() - INTERVAL '9 days', NOW() - INTERVAL '9 days'
FROM users_map m
JOIN user_lookup u ON u.n IN (1, 2, 3)
WHERE m.email = 'migue1990@gmail.com'
  AND NOT EXISTS (
    SELECT 1 FROM connections c
    WHERE (c.user_a_hash = m.user_hash AND c.user_b_hash = u.user_hash)
       OR (c.user_a_hash = u.user_hash AND c.user_b_hash = m.user_hash)
  );

-- Pending requests (for UI variety)
INSERT INTO connections (user_a_hash, user_b_hash, status, requested_at, responded_at, confirmed_at)
SELECT u1.user_hash, u2.user_hash, 'PENDING',
       NOW() - INTERVAL '2 days', NULL, NULL
FROM user_lookup u1
JOIN user_lookup u2 ON u2.n = CASE WHEN u1.n = 100 THEN 1 ELSE u1.n + 1 END
WHERE u1.n % 10 = 0
  AND NOT EXISTS (
    SELECT 1 FROM connections c
    WHERE (c.user_a_hash = u1.user_hash AND c.user_b_hash = u2.user_hash)
       OR (c.user_a_hash = u2.user_hash AND c.user_b_hash = u1.user_hash)
  );

-- Health statuses: every 5th user reports a condition
INSERT INTO health_status (user_hash, condition_type, status, test_date, reported_at, verified, cleared_at)
SELECT u.user_hash,
       CASE (u.n % 5)
         WHEN 0 THEN 'CHLAMYDIA'
         WHEN 1 THEN 'GONORRHEA'
         WHEN 2 THEN 'SYPHILIS'
         WHEN 3 THEN 'HIV'
         ELSE 'HPV'
       END AS condition_type,
       'POSITIVE' AS status,
       CURRENT_DATE - (10 + (u.n % 15)),
       NOW() - ((10 + (u.n % 15)) || ' days')::interval,
       false,
       CASE WHEN u.n % 4 = 0 THEN NOW() - INTERVAL '3 days' ELSE NULL END
FROM user_lookup u
WHERE u.n % 5 = 0
ON CONFLICT (user_hash, condition_type) DO UPDATE
SET status = EXCLUDED.status,
    test_date = EXCLUDED.test_date,
    reported_at = EXCLUDED.reported_at,
    verified = EXCLUDED.verified,
    cleared_at = EXCLUDED.cleared_at;

-- Optional: force exposure recompute
DELETE FROM exposure_snapshots;
