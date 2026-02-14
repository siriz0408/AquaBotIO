-- ============================================================================
-- AquaBotAI Coaching History Schema
-- Created: February 14, 2026
-- Sprint 34: Daily AI Coaching - History Persistence
-- Description: Stores coaching messages for users to review past tips
-- ============================================================================

-- ============================================================================
-- COACHING HISTORY TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.coaching_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tank_id UUID REFERENCES public.tanks(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  context JSONB, -- Store the coaching context used to generate the message
  tokens_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Index for user queries - allows efficient pagination of user's coaching history
CREATE INDEX idx_coaching_history_user ON public.coaching_history(user_id, created_at DESC);

-- Index for tank-specific queries
CREATE INDEX idx_coaching_history_tank ON public.coaching_history(tank_id, created_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.coaching_history ENABLE ROW LEVEL SECURITY;

-- Users can only read their own coaching history
CREATE POLICY "Users can read own coaching history"
  ON public.coaching_history FOR SELECT
  USING (auth.uid() = user_id);

-- Note: INSERT is only allowed via Edge Functions with service role key
-- This prevents users from inserting arbitrary coaching history entries
-- Service role bypasses RLS, so no INSERT policy is needed for Edge Functions

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.coaching_history IS 'Stores AI-generated coaching messages for user review and historical reference';
COMMENT ON COLUMN public.coaching_history.user_id IS 'The user who received this coaching message';
COMMENT ON COLUMN public.coaching_history.tank_id IS 'The tank the coaching was focused on (NULL if no tank context)';
COMMENT ON COLUMN public.coaching_history.message IS 'The actual coaching message text';
COMMENT ON COLUMN public.coaching_history.context IS 'The CoachingContext object used to generate this message (for debugging/analysis)';
COMMENT ON COLUMN public.coaching_history.tokens_used IS 'Total tokens (input + output) used to generate this message';
