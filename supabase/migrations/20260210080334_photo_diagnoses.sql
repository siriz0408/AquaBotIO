-- ============================================================================
-- PHOTO DIAGNOSES TABLE
-- Sprint 20 - AI-powered photo diagnosis for species identification and disease detection
-- Per Spec 09 (Photo Diagnosis) and 00_Data_Model_Schema.md
-- ============================================================================

-- Create photo_diagnoses table
CREATE TABLE IF NOT EXISTS public.photo_diagnoses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tank_id UUID NOT NULL REFERENCES public.tanks(id) ON DELETE CASCADE,
  diagnosis_type TEXT NOT NULL CHECK (diagnosis_type IN ('species_id', 'disease', 'both')),
  photo_url TEXT NOT NULL,

  -- Species identification results (JSONB for flexibility)
  species_result JSONB,
  -- Expected structure:
  -- {
  --   "name": "Neon Tetra",
  --   "scientificName": "Paracheirodon innesi",
  --   "speciesId": "uuid-if-matched",
  --   "confidence": "high|medium|low",
  --   "careLevel": "beginner",
  --   "minTankSize": 10,
  --   "temperament": "peaceful",
  --   "careSummary": "Brief care overview..."
  -- }

  -- Disease diagnosis results (JSONB for flexibility)
  disease_result JSONB,
  -- Expected structure:
  -- {
  --   "diagnosis": "Ich (White Spot Disease)",
  --   "confidence": "high|medium|low",
  --   "severity": "minor|moderate|severe",
  --   "symptoms": ["white spots", "flashing", "clamped fins"],
  --   "treatmentSteps": ["Raise temp to 86F", "Add aquarium salt", "..."],
  --   "medicationName": "Ich-X",
  --   "medicationDosage": "5ml per 10 gallons",
  --   "treatmentDuration": "7-10 days",
  --   "medicationWarnings": ["Not safe for scaleless fish", "Remove carbon"]
  -- }

  -- Overall confidence (may differ from individual results)
  confidence TEXT CHECK (confidence IN ('high', 'medium', 'low')),

  -- User feedback for quality tracking
  user_feedback TEXT CHECK (user_feedback IN ('helpful', 'not_helpful')),

  -- Full AI response for debugging/audit
  ai_response TEXT,

  -- Token usage tracking
  input_tokens INTEGER,
  output_tokens INTEGER,
  model TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add comment for documentation
COMMENT ON TABLE public.photo_diagnoses IS 'AI photo diagnosis results for species identification and disease detection';

