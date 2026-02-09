-- ============================================================================
-- Pricing Strategy Schema Updates (Spec 18)
-- Created: February 9, 2026
-- Description: Add billing_interval, stripe_price_id, tier_override columns
--              Update trial duration from 14 to 7 days for new subscriptions
-- ============================================================================

-- ============================================================================
-- R-018.5: Schema Fixes - Add missing columns to subscriptions table
-- ============================================================================

-- Add billing_interval column to support future annual billing
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS billing_interval TEXT DEFAULT 'monthly'
    CHECK (billing_interval IN ('monthly', 'annual'));

-- Add stripe_price_id to track which specific price was used
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS stripe_price_id TEXT;

-- Add tier_override for admin/beta tester access (R-018.4)
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS tier_override subscription_tier DEFAULT NULL;

-- Add override_reason to document why override was granted
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS override_reason TEXT DEFAULT NULL;

-- Add override_expires_at for time-limited overrides (e.g., beta testers)
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS override_expires_at TIMESTAMPTZ DEFAULT NULL;

-- Add grace_period_ends_at for failed payment handling
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS grace_period_ends_at TIMESTAMPTZ DEFAULT NULL;

-- ============================================================================
-- R-018.2: Update trial duration from 14 to 7 days for NEW subscriptions
-- Note: This only affects subscriptions created AFTER this migration
-- Existing subscriptions retain their original trial_ends_at values
-- ============================================================================

-- Update the default for new rows
ALTER TABLE public.subscriptions
  ALTER COLUMN trial_ends_at SET DEFAULT (NOW() + INTERVAL '7 days');

-- Update the auto-subscription trigger to use 7 days
CREATE OR REPLACE FUNCTION public.handle_new_user_subscription()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.subscriptions (user_id, tier, status, trial_ends_at)
  VALUES (NEW.id, 'free', 'trialing', NOW() + INTERVAL '7 days');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- R-018.4: Create admin_profiles table if it doesn't exist
-- Required for tier resolution priority chain
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.admin_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'ops_admin', 'content_admin', 'support_admin', 'analytics_viewer')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  granted_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on admin_profiles
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;

-- Admins can read their own profile
CREATE POLICY IF NOT EXISTS "Admins can view own profile" ON public.admin_profiles
  FOR SELECT USING (auth.uid() = user_id);

-- Create index for user_id lookups
CREATE INDEX IF NOT EXISTS idx_admin_profiles_user_id ON public.admin_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_profiles_active ON public.admin_profiles(user_id, is_active) WHERE is_active = true;

-- Add updated_at trigger for admin_profiles
DROP TRIGGER IF EXISTS update_admin_profiles_updated_at ON public.admin_profiles;
CREATE TRIGGER update_admin_profiles_updated_at BEFORE UPDATE ON public.admin_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================================
-- Update check_and_increment_ai_usage function with new tier limits (R-018.1)
-- Free: 0 messages, Starter: 10, Plus: 100, Pro: 500
-- ============================================================================

CREATE OR REPLACE FUNCTION public.check_and_increment_ai_usage(
  user_uuid UUID,
  feature_name TEXT DEFAULT 'chat'
)
RETURNS BOOLEAN AS $$
DECLARE
  current_count INTEGER;
  limit_count INTEGER;
  user_tier subscription_tier;
  user_sub RECORD;
  is_admin BOOLEAN;
