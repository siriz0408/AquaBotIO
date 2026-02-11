-- Sprint 27: Add coral species type
-- This migration adds 'coral' as a valid species type for reef/saltwater tanks

-- Drop and recreate the check constraint to include 'coral'
ALTER TABLE public.species
DROP CONSTRAINT IF EXISTS species_type_check;

ALTER TABLE public.species
ADD CONSTRAINT species_type_check
CHECK (type IN ('freshwater', 'saltwater', 'invertebrate', 'plant', 'coral'));

-- Add comment for documentation
COMMENT ON COLUMN public.species.type IS 'Species type: freshwater, saltwater, invertebrate, plant, or coral';
