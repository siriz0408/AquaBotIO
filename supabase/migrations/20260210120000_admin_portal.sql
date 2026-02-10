-- ============================================================================
-- Admin Portal Phase 1 MVP Database Schema
-- Created: February 10, 2026
-- Description: Admin tables for user management, audit logging, feature flags, and tier config
-- Spec: 13_Admin_Portal_Management_Spec.md
-- ============================================================================

-- ============================================================================
-- ENUMS
-- ============================================================================

-- Admin role enum
CREATE TYPE admin_role AS ENUM (
  'super_admin',    -- Full access to all admin functions
  'content_admin',  -- CRUD species, equipment, prompts
  'support_admin'   -- User management, subscriptions
);

-- Admin action enum for audit logging
CREATE TYPE admin_action_type AS ENUM (
  -- User management
  'user_viewed',
  'user_updated',
  'user_suspended',
  'user_unsuspended',
  'user_deleted',
  -- Subscription management
  'subscription_updated',
  'subscription_tier_changed',
  'subscription_trial_extended',
  'subscription_credits_issued',
  -- Feature flags
  'feature_flag_created',
  'feature_flag_updated',
  'feature_flag_deleted',
  -- Tier config
  'tier_config_updated',
  -- Content management
  'species_created',
  'species_updated',
  'species_deleted',
  'equipment_created',
  'equipment_updated',
  'equipment_deleted',
  -- Admin management
  'admin_created',
  'admin_updated',
  'admin_deleted',
  -- System
  'system_config_updated'
);

-- Feature flag scope enum
CREATE TYPE feature_flag_scope AS ENUM ('global', 'tier_specific');

-- ============================================================================
-- ADMIN_USERS TABLE
-- Links auth.users to admin roles
-- ============================================================================

CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role admin_role NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  invited_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_admin_users_user_id ON admin_users(user_id);
CREATE INDEX idx_admin_users_role ON admin_users(role);
CREATE INDEX idx_admin_users_is_active ON admin_users(is_active) WHERE is_active = TRUE;

-- Comment
COMMENT ON TABLE admin_users IS 'Admin role assignments for platform management (Spec 13)';

-- ============================================================================
-- ADMIN_AUDIT_LOG TABLE
-- Immutable log of all admin actions
-- ============================================================================

CREATE TABLE IF NOT EXISTS admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  action admin_action_type NOT NULL,
  target_type TEXT NOT NULL, -- 'user', 'subscription', 'species', 'feature_flag', 'tier_config', etc.
  target_id TEXT, -- UUID or other identifier of the target entity
  old_value JSONB, -- Previous state (null for creates)
  new_value JSONB, -- New state (null for deletes)
  reason TEXT, -- Optional reason for the action
  ip_address INET,
  user_agent TEXT,
  request_id TEXT, -- For tracing
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  -- Note: No updated_at - this table is append-only
);

-- Indexes for efficient querying
CREATE INDEX idx_admin_audit_log_admin_user_id ON admin_audit_log(admin_user_id);
CREATE INDEX idx_admin_audit_log_action ON admin_audit_log(action);
CREATE INDEX idx_admin_audit_log_target ON admin_audit_log(target_type, target_id);
CREATE INDEX idx_admin_audit_log_created_at ON admin_audit_log(created_at DESC);

-- Composite index for common queries
CREATE INDEX idx_admin_audit_log_admin_created ON admin_audit_log(admin_user_id, created_at DESC);

-- Comment
COMMENT ON TABLE admin_audit_log IS 'Immutable audit trail of all admin actions (Spec 13)';

-- ============================================================================
-- FEATURE_FLAGS TABLE
-- Toggle features on/off per tier or globally
-- ============================================================================

CREATE TABLE IF NOT EXISTS feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  is_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  scope feature_flag_scope NOT NULL DEFAULT 'global',
  -- For tier_specific scope, specifies which tiers have access
  enabled_tiers TEXT[] DEFAULT '{}', -- Array of tier names: ['starter', 'plus', 'pro']
  rollout_percent INTEGER DEFAULT 100 CHECK (rollout_percent >= 0 AND rollout_percent <= 100),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_feature_flags_name ON feature_flags(name);
CREATE INDEX idx_feature_flags_is_enabled ON feature_flags(is_enabled) WHERE is_enabled = TRUE;
CREATE INDEX idx_feature_flags_scope ON feature_flags(scope);

-- Comment
COMMENT ON TABLE feature_flags IS 'Feature flags for gradual rollout and tier-based access (Spec 13)';

-- ============================================================================
-- TIER_CONFIG TABLE
-- Configurable tier limits
-- ============================================================================

CREATE TABLE IF NOT EXISTS tier_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier VARCHAR(20) NOT NULL UNIQUE CHECK (tier IN ('free', 'starter', 'plus', 'pro')),
  display_name VARCHAR(50) NOT NULL,
  price_monthly_cents INTEGER NOT NULL DEFAULT 0,
  -- Limits
  max_tanks INTEGER NOT NULL DEFAULT 1,
  daily_ai_messages INTEGER NOT NULL DEFAULT 10,
  daily_photo_diagnoses INTEGER NOT NULL DEFAULT 0,
  daily_equipment_recs INTEGER NOT NULL DEFAULT 0,
  -- Feature access (JSON array of feature names)
  features_enabled JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- Metadata
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unique constraint on sort_order for tier ordering
CREATE INDEX idx_tier_config_tier ON tier_config(tier);
CREATE INDEX idx_tier_config_sort_order ON tier_config(sort_order) WHERE is_active = TRUE;

