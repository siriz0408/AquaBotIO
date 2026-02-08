-- ============================================================================
-- Feedback Table - Roadmap feedback from stakeholders
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.feedback (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('priority', 'bug', 'feature', 'question', 'other')),
  message TEXT NOT NULL,
  image_urls TEXT[] DEFAULT '{}',
  submitted_by TEXT DEFAULT 'Sam',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'addressed', 'wontfix')),
  pm_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Anyone can insert feedback (roadmap page is public)
CREATE POLICY "Anyone can insert feedback"
  ON public.feedback FOR INSERT
  WITH CHECK (true);

-- Anyone can read feedback
CREATE POLICY "Anyone can read feedback"
  ON public.feedback FOR SELECT
  USING (true);

-- Anyone can update feedback (PM use)
CREATE POLICY "Anyone can update feedback"
  ON public.feedback FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON public.feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON public.feedback(status);

-- ============================================================================
-- Storage bucket for feedback images
-- ============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'feedback-images',
  'feedback-images',
  true,
  5242880,  -- 5MB limit
  ARRAY['image/png', 'image/jpeg', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: anyone can upload and read feedback images
CREATE POLICY "Anyone can upload feedback images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'feedback-images');

CREATE POLICY "Anyone can read feedback images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'feedback-images');
