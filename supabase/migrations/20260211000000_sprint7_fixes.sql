-- ============================================================================
-- SPRINT 7 FIXES
-- Create missing tables from Sprint 4, fix B004, add missing functions
-- ============================================================================

-- ============================================================================
-- CREATE MISSING TABLES (from Sprint 4 migration that didn't fully apply)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.parameter_thresholds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tank_id UUID NOT NULL REFERENCES public.tanks(id) ON DELETE CASCADE,
  parameter_type TEXT NOT NULL CHECK (parameter_type IN (
    'temperature_f', 'ph', 'ammonia_ppm', 'nitrite_ppm', 'nitrate_ppm',
    'gh_dgh', 'kh_dkh', 'salinity', 'phosphate_ppm', 'calcium_ppm',
    'magnesium_ppm', 'alkalinity_dkh', 'dissolved_oxygen_ppm'
  )),
  safe_min DECIMAL(8,3),
  safe_max DECIMAL(8,3),
  warning_min DECIMAL(8,3),
  warning_max DECIMAL(8,3),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tank_id, parameter_type)
);

CREATE INDEX IF NOT EXISTS idx_parameter_thresholds_tank
  ON public.parameter_thresholds(tank_id);

ALTER TABLE public.parameter_thresholds ENABLE ROW LEVEL SECURITY;

-- RLS policy (drop first to avoid duplicate)
DROP POLICY IF EXISTS "Users can manage own tank thresholds" ON public.parameter_thresholds;
CREATE POLICY "Users can manage own tank thresholds"
  ON public.parameter_thresholds
  FOR ALL
  USING (
    tank_id IN (
      SELECT id FROM public.tanks WHERE user_id = auth.uid() AND deleted_at IS NULL
    )
  );

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_parameter_thresholds_updated_at ON public.parameter_thresholds;
CREATE TRIGGER update_parameter_thresholds_updated_at
  BEFORE UPDATE ON public.parameter_thresholds
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- ============================================================================
-- COMPATIBILITY CHECKS TABLE (from Sprint 4)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.compatibility_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tank_id UUID NOT NULL REFERENCES public.tanks(id) ON DELETE CASCADE,
  species_a_id UUID NOT NULL REFERENCES public.species(id),
  species_b_id UUID NOT NULL REFERENCES public.species(id),
  compatibility_score INTEGER CHECK (compatibility_score >= 1 AND compatibility_score <= 5),
  warnings JSONB DEFAULT '[]',
  notes TEXT,
  ai_model TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  UNIQUE(tank_id, species_a_id, species_b_id)
);

CREATE INDEX IF NOT EXISTS idx_compatibility_checks_tank
  ON public.compatibility_checks(tank_id);
CREATE INDEX IF NOT EXISTS idx_compatibility_checks_species_a
  ON public.compatibility_checks(species_a_id);
CREATE INDEX IF NOT EXISTS idx_compatibility_checks_species_b
  ON public.compatibility_checks(species_b_id);
CREATE INDEX IF NOT EXISTS idx_compatibility_checks_expires
  ON public.compatibility_checks(expires_at);

ALTER TABLE public.compatibility_checks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own tank compatibility checks" ON public.compatibility_checks;
CREATE POLICY "Users can manage own tank compatibility checks"
  ON public.compatibility_checks
  FOR ALL
  USING (
    tank_id IN (
      SELECT id FROM public.tanks WHERE user_id = auth.uid() AND deleted_at IS NULL
    )
  );

-- ============================================================================
-- SPECIES TABLE ENHANCEMENTS (from Sprint 4)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_species_search
  ON public.species
  USING GIN (to_tsvector('english', common_name || ' ' || COALESCE(scientific_name, '')));

ALTER TABLE public.species ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0;

