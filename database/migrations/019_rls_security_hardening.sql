-- Migration 019: RLS Security Hardening
-- Purpose: Enable RLS on all 20 unprotected tables and fix function search_path
-- Addresses all ERRORS and WARNINGS from Supabase security advisor
--
-- ROLLBACK:
-- BEGIN;
-- -- Drop all new policies
-- DROP POLICY IF EXISTS encounter_journal_select_own ON encounter_journal;
-- DROP POLICY IF EXISTS encounter_journal_insert_own ON encounter_journal;
-- DROP POLICY IF EXISTS encounter_journal_update_own ON encounter_journal;
-- DROP POLICY IF EXISTS encounter_journal_delete_own ON encounter_journal;
-- DROP POLICY IF EXISTS journal_field_templates_select_own ON journal_field_templates;
-- DROP POLICY IF EXISTS journal_field_templates_insert_own ON journal_field_templates;
-- DROP POLICY IF EXISTS journal_field_templates_update_own ON journal_field_templates;
-- DROP POLICY IF EXISTS journal_field_templates_delete_own ON journal_field_templates;
-- DROP POLICY IF EXISTS journal_partners_select_own ON journal_partners;
-- DROP POLICY IF EXISTS journal_partners_insert_own ON journal_partners;
-- DROP POLICY IF EXISTS journal_partners_update_own ON journal_partners;
-- DROP POLICY IF EXISTS journal_partners_delete_own ON journal_partners;
-- DROP POLICY IF EXISTS push_subscriptions_select_own ON push_subscriptions;
-- DROP POLICY IF EXISTS push_subscriptions_insert_own ON push_subscriptions;
-- DROP POLICY IF EXISTS push_subscriptions_update_own ON push_subscriptions;
-- DROP POLICY IF EXISTS push_subscriptions_delete_own ON push_subscriptions;
-- DROP POLICY IF EXISTS verification_cards_select_own ON verification_cards;
-- DROP POLICY IF EXISTS verification_cards_insert_own ON verification_cards;
-- DROP POLICY IF EXISTS verification_cards_update_own ON verification_cards;
-- DROP POLICY IF EXISTS verification_cards_delete_own ON verification_cards;
-- DROP POLICY IF EXISTS test_visits_select_own ON test_visits;
-- DROP POLICY IF EXISTS test_visits_insert_own ON test_visits;
-- DROP POLICY IF EXISTS test_visits_update_own ON test_visits;
-- DROP POLICY IF EXISTS test_visits_delete_own ON test_visits;
-- DROP POLICY IF EXISTS labs_select_own ON labs;
-- DROP POLICY IF EXISTS labs_insert_own ON labs;
-- DROP POLICY IF EXISTS labs_update_own ON labs;
-- DROP POLICY IF EXISTS labs_delete_own ON labs;
-- DROP POLICY IF EXISTS lab_credentials_select_own ON lab_credentials;
-- DROP POLICY IF EXISTS lab_credentials_insert_own ON lab_credentials;
-- DROP POLICY IF EXISTS lab_credentials_update_own ON lab_credentials;
-- DROP POLICY IF EXISTS lab_credentials_delete_own ON lab_credentials;
-- DROP POLICY IF EXISTS test_results_select_own ON test_results;
-- DROP POLICY IF EXISTS test_results_insert_own ON test_results;
-- DROP POLICY IF EXISTS test_results_update_own ON test_results;
-- DROP POLICY IF EXISTS test_results_delete_own ON test_results;
-- DROP POLICY IF EXISTS medications_select_own ON medications;
-- DROP POLICY IF EXISTS medications_insert_own ON medications;
-- DROP POLICY IF EXISTS medications_update_own ON medications;
-- DROP POLICY IF EXISTS medications_delete_own ON medications;
-- DROP POLICY IF EXISTS medication_logs_select_own ON medication_logs;
-- DROP POLICY IF EXISTS medication_logs_insert_own ON medication_logs;
-- DROP POLICY IF EXISTS medication_logs_update_own ON medication_logs;
-- DROP POLICY IF EXISTS medication_logs_delete_own ON medication_logs;
-- DROP POLICY IF EXISTS reminder_settings_select_own ON reminder_settings;
-- DROP POLICY IF EXISTS reminder_settings_insert_own ON reminder_settings;
-- DROP POLICY IF EXISTS reminder_settings_update_own ON reminder_settings;
-- DROP POLICY IF EXISTS reminder_settings_delete_own ON reminder_settings;
-- DROP POLICY IF EXISTS vaccinations_select_own ON vaccinations;
-- DROP POLICY IF EXISTS vaccinations_insert_own ON vaccinations;
-- DROP POLICY IF EXISTS vaccinations_update_own ON vaccinations;
-- DROP POLICY IF EXISTS vaccinations_delete_own ON vaccinations;
-- DROP POLICY IF EXISTS reminders_select_own ON reminders;
-- DROP POLICY IF EXISTS reminders_insert_own ON reminders;
-- DROP POLICY IF EXISTS reminders_update_own ON reminders;
-- DROP POLICY IF EXISTS reminders_delete_own ON reminders;
-- DROP POLICY IF EXISTS connection_phone_entries_select_own ON connection_phone_entries;
-- DROP POLICY IF EXISTS connection_phone_entries_insert_own ON connection_phone_entries;
-- DROP POLICY IF EXISTS connection_phone_entries_delete_own ON connection_phone_entries;
-- DROP POLICY IF EXISTS phone_blocks_select_own ON phone_blocks;
-- DROP POLICY IF EXISTS phone_blocks_insert_own ON phone_blocks;
-- DROP POLICY IF EXISTS phone_blocks_delete_own ON phone_blocks;
-- DROP POLICY IF EXISTS phone_reports_insert_own ON phone_reports;
-- DROP POLICY IF EXISTS condition_catalog_select_all ON condition_catalog;
-- DROP POLICY IF EXISTS network_stages_select_all ON network_stages;
-- -- Disable RLS on all 20 tables
-- ALTER TABLE encounter_journal DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE journal_field_templates DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE journal_partners DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE push_subscriptions DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE verification_cards DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE test_visits DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE labs DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE lab_credentials DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE test_results DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE medications DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE medication_logs DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE reminder_settings DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE vaccinations DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE reminders DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE connection_phone_entries DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE phone_blocks DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE phone_reports DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE condition_catalog DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE network_stages DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE app_config DISABLE ROW LEVEL SECURITY;
-- COMMIT;

