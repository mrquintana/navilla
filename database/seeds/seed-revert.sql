-- Seed Revert Script
-- Run in Supabase SQL Editor to wipe all seed data.
-- Targets: migue1990@gmail.com + user001-130@navilla.app
--
-- Usage:
--   1. Open Supabase Dashboard → SQL Editor
--   2. Paste this entire script
--   3. Run

BEGIN;

-- Collect auth IDs and user hashes for all seed users
CREATE TEMP TABLE seed_hashes ON COMMIT DROP AS
    SELECT a.id AS auth_id, u.email_hash AS user_hash
    FROM auth.users a
    LEFT JOIN public.users u ON u.supabase_id = a.id
    WHERE a.email = 'migue1990@gmail.com'
       OR a.email ~ '^user\d{3}@navilla\.app$';

-- Delete in dependency order (most dependent tables first)
DELETE FROM health_status
    WHERE user_hash IN (SELECT user_hash FROM seed_hashes WHERE user_hash IS NOT NULL);

DELETE FROM connections
    WHERE user_a_hash IN (SELECT user_hash FROM seed_hashes WHERE user_hash IS NOT NULL)
       OR user_b_hash IN (SELECT user_hash FROM seed_hashes WHERE user_hash IS NOT NULL);

DELETE FROM exposure_snapshots
    WHERE user_hash IN (SELECT user_hash FROM seed_hashes WHERE user_hash IS NOT NULL);

DELETE FROM notifications
    WHERE user_hash IN (SELECT user_hash FROM seed_hashes WHERE user_hash IS NOT NULL);

DELETE FROM audit_log
    WHERE user_hash IN (SELECT user_hash FROM seed_hashes WHERE user_hash IS NOT NULL);

DELETE FROM public.users
    WHERE supabase_id IN (SELECT auth_id FROM seed_hashes);

DELETE FROM auth.users
    WHERE email = 'migue1990@gmail.com'
       OR email ~ '^user\d{3}@navilla\.app$';

COMMIT;
