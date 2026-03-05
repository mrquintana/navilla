-- Migration 015: Lab verification system
-- Adds raw_lab_response_encrypted column to test_visits for storing original lab responses
-- Widens provider column to accommodate longer provider codes from config
--
-- Rollback:
-- ALTER TABLE test_visits DROP COLUMN IF EXISTS raw_lab_response_encrypted;
-- ALTER TABLE labs ALTER COLUMN provider TYPE varchar(32);

ALTER TABLE test_visits ADD COLUMN raw_lab_response_encrypted BYTEA;
ALTER TABLE labs ALTER COLUMN provider TYPE varchar(50);
