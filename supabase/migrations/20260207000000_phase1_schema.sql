-- ============================================================================
-- AquaBotAI Phase 1 Database Schema
-- Created: February 7, 2026
-- Description: Core MVP tables for authentication, tanks, AI chat, and billing
-- ============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE tank_type AS ENUM ('freshwater', 'saltwater', 'brackish', 'pond');
CREATE TYPE subscription_tier AS ENUM ('free', 'starter', 'plus', 'pro');
CREATE TYPE subscription_status AS ENUM ('trialing', 'active', 'past_due', 'canceled', 'incomplete');
CREATE TYPE skill_level AS ENUM ('beginner', 'intermediate', 'advanced');
CREATE TYPE task_type AS ENUM ('water_change', 'filter_cleaning', 'feeding', 'dosing', 'equipment_maintenance', 'water_testing', 'custom');
CREATE TYPE task_frequency AS ENUM ('once', 'daily', 'weekly', 'biweekly', 'monthly', 'custom');
CREATE TYPE temperament AS ENUM ('peaceful', 'semi_aggressive', 'aggressive');
CREATE TYPE care_level AS ENUM ('beginner', 'intermediate', 'expert');

-- ============================================================================
-- USERS TABLE (extends auth.users)
-- ============================================================================

CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  skill_level skill_level DEFAULT 'beginner',
  unit_preference_volume TEXT DEFAULT 'gallons' CHECK (unit_preference_volume IN ('gallons', 'liters')),
  unit_preference_temp TEXT DEFAULT 'fahrenheit' CHECK (unit_preference_temp IN ('fahrenheit', 'celsius')),
  onboarding_completed BOOLEAN DEFAULT FALSE,
  onboarding_step INTEGER DEFAULT 0,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create trigger to auto-create user record on auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- SUBSCRIPTIONS TABLE
-- ============================================================================

CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  tier subscription_tier DEFAULT 'free',
  status subscription_status DEFAULT 'trialing',
  trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days'),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create trigger to auto-create subscription on user creation
CREATE OR REPLACE FUNCTION public.handle_new_user_subscription()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.subscriptions (user_id, tier, status, trial_ends_at)
  VALUES (NEW.id, 'free', 'trialing', NOW() + INTERVAL '14 days');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_user_created_subscription
  AFTER INSERT ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_subscription();

-- ============================================================================
-- TANKS TABLE
-- ============================================================================

CREATE TABLE public.tanks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type tank_type NOT NULL,
  volume_gallons NUMERIC(10,2) NOT NULL CHECK (volume_gallons > 0),
  length_inches NUMERIC(10,2),
  width_inches NUMERIC(10,2),
  height_inches NUMERIC(10,2),
  substrate TEXT,
  photo_url TEXT,
  notes TEXT,
  setup_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_tanks_user_id ON public.tanks(user_id);
CREATE INDEX idx_tanks_deleted_at ON public.tanks(deleted_at) WHERE deleted_at IS NULL;

-- ============================================================================
-- WATER PARAMETERS TABLE
-- ============================================================================

CREATE TABLE public.water_parameters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tank_id UUID NOT NULL REFERENCES public.tanks(id) ON DELETE CASCADE,
  measured_at TIMESTAMPTZ DEFAULT NOW(),
  ph NUMERIC(4,2) CHECK (ph >= 0 AND ph <= 14),
  ammonia_ppm NUMERIC(6,3) CHECK (ammonia_ppm >= 0),
  nitrite_ppm NUMERIC(6,3) CHECK (nitrite_ppm >= 0),
  nitrate_ppm NUMERIC(6,2) CHECK (nitrate_ppm >= 0),
  temperature_f NUMERIC(5,2) CHECK (temperature_f >= 32 AND temperature_f <= 120),
  gh_dgh NUMERIC(5,2) CHECK (gh_dgh >= 0),
  kh_dgh NUMERIC(5,2) CHECK (kh_dgh >= 0),
  -- Saltwater specific
  salinity NUMERIC(5,4) CHECK (salinity >= 0 AND salinity <= 2),
  calcium_ppm NUMERIC(6,2) CHECK (calcium_ppm >= 0),
  alkalinity_dkh NUMERIC(5,2) CHECK (alkalinity_dkh >= 0),
  magnesium_ppm NUMERIC(6,2) CHECK (magnesium_ppm >= 0),
  phosphate_ppm NUMERIC(5,3) CHECK (phosphate_ppm >= 0),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_water_parameters_tank_id ON public.water_parameters(tank_id);
