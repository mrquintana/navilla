-- Migration 011: Smart Reminders + Medication Tracking
-- Purpose: Add medications, medication logs, vaccinations, reminders, and reminder settings
--
-- ROLLBACK:
-- BEGIN;
-- DROP TABLE IF EXISTS reminder_settings;
-- DROP TABLE IF EXISTS reminders;
-- DROP TABLE IF EXISTS vaccinations;
-- DROP TABLE IF EXISTS medication_logs;
-- DROP TABLE IF EXISTS medications;
-- COMMIT;

BEGIN;

-- Active medications a user is tracking
CREATE TABLE medications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_hash VARCHAR(64) NOT NULL,
    medication_type VARCHAR(32) NOT NULL,
    name_encrypted BYTEA NOT NULL,
    dosage_encrypted BYTEA,
    start_date DATE NOT NULL,
    end_date DATE,
    frequency VARCHAR(32) NOT NULL,
    reminder_time TIME,
    notes_encrypted BYTEA,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_medications_user ON medications(user_hash);

COMMENT ON TABLE medications IS 'User medication tracking. name, dosage, and notes are AES-256-GCM encrypted.';

-- Daily adherence log for each medication
CREATE TABLE medication_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    medication_id UUID NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
    user_hash VARCHAR(64) NOT NULL,
    logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    scheduled_for DATE NOT NULL,
    taken BOOLEAN NOT NULL,
    notes_encrypted BYTEA,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_medication_logs_medication ON medication_logs(medication_id);
CREATE INDEX idx_medication_logs_user_date ON medication_logs(user_hash, scheduled_for);

COMMENT ON TABLE medication_logs IS 'Per-day medication adherence log. notes are AES-256-GCM encrypted.';

-- Vaccination records
CREATE TABLE vaccinations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_hash VARCHAR(64) NOT NULL,
    vaccine_type VARCHAR(32) NOT NULL,
    dose_number INTEGER NOT NULL,
    total_doses INTEGER NOT NULL,
    administered_date DATE NOT NULL,
    location_encrypted BYTEA,
    notes_encrypted BYTEA,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_vaccinations_user ON vaccinations(user_hash);
CREATE INDEX idx_vaccinations_user_type ON vaccinations(user_hash, vaccine_type);

COMMENT ON TABLE vaccinations IS 'Vaccination records (HPV, Hepatitis A/B, Mpox, etc). location and notes are AES-256-GCM encrypted.';

-- Unified reminder system (testing, medication, vaccination, custom)
CREATE TABLE reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_hash VARCHAR(64) NOT NULL,
    reminder_type VARCHAR(32) NOT NULL,
    reference_id UUID,
    title_encrypted BYTEA NOT NULL,
    message_encrypted BYTEA,
    scheduled_for TIMESTAMPTZ NOT NULL,
    repeat_rule VARCHAR(64),
    snoozed_until TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reminders_user ON reminders(user_hash);
CREATE INDEX idx_reminders_pending ON reminders(scheduled_for) WHERE completed_at IS NULL AND active = TRUE;
CREATE INDEX idx_reminders_reference ON reminders(reference_id) WHERE reference_id IS NOT NULL;

COMMENT ON TABLE reminders IS 'Unified reminder system. reference_id points to medication/vaccination/etc. title and message are AES-256-GCM encrypted.';

-- Per-user reminder preferences
CREATE TABLE reminder_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_hash VARCHAR(64) NOT NULL UNIQUE,
    quiet_hours_start TIME,
    quiet_hours_end TIME,
    email_digest_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    email_digest_day VARCHAR(12),
    testing_reminders_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    medication_reminders_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    vaccination_reminders_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE reminder_settings IS 'Per-user reminder preferences. One row per user (user_hash is UNIQUE).';

COMMIT;
