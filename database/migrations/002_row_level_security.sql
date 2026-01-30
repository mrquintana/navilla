-- Navilla Database Schema
-- Migration 002: Row Level Security
-- Run after 001_initial_schema.sql

-- ============================================
-- ENABLE RLS ON ALL TABLES
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE exposure_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- ============================================
-- HELPER FUNCTION
-- Gets the current user's hash from JWT claims
-- ============================================

CREATE OR REPLACE FUNCTION current_user_hash()
RETURNS VARCHAR(64) AS $$
BEGIN
    -- The user_hash is stored in the JWT's app_metadata
    -- This is set by the backend when the user registers
    RETURN COALESCE(
        current_setting('request.jwt.claims', true)::json->>'user_hash',
        ''
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- RLS POLICIES - USERS
-- ============================================

-- Users can only see their own record
CREATE POLICY users_select_own ON users
    FOR SELECT
    USING (email_hash = current_user_hash());

-- Users can only update their own record
CREATE POLICY users_update_own ON users
    FOR UPDATE
    USING (email_hash = current_user_hash());

-- Users can delete their own account
CREATE POLICY users_delete_own ON users
    FOR DELETE
    USING (email_hash = current_user_hash());

-- Insert is handled by service role (registration)
-- No policy needed - service role bypasses RLS

-- ============================================
-- RLS POLICIES - CONNECTIONS
-- ============================================

-- Users can see connections they're part of
CREATE POLICY connections_select_own ON connections
    FOR SELECT
    USING (
        user_a_hash = current_user_hash() OR
        user_b_hash = current_user_hash()
    );

-- Users can create connection requests (as user_a)
CREATE POLICY connections_insert_own ON connections
    FOR INSERT
    WITH CHECK (user_a_hash = current_user_hash());

-- Users can update connections they received (confirm/deny)
CREATE POLICY connections_update_received ON connections
    FOR UPDATE
    USING (user_b_hash = current_user_hash());

-- Users can delete connections they're part of
CREATE POLICY connections_delete_own ON connections
    FOR DELETE
    USING (
        user_a_hash = current_user_hash() OR
        user_b_hash = current_user_hash()
    );

-- ============================================
-- RLS POLICIES - HEALTH STATUS
-- ============================================

-- Users can only see their own health status
CREATE POLICY health_select_own ON health_status
    FOR SELECT
    USING (user_hash = current_user_hash());

-- Users can insert their own health status
CREATE POLICY health_insert_own ON health_status
    FOR INSERT
    WITH CHECK (user_hash = current_user_hash());

-- Users can update their own health status
CREATE POLICY health_update_own ON health_status
    FOR UPDATE
    USING (user_hash = current_user_hash());

-- Users can delete their own health status
CREATE POLICY health_delete_own ON health_status
    FOR DELETE
    USING (user_hash = current_user_hash());

-- ============================================
-- RLS POLICIES - EXPOSURE SNAPSHOTS
-- ============================================

-- Users can only see their own snapshots
CREATE POLICY snapshots_select_own ON exposure_snapshots
    FOR SELECT
    USING (user_hash = current_user_hash());

-- Insert/update/delete handled by service role (batch job)

-- ============================================
-- RLS POLICIES - NOTIFICATIONS
-- ============================================

-- Users can only see their own notifications
CREATE POLICY notifications_select_own ON notifications
    FOR SELECT
    USING (user_hash = current_user_hash());

-- Users can update (mark as read) their own notifications
CREATE POLICY notifications_update_own ON notifications
    FOR UPDATE
    USING (user_hash = current_user_hash());

-- Insert/delete handled by service role

-- ============================================
-- RLS POLICIES - AUDIT LOG
-- ============================================

-- Users cannot directly access audit log
-- Only service role can read/write

-- ============================================
-- SERVICE ROLE PERMISSIONS
-- Note: Service role bypasses RLS by default
-- These policies are for defense in depth
-- ============================================

-- Create a service role policy for batch operations
-- This allows the backend service to perform operations
-- that users cannot do directly

-- Grant service role full access (bypasses RLS anyway, but explicit)
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON FUNCTION current_user_hash() IS
    'Returns the user_hash from JWT claims for RLS policies';

COMMENT ON POLICY users_select_own ON users IS
    'Users can only view their own profile';

COMMENT ON POLICY connections_select_own ON connections IS
    'Users can view connections they are part of';

COMMENT ON POLICY health_select_own ON health_status IS
    'Users can only view their own health records';
