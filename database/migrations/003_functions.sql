-- Navilla Database Schema
-- Migration 003: Database Functions
-- Run after 002_row_level_security.sql

-- ============================================
-- CONNECTION GRAPH TRAVERSAL
-- Used for exposure calculations
-- ============================================

-- Get all connections for a user (confirmed only)
CREATE OR REPLACE FUNCTION get_user_connections(p_user_hash VARCHAR(64))
RETURNS TABLE (connected_user_hash VARCHAR(64)) AS $$
BEGIN
    RETURN QUERY
    SELECT
        CASE
            WHEN user_a_hash = p_user_hash THEN user_b_hash
            ELSE user_a_hash
        END AS connected_user_hash
    FROM connections
    WHERE (user_a_hash = p_user_hash OR user_b_hash = p_user_hash)
    AND status = 'confirmed';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get connection graph up to N degrees
-- Returns user_hash and minimum degree of separation
CREATE OR REPLACE FUNCTION get_connection_graph(
    p_user_hash VARCHAR(64),
    p_max_degree INTEGER DEFAULT 3
)
RETURNS TABLE (
    connected_user VARCHAR(64),
    degree INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE connection_graph AS (
        -- Base case: direct connections (degree 1)
        SELECT
            CASE
                WHEN c.user_a_hash = p_user_hash THEN c.user_b_hash
                ELSE c.user_a_hash
            END AS connected_user,
            1 AS degree
        FROM connections c
        WHERE (c.user_a_hash = p_user_hash OR c.user_b_hash = p_user_hash)
        AND c.status = 'confirmed'

        UNION

        -- Recursive case: connections of connections
        SELECT
            CASE
                WHEN c.user_a_hash = cg.connected_user THEN c.user_b_hash
                ELSE c.user_a_hash
            END AS connected_user,
            cg.degree + 1 AS degree
        FROM connections c
        INNER JOIN connection_graph cg ON
            (c.user_a_hash = cg.connected_user OR c.user_b_hash = cg.connected_user)
        WHERE c.status = 'confirmed'
        AND cg.degree < p_max_degree
        -- Don't go back to the original user
        AND CASE
                WHEN c.user_a_hash = cg.connected_user THEN c.user_b_hash
                ELSE c.user_a_hash
            END != p_user_hash
    )
    SELECT DISTINCT ON (cg2.connected_user)
        cg2.connected_user,
        MIN(cg2.degree) AS degree
    FROM connection_graph cg2
    GROUP BY cg2.connected_user
    ORDER BY cg2.connected_user, degree;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- EXPOSURE CALCULATION HELPERS
-- ============================================

-- Get positive health statuses for users in a list
CREATE OR REPLACE FUNCTION get_exposures_for_users(
    p_user_hashes VARCHAR(64)[]
)
RETURNS TABLE (
    user_hash VARCHAR(64),
    condition condition_type,
    reported_at TIMESTAMPTZ,
    is_cleared BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        hs.user_hash,
        hs.condition_type,
        hs.reported_at,
        (hs.cleared_at IS NOT NULL) AS is_cleared
    FROM health_status hs
    WHERE hs.user_hash = ANY(p_user_hashes)
    AND hs.status = 'positive';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Calculate exposure summary for a user
-- This is the main function used by the batch job
CREATE OR REPLACE FUNCTION calculate_exposure_summary(
    p_user_hash VARCHAR(64),
    p_max_degree INTEGER DEFAULT 3
)
RETURNS JSONB AS $$
DECLARE
    v_connection_count INTEGER;
    v_result JSONB;
BEGIN
    -- Count direct connections
    SELECT COUNT(*) INTO v_connection_count
    FROM connections
    WHERE (user_a_hash = p_user_hash OR user_b_hash = p_user_hash)
    AND status = 'confirmed';

    -- If less than 3 connections, return minimal info
    IF v_connection_count < 3 THEN
        RETURN jsonb_build_object(
            'connection_count', v_connection_count,
            'has_minimum_connections', false,
            'message', 'Add more connections for exposure insights'
        );
    END IF;

    -- Calculate full exposure
    WITH graph AS (
        SELECT * FROM get_connection_graph(p_user_hash, p_max_degree)
    ),
    degree_counts AS (
        SELECT
            degree,
            COUNT(*) as count
        FROM graph
        GROUP BY degree
    ),
    exposures AS (
        SELECT
            g.degree,
            hs.condition_type,
            hs.reported_at,
            (hs.cleared_at IS NOT NULL) as is_cleared
        FROM graph g
        JOIN health_status hs ON g.connected_user = hs.user_hash
        WHERE hs.status = 'positive'
    ),
    exposure_summary AS (
        SELECT
            condition_type,
            COUNT(*) as exposure_count,
            MIN(degree) as closest_degree,
            MAX(reported_at) as most_recent,
            BOOL_AND(is_cleared) as all_cleared
        FROM exposures
        GROUP BY condition_type
    )
    SELECT jsonb_build_object(
        'connection_count', v_connection_count,
        'has_minimum_connections', true,
        'degree_counts', (
            SELECT jsonb_object_agg('degree_' || degree, count)
            FROM degree_counts
        ),
        'exposures', COALESCE((
            SELECT jsonb_agg(jsonb_build_object(
                'condition', condition_type,
                'count', exposure_count,
                'closest_degree', closest_degree,
                'timeframe', CASE
                    WHEN most_recent > NOW() - INTERVAL '30 days' THEN 'recent'
                    ELSE 'older'
                END,
                'status', CASE
                    WHEN all_cleared THEN 'resolved'
                    ELSE 'active'
                END
            ))
            FROM exposure_summary
        ), '[]'::jsonb)
    ) INTO v_result;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- NOTIFICATION HELPERS
-- ============================================

-- Get pending notifications for batch processing
CREATE OR REPLACE FUNCTION get_pending_notifications(
    p_batch_size INTEGER DEFAULT 100
)
RETURNS TABLE (
    id UUID,
    user_hash VARCHAR(64),
    notification_type notification_type,
    payload_encrypted BYTEA,
    scheduled_for TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        n.id,
        n.user_hash,
        n.notification_type,
        n.payload_encrypted,
        n.scheduled_for
    FROM notifications n
    WHERE n.sent_at IS NULL
    AND n.scheduled_for <= NOW()
    ORDER BY n.scheduled_for
    LIMIT p_batch_size
    FOR UPDATE SKIP LOCKED;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mark notifications as sent
CREATE OR REPLACE FUNCTION mark_notifications_sent(
    p_notification_ids UUID[]
)
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    UPDATE notifications
    SET sent_at = NOW()
    WHERE id = ANY(p_notification_ids)
    AND sent_at IS NULL;

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- CLEANUP FUNCTIONS
-- ============================================

-- Expire old pending connection requests
CREATE OR REPLACE FUNCTION expire_old_connection_requests(
    p_days INTEGER DEFAULT 30
)
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    UPDATE connections
    SET status = 'expired',
        responded_at = NOW()
    WHERE status = 'pending'
    AND requested_at < NOW() - (p_days || ' days')::INTERVAL;

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Clean up expired exposure snapshots
CREATE OR REPLACE FUNCTION cleanup_expired_snapshots()
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    DELETE FROM exposure_snapshots
    WHERE expires_at < NOW();

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Clean up old audit logs
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs(
    p_days INTEGER DEFAULT 90
)
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    DELETE FROM audit_log
    WHERE created_at < NOW() - (p_days || ' days')::INTERVAL;

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- STATISTICS FUNCTIONS
-- ============================================

-- Get connection count for a user
CREATE OR REPLACE FUNCTION get_connection_count(p_user_hash VARCHAR(64))
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)
        FROM connections
        WHERE (user_a_hash = p_user_hash OR user_b_hash = p_user_hash)
        AND status = 'confirmed'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON FUNCTION get_connection_graph IS
    'Returns all users connected to the given user up to N degrees of separation';

COMMENT ON FUNCTION calculate_exposure_summary IS
    'Calculates exposure summary for a user, enforcing minimum connection threshold';

COMMENT ON FUNCTION get_pending_notifications IS
    'Returns notifications ready to be sent, with row locking for concurrent processing';

COMMENT ON FUNCTION expire_old_connection_requests IS
    'Marks old pending connection requests as expired';
