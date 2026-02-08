-- Create storage buckets for tank photos
-- Per Implementation_Plan_Phase1.md Day 18-19

-- Add photo_path column to tanks table for storage path tracking
ALTER TABLE public.tanks ADD COLUMN IF NOT EXISTS photo_path TEXT;

-- Create the tank-photos bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'tank-photos',
  'tank-photos',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for tank-photos bucket

-- Allow authenticated users to view any tank photo (public bucket)
CREATE POLICY "Public can view tank photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'tank-photos');

-- Allow users to upload photos to their own folders (user_id/*)
CREATE POLICY "Users can upload own tank photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'tank-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow users to update their own photos
CREATE POLICY "Users can update own tank photos"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'tank-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow users to delete their own photos
CREATE POLICY "Users can delete own tank photos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'tank-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
