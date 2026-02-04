-- Dev Seed: 101 Users (migue + user001..user100) + Connections + Health Status
-- Password (for all in Auth): TestPassword123!
-- This script assumes users already exist in auth.users and public.users.
-- It validates that assumption and aborts if any are missing.

DO $$
DECLARE
  missing_auth int;
  missing_public int;
BEGIN
  -- Verify auth.users contains all expected emails
  SELECT 101 - COUNT(*) INTO missing_auth
  FROM auth.users
  WHERE email = 'migue1990@gmail.com'
     OR email ~ '^user\\d{3}@navilla\\.app$';

  IF missing_auth <> 0 THEN
    RAISE EXCEPTION 'Missing % auth.users records. Create users in Supabase Auth first.', missing_auth;
  END IF;

  -- Verify public.users contains all expected emails
  SELECT 101 - COUNT(*) INTO missing_public
  FROM public.users u
  JOIN auth.users a ON a.id = u.supabase_id
  WHERE a.email = 'migue1990@gmail.com'
     OR a.email ~ '^user\\d{3}@navilla\\.app$';

  IF missing_public <> 0 THEN
    RAISE EXCEPTION 'Missing % public.users records. Each user must sign in once to sync.', missing_public;
  END IF;
END $$;

WITH users_map AS (
  SELECT a.email, u.email_hash AS user_hash
  FROM auth.users a
  JOIN public.users u ON u.supabase_id = a.id
  WHERE a.email = 'migue1990@gmail.com'
     OR a.email ~ '^user\\d{3}@navilla\\.app$'
),
user_series AS (
  SELECT email, user_hash,
         CAST(SUBSTRING(email FROM 5 FOR 3) AS INTEGER) AS n
  FROM users_map
  WHERE email ~ '^user\\d{3}@navilla\\.app$'
),
user_lookup AS (
  SELECT n, user_hash, email FROM user_series
),
me AS (
  SELECT user_hash FROM users_map WHERE email = 'migue1990@gmail.com'
)
-- 1) Update privacy settings for variety (no encrypted fields touched)
UPDATE public.users u
SET profile_visibility = CASE
      WHEN a.email = 'migue1990@gmail.com' THEN 'PUBLIC'
      WHEN (SUBSTRING(a.email FROM 5 FOR 3)::int) % 3 = 0 THEN 'PUBLIC'
      WHEN (SUBSTRING(a.email FROM 5 FOR 3)::int) % 3 = 1 THEN 'CONNECTIONS_ONLY'
      ELSE 'PRIVATE'
    END,
    display_name_public = CASE
      WHEN (SUBSTRING(a.email FROM 5 FOR 3)::int) % 2 = 0 THEN true
      ELSE false
    END,
    searchable_by_email = CASE
      WHEN (SUBSTRING(a.email FROM 5 FOR 3)::int) % 4 = 0 THEN true
      ELSE false
    END,
    show_age = CASE
      WHEN (SUBSTRING(a.email FROM 5 FOR 3)::int) % 2 = 0 THEN true
      ELSE false
    END
FROM auth.users a
WHERE u.supabase_id = a.id
  AND (a.email = 'migue1990@gmail.com' OR a.email ~ '^user\\d{3}@navilla\\.app$');

-- 2) Set simple usernames (optional; username_hash left null)
UPDATE public.users u
SET username = CASE
      WHEN a.email = 'migue1990@gmail.com' THEN 'migue1990'
      ELSE LOWER(SUBSTRING(a.email FROM 1 FOR POSITION('@' IN a.email) - 1))
    END
FROM auth.users a
WHERE u.supabase_id = a.id
  AND (a.email = 'migue1990@gmail.com' OR a.email ~ '^user\\d{3}@navilla\\.app$');

-- 3) Base ring connections: user001 -> user002 -> ... -> user100 -> user001
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

-- 4) Extra edges to increase degree: userN -> userN+3
INSERT INTO connections (user_a_hash, user_b_hash, status, requested_at, responded_at, confirmed_at)
SELECT u1.user_hash, u2.user_hash, 'CONFIRMED',
       NOW() - INTERVAL '18 days', NOW() - INTERVAL '17 days', NOW() - INTERVAL '17 days'
