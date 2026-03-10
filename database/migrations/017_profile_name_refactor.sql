-- Migration 017: Profile Name Refactor (displayName/fullName → firstName/lastName)
-- Replaces redundant display_name + full_name with standard first_name + last_name
-- Drops display_name_public (verification cards now handle public identity)
--
-- Rollback:
-- ALTER TABLE users ADD COLUMN display_name_encrypted BYTEA;
-- ALTER TABLE users ADD COLUMN full_name_encrypted BYTEA;
-- ALTER TABLE users ADD COLUMN display_name_public BOOLEAN NOT NULL DEFAULT false;
-- ALTER TABLE users DROP COLUMN IF EXISTS first_name_encrypted;
-- ALTER TABLE users DROP COLUMN IF EXISTS last_name_encrypted;

ALTER TABLE users ADD COLUMN first_name_encrypted BYTEA;
ALTER TABLE users ADD COLUMN last_name_encrypted BYTEA;

ALTER TABLE users DROP COLUMN IF EXISTS display_name_encrypted;
ALTER TABLE users DROP COLUMN IF EXISTS full_name_encrypted;
ALTER TABLE users DROP COLUMN IF EXISTS display_name_public;