CREATE INDEX idx_water_parameters_measured_at ON public.water_parameters(measured_at);

-- ============================================================================
-- SPECIES TABLE
-- ============================================================================

CREATE TABLE public.species (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  common_name TEXT NOT NULL,
  scientific_name TEXT,
  type TEXT NOT NULL CHECK (type IN ('freshwater', 'saltwater', 'invertebrate', 'plant')),
  care_level care_level DEFAULT 'beginner',
  temperament temperament DEFAULT 'peaceful',
  min_tank_size_gallons NUMERIC(6,2),
  max_size_inches NUMERIC(5,2),
  temp_min_f NUMERIC(5,2),
  temp_max_f NUMERIC(5,2),
  ph_min NUMERIC(4,2),
  ph_max NUMERIC(4,2),
  diet TEXT,
  compatibility_notes TEXT,
  photo_url TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_species_type ON public.species(type);
CREATE INDEX idx_species_common_name_gin ON public.species USING GIN (to_tsvector('english', common_name));
CREATE INDEX idx_species_scientific_name_gin ON public.species USING GIN (to_tsvector('english', scientific_name));

-- ============================================================================
-- LIVESTOCK TABLE
-- ============================================================================

CREATE TABLE public.livestock (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tank_id UUID NOT NULL REFERENCES public.tanks(id) ON DELETE CASCADE,
  species_id UUID REFERENCES public.species(id) ON DELETE SET NULL,
  custom_name TEXT, -- For species not in database
  nickname TEXT,
  quantity INTEGER DEFAULT 1 CHECK (quantity > 0),
  date_added DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_livestock_tank_id ON public.livestock(tank_id);
CREATE INDEX idx_livestock_species_id ON public.livestock(species_id);

-- ============================================================================
-- MAINTENANCE TASKS TABLE
-- ============================================================================

CREATE TABLE public.maintenance_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tank_id UUID NOT NULL REFERENCES public.tanks(id) ON DELETE CASCADE,
  type task_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  frequency task_frequency DEFAULT 'once',
  custom_interval_days INTEGER CHECK (custom_interval_days > 0),
  next_due_date DATE NOT NULL,
  reminder_before_hours INTEGER DEFAULT 24,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_maintenance_tasks_tank_id ON public.maintenance_tasks(tank_id);
CREATE INDEX idx_maintenance_tasks_next_due_date ON public.maintenance_tasks(next_due_date);

-- ============================================================================
-- MAINTENANCE LOGS TABLE
-- ============================================================================

CREATE TABLE public.maintenance_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES public.maintenance_tasks(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_maintenance_logs_task_id ON public.maintenance_logs(task_id);

-- ============================================================================
-- AI MESSAGES TABLE
-- ============================================================================

CREATE TABLE public.ai_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tank_id UUID NOT NULL REFERENCES public.tanks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  action_type TEXT,
  action_data JSONB,
  action_executed BOOLEAN DEFAULT FALSE,
  input_tokens INTEGER,
  output_tokens INTEGER,
  model TEXT,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ai_messages_tank_id ON public.ai_messages(tank_id);
CREATE INDEX idx_ai_messages_user_id ON public.ai_messages(user_id);
CREATE INDEX idx_ai_messages_created_at ON public.ai_messages(created_at);

-- ============================================================================
-- AI USAGE TABLE (for rate limiting)
-- ============================================================================

CREATE TABLE public.ai_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  feature TEXT NOT NULL CHECK (feature IN ('chat', 'diagnosis', 'report', 'search')),
  message_count INTEGER DEFAULT 0,
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  model TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date, feature)
);

CREATE INDEX idx_ai_usage_user_date ON public.ai_usage(user_id, date);

-- ============================================================================
-- AUDIT LOGS TABLE (immutable)
-- ============================================================================

CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  admin_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at);
CREATE INDEX idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tanks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.water_parameters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.species ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.livestock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Subscriptions policies
CREATE POLICY "Users can view own subscription" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Tanks policies
CREATE POLICY "Users can view own tanks" ON public.tanks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own tanks" ON public.tanks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tanks" ON public.tanks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tanks" ON public.tanks
  FOR DELETE USING (auth.uid() = user_id);

