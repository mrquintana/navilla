-- Migration 013: Push subscriptions for web push notifications
-- Rollback: DROP TABLE IF EXISTS push_subscriptions;

CREATE TABLE IF NOT EXISTS push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_hash VARCHAR(64) NOT NULL,
    endpoint_encrypted BYTEA NOT NULL,
    p256dh_encrypted BYTEA NOT NULL,
    auth_encrypted BYTEA NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_push_subscriptions_user_hash ON push_subscriptions(user_hash);
