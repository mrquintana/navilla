-- Navilla Database Schema
-- Migration 009: Journal Partners
-- Purpose: Create journal_partners table for recurring partner tracking with encrypted fields
--
-- ROLLBACK:
-- BEGIN;
-- ALTER TABLE encounter_journal DROP COLUMN IF EXISTS partner_id;
-- DROP INDEX IF EXISTS idx_encounter_journal_partner;
-- DROP TABLE IF EXISTS journal_partners;
-- COMMIT;

BEGIN;

-- Recurring partners table
CREATE TABLE journal_partners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_hash VARCHAR(64) NOT NULL,
    alias_encrypted BYTEA NOT NULL,
    connection_id UUID REFERENCES connections(id) ON DELETE SET NULL,
    notes_encrypted BYTEA,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_journal_partners_user ON journal_partners(user_hash);

COMMENT ON TABLE journal_partners IS 'Encrypted recurring partner entries. Alias and notes are AES-256-GCM encrypted.';
COMMENT ON COLUMN journal_partners.user_hash IS 'SHA-256 hashed user identity — never stores raw email or UUID.';
COMMENT ON COLUMN journal_partners.alias_encrypted IS 'AES-256-GCM encrypted partner alias/nickname.';
COMMENT ON COLUMN journal_partners.notes_encrypted IS 'AES-256-GCM encrypted freeform notes about this partner.';

-- Add partner_id foreign key to encounter_journal
ALTER TABLE encounter_journal ADD COLUMN partner_id UUID REFERENCES journal_partners(id) ON DELETE SET NULL;

CREATE INDEX idx_encounter_journal_partner ON encounter_journal(partner_id);

COMMIT;
