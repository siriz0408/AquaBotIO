-- ============================================================================
-- AquaBotAI Push Notifications Schema
-- Created: February 9, 2026
-- Description: Tables for push notifications and notification preferences
-- Spec Reference: 00_Data_Model_Schema.md (Tables 13, 14), 08_PWA_Shell_Spec.md
-- ============================================================================

-- ============================================================================
-- PUSH SUBSCRIPTIONS TABLE
-- Stores Web Push API subscription tokens. One user can have multiple devices.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  auth_key TEXT NOT NULL,
  p256dh_key TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ
);

-- Index for efficient user lookup
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON public.push_subscriptions(user_id);

-- Enable RLS
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can view their own push subscriptions
CREATE POLICY "Users can view own push subscriptions"
  ON public.push_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own push subscriptions
CREATE POLICY "Users can create own push subscriptions"
  ON public.push_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own push subscriptions (for last_used_at)
CREATE POLICY "Users can update own push subscriptions"
  ON public.push_subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own push subscriptions
CREATE POLICY "Users can delete own push subscriptions"
  ON public.push_subscriptions FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- NOTIFICATION PREFERENCES TABLE
-- Stores user notification settings. One per user.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  push_enabled BOOLEAN DEFAULT true,
  email_enabled BOOLEAN DEFAULT true,
  maintenance_reminders BOOLEAN DEFAULT true,
  parameter_alerts BOOLEAN DEFAULT true,
  ai_insights BOOLEAN DEFAULT true,
  reminder_time TIME DEFAULT '09:00:00',
  reminder_days_before INTEGER DEFAULT 1 CHECK (reminder_days_before >= 0 AND reminder_days_before <= 7),
  quiet_hours_enabled BOOLEAN DEFAULT false,
  quiet_hours_start TIME DEFAULT '22:00:00',
  quiet_hours_end TIME DEFAULT '08:00:00',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- Users can view their own notification preferences
CREATE POLICY "Users can view own notification preferences"
  ON public.notification_preferences FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own notification preferences
CREATE POLICY "Users can create own notification preferences"
  ON public.notification_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own notification preferences
CREATE POLICY "Users can update own notification preferences"
  ON public.notification_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================================
-- UPDATED_AT TRIGGER
-- ============================================================================

CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================================
-- AUTO-CREATE NOTIFICATION PREFERENCES ON USER CREATION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Only create trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_user_created_notification_preferences'
  ) THEN
    CREATE TRIGGER on_user_created_notification_preferences
      AFTER INSERT ON public.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_notification_preferences();
  END IF;
END;
$$;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.push_subscriptions IS 'Web Push API subscription tokens for push notifications. One user can have multiple devices.';
COMMENT ON COLUMN public.push_subscriptions.endpoint IS 'Web Push endpoint URL from the browser';
COMMENT ON COLUMN public.push_subscriptions.p256dh_key IS 'ECDH public key for encryption';
COMMENT ON COLUMN public.push_subscriptions.auth_key IS 'Authentication key for push message encryption';
COMMENT ON COLUMN public.push_subscriptions.user_agent IS 'Device/browser identification for debugging';
COMMENT ON COLUMN public.push_subscriptions.last_used_at IS 'Last time a notification was successfully sent to this subscription';

COMMENT ON TABLE public.notification_preferences IS 'User notification preferences. One record per user.';
COMMENT ON COLUMN public.notification_preferences.push_enabled IS 'Whether push notifications are enabled globally';
COMMENT ON COLUMN public.notification_preferences.email_enabled IS 'Whether email notifications are enabled globally';
COMMENT ON COLUMN public.notification_preferences.maintenance_reminders IS 'Whether to send maintenance task reminders';
COMMENT ON COLUMN public.notification_preferences.parameter_alerts IS 'Whether to send water parameter alerts';
COMMENT ON COLUMN public.notification_preferences.ai_insights IS 'Whether to send AI-generated insights';
COMMENT ON COLUMN public.notification_preferences.reminder_time IS 'Preferred time for daily reminders (user local time)';
COMMENT ON COLUMN public.notification_preferences.reminder_days_before IS 'How many days before a task is due to send reminder';
COMMENT ON COLUMN public.notification_preferences.quiet_hours_enabled IS 'Whether to respect quiet hours';
COMMENT ON COLUMN public.notification_preferences.quiet_hours_start IS 'Start of quiet hours (no notifications)';
COMMENT ON COLUMN public.notification_preferences.quiet_hours_end IS 'End of quiet hours';
