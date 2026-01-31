-- Navilla Database Schema
-- Migration 004: User Enhancements
-- Adds Supabase ID for API lookups and privacy settings

-- ============================================
-- ADD SUPABASE ID COLUMN
-- ============================================

-- Add supabase_id column for looking up users by their Supabase Auth UUID
-- This is separate from email_hash which is used for the connection system
ALTER TABLE users
ADD COLUMN supabase_id UUID UNIQUE;

-- Create index for fast lookups by Supabase ID
CREATE INDEX idx_users_supabase_id ON users(supabase_id);

COMMENT ON COLUMN users.supabase_id IS 'Supabase Auth user UUID for API authentication lookups';

-- ============================================
-- ADD PRIVACY SETTINGS
-- ============================================

-- Profile visibility enum
CREATE TYPE profile_visibility AS ENUM (
    'public',           -- Searchable by name/username/email
    'connections_only', -- Only visible to confirmed connections
    'private'           -- Only findable via direct email invite
);

-- Add privacy settings to users table
ALTER TABLE users
ADD COLUMN profile_visibility profile_visibility DEFAULT 'private',
ADD COLUMN display_name_public BOOLEAN DEFAULT FALSE,
ADD COLUMN searchable_by_email BOOLEAN DEFAULT FALSE;

-- Index for searching public profiles
CREATE INDEX idx_users_public_profiles ON users(profile_visibility)
    WHERE profile_visibility = 'public';

COMMENT ON COLUMN users.profile_visibility IS 'Controls who can find this user profile';
COMMENT ON COLUMN users.display_name_public IS 'Whether display name is shown in search results';
COMMENT ON COLUMN users.searchable_by_email IS 'Whether user can be found by email search';

-- ============================================
-- ADD USERNAME (OPTIONAL)
-- ============================================

-- Optional username for public profiles (hashed for privacy)
ALTER TABLE users
ADD COLUMN username VARCHAR(30) UNIQUE,
ADD COLUMN username_hash VARCHAR(64) UNIQUE;

CREATE INDEX idx_users_username ON users(username)
    WHERE username IS NOT NULL;

CREATE INDEX idx_users_username_hash ON users(username_hash)
    WHERE username_hash IS NOT NULL;

COMMENT ON COLUMN users.username IS 'Optional public username (only for public profiles)';
COMMENT ON COLUMN users.username_hash IS 'SHA-256 hash of username for privacy-preserving lookups';
