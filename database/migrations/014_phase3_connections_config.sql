-- Migration 014: Phase 3 — Configurability foundation, connection redesign, reciprocity
-- Rollback:
--   DROP TABLE IF EXISTS phone_reports;
--   DROP TABLE IF EXISTS phone_blocks;
--   DROP TABLE IF EXISTS connection_phone_entries;
--   DROP TABLE IF EXISTS app_config;
--   DROP TABLE IF EXISTS network_stages;
--   DROP TABLE IF EXISTS condition_catalog;
--   ALTER TABLE connections DROP COLUMN IF EXISTS connection_type;
--   ALTER TABLE encounter_journal DROP COLUMN IF EXISTS phone_hash;
--   DROP INDEX IF EXISTS idx_journal_phone_hash;
--   ALTER TABLE users DROP COLUMN IF EXISTS receive_match_notifications;
--   ALTER TABLE users DROP COLUMN IF EXISTS exposure_opted_in;
--   ALTER TABLE users DROP COLUMN IF EXISTS exposure_opted_in_at;
--   ALTER TABLE users DROP COLUMN IF EXISTS exposure_opted_out_at;

BEGIN;

-- ============================================================
-- 1. CONDITION CATALOG — Replaces hardcoded ConditionType enum
-- ============================================================
CREATE TABLE IF NOT EXISTS condition_catalog (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    display_name_es VARCHAR(100),
    description TEXT,
    description_es TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    icon VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE condition_catalog IS 'Database-driven catalog of STI conditions, replaces hardcoded ConditionType enum';

-- Seed with existing conditions (preserving current enum values as codes)
INSERT INTO condition_catalog (code, display_name, display_name_es, display_order, active) VALUES
    ('CHLAMYDIA', 'Chlamydia', 'Clamidia', 1, true),
    ('GONORRHEA', 'Gonorrhea', 'Gonorrea', 2, true),
    ('SYPHILIS', 'Syphilis', 'Sífilis', 3, true),
    ('HIV', 'HIV', 'VIH', 4, true),
    ('HSV1', 'HSV-1 (Oral Herpes)', 'VHS-1 (Herpes Oral)', 5, true),
    ('HSV2', 'HSV-2 (Genital Herpes)', 'VHS-2 (Herpes Genital)', 6, true),
    ('HPV', 'HPV', 'VPH', 7, true),
    ('HEPATITIS_B', 'Hepatitis B', 'Hepatitis B', 8, true),
    ('HEPATITIS_C', 'Hepatitis C', 'Hepatitis C', 9, true),
    ('TRICHOMONIASIS', 'Trichomoniasis', 'Tricomoniasis', 10, true)
ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- 2. NETWORK STAGES — Configurable constellation stage thresholds
-- ============================================================
CREATE TABLE IF NOT EXISTS network_stages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    display_name_es VARCHAR(100),
    min_nodes INTEGER NOT NULL,
    max_nodes INTEGER,
    description TEXT,
    description_es TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE network_stages IS 'Configurable thresholds for network constellation stage badges';

INSERT INTO network_stages (code, display_name, display_name_es, min_nodes, max_nodes, display_order) VALUES
    ('EMPTY_SKY', 'Empty Sky', 'Cielo Vacío', 0, 0, 1),
    ('SPARK', 'Spark', 'Chispa', 1, 50, 2),
    ('CLUSTER', 'Cluster', 'Cúmulo', 51, 500, 3),
    ('CONSTELLATION', 'Constellation', 'Constelación', 501, 2000, 4),
    ('GALAXY', 'Galaxy', 'Galaxia', 2001, 10000, 5),
    ('SUPERCLUSTER', 'Supercluster', 'Supercúmulo', 10001, NULL, 6)
ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- 3. APP CONFIG — Runtime key-value configuration
-- ============================================================
CREATE TABLE IF NOT EXISTS app_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_key VARCHAR(100) NOT NULL UNIQUE,
    config_value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE app_config IS 'Runtime-configurable key-value settings, no redeploy needed';

INSERT INTO app_config (config_key, config_value, description) VALUES
    ('phone_match.window_days', '2', 'Days tolerance for phone auto-match (±N days)'),
    ('phone_match.max_attempts_per_week', '5', 'Max outbound phone-match attempts per user per week'),
    ('phone_match.denial_cooldown_threshold', '3', 'Number of denials before throttling sender'),
    ('reciprocity.cooldown_days', '15', 'Days before user can re-opt-in after opting out'),
    ('exposure.min_connections', '3', 'Minimum confirmed connections to see exposure data'),
    ('exposure.max_depth', '3', 'Maximum BFS depth for exposure calculation'),
    ('exposure.snapshot_ttl_days', '7', 'Days before exposure snapshot expires'),
    ('verification.qr_token_lifetime_minutes', '5', 'QR code token lifetime in minutes'),
    ('verification.default_expiry_days', '30', 'Default verification card expiry'),
    ('verification.max_view_limit', '5', 'Maximum view limit option for private cards')
ON CONFLICT (config_key) DO NOTHING;

-- ============================================================
-- 4. CONNECTION PHONE MATCHING
-- ============================================================
CREATE TABLE IF NOT EXISTS connection_phone_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_hash VARCHAR(64) NOT NULL,
    phone_hash VARCHAR(64) NOT NULL,
    encounter_date DATE NOT NULL,
    journal_entry_id UUID REFERENCES encounter_journal(id) ON DELETE CASCADE,
    matched BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_phone_entries_phone_hash ON connection_phone_entries(phone_hash);
CREATE INDEX idx_phone_entries_user_hash ON connection_phone_entries(user_hash);
CREATE INDEX idx_phone_entries_unmatched ON connection_phone_entries(phone_hash, matched) WHERE matched = FALSE;

COMMENT ON TABLE connection_phone_entries IS 'Phone hashes from journal entries for auto-matching connections';

-- ============================================================
-- 5. PHONE BLOCKS & REPORTS
-- ============================================================
CREATE TABLE IF NOT EXISTS phone_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_hash VARCHAR(64) NOT NULL,
    blocked_phone_hash VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_hash, blocked_phone_hash)
);

COMMENT ON TABLE phone_blocks IS 'Blocked phone hashes per user for abuse prevention';

CREATE TABLE IF NOT EXISTS phone_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_hash VARCHAR(64) NOT NULL,
    reported_phone_hash VARCHAR(64) NOT NULL,
    reason VARCHAR(200),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_phone_reports_phone ON phone_reports(reported_phone_hash);

COMMENT ON TABLE phone_reports IS 'Abuse reports for phone-match senders';

-- ============================================================
-- 6. ALTER EXISTING TABLES
-- ============================================================

-- Connections: track how the connection was formed
ALTER TABLE connections ADD COLUMN IF NOT EXISTS connection_type VARCHAR(30) DEFAULT 'EXPLICIT';

COMMENT ON COLUMN connections.connection_type IS 'How connection was formed: PHONE_MATCH, NOTIFICATION_MATCH, EXPLICIT, LINK';

-- Encounter journal: optional phone hash for matching
ALTER TABLE encounter_journal ADD COLUMN IF NOT EXISTS phone_hash VARCHAR(64);

CREATE INDEX idx_journal_phone_hash ON encounter_journal(phone_hash) WHERE phone_hash IS NOT NULL;

-- Users: match notification preference + reciprocity
ALTER TABLE users ADD COLUMN IF NOT EXISTS receive_match_notifications BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS exposure_opted_in BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS exposure_opted_in_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS exposure_opted_out_at TIMESTAMPTZ;

COMMIT;
