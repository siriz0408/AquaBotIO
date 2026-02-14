-- ============================================================================
-- AquaBotAI Performance Optimization Migration
-- Created: February 14, 2026
-- Description: Comprehensive database performance improvements based on
--              Supabase Postgres best practices analysis
-- ============================================================================

-- ============================================================================
-- SECTION 1: SECURITY DEFINER HELPER FUNCTIONS
-- These functions optimize RLS policies by caching auth.uid() and avoiding
-- per-row subquery execution
-- ============================================================================

-- Helper function: Check if user owns a tank (cached, SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.user_owns_tank(tank_uuid UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.tanks
    WHERE id = tank_uuid
    AND user_id = auth.uid()
    AND deleted_at IS NULL
  )
$$;

COMMENT ON FUNCTION public.user_owns_tank IS
  'Optimized RLS helper: checks tank ownership with cached auth.uid()';

-- Helper function: Check if user owns a maintenance task
CREATE OR REPLACE FUNCTION public.user_owns_task(task_uuid UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.maintenance_tasks mt
    JOIN public.tanks t ON t.id = mt.tank_id
    WHERE mt.id = task_uuid
    AND t.user_id = auth.uid()
    AND t.deleted_at IS NULL
  )
$$;

COMMENT ON FUNCTION public.user_owns_task IS
  'Optimized RLS helper: checks maintenance task ownership via tank';

-- Helper function: Get current user ID (cached)
CREATE OR REPLACE FUNCTION public.current_user_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT auth.uid()
$$;

COMMENT ON FUNCTION public.current_user_id IS
  'Cached auth.uid() call to avoid repeated evaluation in RLS policies';

-- Helper function: Check if user is an active admin
CREATE OR REPLACE FUNCTION public.is_active_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.admin_profiles
    WHERE user_id = auth.uid()
    AND is_active = TRUE
  )
$$;

COMMENT ON FUNCTION public.is_active_admin IS
  'Optimized RLS helper: checks if current user is an active admin';

-- ============================================================================
-- SECTION 2: PRIORITY 1 - CRITICAL INDEXES
-- These indexes address the most severe performance bottlenecks
-- ============================================================================

-- 2.1 Subscriptions tier index (for cron jobs querying Pro/Plus users)
-- Note: tier column is on subscriptions table, not users
CREATE INDEX IF NOT EXISTS idx_subscriptions_tier
  ON public.subscriptions(tier)
  WHERE tier IN ('pro', 'plus', 'starter');

COMMENT ON INDEX idx_subscriptions_tier IS
  'Partial index for tier-based cron queries (reports, features)';

-- 2.2 Subscriptions status indexes (for Stripe webhook processing)
CREATE INDEX IF NOT EXISTS idx_subscriptions_status
  ON public.subscriptions(status);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status
  ON public.subscriptions(user_id, status);

-- Grace period index (if column exists - added in pricing strategy migration)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'subscriptions'
    AND column_name = 'grace_period_ends_at'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_subscriptions_grace_period
      ON public.subscriptions(status, grace_period_ends_at)
      WHERE status = ''past_due'' AND grace_period_ends_at IS NOT NULL';
  END IF;
END $$;

COMMENT ON INDEX idx_subscriptions_status IS
  'Index for payment status queries during webhook processing';

-- 2.3 Water parameters composite index (for chart queries)
CREATE INDEX IF NOT EXISTS idx_water_params_tank_measured_desc
  ON public.water_parameters(tank_id, measured_at DESC);

-- Covering index for chart queries - avoids heap lookups
CREATE INDEX IF NOT EXISTS idx_water_params_covering
  ON public.water_parameters(tank_id, measured_at DESC)
  INCLUDE (ph, ammonia_ppm, nitrite_ppm, nitrate_ppm, temperature_f);

COMMENT ON INDEX idx_water_params_covering IS
  'Covering index for chart queries - avoids heap lookups';

-- 2.4 Maintenance tasks for cron notification scheduler
CREATE INDEX IF NOT EXISTS idx_maintenance_tasks_due_notifications
  ON public.maintenance_tasks(next_due_date, is_active)
  WHERE is_active = TRUE AND deleted_at IS NULL;

