-- ============================================================================
-- ADD MISSING check_and_increment_ai_usage FUNCTION
-- This function was in phase1_schema but not applied to remote Supabase
-- ============================================================================

-- Drop first to avoid conflicts
DROP FUNCTION IF EXISTS public.check_and_increment_ai_usage(UUID, TEXT);

-- Function to check and increment AI usage (rate limiting)
CREATE OR REPLACE FUNCTION public.check_and_increment_ai_usage(
  user_uuid UUID,
  feature_name TEXT DEFAULT 'chat'
)
RETURNS BOOLEAN AS $$
DECLARE
  current_count INTEGER;
  limit_count INTEGER;
  user_tier TEXT;
BEGIN
  -- Get user's tier (handle trialing as pro)
  SELECT
    CASE
      WHEN s.status = 'trialing' AND s.trial_ends_at > NOW() THEN 'pro'
      WHEN s.status = 'active' THEN s.tier::TEXT
      ELSE 'free'
    END INTO user_tier
  FROM public.subscriptions s
  WHERE s.user_id = user_uuid;

  -- Default to free if no subscription found
  IF user_tier IS NULL THEN
    user_tier := 'free';
  END IF;

  -- Get limit based on tier
  SELECT CASE user_tier
    WHEN 'free' THEN 10
    WHEN 'starter' THEN 100
    WHEN 'plus' THEN 200
    WHEN 'pro' THEN 999999
    ELSE 10
  END INTO limit_count;

  -- Get current count for today
  SELECT COALESCE(message_count, 0) INTO current_count
  FROM public.ai_usage
  WHERE user_id = user_uuid AND date = CURRENT_DATE AND feature = feature_name;

  -- Default to 0 if no record
  IF current_count IS NULL THEN
    current_count := 0;
  END IF;

  -- Check if under limit
  IF current_count >= limit_count THEN
    RETURN FALSE;
  END IF;

  -- Increment or insert usage record
  INSERT INTO public.ai_usage (user_id, date, feature, message_count)
  VALUES (user_uuid, CURRENT_DATE, feature_name, 1)
  ON CONFLICT (user_id, date, feature)
  DO UPDATE SET message_count = ai_usage.message_count + 1, updated_at = NOW();

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.check_and_increment_ai_usage IS 'Check if user is under AI usage limit and increment counter if so';
