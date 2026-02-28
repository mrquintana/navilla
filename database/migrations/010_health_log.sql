-- Migration 010: Health Log (test visits + results + labs)
-- Purpose: Replace single-status-per-condition model with full test visit history
--
-- ROLLBACK:
-- BEGIN;
-- DROP TABLE IF EXISTS lab_credentials;
-- DROP TABLE IF EXISTS test_results;
-- DROP TABLE IF EXISTS test_visits;
-- DROP TABLE IF EXISTS labs;
-- COMMIT;

BEGIN;

-- User's saved lab profiles
CREATE TABLE labs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_hash VARCHAR(64) NOT NULL,
    provider VARCHAR(32) NOT NULL,
    name_encrypted BYTEA NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_labs_user ON labs(user_hash);

COMMENT ON TABLE labs IS 'User-saved lab profiles (Chopo, Salud Digna, etc). Name is AES-256-GCM encrypted.';

-- EAV for lab-level persistent identifiers
CREATE TABLE lab_credentials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lab_id UUID NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
    credential_key VARCHAR(64) NOT NULL,
    value_encrypted BYTEA NOT NULL,
    UNIQUE (lab_id, credential_key)
);

COMMENT ON TABLE lab_credentials IS 'Key-value credentials per lab (patient_id, account_number, etc). Values are AES-256-GCM encrypted.';

-- One row per test visit
CREATE TABLE test_visits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_hash VARCHAR(64) NOT NULL,
    test_date DATE NOT NULL,
    lab_id UUID REFERENCES labs(id) ON DELETE SET NULL,
    lab_reference_encrypted BYTEA,
    notes_encrypted BYTEA,
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_test_visits_user ON test_visits(user_hash);
CREATE INDEX idx_test_visits_date ON test_visits(user_hash, test_date DESC);

COMMENT ON TABLE test_visits IS 'Test visit log. One row per lab visit. lab_reference and notes are AES-256-GCM encrypted.';

-- One row per condition tested in a visit
CREATE TABLE test_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    visit_id UUID NOT NULL REFERENCES test_visits(id) ON DELETE CASCADE,
    condition_type VARCHAR(32),
    custom_condition_encrypted BYTEA,
    status VARCHAR(16) NOT NULL,
    result_value_encrypted BYTEA,
    reference_range VARCHAR(200),
    cleared_at TIMESTAMPTZ,
    document_ref_encrypted BYTEA,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_test_results_visit ON test_results(visit_id);
CREATE INDEX idx_test_results_condition ON test_results(condition_type);

COMMENT ON TABLE test_results IS 'Per-condition results within a test visit. custom_condition and result_value are AES-256-GCM encrypted. reference_range is plaintext (public medical knowledge).';

COMMIT;
