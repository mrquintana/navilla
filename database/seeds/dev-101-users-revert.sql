-- Revert seed: remove connections + health statuses for user001..user100 + migue1990

WITH users_map AS (
  SELECT a.email, u.email_hash AS user_hash
  FROM auth.users a
  JOIN public.users u ON u.supabase_id = a.id
  WHERE a.email = 'migue1990@gmail.com'
     OR a.email ~ '^user\\d{3}@navilla\\.app$'
)
DELETE FROM connections c
USING users_map u1, users_map u2
WHERE (c.user_a_hash = u1.user_hash AND c.user_b_hash = u2.user_hash)
   OR (c.user_a_hash = u2.user_hash AND c.user_b_hash = u1.user_hash);

WITH users_map AS (
  SELECT a.email, u.email_hash AS user_hash
  FROM auth.users a
  JOIN public.users u ON u.supabase_id = a.id
  WHERE a.email = 'migue1990@gmail.com'
     OR a.email ~ '^user\\d{3}@navilla\\.app$'
)
DELETE FROM health_status h
USING users_map u
WHERE h.user_hash = u.user_hash;

DELETE FROM exposure_snapshots;