BEGIN;

-- ============================================================
-- 1. ENABLE RLS ON ALL 20 UNPROTECTED TABLES
-- ============================================================

ALTER TABLE encounter_journal ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_field_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE labs ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminder_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE vaccinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE connection_phone_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE phone_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE phone_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE condition_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE network_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 2. USER-OWNED TABLES — own data only (user_hash match)
-- Backend uses service_role which bypasses RLS.
-- These policies protect against direct PostgREST access.
-- ============================================================

-- encounter_journal
CREATE POLICY encounter_journal_select_own ON encounter_journal
    FOR SELECT USING (user_hash = current_user_hash());
CREATE POLICY encounter_journal_insert_own ON encounter_journal
    FOR INSERT WITH CHECK (user_hash = current_user_hash());
CREATE POLICY encounter_journal_update_own ON encounter_journal
    FOR UPDATE USING (user_hash = current_user_hash());
CREATE POLICY encounter_journal_delete_own ON encounter_journal
    FOR DELETE USING (user_hash = current_user_hash());

-- journal_field_templates
CREATE POLICY journal_field_templates_select_own ON journal_field_templates
    FOR SELECT USING (user_hash = current_user_hash());
CREATE POLICY journal_field_templates_insert_own ON journal_field_templates
    FOR INSERT WITH CHECK (user_hash = current_user_hash());
CREATE POLICY journal_field_templates_update_own ON journal_field_templates
    FOR UPDATE USING (user_hash = current_user_hash());
CREATE POLICY journal_field_templates_delete_own ON journal_field_templates
    FOR DELETE USING (user_hash = current_user_hash());

-- journal_partners
CREATE POLICY journal_partners_select_own ON journal_partners
    FOR SELECT USING (user_hash = current_user_hash());
CREATE POLICY journal_partners_insert_own ON journal_partners
    FOR INSERT WITH CHECK (user_hash = current_user_hash());
CREATE POLICY journal_partners_update_own ON journal_partners
    FOR UPDATE USING (user_hash = current_user_hash());
CREATE POLICY journal_partners_delete_own ON journal_partners
    FOR DELETE USING (user_hash = current_user_hash());

-- push_subscriptions
CREATE POLICY push_subscriptions_select_own ON push_subscriptions
    FOR SELECT USING (user_hash = current_user_hash());
CREATE POLICY push_subscriptions_insert_own ON push_subscriptions
    FOR INSERT WITH CHECK (user_hash = current_user_hash());
CREATE POLICY push_subscriptions_update_own ON push_subscriptions
    FOR UPDATE USING (user_hash = current_user_hash());
CREATE POLICY push_subscriptions_delete_own ON push_subscriptions
    FOR DELETE USING (user_hash = current_user_hash());