-- Water parameters policies
CREATE POLICY "Users can view own parameters" ON public.water_parameters
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.tanks WHERE tanks.id = water_parameters.tank_id AND tanks.user_id = auth.uid())
  );

CREATE POLICY "Users can create own parameters" ON public.water_parameters
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.tanks WHERE tanks.id = water_parameters.tank_id AND tanks.user_id = auth.uid())
  );

CREATE POLICY "Users can update own parameters" ON public.water_parameters
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.tanks WHERE tanks.id = water_parameters.tank_id AND tanks.user_id = auth.uid())
  );

CREATE POLICY "Users can delete own parameters" ON public.water_parameters
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.tanks WHERE tanks.id = water_parameters.tank_id AND tanks.user_id = auth.uid())
  );

-- Species policies (public read)
CREATE POLICY "Anyone can view species" ON public.species
  FOR SELECT USING (true);

-- Livestock policies
CREATE POLICY "Users can view own livestock" ON public.livestock
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.tanks WHERE tanks.id = livestock.tank_id AND tanks.user_id = auth.uid())
  );

CREATE POLICY "Users can create own livestock" ON public.livestock
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.tanks WHERE tanks.id = livestock.tank_id AND tanks.user_id = auth.uid())
  );

CREATE POLICY "Users can update own livestock" ON public.livestock
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.tanks WHERE tanks.id = livestock.tank_id AND tanks.user_id = auth.uid())
  );

CREATE POLICY "Users can delete own livestock" ON public.livestock
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.tanks WHERE tanks.id = livestock.tank_id AND tanks.user_id = auth.uid())
  );

-- Maintenance tasks policies
CREATE POLICY "Users can view own tasks" ON public.maintenance_tasks
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.tanks WHERE tanks.id = maintenance_tasks.tank_id AND tanks.user_id = auth.uid())
  );

CREATE POLICY "Users can create own tasks" ON public.maintenance_tasks
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.tanks WHERE tanks.id = maintenance_tasks.tank_id AND tanks.user_id = auth.uid())
  );

CREATE POLICY "Users can update own tasks" ON public.maintenance_tasks
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.tanks WHERE tanks.id = maintenance_tasks.tank_id AND tanks.user_id = auth.uid())
  );

CREATE POLICY "Users can delete own tasks" ON public.maintenance_tasks
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.tanks WHERE tanks.id = maintenance_tasks.tank_id AND tanks.user_id = auth.uid())
  );

-- Maintenance logs policies
CREATE POLICY "Users can view own logs" ON public.maintenance_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.maintenance_tasks
      JOIN public.tanks ON tanks.id = maintenance_tasks.tank_id
      WHERE maintenance_tasks.id = maintenance_logs.task_id AND tanks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own logs" ON public.maintenance_logs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.maintenance_tasks
      JOIN public.tanks ON tanks.id = maintenance_tasks.tank_id
      WHERE maintenance_tasks.id = maintenance_logs.task_id AND tanks.user_id = auth.uid()
    )
  );

-- AI messages policies
CREATE POLICY "Users can view own messages" ON public.ai_messages
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own messages" ON public.ai_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- AI usage policies
CREATE POLICY "Users can view own usage" ON public.ai_usage
  FOR SELECT USING (auth.uid() = user_id);

-- Audit logs policies (users can view their own)
CREATE POLICY "Users can view own audit logs" ON public.audit_logs
  FOR SELECT USING (auth.uid() = user_id);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get user's current tier limits
