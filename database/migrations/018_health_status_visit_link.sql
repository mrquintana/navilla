-- Migration 018: Link health_status → test_visits for lab provenance
-- Rollback: ALTER TABLE health_status DROP COLUMN IF EXISTS visit_id;

-- Add nullable visit_id to health_status, linking to the test_visit that produced the status
ALTER TABLE health_status
  ADD COLUMN IF NOT EXISTS visit_id UUID REFERENCES test_visits(id) ON DELETE SET NULL;

-- Index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_health_status_visit_id ON health_status(visit_id);
