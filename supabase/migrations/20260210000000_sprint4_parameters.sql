-- ============================================================================
-- SPRINT 4 ENHANCEMENTS
-- Water Parameters & Species/Livestock Features
-- ============================================================================

-- ============================================================================
-- PARAMETER THRESHOLDS TABLE
-- Custom safe/warning zones per tank
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.parameter_thresholds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tank_id UUID NOT NULL REFERENCES public.tanks(id) ON DELETE CASCADE,
  parameter_type TEXT NOT NULL CHECK (parameter_type IN (
    'temperature_f', 'ph', 'ammonia_ppm', 'nitrite_ppm', 'nitrate_ppm',
    'gh_ppm', 'kh_ppm', 'salinity_ppt', 'phosphate_ppm', 'calcium_ppm',
    'magnesium_ppm', 'alkalinity_dkh', 'dissolved_oxygen_ppm'
  )),

  -- Safe zone (green)
  safe_min DECIMAL(8,3),
  safe_max DECIMAL(8,3),

  -- Warning zone (yellow) - outside safe but not critical
  warning_min DECIMAL(8,3),
  warning_max DECIMAL(8,3),

  -- Danger zone is anything outside warning

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint: one threshold per parameter per tank
  UNIQUE(tank_id, parameter_type)
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_parameter_thresholds_tank
  ON public.parameter_thresholds(tank_id);

-- Enable RLS
ALTER TABLE public.parameter_thresholds ENABLE ROW LEVEL SECURITY;

-- Users can manage their own tank thresholds
CREATE POLICY "Users can manage own tank thresholds"
  ON public.parameter_thresholds
  FOR ALL
  USING (
    tank_id IN (
      SELECT id FROM public.tanks WHERE user_id = auth.uid() AND deleted_at IS NULL
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_parameter_thresholds_updated_at
  BEFORE UPDATE ON public.parameter_thresholds
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- SPECIES COMPATIBILITY CACHE
-- Store AI-generated compatibility checks
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.compatibility_checks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tank_id UUID NOT NULL REFERENCES public.tanks(id) ON DELETE CASCADE,
  species_a_id UUID NOT NULL REFERENCES public.species(id),
  species_b_id UUID NOT NULL REFERENCES public.species(id),

  -- Compatibility result
  compatibility_score INTEGER CHECK (compatibility_score >= 1 AND compatibility_score <= 5),
  -- 1 = Incompatible, 2 = Poor, 3 = Moderate, 4 = Good, 5 = Excellent

  warnings JSONB DEFAULT '[]',
  -- Array of { type: string, message: string, severity: 'info'|'warning'|'danger' }

  notes TEXT,

  -- AI model that generated this
  ai_model TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),

  -- Unique constraint: one check per species pair per tank
  UNIQUE(tank_id, species_a_id, species_b_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_compatibility_checks_tank
  ON public.compatibility_checks(tank_id);
CREATE INDEX IF NOT EXISTS idx_compatibility_checks_species_a
  ON public.compatibility_checks(species_a_id);
CREATE INDEX IF NOT EXISTS idx_compatibility_checks_species_b
  ON public.compatibility_checks(species_b_id);
CREATE INDEX IF NOT EXISTS idx_compatibility_checks_expires
  ON public.compatibility_checks(expires_at);

-- Enable RLS
ALTER TABLE public.compatibility_checks ENABLE ROW LEVEL SECURITY;

-- Users can read/write compatibility checks for their tanks
CREATE POLICY "Users can manage own tank compatibility checks"
  ON public.compatibility_checks
  FOR ALL
  USING (
    tank_id IN (
      SELECT id FROM public.tanks WHERE user_id = auth.uid() AND deleted_at IS NULL
    )
  );

-- ============================================================================
-- SPECIES TABLE ENHANCEMENTS
-- Additional fields for better species management
-- ============================================================================

-- Add full-text search index if not exists
CREATE INDEX IF NOT EXISTS idx_species_search
  ON public.species
  USING GIN (to_tsvector('english', common_name || ' ' || COALESCE(scientific_name, '')));

-- Add popularity/usage tracking
ALTER TABLE public.species ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0;

-- ============================================================================
-- LIVESTOCK TABLE ENHANCEMENTS
-- Better tracking and soft delete support
-- ============================================================================

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_livestock_tank_active
  ON public.livestock(tank_id, is_active)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_livestock_species
  ON public.livestock(species_id)
  WHERE deleted_at IS NULL;

-- ============================================================================
-- WATER PARAMETERS INDEX OPTIMIZATION
-- For chart queries
-- ============================================================================

-- Composite index for time-range queries
CREATE INDEX IF NOT EXISTS idx_water_params_tank_date_desc
  ON public.water_parameters(tank_id, measured_at DESC);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to get parameter thresholds for a tank with defaults
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
  -- First try to get custom thresholds
  RETURN QUERY
  SELECT
    pt.safe_min,
    pt.safe_max,
    pt.warning_min,
    pt.warning_max
  FROM public.parameter_thresholds pt
  WHERE pt.tank_id = tank_uuid
    AND pt.parameter_type = param_type;

  -- If no custom thresholds, return defaults based on tank type
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

-- Function to clean up expired compatibility checks
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

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.parameter_thresholds IS 'Custom water parameter safe zones per tank';
COMMENT ON TABLE public.compatibility_checks IS 'AI-generated species compatibility results (cached 30 days)';
COMMENT ON FUNCTION public.get_parameter_thresholds IS 'Get parameter thresholds for a tank with defaults fallback';
COMMENT ON FUNCTION public.cleanup_expired_compatibility_checks IS 'Remove expired compatibility check cache entries';
