-- ============================================================================
-- AquaBotAI User Preferences Schema
-- Created: February 12, 2026
-- Description: Stores user preferences for personalized AI interactions
--              and onboarding data
-- ============================================================================

-- ============================================================================
-- USER PREFERENCES TABLE
-- ============================================================================

CREATE TABLE public.user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,

  -- Experience & Background
  experience_level TEXT CHECK (experience_level IN ('first_timer', 'returning', 'experienced', 'expert')),
  years_in_hobby INTEGER,
  previous_tank_types TEXT[],

  -- Current Situation
  current_situation TEXT CHECK (current_situation IN ('new_tank', 'existing_tank', 'exploring', 'multiple_tanks')),
  primary_goal TEXT,
  motivation TEXT CHECK (motivation IN ('relaxation', 'family_project', 'specific_species', 'nature_interest', 'other')),
  motivation_details TEXT,

  -- Learning Style & Preferences
  explanation_depth TEXT CHECK (explanation_depth IN ('brief', 'moderate', 'detailed')) DEFAULT 'moderate',
  wants_scientific_names BOOLEAN DEFAULT false,
  wants_reminders BOOLEAN DEFAULT true,
  communication_style TEXT CHECK (communication_style IN ('friendly', 'professional', 'casual')) DEFAULT 'friendly',

  -- Challenges & Context
  current_challenges TEXT[],
  avoided_topics TEXT[],
  completed_topics TEXT[],

  -- Tank Preferences
  preferred_tank_types TEXT[],
  budget_range TEXT CHECK (budget_range IN ('tight', 'moderate', 'flexible', 'unspecified')),
  time_available TEXT CHECK (time_available IN ('minimal', 'moderate', 'plenty', 'unspecified')),

  -- AI Memory
  ai_learned_facts JSONB DEFAULT '[]'::jsonb,
  ai_interaction_summary TEXT,
  last_interaction_topics TEXT[],

  -- Timestamps
  onboarding_completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_user_prefs_user ON public.user_preferences(user_id);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users access own preferences" ON public.user_preferences
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- UPDATED_AT TRIGGER
-- ============================================================================

CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.user_preferences IS 'User preferences for personalized AI interactions and onboarding data';
COMMENT ON COLUMN public.user_preferences.experience_level IS 'User experience level with aquariums';
COMMENT ON COLUMN public.user_preferences.explanation_depth IS 'Preferred level of detail in AI explanations';
COMMENT ON COLUMN public.user_preferences.ai_learned_facts IS 'Facts the AI has learned about this user from conversations';
COMMENT ON COLUMN public.user_preferences.ai_interaction_summary IS 'Rolling summary of AI interactions for context';
