-- ============================================================================
-- Add email_reports_enabled column to notification_preferences
-- Created: February 15, 2026
-- Description: Adds column for weekly email report opt-in (Pro tier feature)
-- Spec Reference: Spec 11 (R-104.2, R-104.3)
-- ============================================================================

-- Add email_reports_enabled column (defaults to true for new users)
ALTER TABLE public.notification_preferences
ADD COLUMN IF NOT EXISTS email_reports_enabled BOOLEAN DEFAULT true;

-- Comment on the column
COMMENT ON COLUMN public.notification_preferences.email_reports_enabled
IS 'Whether weekly email reports are enabled (Pro tier only). Defaults to true.';