-- Composite index for tank + due date queries
CREATE INDEX IF NOT EXISTS idx_maintenance_tasks_tank_due
  ON public.maintenance_tasks(tank_id, next_due_date)
  WHERE is_active = TRUE AND deleted_at IS NULL;

COMMENT ON INDEX idx_maintenance_tasks_due_notifications IS
  'Index for cron job finding upcoming maintenance tasks';

-- 2.5 Tanks user + active composite index
CREATE INDEX IF NOT EXISTS idx_tanks_user_active
  ON public.tanks(user_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_tanks_user_deleted
  ON public.tanks(user_id, deleted_at);

COMMENT ON INDEX idx_tanks_user_active IS
  'Partial index for active tanks per user (most common query pattern)';

-- ============================================================================
-- SECTION 3: PRIORITY 2 - HIGH IMPACT INDEXES
-- ============================================================================

-- 3.1 AI usage composite index for tier enforcement
CREATE INDEX IF NOT EXISTS idx_ai_usage_user_date_feature
  ON public.ai_usage(user_id, date, feature);

-- Covering index for tier limit checks - Index Only Scan
CREATE INDEX IF NOT EXISTS idx_ai_usage_covering
  ON public.ai_usage(user_id, date, feature)
  INCLUDE (message_count);

COMMENT ON INDEX idx_ai_usage_covering IS
  'Covering index for tier limit checks - Index Only Scan';

-- 3.2 AI messages indexes (for chat history)
CREATE INDEX IF NOT EXISTS idx_ai_messages_user_created
  ON public.ai_messages(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_messages_tank_created
  ON public.ai_messages(tank_id, created_at DESC);

COMMENT ON INDEX idx_ai_messages_user_created IS
  'Index for loading user chat history sorted by recency';

-- 3.3 Livestock active per tank (with soft-delete support)
CREATE INDEX IF NOT EXISTS idx_livestock_tank_active
  ON public.livestock(tank_id)
  WHERE deleted_at IS NULL AND is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_livestock_species
  ON public.livestock(species_id)
  WHERE deleted_at IS NULL;

COMMENT ON INDEX idx_livestock_tank_active IS
  'Partial index for current (active) livestock per tank';

-- 3.4 Audit logs recent entries (using existing audit_logs table)
CREATE INDEX IF NOT EXISTS idx_audit_logs_recent
  ON public.audit_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_recent
  ON public.audit_logs(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action
  ON public.audit_logs(action, created_at DESC);

COMMENT ON INDEX idx_audit_logs_recent IS
  'Index for admin dashboard recent activity queries';

-- 3.5 Species search optimization
CREATE INDEX IF NOT EXISTS idx_species_type_care
  ON public.species(type, care_level);

CREATE INDEX IF NOT EXISTS idx_species_temperament
  ON public.species(temperament);

COMMENT ON INDEX idx_species_type_care IS
  'Index for filtering species by type and care level';

-- ============================================================================
-- SECTION 4: PRIORITY 3 - MEDIUM IMPACT INDEXES
-- ============================================================================

-- 4.1 Notification preferences (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notification_preferences') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_notification_prefs_user ON public.notification_preferences(user_id)';
  END IF;
END $$;

-- 4.2 Push subscriptions for active devices
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'push_subscriptions') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON public.push_subscriptions(user_id)';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_push_subscriptions_recent ON public.push_subscriptions(user_id, created_at DESC)';
  END IF;
END $$;

-- 4.3 Parameter thresholds composite (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'parameter_thresholds') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_parameter_thresholds_tank_type ON public.parameter_thresholds(tank_id, parameter_type)';
  END IF;
END $$;

-- 4.4 Webhook events for idempotency checks (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'webhook_events') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_webhook_events_event_id ON public.webhook_events(event_id)';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_webhook_events_type_created ON public.webhook_events(event_type, created_at DESC)';
  END IF;
END $$;

-- 4.5 Admin profiles active lookup (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'admin_profiles') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_admin_profiles_active ON public.admin_profiles(user_id) WHERE is_active = TRUE';
  END IF;
END $$;

-- 4.6 Coaching history indexes
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'coaching_history') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_coaching_history_user_created ON public.coaching_history(user_id, created_at DESC)';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_coaching_history_tank ON public.coaching_history(tank_id, created_at DESC) WHERE tank_id IS NOT NULL';
  END IF;
END $$;

-- 4.7 User preferences lookup
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_preferences') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_user_preferences_user ON public.user_preferences(user_id)';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_user_preferences_onboarded ON public.user_preferences(user_id) WHERE onboarding_completed_at IS NOT NULL';
  END IF;
END $$;

-- 4.8 Maintenance logs task lookup
CREATE INDEX IF NOT EXISTS idx_maintenance_logs_task_completed
  ON public.maintenance_logs(task_id, completed_at DESC);

-- 4.9 Photo diagnoses user lookup (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'photo_diagnoses') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_photo_diagnoses_user ON public.photo_diagnoses(user_id, created_at DESC)';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_photo_diagnoses_tank ON public.photo_diagnoses(tank_id, created_at DESC) WHERE tank_id IS NOT NULL';
  END IF;
END $$;

-- 4.10 Equipment tracking (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'equipment') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_equipment_tank_active ON public.equipment(tank_id) WHERE deleted_at IS NULL';
  END IF;
END $$;

-- ============================================================================
-- SECTION 5: OPTIMIZED RLS POLICIES
-- Replace existing policies with optimized versions using helper functions
-- ============================================================================

-- 5.1 Water Parameters - Optimized RLS
DROP POLICY IF EXISTS "Users can view own parameters" ON public.water_parameters;
DROP POLICY IF EXISTS "Users can insert own parameters" ON public.water_parameters;
DROP POLICY IF EXISTS "Users can update own parameters" ON public.water_parameters;
DROP POLICY IF EXISTS "Users can delete own parameters" ON public.water_parameters;

CREATE POLICY "water_params_select_optimized" ON public.water_parameters
  FOR SELECT USING (public.user_owns_tank(tank_id));

CREATE POLICY "water_params_insert_optimized" ON public.water_parameters
  FOR INSERT WITH CHECK (public.user_owns_tank(tank_id));

CREATE POLICY "water_params_update_optimized" ON public.water_parameters
  FOR UPDATE USING (public.user_owns_tank(tank_id));

CREATE POLICY "water_params_delete_optimized" ON public.water_parameters
  FOR DELETE USING (public.user_owns_tank(tank_id));

-- 5.2 Livestock - Optimized RLS
DROP POLICY IF EXISTS "Users can view own livestock" ON public.livestock;
DROP POLICY IF EXISTS "Users can insert own livestock" ON public.livestock;
DROP POLICY IF EXISTS "Users can update own livestock" ON public.livestock;
DROP POLICY IF EXISTS "Users can delete own livestock" ON public.livestock;

CREATE POLICY "livestock_select_optimized" ON public.livestock
  FOR SELECT USING (public.user_owns_tank(tank_id));

CREATE POLICY "livestock_insert_optimized" ON public.livestock
  FOR INSERT WITH CHECK (public.user_owns_tank(tank_id));

CREATE POLICY "livestock_update_optimized" ON public.livestock
  FOR UPDATE USING (public.user_owns_tank(tank_id));

CREATE POLICY "livestock_delete_optimized" ON public.livestock
  FOR DELETE USING (public.user_owns_tank(tank_id));

-- 5.3 Maintenance Tasks - Optimized RLS
DROP POLICY IF EXISTS "Users can view own tasks" ON public.maintenance_tasks;
DROP POLICY IF EXISTS "Users can insert own tasks" ON public.maintenance_tasks;
DROP POLICY IF EXISTS "Users can update own tasks" ON public.maintenance_tasks;
DROP POLICY IF EXISTS "Users can delete own tasks" ON public.maintenance_tasks;

CREATE POLICY "maintenance_tasks_select_optimized" ON public.maintenance_tasks
  FOR SELECT USING (public.user_owns_tank(tank_id));

CREATE POLICY "maintenance_tasks_insert_optimized" ON public.maintenance_tasks
  FOR INSERT WITH CHECK (public.user_owns_tank(tank_id));

CREATE POLICY "maintenance_tasks_update_optimized" ON public.maintenance_tasks
  FOR UPDATE USING (public.user_owns_tank(tank_id));

CREATE POLICY "maintenance_tasks_delete_optimized" ON public.maintenance_tasks
  FOR DELETE USING (public.user_owns_tank(tank_id));

-- 5.4 Maintenance Logs - Optimized RLS
DROP POLICY IF EXISTS "Users can view own logs" ON public.maintenance_logs;
DROP POLICY IF EXISTS "Users can insert own logs" ON public.maintenance_logs;
DROP POLICY IF EXISTS "Users can update own logs" ON public.maintenance_logs;
DROP POLICY IF EXISTS "Users can delete own logs" ON public.maintenance_logs;

CREATE POLICY "maintenance_logs_select_optimized" ON public.maintenance_logs
  FOR SELECT USING (public.user_owns_task(task_id));

CREATE POLICY "maintenance_logs_insert_optimized" ON public.maintenance_logs
  FOR INSERT WITH CHECK (public.user_owns_task(task_id));

CREATE POLICY "maintenance_logs_update_optimized" ON public.maintenance_logs
  FOR UPDATE USING (public.user_owns_task(task_id));

CREATE POLICY "maintenance_logs_delete_optimized" ON public.maintenance_logs
  FOR DELETE USING (public.user_owns_task(task_id));

-- 5.5 AI Messages - Optimized RLS
DROP POLICY IF EXISTS "Users can view own messages" ON public.ai_messages;
DROP POLICY IF EXISTS "Users can insert own messages" ON public.ai_messages;
DROP POLICY IF EXISTS "Users can update own messages" ON public.ai_messages;
DROP POLICY IF EXISTS "Users can delete own messages" ON public.ai_messages;

CREATE POLICY "ai_messages_select_optimized" ON public.ai_messages
  FOR SELECT USING (user_id = public.current_user_id());

CREATE POLICY "ai_messages_insert_optimized" ON public.ai_messages
  FOR INSERT WITH CHECK (user_id = public.current_user_id());

CREATE POLICY "ai_messages_update_optimized" ON public.ai_messages
  FOR UPDATE USING (user_id = public.current_user_id());

CREATE POLICY "ai_messages_delete_optimized" ON public.ai_messages
  FOR DELETE USING (user_id = public.current_user_id());

-- 5.6 AI Usage - Optimized RLS
DROP POLICY IF EXISTS "Users can view own usage" ON public.ai_usage;
DROP POLICY IF EXISTS "Users can insert own usage" ON public.ai_usage;
DROP POLICY IF EXISTS "Users can update own usage" ON public.ai_usage;

CREATE POLICY "ai_usage_select_optimized" ON public.ai_usage
  FOR SELECT USING (user_id = public.current_user_id());

CREATE POLICY "ai_usage_insert_optimized" ON public.ai_usage
  FOR INSERT WITH CHECK (user_id = public.current_user_id());

CREATE POLICY "ai_usage_update_optimized" ON public.ai_usage
  FOR UPDATE USING (user_id = public.current_user_id());

-- ============================================================================
-- SECTION 6: STATISTICS AND ANALYZE
-- Update statistics for the query planner after index creation
-- ============================================================================

-- Analyze tables with new indexes for optimal query planning
ANALYZE public.users;
ANALYZE public.subscriptions;
ANALYZE public.tanks;
ANALYZE public.water_parameters;
ANALYZE public.maintenance_tasks;
ANALYZE public.maintenance_logs;
ANALYZE public.livestock;
ANALYZE public.ai_messages;
ANALYZE public.ai_usage;
ANALYZE public.species;
ANALYZE public.audit_logs;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

COMMENT ON SCHEMA public IS
  'AquaBotAI schema - Performance optimizations applied Feb 14, 2026';