-- verification_cards
CREATE POLICY verification_cards_select_own ON verification_cards
    FOR SELECT USING (user_hash = current_user_hash());
CREATE POLICY verification_cards_insert_own ON verification_cards
    FOR INSERT WITH CHECK (user_hash = current_user_hash());
CREATE POLICY verification_cards_update_own ON verification_cards
    FOR UPDATE USING (user_hash = current_user_hash());
CREATE POLICY verification_cards_delete_own ON verification_cards
    FOR DELETE USING (user_hash = current_user_hash());

-- test_visits
CREATE POLICY test_visits_select_own ON test_visits
    FOR SELECT USING (user_hash = current_user_hash());
CREATE POLICY test_visits_insert_own ON test_visits
    FOR INSERT WITH CHECK (user_hash = current_user_hash());
CREATE POLICY test_visits_update_own ON test_visits
    FOR UPDATE USING (user_hash = current_user_hash());
CREATE POLICY test_visits_delete_own ON test_visits
    FOR DELETE USING (user_hash = current_user_hash());

-- labs
CREATE POLICY labs_select_own ON labs
    FOR SELECT USING (user_hash = current_user_hash());
CREATE POLICY labs_insert_own ON labs
    FOR INSERT WITH CHECK (user_hash = current_user_hash());
CREATE POLICY labs_update_own ON labs
    FOR UPDATE USING (user_hash = current_user_hash());
CREATE POLICY labs_delete_own ON labs
    FOR DELETE USING (user_hash = current_user_hash());

-- medications
CREATE POLICY medications_select_own ON medications
    FOR SELECT USING (user_hash = current_user_hash());
CREATE POLICY medications_insert_own ON medications
    FOR INSERT WITH CHECK (user_hash = current_user_hash());
CREATE POLICY medications_update_own ON medications
    FOR UPDATE USING (user_hash = current_user_hash());
CREATE POLICY medications_delete_own ON medications
    FOR DELETE USING (user_hash = current_user_hash());

-- medication_logs
CREATE POLICY medication_logs_select_own ON medication_logs
    FOR SELECT USING (user_hash = current_user_hash());
CREATE POLICY medication_logs_insert_own ON medication_logs
    FOR INSERT WITH CHECK (user_hash = current_user_hash());
CREATE POLICY medication_logs_update_own ON medication_logs
    FOR UPDATE USING (user_hash = current_user_hash());
CREATE POLICY medication_logs_delete_own ON medication_logs
    FOR DELETE USING (user_hash = current_user_hash());

-- reminder_settings
CREATE POLICY reminder_settings_select_own ON reminder_settings
    FOR SELECT USING (user_hash = current_user_hash());
CREATE POLICY reminder_settings_insert_own ON reminder_settings
    FOR INSERT WITH CHECK (user_hash = current_user_hash());
CREATE POLICY reminder_settings_update_own ON reminder_settings
    FOR UPDATE USING (user_hash = current_user_hash());
CREATE POLICY reminder_settings_delete_own ON reminder_settings
    FOR DELETE USING (user_hash = current_user_hash());

-- vaccinations
CREATE POLICY vaccinations_select_own ON vaccinations
    FOR SELECT USING (user_hash = current_user_hash());
CREATE POLICY vaccinations_insert_own ON vaccinations
    FOR INSERT WITH CHECK (user_hash = current_user_hash());
CREATE POLICY vaccinations_update_own ON vaccinations
    FOR UPDATE USING (user_hash = current_user_hash());
CREATE POLICY vaccinations_delete_own ON vaccinations
    FOR DELETE USING (user_hash = current_user_hash());

-- reminders
CREATE POLICY reminders_select_own ON reminders
    FOR SELECT USING (user_hash = current_user_hash());
CREATE POLICY reminders_insert_own ON reminders
    FOR INSERT WITH CHECK (user_hash = current_user_hash());
CREATE POLICY reminders_update_own ON reminders
    FOR UPDATE USING (user_hash = current_user_hash());
CREATE POLICY reminders_delete_own ON reminders
    FOR DELETE USING (user_hash = current_user_hash());

-- connection_phone_entries
CREATE POLICY connection_phone_entries_select_own ON connection_phone_entries
    FOR SELECT USING (user_hash = current_user_hash());
CREATE POLICY connection_phone_entries_insert_own ON connection_phone_entries
    FOR INSERT WITH CHECK (user_hash = current_user_hash());
CREATE POLICY connection_phone_entries_delete_own ON connection_phone_entries
    FOR DELETE USING (user_hash = current_user_hash());