-- ============================================================================
-- LIVESTOCK/WATER PARAMS INDEX OPTIMIZATION (from Sprint 4)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_livestock_tank_active
  ON public.livestock(tank_id, is_active)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_livestock_species
  ON public.livestock(species_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_water_params_tank_date_desc
  ON public.water_parameters(tank_id, measured_at DESC);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Get parameter thresholds with defaults fallback
CREATE OR REPLACE FUNCTION public.get_parameter_thresholds(
  tank_uuid UUID,
  param_type TEXT
)
RETURNS TABLE (
  safe_min DECIMAL,
  safe_max DECIMAL,
  warning_min DECIMAL,
  warning_max DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pt.safe_min,
    pt.safe_max,
    pt.warning_min,
    pt.warning_max
  FROM public.parameter_thresholds pt
  WHERE pt.tank_id = tank_uuid
    AND pt.parameter_type = param_type;

  IF NOT FOUND THEN
    RETURN QUERY
    SELECT
      CASE param_type
        WHEN 'temperature_f' THEN 74.0
        WHEN 'ph' THEN 6.8
        WHEN 'ammonia_ppm' THEN 0.0
        WHEN 'nitrite_ppm' THEN 0.0
        WHEN 'nitrate_ppm' THEN 0.0
        ELSE NULL
      END::DECIMAL,
      CASE param_type
        WHEN 'temperature_f' THEN 80.0
        WHEN 'ph' THEN 7.6
        WHEN 'ammonia_ppm' THEN 0.25
        WHEN 'nitrite_ppm' THEN 0.25
        WHEN 'nitrate_ppm' THEN 20.0
        ELSE NULL
      END::DECIMAL,
      CASE param_type
        WHEN 'temperature_f' THEN 70.0
        WHEN 'ph' THEN 6.4
        WHEN 'ammonia_ppm' THEN 0.0
        WHEN 'nitrite_ppm' THEN 0.0
        WHEN 'nitrate_ppm' THEN 0.0
        ELSE NULL
      END::DECIMAL,
      CASE param_type
        WHEN 'temperature_f' THEN 84.0
        WHEN 'ph' THEN 8.0
        WHEN 'ammonia_ppm' THEN 0.5
        WHEN 'nitrite_ppm' THEN 0.5
        WHEN 'nitrate_ppm' THEN 40.0
        ELSE NULL
      END::DECIMAL;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Clean up expired compatibility checks
CREATE OR REPLACE FUNCTION public.cleanup_expired_compatibility_checks()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.compatibility_checks
  WHERE expires_at < NOW();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get AI usage for today
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
  user_tier TEXT;
  limit_count INTEGER;
BEGIN
  SELECT
    CASE
      WHEN s.status = 'trialing' AND s.trial_ends_at > NOW() THEN 'pro'
      WHEN s.status = 'active' THEN s.tier::TEXT
      ELSE 'free'
    END INTO user_tier
  FROM public.subscriptions s
  WHERE s.user_id = user_uuid;

  IF user_tier IS NULL THEN
    user_tier := 'free';
  END IF;

  SELECT CASE user_tier
    WHEN 'free' THEN 10
    WHEN 'starter' THEN 100
    WHEN 'plus' THEN 200
    WHEN 'pro' THEN 999999
    ELSE 10
  END INTO limit_count;

  RETURN QUERY
  SELECT
    COALESCE(u.message_count, 0)::INTEGER,
    COALESCE(u.input_tokens, 0)::INTEGER,
    COALESCE(u.output_tokens, 0)::INTEGER,
    limit_count,
    user_tier
  FROM (SELECT 1) AS dummy
  LEFT JOIN public.ai_usage u
    ON u.user_id = user_uuid
    AND u.date = CURRENT_DATE
    AND u.feature = feature_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update token usage
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

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.parameter_thresholds IS 'Custom water parameter safe zones per tank';
COMMENT ON TABLE public.compatibility_checks IS 'AI-generated species compatibility results (cached 30 days)';
COMMENT ON FUNCTION public.get_parameter_thresholds IS 'Get parameter thresholds for a tank with defaults fallback';
COMMENT ON FUNCTION public.cleanup_expired_compatibility_checks IS 'Remove expired compatibility check cache entries';
COMMENT ON FUNCTION public.get_ai_usage_today IS 'Get user AI usage for today with tier limits';
COMMENT ON FUNCTION public.update_ai_token_usage IS 'Update token usage counts for AI features';
