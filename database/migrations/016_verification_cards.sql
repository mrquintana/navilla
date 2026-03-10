-- Migration 016: Verification Cards
-- Allows users to create shareable verification cards showing their health status
--
-- Rollback:
-- DROP INDEX IF EXISTS idx_verification_cards_token;
-- DROP INDEX IF EXISTS idx_verification_cards_user;
-- DROP TABLE IF EXISTS verification_cards;

CREATE TABLE verification_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_hash TEXT NOT NULL REFERENCES users(email_hash) ON DELETE CASCADE,
  display_name_encrypted BYTEA,
  included_conditions TEXT[] NOT NULL DEFAULT '{}',
  show_test_dates BOOLEAN NOT NULL DEFAULT false,
  show_verification_level BOOLEAN NOT NULL DEFAULT true,
  share_token VARCHAR(64) NOT NULL UNIQUE,
  privacy_mode VARCHAR(20) NOT NULL DEFAULT 'PRIVATE',
  max_views INTEGER,
  current_views INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_verification_cards_user ON verification_cards(user_hash);
CREATE INDEX idx_verification_cards_token ON verification_cards(share_token);
