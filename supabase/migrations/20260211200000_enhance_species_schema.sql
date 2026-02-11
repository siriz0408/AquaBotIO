-- Migration: Enhance Species Database Schema
-- Sprint 28: Species Database Upgrade Phase 1
-- Date: 2026-02-11
-- Description: Adds comprehensive fields for a professional-grade species database
--   with external API integration, enhanced care info, media support, and full-text search

-- ============================================================================
-- PHASE 1: EXTERNAL API IDENTIFIERS
-- For integration with FishBase, GBIF, and Wikidata
-- ============================================================================

ALTER TABLE public.species
  ADD COLUMN IF NOT EXISTS fishbase_id INTEGER,
  ADD COLUMN IF NOT EXISTS gbif_key BIGINT,
  ADD COLUMN IF NOT EXISTS wikidata_id TEXT,
  ADD COLUMN IF NOT EXISTS data_source TEXT DEFAULT 'manual'
    CHECK (data_source IN ('manual', 'fishbase', 'gbif', 'ai_enriched'));

-- ============================================================================
-- PHASE 2: ENHANCED CARE INFORMATION
-- Comprehensive lifecycle and behavioral data
-- ============================================================================

ALTER TABLE public.species
  ADD COLUMN IF NOT EXISTS lifespan_years INTEGER,
  ADD COLUMN IF NOT EXISTS origin_region TEXT,
  ADD COLUMN IF NOT EXISTS habitat TEXT,
  ADD COLUMN IF NOT EXISTS group_behavior TEXT
    CHECK (group_behavior IS NULL OR group_behavior IN ('solitary', 'pair', 'small_group', 'schooling', 'colony')),
  ADD COLUMN IF NOT EXISTS min_school_size INTEGER,
  ADD COLUMN IF NOT EXISTS breeding_difficulty TEXT
    CHECK (breeding_difficulty IS NULL OR breeding_difficulty IN ('easy', 'moderate', 'difficult', 'very_difficult', 'impossible_in_captivity')),
  ADD COLUMN IF NOT EXISTS diet_type TEXT
    CHECK (diet_type IS NULL OR diet_type IN ('carnivore', 'herbivore', 'omnivore', 'planktivore', 'filter_feeder', 'detritivore', 'photosynthetic')),
  ADD COLUMN IF NOT EXISTS feeding_frequency TEXT,
  ADD COLUMN IF NOT EXISTS common_diseases TEXT[] DEFAULT '{}';

-- ============================================================================
-- PHASE 3: ADDITIONAL WATER PARAMETERS
-- Hardness and salinity ranges
-- ============================================================================

ALTER TABLE public.species
  ADD COLUMN IF NOT EXISTS hardness_min_dgh NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS hardness_max_dgh NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS salinity_min NUMERIC(5,4),
  ADD COLUMN IF NOT EXISTS salinity_max NUMERIC(5,4);

-- ============================================================================
-- PHASE 4: MEDIA SUPPORT
-- JSONB array for multiple images with attribution
-- Structure: [{url, thumbnail, attribution, license, source}]
-- ============================================================================

ALTER TABLE public.species
  ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;

-- Add check constraint for images structure
ALTER TABLE public.species
  ADD CONSTRAINT species_images_is_array
    CHECK (jsonb_typeof(images) = 'array');

COMMENT ON COLUMN public.species.images IS
  'Array of image objects: [{url: string, thumbnail?: string, attribution?: string, license?: string, source?: string}]';

-- ============================================================================
-- PHASE 5: RICH CONTENT
-- Care tips, fun facts, and alternative names for better UX
-- ============================================================================

ALTER TABLE public.species
  ADD COLUMN IF NOT EXISTS care_tips TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS fun_facts TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS aliases TEXT[] DEFAULT '{}';

-- ============================================================================
-- PHASE 6: FULL-TEXT SEARCH
-- Optimized search across multiple fields
-- ============================================================================

-- Add tsvector column for full-text search
ALTER TABLE public.species
  ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Create function to update search vector
