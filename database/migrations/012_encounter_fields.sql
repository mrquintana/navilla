-- Migration 012: Encounter type + protection method fields
-- ROLLBACK:
-- ALTER TABLE encounter_journal DROP COLUMN IF EXISTS encounter_types_encrypted;
-- ALTER TABLE encounter_journal DROP COLUMN IF EXISTS protection_methods_encrypted;

BEGIN;
ALTER TABLE encounter_journal ADD COLUMN encounter_types_encrypted BYTEA;
ALTER TABLE encounter_journal ADD COLUMN protection_methods_encrypted BYTEA;
COMMENT ON COLUMN encounter_journal.encounter_types_encrypted IS 'AES-256-GCM encrypted JSON array of encounter type strings.';
COMMENT ON COLUMN encounter_journal.protection_methods_encrypted IS 'AES-256-GCM encrypted JSON array of protection method strings.';
COMMIT;
