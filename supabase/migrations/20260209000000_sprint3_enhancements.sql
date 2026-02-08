-- ============================================================================
-- SPRINT 3 ENHANCEMENTS
-- AI Chat Engine + Billing Infrastructure
-- ============================================================================

-- ============================================================================
-- AI USAGE TOKEN TRACKING
-- ============================================================================

-- Function to update token usage counts
CREATE OR REPLACE FUNCTION public.update_ai_token_usage(
  user_uuid UUID,
  input_count INTEGER,
  output_count INTEGER,
  feature_name TEXT DEFAULT 'chat'
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.ai_usage (user_id, date, feature, input_tokens, output_tokens)
  VALUES (user_uuid, CURRENT_DATE, feature_name, input_count, output_count)
  ON CONFLICT (user_id, date, feature)
  DO UPDATE SET
    input_tokens = ai_usage.input_tokens + input_count,
    output_tokens = ai_usage.output_tokens + output_count,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's current daily AI usage
CREATE OR REPLACE FUNCTION public.get_ai_usage_today(
  user_uuid UUID,
  feature_name TEXT DEFAULT 'chat'
)
RETURNS TABLE (
  message_count INTEGER,
  input_tokens INTEGER,
  output_tokens INTEGER,
  daily_limit INTEGER,
  tier TEXT
) AS $$
DECLARE
  user_tier subscription_tier;
  limit_count INTEGER;
BEGIN
  -- Get user's effective tier (considering trial)
  SELECT
    CASE
      WHEN s.status = 'trialing' AND s.trial_ends_at > NOW() THEN 'pro'::subscription_tier
      WHEN s.status = 'active' THEN s.tier
      ELSE 'free'::subscription_tier
    END INTO user_tier
  FROM public.subscriptions s
  WHERE s.user_id = user_uuid;

  IF user_tier IS NULL THEN
    user_tier := 'free';
  END IF;

  -- Get limit for tier
  SELECT CASE user_tier
    WHEN 'free' THEN 10
    WHEN 'starter' THEN 100
    WHEN 'plus' THEN 200
    WHEN 'pro' THEN 999999
  END INTO limit_count;

  -- Return usage data
  RETURN QUERY
  SELECT
    COALESCE(u.message_count, 0)::INTEGER,
    COALESCE(u.input_tokens, 0)::INTEGER,
    COALESCE(u.output_tokens, 0)::INTEGER,
    limit_count,
    user_tier::TEXT
  FROM (SELECT 1) AS dummy
  LEFT JOIN public.ai_usage u
    ON u.user_id = user_uuid
    AND u.date = CURRENT_DATE
    AND u.feature = feature_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- WEBHOOK EVENTS TABLE (Stripe webhook idempotency)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.webhook_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT NOW(),
  payload JSONB NOT NULL,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for quick event_id lookups
CREATE INDEX IF NOT EXISTS idx_webhook_events_event_id ON public.webhook_events(event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_type ON public.webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_events_created_at ON public.webhook_events(created_at);

-- RLS for webhook_events (service role only, no user access)
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

-- No policies = no access for regular users (service role bypasses RLS)

-- ============================================================================
-- STRIPE CUSTOMER ID ON USERS
-- ============================================================================

-- Add stripe_customer_id if not present
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE;

-- Index for Stripe customer lookups
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON public.users(stripe_customer_id);

-- ============================================================================
-- SUBSCRIPTION ENHANCEMENTS
-- ============================================================================

-- Add grace period tracking
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS grace_period_ends_at TIMESTAMPTZ;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS stripe_price_id TEXT;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS billing_interval TEXT CHECK (billing_interval IN ('month', 'year'));

-- ============================================================================
-- AI CONVERSATION SUMMARY
-- ============================================================================

-- Add summary column to ai_messages for conversation summarization
-- Note: Per spec, we store individual messages, not conversations
-- The summary could be stored as a system message or separate table
-- For now, add a metadata column for flexibility
ALTER TABLE public.ai_messages ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.webhook_events IS 'Stripe webhook events for idempotency';
COMMENT ON COLUMN public.users.stripe_customer_id IS 'Stripe customer ID for billing';
COMMENT ON COLUMN public.subscriptions.grace_period_ends_at IS 'End of grace period for failed payments';
COMMENT ON COLUMN public.subscriptions.stripe_price_id IS 'Current Stripe price ID';
COMMENT ON FUNCTION public.update_ai_token_usage IS 'Update token usage counts for AI features';
COMMENT ON FUNCTION public.get_ai_usage_today IS 'Get user AI usage for today with tier limits';
