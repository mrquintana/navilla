-- Navilla Database Schema
-- Migration 005: User Profile Updates
-- Adds additional profile fields, privacy controls, and avatar storage keys

ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name_encrypted BYTEA;
ALTER TABLE users ADD COLUMN IF NOT EXISTS sex VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS country VARCHAR(2);
ALTER TABLE users ADD COLUMN IF NOT EXISTS location_encrypted BYTEA;
ALTER TABLE users ADD COLUMN IF NOT EXISTS show_age BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_key VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_thumb_key VARCHAR(255);

COMMENT ON COLUMN users.full_name_encrypted IS 'AES-256-GCM encrypted full name';
COMMENT ON COLUMN users.sex IS 'Self-reported sex (string for flexibility)';
COMMENT ON COLUMN users.country IS 'ISO 3166-1 alpha-2 country code';
COMMENT ON COLUMN users.location_encrypted IS 'AES-256-GCM encrypted location';
COMMENT ON COLUMN users.show_age IS 'Whether age is shown to others';
COMMENT ON COLUMN users.avatar_key IS 'Storage key for profile avatar';
COMMENT ON COLUMN users.avatar_thumb_key IS 'Storage key for avatar thumbnail';