-- Create indexes for common queries
CREATE INDEX idx_photo_diagnoses_user ON public.photo_diagnoses(user_id);
CREATE INDEX idx_photo_diagnoses_tank ON public.photo_diagnoses(tank_id);
CREATE INDEX idx_photo_diagnoses_user_tank_created ON public.photo_diagnoses(user_id, tank_id, created_at DESC);
CREATE INDEX idx_photo_diagnoses_created ON public.photo_diagnoses(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.photo_diagnoses ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can view their own diagnoses
CREATE POLICY "photo_diagnoses_select_own"
  ON public.photo_diagnoses FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own diagnoses
CREATE POLICY "photo_diagnoses_insert_own"
  ON public.photo_diagnoses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own diagnoses (for feedback)
CREATE POLICY "photo_diagnoses_update_own"
  ON public.photo_diagnoses FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own diagnoses
CREATE POLICY "photo_diagnoses_delete_own"
  ON public.photo_diagnoses FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- PHOTO DIAGNOSIS STORAGE BUCKET
-- Bucket for storing diagnosis photos
-- ============================================================================

-- Create the photo-diagnosis bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'photo-diagnosis',
  'photo-diagnosis',
  false, -- Private bucket - use signed URLs
  10485760, -- 10MB limit per spec
  ARRAY['image/jpeg', 'image/png']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png'];

-- RLS Policies for photo-diagnosis bucket

-- Allow users to view their own photos
CREATE POLICY "Users can view own diagnosis photos"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'photo-diagnosis'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow users to upload photos to their own folders (user_id/*)
CREATE POLICY "Users can upload own diagnosis photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'photo-diagnosis'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow users to delete their own photos
CREATE POLICY "Users can delete own diagnosis photos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'photo-diagnosis'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================================================
-- AI USAGE UPDATE FOR PHOTO DIAGNOSIS
-- Add function to check and increment photo diagnosis usage
-- ============================================================================

-- Function to check and increment photo diagnosis usage
CREATE OR REPLACE FUNCTION public.check_and_increment_photo_diagnosis_usage(
  user_uuid UUID
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
      WHEN s.tier_override IS NOT NULL AND (s.override_expires_at IS NULL OR s.override_expires_at > NOW()) THEN s.tier_override::TEXT
      WHEN s.status = 'active' THEN s.tier::TEXT
      ELSE 'free'
    END INTO user_tier
  FROM public.subscriptions s
  WHERE s.user_id = user_uuid;

  -- Default to free if no subscription found
  IF user_tier IS NULL THEN
    user_tier := 'free';
  END IF;

  -- Check admin status (admins get pro access)
  IF EXISTS (
    SELECT 1 FROM public.admin_profiles
    WHERE user_id = user_uuid AND is_active = true
  ) THEN
    user_tier := 'pro';
  END IF;

  -- Get limit based on tier (per Spec 09 R-101.7)
  -- Free: 0, Starter: 0, Plus: 10/day, Pro: 30/day
  SELECT CASE user_tier
    WHEN 'free' THEN 0
    WHEN 'starter' THEN 0
    WHEN 'plus' THEN 10
    WHEN 'pro' THEN 30
    ELSE 0
  END INTO limit_count;

  -- Get current count for today
  SELECT COALESCE(message_count, 0) INTO current_count
  FROM public.ai_usage
  WHERE user_id = user_uuid AND date = CURRENT_DATE AND feature = 'diagnosis';

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
  VALUES (user_uuid, CURRENT_DATE, 'diagnosis', 1)
  ON CONFLICT (user_id, date, feature)
  DO UPDATE SET message_count = ai_usage.message_count + 1, updated_at = NOW();

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.check_and_increment_photo_diagnosis_usage IS 'Check if user is under photo diagnosis limit and increment counter if so';

-- Function to get photo diagnosis usage info (remaining count, tier, etc.)
CREATE OR REPLACE FUNCTION public.get_photo_diagnosis_usage_info(
  user_uuid UUID
)
RETURNS TABLE (
  tier TEXT,
  daily_limit INTEGER,
  used_today INTEGER,
  remaining INTEGER,
  can_use BOOLEAN
) AS $$
DECLARE
  user_tier TEXT;
  limit_count INTEGER;
  current_count INTEGER;
BEGIN
  -- Get user's tier
  SELECT
    CASE
      WHEN s.status = 'trialing' AND s.trial_ends_at > NOW() THEN 'pro'
      WHEN s.tier_override IS NOT NULL AND (s.override_expires_at IS NULL OR s.override_expires_at > NOW()) THEN s.tier_override::TEXT
      WHEN s.status = 'active' THEN s.tier::TEXT
      ELSE 'free'
    END INTO user_tier
  FROM public.subscriptions s
  WHERE s.user_id = user_uuid;

  -- Default to free if no subscription found
  IF user_tier IS NULL THEN
    user_tier := 'free';
  END IF;

  -- Check admin status
  IF EXISTS (
    SELECT 1 FROM public.admin_profiles
    WHERE user_id = user_uuid AND is_active = true
  ) THEN
    user_tier := 'pro';
  END IF;

  -- Get limit based on tier
  SELECT CASE user_tier
    WHEN 'free' THEN 0
    WHEN 'starter' THEN 0
    WHEN 'plus' THEN 10
    WHEN 'pro' THEN 30
    ELSE 0
  END INTO limit_count;

  -- Get current count for today
  SELECT COALESCE(a.message_count, 0) INTO current_count
  FROM public.ai_usage a
  WHERE a.user_id = user_uuid AND a.date = CURRENT_DATE AND a.feature = 'diagnosis';

  IF current_count IS NULL THEN
    current_count := 0;
  END IF;

  RETURN QUERY SELECT
    user_tier,
    limit_count,
    current_count,
    GREATEST(limit_count - current_count, 0),
    current_count < limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_photo_diagnosis_usage_info IS 'Get photo diagnosis usage info for a user including tier, limits, and remaining';
