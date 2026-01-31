-- Navilla Database Schema
-- Migration 004: Add User Profile Columns
-- Adds missing columns for user profiles and privacy settings

-- Add supabase_id for auth integration
ALTER TABLE users ADD COLUMN IF NOT EXISTS supabase_id UUID UNIQUE;

-- Add profile visibility enum type
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'profile_visibility') THEN
        CREATE TYPE profile_visibility AS ENUM ('PRIVATE', 'CONNECTIONS', 'PUBLIC');
    END IF;
END$$;

-- Add privacy settings columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_visibility VARCHAR(20) DEFAULT 'PRIVATE' NOT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name_public BOOLEAN DEFAULT FALSE NOT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS searchable_by_email BOOLEAN DEFAULT FALSE NOT NULL;

-- Add optional username for public profiles
ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(30) UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS username_hash VARCHAR(64) UNIQUE;

-- Add indexes for new columns
CREATE INDEX IF NOT EXISTS idx_users_supabase_id ON users(supabase_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_username_hash ON users(username_hash);

-- Comments
COMMENT ON COLUMN users.supabase_id IS 'Supabase Auth user UUID for API authentication';
COMMENT ON COLUMN users.profile_visibility IS 'Controls who can find this user profile';
COMMENT ON COLUMN users.display_name_public IS 'Whether display name is shown in search results';
COMMENT ON COLUMN users.searchable_by_email IS 'Whether user can be found by email search';
COMMENT ON COLUMN users.username IS 'Optional public username';
COMMENT ON COLUMN users.username_hash IS 'SHA-256 hash of username for privacy-preserving lookups';