-- Comment
COMMENT ON TABLE tier_config IS 'Configurable subscription tier limits (Spec 13)';

-- Seed default tier configuration
INSERT INTO tier_config (tier, display_name, price_monthly_cents, max_tanks, daily_ai_messages, daily_photo_diagnoses, daily_equipment_recs, features_enabled, sort_order)
VALUES
  ('free', 'Free', 0, 1, 10, 0, 0, '["parameter_tracking", "species_database", "livestock_management", "basic_dashboard"]'::jsonb, 0),
  ('starter', 'Starter', 399, 1, 100, 0, 0, '["parameter_tracking", "species_database", "livestock_management", "basic_dashboard"]'::jsonb, 1),
  ('plus', 'Plus', 799, 5, 200, 10, 0, '["parameter_tracking", "species_database", "livestock_management", "full_dashboard", "photo_diagnosis", "equipment_tracking"]'::jsonb, 2),
  ('pro', 'Pro', 1499, 999999, 999999, 30, 10, '["parameter_tracking", "species_database", "livestock_management", "advanced_dashboard", "photo_diagnosis", "equipment_tracking", "equipment_recommendations", "email_reports", "multi_tank_comparison"]'::jsonb, 3)
ON CONFLICT (tier) DO NOTHING;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on all admin tables
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE tier_config ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES: admin_users
-- Only admins can read admin_users table
-- ============================================================================

-- Admins can view the admin_users table
CREATE POLICY "Admins can view admin users"
  ON admin_users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.user_id = auth.uid() AND au.is_active = TRUE
    )
  );

-- Only super_admin can insert new admin users
CREATE POLICY "Super admins can create admin users"
  ON admin_users FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.user_id = auth.uid() AND au.is_active = TRUE AND au.role = 'super_admin'
    )
  );

-- Only super_admin can update admin users
CREATE POLICY "Super admins can update admin users"
  ON admin_users FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.user_id = auth.uid() AND au.is_active = TRUE AND au.role = 'super_admin'
    )
  );

-- Only super_admin can delete admin users
CREATE POLICY "Super admins can delete admin users"
  ON admin_users FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.user_id = auth.uid() AND au.is_active = TRUE AND au.role = 'super_admin'
    )
  );

-- ============================================================================
-- RLS POLICIES: admin_audit_log
-- Admin read-only, no user writes (service role only)
-- ============================================================================

-- Admins can read audit log (super_admin can see all, others see their own)
CREATE POLICY "Admins can view audit log"
  ON admin_audit_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.user_id = auth.uid() AND au.is_active = TRUE
      AND (au.role = 'super_admin' OR admin_audit_log.admin_user_id = auth.uid())
    )
  );

-- No INSERT policy for regular users - only service role can write
-- This ensures audit log is append-only and tamper-proof
-- Note: Service role key bypasses RLS

-- No UPDATE or DELETE policies - audit log is immutable

-- ============================================================================
-- RLS POLICIES: feature_flags
-- Admins can read/write, authenticated users can read
-- ============================================================================

-- Any authenticated user can read feature flags (for feature checking)
CREATE POLICY "Authenticated users can read feature flags"
  ON feature_flags FOR SELECT
  USING (auth.role() = 'authenticated');

-- Only super_admin can create feature flags
CREATE POLICY "Super admins can create feature flags"
  ON feature_flags FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.user_id = auth.uid() AND au.is_active = TRUE AND au.role = 'super_admin'
    )
  );

-- Only super_admin can update feature flags
CREATE POLICY "Super admins can update feature flags"
  ON feature_flags FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.user_id = auth.uid() AND au.is_active = TRUE AND au.role = 'super_admin'
    )
  );

-- Only super_admin can delete feature flags
CREATE POLICY "Super admins can delete feature flags"
  ON feature_flags FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.user_id = auth.uid() AND au.is_active = TRUE AND au.role = 'super_admin'
    )
  );

-- ============================================================================
-- RLS POLICIES: tier_config
-- Admins can read/write, authenticated users can read
-- ============================================================================

-- Any authenticated user can read tier config (for displaying pricing/limits)
CREATE POLICY "Authenticated users can read tier config"
  ON tier_config FOR SELECT
  USING (auth.role() = 'authenticated');

-- Only super_admin can update tier config
CREATE POLICY "Super admins can update tier config"
  ON tier_config FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.user_id = auth.uid() AND au.is_active = TRUE AND au.role = 'super_admin'
    )
  );