CREATE OR REPLACE FUNCTION species_search_vector_update()
RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.common_name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.scientific_name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(NEW.aliases, ' '), '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.origin_region, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(NEW.habitat, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(NEW.diet, '')), 'D') ||
    setweight(to_tsvector('english', COALESCE(NEW.compatibility_notes, '')), 'D');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update search vector
DROP TRIGGER IF EXISTS species_search_vector_trigger ON public.species;
CREATE TRIGGER species_search_vector_trigger
  BEFORE INSERT OR UPDATE ON public.species
  FOR EACH ROW
  EXECUTE FUNCTION species_search_vector_update();

-- Create GIN index for fast full-text search
CREATE INDEX IF NOT EXISTS idx_species_search_vector
  ON public.species USING GIN (search_vector);

-- ============================================================================
-- PHASE 7: ADDITIONAL INDEXES
-- Optimize common query patterns
-- ============================================================================

-- Index for external API lookups
CREATE INDEX IF NOT EXISTS idx_species_fishbase_id ON public.species(fishbase_id) WHERE fishbase_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_species_gbif_key ON public.species(gbif_key) WHERE gbif_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_species_wikidata_id ON public.species(wikidata_id) WHERE wikidata_id IS NOT NULL;

-- Index for care level + type filtering (common combination)
CREATE INDEX IF NOT EXISTS idx_species_type_care ON public.species(type, care_level);

-- Index for origin region queries
CREATE INDEX IF NOT EXISTS idx_species_origin ON public.species(origin_region) WHERE origin_region IS NOT NULL;

-- Index for diet type queries
CREATE INDEX IF NOT EXISTS idx_species_diet_type ON public.species(diet_type) WHERE diet_type IS NOT NULL;

-- ============================================================================
-- PHASE 8: UPDATE EXISTING RECORDS
-- Initialize search vectors for existing species
-- ============================================================================

-- Trigger an update on all existing species to populate search_vector
UPDATE public.species SET updated_at = NOW() WHERE search_vector IS NULL;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON COLUMN public.species.fishbase_id IS 'FishBase species ID for data enrichment';
COMMENT ON COLUMN public.species.gbif_key IS 'GBIF species key for image sourcing';
COMMENT ON COLUMN public.species.wikidata_id IS 'Wikidata entity ID (e.g., Q12345) for Wikipedia integration';
COMMENT ON COLUMN public.species.data_source IS 'Origin of species data: manual, fishbase, gbif, or ai_enriched';
COMMENT ON COLUMN public.species.lifespan_years IS 'Average lifespan in captivity (years)';
COMMENT ON COLUMN public.species.origin_region IS 'Geographic origin (e.g., "Amazon Basin", "Southeast Asia")';
COMMENT ON COLUMN public.species.habitat IS 'Natural habitat description';
COMMENT ON COLUMN public.species.group_behavior IS 'Social behavior: solitary, pair, small_group, schooling, colony';
COMMENT ON COLUMN public.species.min_school_size IS 'Minimum recommended group size for schooling species';
COMMENT ON COLUMN public.species.breeding_difficulty IS 'Difficulty level for captive breeding';
COMMENT ON COLUMN public.species.diet_type IS 'Primary dietary classification';
COMMENT ON COLUMN public.species.feeding_frequency IS 'Recommended feeding schedule (e.g., "2x daily", "every other day")';
COMMENT ON COLUMN public.species.common_diseases IS 'Array of common diseases/health issues';
COMMENT ON COLUMN public.species.hardness_min_dgh IS 'Minimum water hardness (degrees GH)';
COMMENT ON COLUMN public.species.hardness_max_dgh IS 'Maximum water hardness (degrees GH)';
COMMENT ON COLUMN public.species.salinity_min IS 'Minimum salinity (specific gravity)';
COMMENT ON COLUMN public.species.salinity_max IS 'Maximum salinity (specific gravity)';
COMMENT ON COLUMN public.species.care_tips IS 'Array of care tips and best practices';
COMMENT ON COLUMN public.species.fun_facts IS 'Array of interesting facts for engagement';
COMMENT ON COLUMN public.species.aliases IS 'Alternative common names (e.g., ["Cardinal Tetra", "Red Neon"])';
COMMENT ON COLUMN public.species.search_vector IS 'Full-text search vector (auto-generated)';