CREATE OR REPLACE FUNCTION public.get_tier_limits(user_uuid UUID)
RETURNS TABLE (
  tanks_limit INTEGER,
  ai_messages_limit INTEGER,
  photo_diagnosis_limit INTEGER,
  equipment_recs_limit INTEGER
) AS $$
DECLARE
  user_tier subscription_tier;
BEGIN
  SELECT tier INTO user_tier FROM public.subscriptions WHERE user_id = user_uuid;

  RETURN QUERY SELECT
    CASE user_tier
      WHEN 'free' THEN 1
      WHEN 'starter' THEN 1
      WHEN 'plus' THEN 5
      WHEN 'pro' THEN 999999
    END::INTEGER,
    CASE user_tier
      WHEN 'free' THEN 10
      WHEN 'starter' THEN 100
      WHEN 'plus' THEN 200
      WHEN 'pro' THEN 999999
    END::INTEGER,
    CASE user_tier
      WHEN 'free' THEN 0
      WHEN 'starter' THEN 0
      WHEN 'plus' THEN 10
      WHEN 'pro' THEN 30
    END::INTEGER,
    CASE user_tier
      WHEN 'free' THEN 0
      WHEN 'starter' THEN 0
      WHEN 'plus' THEN 0
      WHEN 'pro' THEN 10
    END::INTEGER;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check and increment AI usage
CREATE OR REPLACE FUNCTION public.check_and_increment_ai_usage(
  user_uuid UUID,
  feature_name TEXT DEFAULT 'chat'
)
RETURNS BOOLEAN AS $$
DECLARE
  current_count INTEGER;
  limit_count INTEGER;
  user_tier subscription_tier;
BEGIN
  -- Get user's tier
  SELECT tier INTO user_tier FROM public.subscriptions WHERE user_id = user_uuid;

  -- Get limit based on tier
  SELECT
    CASE user_tier
      WHEN 'free' THEN 10
      WHEN 'starter' THEN 100
      WHEN 'plus' THEN 200
      WHEN 'pro' THEN 999999
    END INTO limit_count;

  -- Get current count for today
  SELECT COALESCE(message_count, 0) INTO current_count
  FROM public.ai_usage
  WHERE user_id = user_uuid AND date = CURRENT_DATE AND feature = feature_name;

  -- Check if under limit
  IF current_count >= limit_count THEN
    RETURN FALSE;
  END IF;

  -- Increment or insert
  INSERT INTO public.ai_usage (user_id, date, feature, message_count)
  VALUES (user_uuid, CURRENT_DATE, feature_name, 1)
  ON CONFLICT (user_id, date, feature)
  DO UPDATE SET message_count = ai_usage.message_count + 1, updated_at = NOW();

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- UPDATED_AT TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_tanks_updated_at BEFORE UPDATE ON public.tanks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_species_updated_at BEFORE UPDATE ON public.species
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_livestock_updated_at BEFORE UPDATE ON public.livestock
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_maintenance_tasks_updated_at BEFORE UPDATE ON public.maintenance_tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_ai_usage_updated_at BEFORE UPDATE ON public.ai_usage
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.users IS 'User profiles extending auth.users';
COMMENT ON TABLE public.subscriptions IS 'Stripe subscription data and tier information';
COMMENT ON TABLE public.tanks IS 'Aquarium tank profiles';
COMMENT ON TABLE public.water_parameters IS 'Water chemistry test results';
COMMENT ON TABLE public.species IS 'Species database with care requirements';
COMMENT ON TABLE public.livestock IS 'Fish and invertebrates in each tank';
COMMENT ON TABLE public.maintenance_tasks IS 'Scheduled maintenance tasks';
COMMENT ON TABLE public.maintenance_logs IS 'Completed maintenance history';
COMMENT ON TABLE public.ai_messages IS 'AI chat conversation history';
COMMENT ON TABLE public.ai_usage IS 'Daily AI usage tracking for rate limiting';
COMMENT ON TABLE public.audit_logs IS 'Immutable audit trail for admin actions';
