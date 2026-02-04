-- Navilla Database Schema
-- Migration 006: Notifications Read Tracking

ALTER TABLE notifications ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;

COMMENT ON COLUMN notifications.read_at IS 'When the notification was read in-app';
