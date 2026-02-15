-- ============================================================================
-- Setup Cron Jobs for Scheduled Tasks
-- Created: February 15, 2026
-- Description: Configure pg_cron jobs for weekly reports and daily trend analysis
-- ============================================================================

-- Enable required extensions (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Grant usage to postgres role
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;

-- ============================================================================
-- Weekly Email Reports - Every Sunday at 8am UTC
-- Sends tank health digest to Pro users with email reports enabled
-- ============================================================================

SELECT cron.schedule(
  'weekly-email-reports',
  '0 8 * * 0',  -- Every Sunday at 8:00 AM UTC
  $$
  SELECT net.http_post(
    url := 'https://mtwyezkbmyrgxqmskblu.supabase.co/functions/v1/send-weekly-reports',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := '{}'::jsonb
  );
  $$
);

-- ============================================================================
-- Daily Trend Analysis - Every day at 6am UTC
-- Analyzes parameter trends for Plus+/Pro users
-- ============================================================================

SELECT cron.schedule(
  'daily-trend-analysis',
  '0 6 * * *',  -- Every day at 6:00 AM UTC
  $$
  SELECT net.http_post(
    url := 'https://mtwyezkbmyrgxqmskblu.supabase.co/functions/v1/run-daily-trend-analysis',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := '{}'::jsonb
  );
  $$
);

-- ============================================================================
-- Maintenance Reminders - Every 15 minutes
-- Sends push notifications for upcoming maintenance tasks
-- ============================================================================

SELECT cron.schedule(
  'maintenance-reminders',
  '*/15 * * * *',  -- Every 15 minutes
  $$
  SELECT net.http_post(
    url := 'https://mtwyezkbmyrgxqmskblu.supabase.co/functions/v1/send-maintenance-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := '{}'::jsonb
  );
  $$
);

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON EXTENSION pg_cron IS 'Job scheduler for PostgreSQL - runs scheduled tasks';
