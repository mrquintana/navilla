-- Revert Dev Seed: 7 Users + Connections + Health Status
-- Deletes only data tied to testuser1..7

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
DELETE FROM health_status
WHERE user_hash IN (SELECT user_hash FROM users_map);

DELETE FROM connections
WHERE user_a_hash IN (SELECT user_hash FROM users_map)
   OR user_b_hash IN (SELECT user_hash FROM users_map);