BEGIN
  -- Check if user is an admin (admin_profiles.is_active = true)
  SELECT EXISTS(
    SELECT 1 FROM public.admin_profiles
    WHERE user_id = user_uuid AND is_active = true
  ) INTO is_admin;

  -- Admins get unlimited access
  IF is_admin THEN
    -- Still track usage but don't enforce limits
    INSERT INTO public.ai_usage (user_id, date, feature, message_count)
    VALUES (user_uuid, CURRENT_DATE, feature_name, 1)
    ON CONFLICT (user_id, date, feature)
    DO UPDATE SET message_count = ai_usage.message_count + 1, updated_at = NOW();
    RETURN TRUE;
  END IF;

  -- Get user's subscription with override info
  SELECT tier, status, trial_ends_at, tier_override, override_expires_at
  INTO user_sub
  FROM public.subscriptions
  WHERE user_id = user_uuid;

  -- Default to free if no subscription
  IF user_sub IS NULL THEN
    user_tier := 'free';
  ELSE
    -- Check tier_override first
    IF user_sub.tier_override IS NOT NULL AND (
      user_sub.override_expires_at IS NULL OR
      user_sub.override_expires_at > NOW()
    ) THEN
      user_tier := user_sub.tier_override;
    -- Check if in active trial
    ELSIF user_sub.status = 'trialing' AND
          user_sub.trial_ends_at IS NOT NULL AND
          user_sub.trial_ends_at > NOW() THEN
      user_tier := 'pro'; -- Trial gets Pro access
    ELSIF user_sub.status = 'active' THEN
      user_tier := user_sub.tier;
    ELSE
      user_tier := 'free';
    END IF;
  END IF;

  -- Get limit based on tier (Spec 18 updated limits)
  SELECT
    CASE user_tier
      WHEN 'free' THEN 0       -- Changed from 10
      WHEN 'starter' THEN 10   -- Changed from 100
      WHEN 'plus' THEN 100     -- Changed from 200
      WHEN 'pro' THEN 500      -- Changed from 999999
    END INTO limit_count;

  -- Get current count for today
  SELECT COALESCE(message_count, 0) INTO current_count
  FROM public.ai_usage
  WHERE user_id = user_uuid AND date = CURRENT_DATE AND feature = feature_name;

  -- Check if under limit
  IF current_count >= limit_count THEN
    RETURN FALSE;
  END IF;

  -- Increment or insert
  INSERT INTO public.ai_usage (user_id, date, feature, message_count)
  VALUES (user_uuid, CURRENT_DATE, feature_name, 1)
  ON CONFLICT (user_id, date, feature)
  DO UPDATE SET message_count = ai_usage.message_count + 1, updated_at = NOW();

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Update get_tier_limits function with new limits (R-018.1)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_tier_limits(user_uuid UUID)
RETURNS TABLE (
  tanks_limit INTEGER,
  ai_messages_limit INTEGER,
  photo_diagnosis_limit INTEGER,
  equipment_recs_limit INTEGER
) AS $$
DECLARE
  user_tier subscription_tier;
  user_sub RECORD;
  is_admin BOOLEAN;
BEGIN
  -- Check if user is an admin
  SELECT EXISTS(
    SELECT 1 FROM public.admin_profiles
    WHERE user_id = user_uuid AND is_active = true
  ) INTO is_admin;

  IF is_admin THEN
    user_tier := 'pro';
  ELSE
    -- Get subscription with override info
    SELECT s.tier, s.status, s.trial_ends_at, s.tier_override, s.override_expires_at
    INTO user_sub
    FROM public.subscriptions s
    WHERE s.user_id = user_uuid;

    IF user_sub IS NULL THEN
      user_tier := 'free';
    ELSIF user_sub.tier_override IS NOT NULL AND (
      user_sub.override_expires_at IS NULL OR
      user_sub.override_expires_at > NOW()
    ) THEN
      user_tier := user_sub.tier_override;
    ELSIF user_sub.status = 'trialing' AND
          user_sub.trial_ends_at IS NOT NULL AND
          user_sub.trial_ends_at > NOW() THEN
      user_tier := 'pro';
    ELSIF user_sub.status = 'active' THEN
      user_tier := user_sub.tier;
    ELSE
      user_tier := 'free';
    END IF;
  END IF;

  RETURN QUERY SELECT
    CASE user_tier
      WHEN 'free' THEN 1
      WHEN 'starter' THEN 2      -- Changed from 1
      WHEN 'plus' THEN 5
      WHEN 'pro' THEN 999999
    END::INTEGER,
    CASE user_tier
      WHEN 'free' THEN 0         -- Changed from 10
      WHEN 'starter' THEN 10     -- Changed from 100
      WHEN 'plus' THEN 100       -- Changed from 200
      WHEN 'pro' THEN 500        -- Changed from 999999
    END::INTEGER,
    CASE user_tier
      WHEN 'free' THEN 0
      WHEN 'starter' THEN 0
      WHEN 'plus' THEN 10
      WHEN 'pro' THEN 30
    END::INTEGER,
    CASE user_tier
      WHEN 'free' THEN 0
      WHEN 'starter' THEN 0
      WHEN 'plus' THEN 0
      WHEN 'pro' THEN 10
    END::INTEGER;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Add indexes for new columns
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_subscriptions_tier_override
  ON public.subscriptions(tier_override)
  WHERE tier_override IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_subscriptions_override_expires
  ON public.subscriptions(override_expires_at)
  WHERE override_expires_at IS NOT NULL;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON COLUMN public.subscriptions.billing_interval IS 'Monthly or annual billing period';
COMMENT ON COLUMN public.subscriptions.stripe_price_id IS 'Stripe price ID used for this subscription';
COMMENT ON COLUMN public.subscriptions.tier_override IS 'Admin/beta override - bypasses normal tier';
COMMENT ON COLUMN public.subscriptions.override_reason IS 'Why override exists (admin, beta_tester, vip, etc.)';
COMMENT ON COLUMN public.subscriptions.override_expires_at IS 'When override expires (NULL = permanent)';
COMMENT ON COLUMN public.subscriptions.grace_period_ends_at IS 'End of grace period after payment failure';
COMMENT ON TABLE public.admin_profiles IS 'Admin role assignments for platform management';
