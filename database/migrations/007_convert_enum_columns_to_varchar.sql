-- Navilla Database Schema
-- Migration 007: Convert enum-backed columns to varchar
-- Purpose: Simplify application mapping by storing enum values as strings

BEGIN;

-- Drop partial indexes that compare enum values
DROP INDEX IF EXISTS idx_connections_pending;
DROP INDEX IF EXISTS idx_health_status_positive;

-- Connections: store uppercase enum names (PENDING, CONFIRMED, ...)
ALTER TABLE connections
    ALTER COLUMN status TYPE VARCHAR(20)
    USING UPPER(status::text);

-- Health status: store uppercase enum names (CHLAMYDIA, POSITIVE, ...)
ALTER TABLE health_status
    ALTER COLUMN condition_type TYPE VARCHAR(32)
    USING UPPER(condition_type::text);

ALTER TABLE health_status
    ALTER COLUMN status TYPE VARCHAR(16)
    USING UPPER(status::text);

-- Notifications: store uppercase enum names
ALTER TABLE notifications
    ALTER COLUMN notification_type TYPE VARCHAR(32)
    USING UPPER(notification_type::text);

-- Recreate partial indexes using varchar values
CREATE INDEX idx_connections_pending ON connections(user_b_hash, status)
    WHERE status = 'PENDING';

CREATE INDEX idx_health_status_positive ON health_status(user_hash, condition_type)
    WHERE status = 'POSITIVE' AND cleared_at IS NULL;

-- Refresh functions that compare status values
DROP FUNCTION IF EXISTS get_user_connections(VARCHAR);
DROP FUNCTION IF EXISTS get_connection_graph(VARCHAR, INTEGER);
DROP FUNCTION IF EXISTS get_exposures_for_users(VARCHAR[]);
DROP FUNCTION IF EXISTS calculate_exposure_summary(VARCHAR, INTEGER);
DROP FUNCTION IF EXISTS expire_old_connections();

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
    AND status = 'CONFIRMED';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
        SELECT
            CASE
                WHEN c.user_a_hash = p_user_hash THEN c.user_b_hash
                ELSE c.user_a_hash
            END AS connected_user,
            1 AS degree
        FROM connections c
        WHERE (c.user_a_hash = p_user_hash OR c.user_b_hash = p_user_hash)
        AND c.status = 'CONFIRMED'

        UNION

        SELECT
            CASE
                WHEN c.user_a_hash = cg.connected_user THEN c.user_b_hash
                ELSE c.user_a_hash
            END AS connected_user,
            cg.degree + 1 AS degree
        FROM connections c
        INNER JOIN connection_graph cg ON
            (c.user_a_hash = cg.connected_user OR c.user_b_hash = cg.connected_user)
        WHERE c.status = 'CONFIRMED'
        AND cg.degree < p_max_degree
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

CREATE OR REPLACE FUNCTION get_exposures_for_users(
    p_user_hashes VARCHAR(64)[]
)
RETURNS TABLE (
    user_hash VARCHAR(64),
    condition VARCHAR(32),
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
    AND hs.status = 'POSITIVE';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION calculate_exposure_summary(
    p_user_hash VARCHAR(64),
    p_max_degree INTEGER DEFAULT 3
)
RETURNS JSONB AS $$
DECLARE
    v_connection_count INTEGER;
    v_result JSONB;
BEGIN
    SELECT COUNT(*) INTO v_connection_count
    FROM connections
    WHERE (user_a_hash = p_user_hash OR user_b_hash = p_user_hash)
    AND status = 'CONFIRMED';

    IF v_connection_count < 3 THEN
        RETURN jsonb_build_object(
            'connection_count', v_connection_count,
            'has_minimum_connections', false,
            'message', 'Add more connections for exposure insights'
        );
    END IF;

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
        WHERE hs.status = 'POSITIVE'
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

CREATE OR REPLACE FUNCTION expire_old_connections()
RETURNS VOID AS $$
BEGIN
    UPDATE connections
    SET status = 'EXPIRED',
        responded_at = NOW()
    WHERE status = 'PENDING'
      AND requested_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