-- Prevent deletion of tier config (use is_active flag instead)
-- No DELETE policy

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to check if a user is an admin with a specific role
CREATE OR REPLACE FUNCTION public.is_admin(user_uuid UUID, required_role admin_role DEFAULT NULL)
RETURNS BOOLEAN AS $$
BEGIN
  IF required_role IS NULL THEN
    -- Check if user is any type of admin
    RETURN EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = user_uuid AND is_active = TRUE
    );
  ELSE
    -- Check if user has the specific role or higher
    RETURN EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = user_uuid AND is_active = TRUE
      AND (
        role = required_role
        OR role = 'super_admin' -- Super admin can do anything
      )
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get admin role for a user
CREATE OR REPLACE FUNCTION public.get_admin_role(user_uuid UUID)
RETURNS admin_role AS $$
DECLARE
  user_role admin_role;
BEGIN
  SELECT role INTO user_role
  FROM admin_users
  WHERE user_id = user_uuid AND is_active = TRUE;

  RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check feature flag status for a user
CREATE OR REPLACE FUNCTION public.is_feature_enabled(
  feature_name TEXT,
  user_uuid UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  flag_record RECORD;
  user_tier TEXT;
BEGIN
  -- Get the feature flag
  SELECT * INTO flag_record
  FROM feature_flags
  WHERE name = feature_name;

  -- If flag doesn't exist, feature is disabled
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- If flag is disabled, return false
  IF NOT flag_record.is_enabled THEN
    RETURN FALSE;
  END IF;

  -- If scope is global, check rollout percentage
  IF flag_record.scope = 'global' THEN
    -- For rollout_percent < 100, use user_id hash for consistent bucketing
    IF flag_record.rollout_percent < 100 AND user_uuid IS NOT NULL THEN
      RETURN (abs(hashtext(user_uuid::text)) % 100) < flag_record.rollout_percent;
    END IF;
    RETURN TRUE;
  END IF;

  -- If scope is tier_specific, check user's tier
  IF flag_record.scope = 'tier_specific' AND user_uuid IS NOT NULL THEN
    SELECT tier::text INTO user_tier
    FROM subscriptions
    WHERE user_id = user_uuid;

    IF user_tier IS NULL THEN
      user_tier := 'free';
    END IF;

    RETURN user_tier = ANY(flag_record.enabled_tiers);
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get tier limits from tier_config table
CREATE OR REPLACE FUNCTION public.get_tier_limits_v2(user_uuid UUID)
RETURNS TABLE (
  tier_name TEXT,
  tanks_limit INTEGER,
  ai_messages_limit INTEGER,
  photo_diagnosis_limit INTEGER,
  equipment_recs_limit INTEGER,
  features JSONB
) AS $$
DECLARE
  user_tier TEXT;
BEGIN
  -- Get user's current tier
  SELECT s.tier::text INTO user_tier
  FROM subscriptions s
  WHERE s.user_id = user_uuid;

  IF user_tier IS NULL THEN
    user_tier := 'free';
  END IF;

  -- Return limits from tier_config
  RETURN QUERY
  SELECT
    tc.tier,
    tc.max_tanks,
    tc.daily_ai_messages,
    tc.daily_photo_diagnoses,
    tc.daily_equipment_recs,
    tc.features_enabled
  FROM tier_config tc
  WHERE tc.tier = user_tier AND tc.is_active = TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Updated_at trigger for admin_users
CREATE TRIGGER update_admin_users_updated_at
  BEFORE UPDATE ON admin_users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Updated_at trigger for feature_flags
CREATE TRIGGER update_feature_flags_updated_at
  BEFORE UPDATE ON feature_flags
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Updated_at trigger for tier_config
CREATE TRIGGER update_tier_config_updated_at
  BEFORE UPDATE ON tier_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================================
-- SEED DEFAULT FEATURE FLAGS
-- ============================================================================

INSERT INTO feature_flags (name, description, is_enabled, scope, enabled_tiers)
VALUES
  ('photo_diagnosis', 'AI-powered photo diagnosis for fish health', TRUE, 'tier_specific', ARRAY['plus', 'pro']),
  ('equipment_tracking', 'Track aquarium equipment and lifespan', TRUE, 'tier_specific', ARRAY['plus', 'pro']),
  ('equipment_recommendations', 'AI equipment purchase recommendations via web search', TRUE, 'tier_specific', ARRAY['pro']),
  ('email_reports', 'Automated email health reports', TRUE, 'tier_specific', ARRAY['pro']),
  ('multi_tank_comparison', 'Compare parameters across multiple tanks', TRUE, 'tier_specific', ARRAY['pro']),
  ('ai_streaming', 'Stream AI responses in real-time', TRUE, 'global', '{}'),
  ('proactive_alerts', 'AI-generated proactive health alerts', TRUE, 'global', '{}'),
  ('maintenance_mode', 'System-wide maintenance mode', FALSE, 'global', '{}')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- GRANT SERVICE ROLE ACCESS FOR AUDIT LOGGING
-- Note: Service role can bypass RLS, which we need for admin audit logging
-- ============================================================================

-- Ensure service role can write to audit log
-- (This happens automatically as service role bypasses RLS)
COMMENT ON POLICY "Admins can view audit log" ON admin_audit_log IS 'Admin read-only policy. Writes must use service role key to bypass RLS.';