FROM user_lookup u1
JOIN user_lookup u2 ON u2.n = CASE WHEN u1.n >= 98 THEN u1.n - 97 ELSE u1.n + 3 END
WHERE NOT EXISTS (
  SELECT 1 FROM connections c
  WHERE (c.user_a_hash = u1.user_hash AND c.user_b_hash = u2.user_hash)
     OR (c.user_a_hash = u2.user_hash AND c.user_b_hash = u1.user_hash)
);

-- 5) Connect migue1990 to 30 direct connections: user001..user030
INSERT INTO connections (user_a_hash, user_b_hash, status, requested_at, responded_at, confirmed_at)
SELECT m.user_hash, u.user_hash, 'CONFIRMED',
       NOW() - INTERVAL '10 days', NOW() - INTERVAL '9 days', NOW() - INTERVAL '9 days'
FROM me m
JOIN user_lookup u ON u.n BETWEEN 1 AND 30
WHERE NOT EXISTS (
  SELECT 1 FROM connections c
  WHERE (c.user_a_hash = m.user_hash AND c.user_b_hash = u.user_hash)
     OR (c.user_a_hash = u.user_hash AND c.user_b_hash = m.user_hash)
);

-- 6) Add indirect branches from some of migue's direct connections
INSERT INTO connections (user_a_hash, user_b_hash, status, requested_at, responded_at, confirmed_at)
SELECT u1.user_hash, u2.user_hash, 'CONFIRMED',
       NOW() - INTERVAL '8 days', NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days'
FROM user_lookup u1
JOIN user_lookup u2 ON u2.n = u1.n + 30
WHERE u1.n BETWEEN 1 AND 30
  AND u2.n <= 100
  AND NOT EXISTS (
    SELECT 1 FROM connections c
    WHERE (c.user_a_hash = u1.user_hash AND c.user_b_hash = u2.user_hash)
       OR (c.user_a_hash = u2.user_hash AND c.user_b_hash = u1.user_hash)
  );

-- 7) Health statuses for different degrees (spread across network)
INSERT INTO health_status (user_hash, condition_type, status, test_date, reported_at, verified, cleared_at)
SELECT user_hash, 'CHLAMYDIA', 'POSITIVE', CURRENT_DATE - 18, NOW() - INTERVAL '18 days', false, NULL
FROM user_lookup
WHERE n IN (2, 5, 9)  -- 1st degree from migue
ON CONFLICT (user_hash, condition_type) DO UPDATE
SET status = EXCLUDED.status,
    test_date = EXCLUDED.test_date,
    reported_at = EXCLUDED.reported_at,
    verified = EXCLUDED.verified,
    cleared_at = EXCLUDED.cleared_at;

INSERT INTO health_status (user_hash, condition_type, status, test_date, reported_at, verified, cleared_at)
SELECT user_hash, 'GONORRHEA', 'POSITIVE', CURRENT_DATE - 12, NOW() - INTERVAL '12 days', false, NULL
FROM user_lookup
WHERE n IN (35, 40, 45) -- 2nd degree from migue
ON CONFLICT (user_hash, condition_type) DO UPDATE
SET status = EXCLUDED.status,
    test_date = EXCLUDED.test_date,
    reported_at = EXCLUDED.reported_at,
    verified = EXCLUDED.verified,
    cleared_at = EXCLUDED.cleared_at;

INSERT INTO health_status (user_hash, condition_type, status, test_date, reported_at, verified, cleared_at)
SELECT user_hash, 'HIV', 'POSITIVE', CURRENT_DATE - 40, NOW() - INTERVAL '40 days', false, NOW() - INTERVAL '5 days'
FROM user_lookup
WHERE n IN (70, 80, 90) -- 3rd degree from migue
ON CONFLICT (user_hash, condition_type) DO UPDATE
SET status = EXCLUDED.status,
    test_date = EXCLUDED.test_date,
    reported_at = EXCLUDED.reported_at,
    verified = EXCLUDED.verified,
    cleared_at = EXCLUDED.cleared_at;

-- Optional: force exposure recompute
DELETE FROM exposure_snapshots;
