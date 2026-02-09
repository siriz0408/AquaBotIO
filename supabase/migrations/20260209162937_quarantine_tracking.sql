-- Sprint 19: Quarantine Tracking for AI Chat Widgets
-- Tracks quarantine progress for new livestock additions

-- Create quarantine status enum
CREATE TYPE quarantine_status AS ENUM ('in_progress', 'completed', 'cancelled');

-- Create quarantine_tracking table
CREATE TABLE quarantine_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tank_id UUID NOT NULL REFERENCES tanks(id) ON DELETE CASCADE,
  species_name TEXT NOT NULL,
  start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  target_end_date TIMESTAMPTZ,
  steps_completed JSONB NOT NULL DEFAULT '[]'::jsonb,
  status quarantine_status NOT NULL DEFAULT 'in_progress',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_quarantine_user ON quarantine_tracking(user_id);
CREATE INDEX idx_quarantine_tank ON quarantine_tracking(tank_id);
CREATE INDEX idx_quarantine_status ON quarantine_tracking(status) WHERE status = 'in_progress';

-- RLS Policies
ALTER TABLE quarantine_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own quarantine tracking"
  ON quarantine_tracking FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own quarantine tracking"
  ON quarantine_tracking FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own quarantine tracking"
  ON quarantine_tracking FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own quarantine tracking"
  ON quarantine_tracking FOR DELETE
  USING (auth.uid() = user_id);

-- Updated at trigger
CREATE TRIGGER set_quarantine_tracking_updated_at
  BEFORE UPDATE ON quarantine_tracking
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Comment
COMMENT ON TABLE quarantine_tracking IS 'Tracks quarantine progress for new livestock additions, used by AI chat widgets';