-- phone_blocks
CREATE POLICY phone_blocks_select_own ON phone_blocks
    FOR SELECT USING (user_hash = current_user_hash());
CREATE POLICY phone_blocks_insert_own ON phone_blocks
    FOR INSERT WITH CHECK (user_hash = current_user_hash());
CREATE POLICY phone_blocks_delete_own ON phone_blocks
    FOR DELETE USING (user_hash = current_user_hash());

-- phone_reports (reporter_hash instead of user_hash)
CREATE POLICY phone_reports_insert_own ON phone_reports
    FOR INSERT WITH CHECK (reporter_hash = current_user_hash());

-- ============================================================
-- 3. CHILD TABLES — access via parent ownership
-- These tables don't have user_hash; access is through FK joins.
-- ============================================================

-- lab_credentials: access if user owns the parent lab
CREATE POLICY lab_credentials_select_own ON lab_credentials
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM labs WHERE labs.id = lab_credentials.lab_id
                AND labs.user_hash = current_user_hash())
    );
CREATE POLICY lab_credentials_insert_own ON lab_credentials
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM labs WHERE labs.id = lab_credentials.lab_id
                AND labs.user_hash = current_user_hash())
    );
CREATE POLICY lab_credentials_update_own ON lab_credentials
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM labs WHERE labs.id = lab_credentials.lab_id
                AND labs.user_hash = current_user_hash())
    );
CREATE POLICY lab_credentials_delete_own ON lab_credentials
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM labs WHERE labs.id = lab_credentials.lab_id
                AND labs.user_hash = current_user_hash())
    );

-- test_results: access if user owns the parent test_visit
CREATE POLICY test_results_select_own ON test_results
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM test_visits WHERE test_visits.id = test_results.visit_id
                AND test_visits.user_hash = current_user_hash())
    );
CREATE POLICY test_results_insert_own ON test_results
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM test_visits WHERE test_visits.id = test_results.visit_id
                AND test_visits.user_hash = current_user_hash())
    );
CREATE POLICY test_results_update_own ON test_results
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM test_visits WHERE test_visits.id = test_results.visit_id
                AND test_visits.user_hash = current_user_hash())
    );
CREATE POLICY test_results_delete_own ON test_results
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM test_visits WHERE test_visits.id = test_results.visit_id
                AND test_visits.user_hash = current_user_hash())
    );

-- ============================================================
-- 4. REFERENCE TABLES — read-only for authenticated users
-- condition_catalog and network_stages are public reference data.
-- app_config is service-role only (no user policy).
-- ============================================================

-- condition_catalog: any authenticated user can read
CREATE POLICY condition_catalog_select_all ON condition_catalog
    FOR SELECT USING (auth.role() = 'authenticated');

-- network_stages: any authenticated user can read
CREATE POLICY network_stages_select_all ON network_stages
    FOR SELECT USING (auth.role() = 'authenticated');

-- app_config: NO user policy — service role only
-- (RLS enabled with no policies = locked to service_role)

-- ============================================================
-- 5. FIX FUNCTION SEARCH_PATH — prevent search path injection
-- ============================================================

ALTER FUNCTION public.current_user_hash() SET search_path = public;
ALTER FUNCTION public.get_user_connections(VARCHAR) SET search_path = public;
ALTER FUNCTION public.get_connection_graph(VARCHAR, INTEGER) SET search_path = public;
ALTER FUNCTION public.get_exposures_for_users(VARCHAR[]) SET search_path = public;
ALTER FUNCTION public.calculate_exposure_summary(VARCHAR, INTEGER) SET search_path = public;
ALTER FUNCTION public.expire_old_connections() SET search_path = public;
ALTER FUNCTION public.update_updated_at() SET search_path = public;
ALTER FUNCTION public.get_pending_notifications(INTEGER) SET search_path = public;
ALTER FUNCTION public.mark_notifications_sent(UUID[]) SET search_path = public;
ALTER FUNCTION public.expire_old_connection_requests(INTEGER) SET search_path = public;
ALTER FUNCTION public.cleanup_expired_snapshots() SET search_path = public;
ALTER FUNCTION public.cleanup_old_audit_logs(INTEGER) SET search_path = public;
ALTER FUNCTION public.get_connection_count(VARCHAR) SET search_path = public;

-- ============================================================
-- 6. ADD POLICY FOR AUDIT_LOG (was RLS-enabled but had no policies)
-- audit_log remains service-role only — no user policies needed.
-- The INFO-level advisory is expected: only the backend writes/reads audit logs.
-- ============================================================

COMMIT;
