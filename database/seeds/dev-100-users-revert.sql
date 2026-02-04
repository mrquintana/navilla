-- Revert seed: remove connections + health statuses for user001..user100 + migue1990

WITH auth_users AS (
  SELECT id, email
  FROM auth.users
  WHERE email = 'migue1990@gmail.com'
     OR email ~ '^user\\d{3}@navilla\\.app$'
),
users_map AS (
  SELECT a.email, u.email_hash AS user_hash
  FROM auth_users a
  JOIN public.users u ON u.supabase_id = a.id
)
DELETE FROM connections c
USING users_map u1, users_map u2
WHERE (c.user_a_hash = u1.user_hash AND c.user_b_hash = u2.user_hash)
   OR (c.user_a_hash = u2.user_hash AND c.user_b_hash = u1.user_hash);

WITH auth_users AS (
  SELECT id, email
  FROM auth.users
  WHERE email = 'migue1990@gmail.com'
     OR email ~ '^user\\d{3}@navilla\\.app$'
),
users_map AS (
  SELECT a.email, u.email_hash AS user_hash
  FROM auth_users a
  JOIN public.users u ON u.supabase_id = a.id
)
DELETE FROM health_status h
USING users_map u
WHERE h.user_hash = u.user_hash;

DELETE FROM exposure_snapshots;
