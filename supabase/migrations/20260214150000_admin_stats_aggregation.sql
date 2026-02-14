-- ============================================================================
-- Admin Stats Aggregation Functions
-- Created: February 14, 2026
-- Description: RPC functions for efficient admin dashboard statistics
--              Replaces inefficient fetch-all-then-count patterns with
--              database-level aggregation
-- ============================================================================

-- ============================================================================
-- SECTION 1: Subscription Tier Distribution
-- ============================================================================

-- Function to get subscription counts by tier using GROUP BY
-- This replaces fetching all rows and counting in JavaScript
CREATE OR REPLACE FUNCTION public.get_subscription_tier_counts()
RETURNS TABLE(
  tier TEXT,
  count BIGINT
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    COALESCE(s.tier, 'free') AS tier,
    COUNT(*) AS count
  FROM public.subscriptions s
  GROUP BY s.tier
$$;

COMMENT ON FUNCTION public.get_subscription_tier_counts IS
  'Returns subscription counts grouped by tier for admin dashboard. Uses GROUP BY for O(1) memory instead of O(n).';

-- ============================================================================
-- SECTION 2: AI Usage Aggregation
-- ============================================================================

-- Function to get aggregated AI message counts for a date range
-- More efficient than fetching all rows and summing in JavaScript
CREATE OR REPLACE FUNCTION public.get_ai_usage_stats(
  start_date DATE,
  end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
  total_messages BIGINT,
  total_input_tokens BIGINT,
  total_output_tokens BIGINT
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    COALESCE(SUM(message_count), 0)::BIGINT AS total_messages,
    COALESCE(SUM(input_tokens), 0)::BIGINT AS total_input_tokens,
    COALESCE(SUM(output_tokens), 0)::BIGINT AS total_output_tokens
  FROM public.ai_usage
  WHERE feature = 'chat'
    AND date >= start_date
    AND date <= end_date
$$;

COMMENT ON FUNCTION public.get_ai_usage_stats IS
  'Returns aggregated AI usage statistics for a date range. Single row result instead of fetching all usage records.';

-- ============================================================================
-- SECTION 3: Combined Admin Stats Function
-- ============================================================================

-- All-in-one function for admin dashboard stats
-- Returns a JSON object with all statistics in a single database round-trip
CREATE OR REPLACE FUNCTION public.get_admin_dashboard_stats()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  result JSONB;
  today DATE := CURRENT_DATE;
  week_ago DATE := CURRENT_DATE - INTERVAL '7 days';
  month_ago DATE := CURRENT_DATE - INTERVAL '30 days';
BEGIN
  SELECT jsonb_build_object(
    'users', jsonb_build_object(
      'total', (SELECT COUNT(*) FROM public.users),
      'new_today', (SELECT COUNT(*) FROM public.users WHERE created_at::DATE = today),
      'new_this_week', (SELECT COUNT(*) FROM public.users WHERE created_at::DATE >= week_ago),
      'new_this_month', (SELECT COUNT(*) FROM public.users WHERE created_at::DATE >= month_ago),
      'active_today', (SELECT COUNT(*) FROM public.users WHERE updated_at::DATE = today),
      'active_this_week', (SELECT COUNT(*) FROM public.users WHERE updated_at::DATE >= week_ago),
      'active_this_month', (SELECT COUNT(*) FROM public.users WHERE updated_at::DATE >= month_ago)
    ),
    'subscriptions', (
      SELECT jsonb_object_agg(
        COALESCE(tier, 'unknown'),
        tier_count
      )
      FROM (
        SELECT tier, COUNT(*) AS tier_count
        FROM public.subscriptions
        GROUP BY tier
      ) tier_counts
    ),
    'subscriptions_status', jsonb_build_object(
      'trialing', (SELECT COUNT(*) FROM public.subscriptions WHERE status = 'trialing'),
      'past_due', (SELECT COUNT(*) FROM public.subscriptions WHERE status = 'past_due'),
      'active', (SELECT COUNT(*) FROM public.subscriptions WHERE status = 'active')
    ),
    'ai_usage', jsonb_build_object(
      'messages_today', (
        SELECT COALESCE(SUM(message_count), 0)
        FROM public.ai_usage
        WHERE feature = 'chat' AND date = today
      ),
      'messages_this_week', (
        SELECT COALESCE(SUM(message_count), 0)
        FROM public.ai_usage
        WHERE feature = 'chat' AND date >= week_ago
      ),
      'messages_this_month', (
        SELECT COALESCE(SUM(message_count), 0)
        FROM public.ai_usage
        WHERE feature = 'chat' AND date >= month_ago
      )
    ),
    'generated_at', NOW()
  ) INTO result;

  RETURN result;
END;
$$;

COMMENT ON FUNCTION public.get_admin_dashboard_stats IS
  'Returns all admin dashboard statistics in a single database call. Significantly more efficient than multiple round-trips.';

-- ============================================================================
-- SECTION 4: Grant Permissions
-- ============================================================================

-- These functions use SECURITY DEFINER so they run with elevated privileges
-- But we still need to grant EXECUTE to authenticated users
-- The admin check happens in the API layer

GRANT EXECUTE ON FUNCTION public.get_subscription_tier_counts() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_ai_usage_stats(DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_dashboard_stats() TO authenticated;
