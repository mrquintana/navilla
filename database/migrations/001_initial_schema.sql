-- Navilla Database Schema
-- Migration 001: Initial Schema
-- Run this first to create all tables

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- ENUM TYPES
-- ============================================

CREATE TYPE connection_status AS ENUM (
    'pending',
    'confirmed',
    'denied',
    'expired'
);

CREATE TYPE condition_type AS ENUM (
    'chlamydia',
    'gonorrhea',
    'syphilis',
    'hiv',
    'hsv1',
    'hsv2',
    'hpv',
    'hepatitis_b',
    'hepatitis_c',
    'trichomoniasis'
);

CREATE TYPE health_status_value AS ENUM (
    'positive',
    'negative',
    'unknown'
);

CREATE TYPE notification_type AS ENUM (
    'connection_request',
    'connection_confirmed',
    'connection_denied',
    'exposure_alert',
    'exposure_cleared',
    'account_security'
);

-- ============================================
-- TABLES
-- ============================================

-- Users table
-- Stores user accounts with encrypted PII
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- For lookups (hashed email)
    email_hash VARCHAR(64) UNIQUE NOT NULL,

    -- For account recovery (encrypted email)
    email_encrypted BYTEA NOT NULL,

    -- Optional display name (encrypted)
    display_name_encrypted BYTEA,

    -- Optional date of birth for age verification (encrypted)
    dob_encrypted BYTEA,

    -- Email verification status
    verified BOOLEAN DEFAULT FALSE,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Connections table
-- Represents bidirectional connections between users
CREATE TABLE connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- User who initiated the request (hashed)
    user_a_hash VARCHAR(64) NOT NULL,

    -- User who received the request (hashed)
    user_b_hash VARCHAR(64) NOT NULL,

    -- Connection status
    status connection_status DEFAULT 'pending',

    -- Timestamps
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    responded_at TIMESTAMPTZ,
    confirmed_at TIMESTAMPTZ,

    -- Constraints
    CONSTRAINT unique_connection UNIQUE (user_a_hash, user_b_hash),
    CONSTRAINT no_self_connection CHECK (user_a_hash != user_b_hash)
);

-- Health Status table
-- Stores user health records
CREATE TABLE health_status (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- User (hashed)
    user_hash VARCHAR(64) NOT NULL,

    -- Condition and status
    condition_type condition_type NOT NULL,
    status health_status_value NOT NULL,

    -- Approximate test date (no exact dates for privacy)
    test_date DATE,

    -- When this was reported
    reported_at TIMESTAMPTZ DEFAULT NOW(),

    -- Whether verified by a lab (future feature)
    verified BOOLEAN DEFAULT FALSE,

    -- When condition was cleared (for curable STIs)
    cleared_at TIMESTAMPTZ,

    -- Only one record per condition per user
    CONSTRAINT unique_condition_per_user UNIQUE (user_hash, condition_type)
);

-- Exposure Snapshots table
-- Cached exposure calculations for performance
CREATE TABLE exposure_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- User (hashed)
    user_hash VARCHAR(64) UNIQUE NOT NULL,

    -- Encrypted JSON blob with exposure data
    snapshot_data_encrypted BYTEA NOT NULL,

    -- When calculated
    computed_at TIMESTAMPTZ DEFAULT NOW(),

    -- When this snapshot expires
    expires_at TIMESTAMPTZ NOT NULL
);

-- Notifications table
-- Queue for batched notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Recipient (hashed)
    user_hash VARCHAR(64) NOT NULL,

    -- Notification type
    notification_type notification_type NOT NULL,

    -- Encrypted payload (contains notification details)
    payload_encrypted BYTEA NOT NULL,

    -- When to send
    scheduled_for TIMESTAMPTZ NOT NULL,

    -- When actually sent (null if pending)
    sent_at TIMESTAMPTZ,

    -- When created
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit Log table
-- For security and compliance
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- User who performed action (hashed, null for system actions)
    user_hash VARCHAR(64),

    -- Action type
    action VARCHAR(50) NOT NULL,

    -- Resource type (user, connection, health_status, etc.)
    resource_type VARCHAR(50) NOT NULL,

    -- Resource ID (hashed or UUID depending on resource)
    resource_id VARCHAR(64),

    -- Additional context (no PII)
    metadata JSONB,

    -- IP address hash for security investigations
    ip_hash VARCHAR(64),

    -- Timestamp
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

-- Users indexes
CREATE INDEX idx_users_email_hash ON users(email_hash);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Connections indexes
CREATE INDEX idx_connections_user_a ON connections(user_a_hash);
CREATE INDEX idx_connections_user_b ON connections(user_b_hash);
CREATE INDEX idx_connections_status ON connections(status);
CREATE INDEX idx_connections_pending ON connections(user_b_hash, status)
    WHERE status = 'pending';

-- Health status indexes
CREATE INDEX idx_health_status_user ON health_status(user_hash);
CREATE INDEX idx_health_status_condition ON health_status(condition_type);
CREATE INDEX idx_health_status_positive ON health_status(user_hash, condition_type)
    WHERE status = 'positive' AND cleared_at IS NULL;

-- Exposure snapshots indexes
CREATE INDEX idx_snapshots_user ON exposure_snapshots(user_hash);
CREATE INDEX idx_snapshots_expires ON exposure_snapshots(expires_at);

-- Notifications indexes
CREATE INDEX idx_notifications_user ON notifications(user_hash);
CREATE INDEX idx_notifications_pending ON notifications(scheduled_for)
    WHERE sent_at IS NULL;
CREATE INDEX idx_notifications_type ON notifications(notification_type);

-- Audit log indexes
CREATE INDEX idx_audit_user ON audit_log(user_hash);
CREATE INDEX idx_audit_action ON audit_log(action);
CREATE INDEX idx_audit_created ON audit_log(created_at);

-- ============================================
-- TRIGGERS
-- ============================================

-- Update updated_at on users table
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE users IS 'User accounts with encrypted PII';
COMMENT ON TABLE connections IS 'Bidirectional connections between users';
COMMENT ON TABLE health_status IS 'User STI test results and status';
COMMENT ON TABLE exposure_snapshots IS 'Cached exposure calculations';
COMMENT ON TABLE notifications IS 'Notification queue for batched delivery';
COMMENT ON TABLE audit_log IS 'Security and compliance audit trail';

COMMENT ON COLUMN users.email_hash IS 'SHA-256 hash of email for lookups';
COMMENT ON COLUMN users.email_encrypted IS 'AES-256-GCM encrypted email for recovery';
COMMENT ON COLUMN connections.user_a_hash IS 'Hash of user who initiated request';
COMMENT ON COLUMN connections.user_b_hash IS 'Hash of user who received request';
COMMENT ON COLUMN health_status.cleared_at IS 'When condition was cleared (curable STIs only)';
