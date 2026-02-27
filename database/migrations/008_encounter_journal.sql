-- Navilla Database Schema
-- Migration 008: Encounter Journal
-- Purpose: Create tables for Layer 1 encounter journal with encrypted fields
--
-- ROLLBACK:
-- BEGIN;
-- DROP TABLE IF EXISTS journal_field_templates;
-- DROP TABLE IF EXISTS encounter_journal;
-- COMMIT;

BEGIN;

-- Main journal entries table
CREATE TABLE encounter_journal (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_hash VARCHAR(64) NOT NULL,
    encounter_date DATE NOT NULL,
    partner_alias_encrypted BYTEA,
    connection_id UUID REFERENCES connections(id) ON DELETE SET NULL,
    notes_encrypted BYTEA,
    custom_fields_encrypted BYTEA,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_encounter_journal_user ON encounter_journal(user_hash);
CREATE INDEX idx_encounter_journal_date ON encounter_journal(user_hash, encounter_date DESC);

COMMENT ON TABLE encounter_journal IS 'Encrypted encounter journal entries. All text fields are AES-256-GCM encrypted.';
COMMENT ON COLUMN encounter_journal.user_hash IS 'SHA-256 hashed user identity — never stores raw email or UUID.';
COMMENT ON COLUMN encounter_journal.partner_alias_encrypted IS 'AES-256-GCM encrypted freeform partner alias.';
COMMENT ON COLUMN encounter_journal.notes_encrypted IS 'AES-256-GCM encrypted freeform notes.';
COMMENT ON COLUMN encounter_journal.custom_fields_encrypted IS 'AES-256-GCM encrypted JSON array: [{label, value}], max 3.';

-- Saved custom field label templates (max 3 per user)
CREATE TABLE journal_field_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_hash VARCHAR(64) NOT NULL,
    label_encrypted BYTEA NOT NULL,
    display_order INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_template_per_user_order UNIQUE (user_hash, display_order),
    CONSTRAINT chk_display_order CHECK (display_order BETWEEN 1 AND 3)
);

CREATE INDEX idx_journal_templates_user ON journal_field_templates(user_hash);

COMMENT ON TABLE journal_field_templates IS 'User-saved custom field labels for encounter journal. Max 3 per user.';

COMMIT;
