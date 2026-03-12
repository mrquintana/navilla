-- Migration 020: Add country_code to phone entries for international matching
-- Rollback:
--   ALTER TABLE connection_phone_entries DROP COLUMN IF EXISTS country_code;

ALTER TABLE connection_phone_entries
    ADD COLUMN country_code VARCHAR(5);

COMMENT ON COLUMN connection_phone_entries.country_code IS 'Optional ISO country calling code (e.g. 52 for Mexico, 1 for US). Stored for future use, not part of matching hash.';
