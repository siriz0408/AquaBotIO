-- ============================================================================
-- AquaBotAI PostgreSQL 17 Test Data Seed File
-- ============================================================================
-- This file seeds comprehensive test data for the AquaBotAI Supabase database.
--
-- EXECUTION NOTES:
-- - Run with service role or as authenticated user with appropriate permissions
-- - RLS policies are enabled but bypassed via service role
-- - Triggers handle_new_user() and handle_new_user_subscription() will fire
-- - Insert into auth.users FIRST, then UPDATE public.users and public.subscriptions
-- - This transaction is atomic - all or nothing
--
-- DATA STRUCTURE:
-- 1. Species (reference data, no dependencies)
-- 2. Auth users (triggers create public.users and public.subscriptions)
-- 3. Update user profiles and subscriptions
-- 4. Tanks
-- 5. Water parameters
-- 6. Livestock
-- 7. Maintenance tasks and logs
-- 8. AI messages and usage
-- 9. Feedback and audit logs
-- ============================================================================

BEGIN;

-- ============================================================================
-- SECTION 1: SPECIES REFERENCE DATA (25 species)
-- ============================================================================
-- No foreign key dependencies. Insert these first.
-- Covering freshwater fish, saltwater fish, invertebrates, and plants.

INSERT INTO public.species (
  id, common_name, type, temperament, care_level, temp_min_f, temp_max_f,
  ph_min, ph_max, min_tank_size_gallons, max_size_inches, created_at, updated_at
) VALUES

-- Freshwater Fish (10 species)
('c0000001-0000-0000-0000-000000000001', 'Neon Tetra', 'freshwater', 'peaceful', 'beginner', 72, 80, 5.0, 7.5, 10, 1.5, NOW(), NOW()),
('c0000002-0000-0000-0000-000000000002', 'Betta Fish', 'freshwater', 'semi_aggressive', 'beginner', 76, 82, 6.0, 7.5, 5, 3, NOW(), NOW()),
('c0000003-0000-0000-0000-000000000003', 'Oscar Fish', 'freshwater', 'aggressive', 'intermediate', 72, 80, 6.0, 7.5, 55, 14, NOW(), NOW()),
('c0000004-0000-0000-0000-000000000004', 'Corydoras Catfish', 'freshwater', 'peaceful', 'beginner', 72, 79, 6.0, 8.0, 10, 3, NOW(), NOW()),
('c0000005-0000-0000-0000-000000000005', 'Angelfish', 'freshwater', 'semi_aggressive', 'intermediate', 76, 84, 6.0, 7.5, 30, 6, NOW(), NOW()),
('c0000006-0000-0000-0000-000000000006', 'Guppy', 'freshwater', 'peaceful', 'beginner', 72, 82, 6.8, 7.8, 5, 2, NOW(), NOW()),
('c0000007-0000-0000-0000-000000000007', 'Discus', 'freshwater', 'peaceful', 'expert', 82, 88, 5.0, 7.0, 55, 8, NOW(), NOW()),
('c0000008-0000-0000-0000-000000000008', 'African Cichlid', 'freshwater', 'aggressive', 'intermediate', 75, 82, 7.5, 8.5, 30, 6, NOW(), NOW()),
('c0000009-0000-0000-0000-000000000009', 'Pleco', 'freshwater', 'peaceful', 'beginner', 72, 82, 6.5, 7.5, 30, 15, NOW(), NOW()),
('c0000010-0000-0000-0000-000000000010', 'Cherry Barb', 'freshwater', 'peaceful', 'beginner', 73, 81, 6.0, 8.0, 25, 2, NOW(), NOW()),

-- Saltwater Fish (5 species)
('c0000011-0000-0000-0000-000000000011', 'Clownfish', 'saltwater', 'peaceful', 'beginner', 75, 82, 7.8, 8.4, 20, 4, NOW(), NOW()),
('c0000012-0000-0000-0000-000000000012', 'Blue Tang', 'saltwater', 'semi_aggressive', 'intermediate', 75, 82, 8.0, 8.4, 75, 12, NOW(), NOW()),
('c0000013-0000-0000-0000-000000000013', 'Mandarin Dragonet', 'saltwater', 'peaceful', 'expert', 74, 80, 8.1, 8.4, 30, 3, NOW(), NOW()),
('c0000014-0000-0000-0000-000000000014', 'Royal Gramma', 'saltwater', 'peaceful', 'beginner', 72, 78, 8.1, 8.4, 30, 3, NOW(), NOW()),
('c0000015-0000-0000-0000-000000000015', 'Yellow Tang', 'saltwater', 'semi_aggressive', 'intermediate', 75, 82, 8.0, 8.4, 75, 8, NOW(), NOW()),

-- Invertebrates (5 species)
('c0000016-0000-0000-0000-000000000016', 'Cherry Shrimp', 'invertebrate', 'peaceful', 'beginner', 65, 80, 6.5, 8.0, 5, 1.5, NOW(), NOW()),
('c0000017-0000-0000-0000-000000000017', 'Amano Shrimp', 'invertebrate', 'peaceful', 'beginner', 70, 80, 6.5, 7.5, 10, 2, NOW(), NOW()),
('c0000018-0000-0000-0000-000000000018', 'Mystery Snail', 'invertebrate', 'peaceful', 'beginner', 68, 84, 7.0, 8.0, 5, 2, NOW(), NOW()),
('c0000019-0000-0000-0000-000000000019', 'Cleaner Shrimp', 'invertebrate', 'peaceful', 'intermediate', 75, 82, 8.0, 8.4, 20, 3, NOW(), NOW()),
('c0000020-0000-0000-0000-000000000020', 'Hermit Crab', 'invertebrate', 'peaceful', 'beginner', 72, 80, 8.0, 8.4, 10, 2, NOW(), NOW()),

-- Plants (5 species)
('c0000021-0000-0000-0000-000000000021', 'Java Fern', 'plant', 'peaceful', 'beginner', 68, 82, 6.0, 7.5, 10, 12, NOW(), NOW()),
('c0000022-0000-0000-0000-000000000022', 'Anubias', 'plant', 'peaceful', 'beginner', 72, 82, 6.0, 7.5, 5, 8, NOW(), NOW()),
('c0000023-0000-0000-0000-000000000023', 'Amazon Sword', 'plant', 'peaceful', 'beginner', 72, 82, 6.5, 7.5, 20, 20, NOW(), NOW()),
('c0000024-0000-0000-0000-000000000024', 'Monte Carlo', 'plant', 'peaceful', 'intermediate', 68, 77, 6.0, 7.5, 5, 2, NOW(), NOW()),
('c0000025-0000-0000-0000-000000000025', 'Red Root Floater', 'plant', 'peaceful', 'beginner', 70, 82, 6.5, 7.5, 5, 1, NOW(), NOW());

-- ============================================================================
-- SECTION 2: AUTH USERS (triggers will auto-create public.users and subscriptions)
-- ============================================================================
-- Insert 8 new test users into auth.users
-- Each INSERT triggers handle_new_user() and handle_new_user_subscription()

INSERT INTO auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  raw_user_meta_data, created_at, updated_at, aud, role
) VALUES

-- User 1: Maria Garcia - Free/Trial Active/Beginner
('a1111111-1111-1111-1111-111111111111',
 '00000000-0000-0000-0000-000000000000',
 'maria.garcia@testaquabot.com',
 crypt('TestPass123!', gen_salt('bf')),
 NOW(),
 '{"full_name": "Maria Garcia"}',
 NOW(), NOW(), 'authenticated', 'authenticated'),

-- User 2: James Wilson - Free/Trial Expired/Beginner
('a2222222-2222-2222-2222-222222222222',
 '00000000-0000-0000-0000-000000000000',
 'james.wilson@testaquabot.com',
 crypt('TestPass123!', gen_salt('bf')),
 NOW(),
 '{"full_name": "James Wilson"}',
 NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days', 'authenticated', 'authenticated'),

-- User 3: Emily Chen - Starter/Active/Intermediate
('a3333333-3333-3333-3333-333333333333',
 '00000000-0000-0000-0000-000000000000',
 'emily.chen@testaquabot.com',
 crypt('TestPass123!', gen_salt('bf')),
 NOW(),
 '{"full_name": "Emily Chen"}',
 NOW() - INTERVAL '60 days', NOW() - INTERVAL '60 days', 'authenticated', 'authenticated'),

-- User 4: David Kim - Plus/Active/Advanced
('a4444444-4444-4444-4444-444444444444',
 '00000000-0000-0000-0000-000000000000',
 'david.kim@testaquabot.com',
 crypt('TestPass123!', gen_salt('bf')),
 NOW(),
 '{"full_name": "David Kim"}',
 NOW() - INTERVAL '90 days', NOW() - INTERVAL '90 days', 'authenticated', 'authenticated'),

-- User 5: Sarah Johnson - Pro/Active/Advanced
('a5555555-5555-5555-5555-555555555555',
 '00000000-0000-0000-0000-000000000000',
 'sarah.johnson@testaquabot.com',
 crypt('TestPass123!', gen_salt('bf')),
 NOW(),
 '{"full_name": "Sarah Johnson"}',
 NOW() - INTERVAL '120 days', NOW() - INTERVAL '120 days', 'authenticated', 'authenticated'),

-- User 6: Mike Thompson - Canceled/Was Starter
('a6666666-6666-6666-6666-666666666666',
 '00000000-0000-0000-0000-000000000000',
 'mike.thompson@testaquabot.com',
 crypt('TestPass123!', gen_salt('bf')),
 NOW(),
 '{"full_name": "Mike Thompson"}',
 NOW() - INTERVAL '150 days', NOW() - INTERVAL '150 days', 'authenticated', 'authenticated'),

-- User 7: Lisa Anderson - Plus/Past Due
('a7777777-7777-7777-7777-777777777777',
 '00000000-0000-0000-0000-000000000000',
 'lisa.anderson@testaquabot.com',
 crypt('TestPass123!', gen_salt('bf')),
 NOW(),
 '{"full_name": "Lisa Anderson"}',
 NOW() - INTERVAL '100 days', NOW() - INTERVAL '100 days', 'authenticated', 'authenticated'),

-- User 8: Alex Rivera - Incomplete Signup/Beginner
('a8888888-8888-8888-8888-888888888888',
 '00000000-0000-0000-0000-000000000000',
 'alex.rivera@testaquabot.com',
 crypt('TestPass123!', gen_salt('bf')),
 NULL,
 '{"full_name": "Alex Rivera"}',
 NOW(), NOW(), 'authenticated', 'authenticated');

-- ============================================================================
-- SECTION 3: UPDATE USER PROFILES AND SUBSCRIPTIONS
-- ============================================================================
-- The triggers created basic public.users and subscriptions, now update them
-- with detailed profile information and subscription details.

-- Maria Garcia: Free/Trial Active
UPDATE public.users
SET skill_level = 'beginner', onboarding_completed = false, onboarding_step = 1
WHERE id = 'a1111111-1111-1111-1111-111111111111';

UPDATE public.subscriptions
SET tier = 'free', status = 'trialing', trial_ends_at = NOW() + INTERVAL '13 days'
WHERE user_id = 'a1111111-1111-1111-1111-111111111111';

-- James Wilson: Free/Trial Expired
UPDATE public.users
SET skill_level = 'beginner', onboarding_completed = true
WHERE id = 'a2222222-2222-2222-2222-222222222222';

UPDATE public.subscriptions
SET tier = 'free', status = 'trialing', trial_ends_at = NOW() - INTERVAL '3 days'
WHERE user_id = 'a2222222-2222-2222-2222-222222222222';

-- Emily Chen: Starter/Active/Intermediate
UPDATE public.users
SET skill_level = 'intermediate', onboarding_completed = true
WHERE id = 'a3333333-3333-3333-3333-333333333333';

UPDATE public.subscriptions
SET tier = 'starter', status = 'active',
    stripe_customer_id = 'cus_test_emily',
    stripe_subscription_id = 'sub_test_emily',
    current_period_start = NOW() - INTERVAL '15 days',
    current_period_end = NOW() + INTERVAL '15 days'
WHERE user_id = 'a3333333-3333-3333-3333-333333333333';

-- David Kim: Plus/Active/Advanced
UPDATE public.users
SET skill_level = 'advanced', onboarding_completed = true,
    unit_preference_temp = 'celsius', unit_preference_volume = 'liters'
WHERE id = 'a4444444-4444-4444-4444-444444444444';

UPDATE public.subscriptions
SET tier = 'plus', status = 'active',
    stripe_customer_id = 'cus_test_david',
    stripe_subscription_id = 'sub_test_david',
    current_period_start = NOW() - INTERVAL '20 days',
    current_period_end = NOW() + INTERVAL '10 days'
WHERE user_id = 'a4444444-4444-4444-4444-444444444444';

-- Sarah Johnson: Pro/Active/Advanced
UPDATE public.users
SET skill_level = 'advanced', onboarding_completed = true
WHERE id = 'a5555555-5555-5555-5555-555555555555';

UPDATE public.subscriptions
SET tier = 'pro', status = 'active',
    stripe_customer_id = 'cus_test_sarah',
    stripe_subscription_id = 'sub_test_sarah',
    current_period_start = NOW() - INTERVAL '25 days',
    current_period_end = NOW() + INTERVAL '5 days'
WHERE user_id = 'a5555555-5555-5555-5555-555555555555';

-- Mike Thompson: Starter/Canceled
UPDATE public.users
SET skill_level = 'intermediate', onboarding_completed = true
WHERE id = 'a6666666-6666-6666-6666-666666666666';

UPDATE public.subscriptions
SET tier = 'starter', status = 'canceled',
    stripe_customer_id = 'cus_test_mike',
    cancel_at_period_end = true,
    current_period_end = NOW() + INTERVAL '5 days'
WHERE user_id = 'a6666666-6666-6666-6666-666666666666';

-- Lisa Anderson: Plus/Past Due
UPDATE public.users
SET skill_level = 'intermediate', onboarding_completed = true
WHERE id = 'a7777777-7777-7777-7777-777777777777';

UPDATE public.subscriptions
SET tier = 'plus', status = 'past_due',
    stripe_customer_id = 'cus_test_lisa',
    stripe_subscription_id = 'sub_test_lisa'
WHERE user_id = 'a7777777-7777-7777-7777-777777777777';

-- Alex Rivera: Free/Incomplete
UPDATE public.users
SET skill_level = 'beginner', onboarding_completed = false, onboarding_step = 0
WHERE id = 'a8888888-8888-8888-8888-888888888888';

UPDATE public.subscriptions
SET tier = 'free', status = 'incomplete'
WHERE user_id = 'a8888888-8888-8888-8888-888888888888';

-- ============================================================================
-- SECTION 4: TANKS (15 tanks across test users)
-- ============================================================================
-- Tank naming conventions use UUIDs with meaningful segments for tracking.

-- James Wilson's tank (1 tank)
INSERT INTO public.tanks (
  id, user_id, name, type, volume_gallons, length_inches,
  width_inches, height_inches, substrate,
  setup_date, created_at, updated_at
) VALUES
('b2000001-0000-0000-0000-000000000001', 'a2222222-2222-2222-2222-222222222222',
 'Beginner Bowl', 'freshwater', 10, NULL, NULL, NULL, NULL,
 NOW() - INTERVAL '30 days', NOW(), NOW());

-- Emily Chen's tank (1 tank)
INSERT INTO public.tanks (
  id, user_id, name, type, volume_gallons, length_inches,
  width_inches, height_inches, substrate,
  setup_date, created_at, updated_at
) VALUES
('b3000001-0000-0000-0000-000000000001', 'a3333333-3333-3333-3333-333333333333',
 'Living Room Community', 'freshwater', 29, 24, 12, 16, 'eco-complete',
 NOW() - INTERVAL '60 days', NOW(), NOW());

-- David Kim's tanks (3 tanks)
INSERT INTO public.tanks (
  id, user_id, name, type, volume_gallons, length_inches,
  width_inches, height_inches, substrate,
  setup_date, created_at, updated_at
) VALUES
('b4000001-0000-0000-0000-000000000001', 'a4444444-4444-4444-4444-444444444444',
 'Reef Paradise', 'saltwater', 75, 48, 18, 21, 'live sand',
 NOW() - INTERVAL '90 days', NOW(), NOW()),
('b4000002-0000-0000-0000-000000000002', 'a4444444-4444-4444-4444-444444444444',
 'Planted Paradise', 'freshwater', 40, 36, 12, 16, 'aquasoil',
 NOW() - INTERVAL '120 days', NOW(), NOW()),
('b4000003-0000-0000-0000-000000000003', 'a4444444-4444-4444-4444-444444444444',
 'Brackish Experiment', 'brackish', 20, 24, 12, 12, 'crushed coral',
 NOW() - INTERVAL '45 days', NOW(), NOW());

-- Sarah Johnson's tanks (5 tanks, one soft-deleted)
INSERT INTO public.tanks (
  id, user_id, name, type, volume_gallons, length_inches,
  width_inches, height_inches, substrate,
  setup_date, created_at, updated_at
) VALUES
('b5000001-0000-0000-0000-000000000001', 'a5555555-5555-5555-5555-555555555555',
 'Main Display Reef', 'saltwater', 150, 60, 24, 24, 'live rock/sand',
 NOW() - INTERVAL '180 days', NOW(), NOW()),
('b5000002-0000-0000-0000-000000000002', 'a5555555-5555-5555-5555-555555555555',
 'Discus Palace', 'freshwater', 75, 48, 18, 21, 'fine gravel',
 NOW() - INTERVAL '150 days', NOW(), NOW()),
('b5000003-0000-0000-0000-000000000003', 'a5555555-5555-5555-5555-555555555555',
 'Koi Pond', 'pond', 1000, NULL, NULL, NULL, NULL,
 NOW() - INTERVAL '365 days', NOW(), NOW()),
('b5000004-0000-0000-0000-000000000004', 'a5555555-5555-5555-5555-555555555555',
 'Quarantine Tank', 'freshwater', 10, 20, 10, 12, NULL,
 NOW() - INTERVAL '200 days', NOW(), NOW()),
('b5000005-0000-0000-0000-000000000005', 'a5555555-5555-5555-5555-555555555555',
 'Nano Planted', 'freshwater', 5, 12, 8, 10, 'aquasoil',
 NOW() - INTERVAL '90 days', NOW(), NOW());

-- Update the soft-deleted tank properly
UPDATE public.tanks
SET deleted_at = NOW() - INTERVAL '10 days'
WHERE id = 'b5000005-0000-0000-0000-000000000005';

-- Mike Thompson's tank (1 tank)
INSERT INTO public.tanks (
  id, user_id, name, type, volume_gallons, length_inches,
  width_inches, height_inches, substrate,
  setup_date, created_at, updated_at
) VALUES
('b6000001-0000-0000-0000-000000000001', 'a6666666-6666-6666-6666-666666666666',
 'Office Tank', 'freshwater', 20, NULL, NULL, NULL, 'gravel',
 NOW() - INTERVAL '100 days', NOW(), NOW());

-- Lisa Anderson's tanks (2 tanks)
INSERT INTO public.tanks (
  id, user_id, name, type, volume_gallons, length_inches,
  width_inches, height_inches, substrate,
  setup_date, created_at, updated_at
) VALUES
('b7000001-0000-0000-0000-000000000001', 'a7777777-7777-7777-7777-777777777777',
 'Family Room Reef', 'saltwater', 55, 48, 13, 21, 'live sand',
 NOW() - INTERVAL '80 days', NOW(), NOW()),
('b7000002-0000-0000-0000-000000000002', 'a7777777-7777-7777-7777-777777777777',
 'Kids Freshwater', 'freshwater', 20, NULL, NULL, NULL, 'colored gravel',
 NOW() - INTERVAL '60 days', NOW(), NOW());

-- ============================================================================
-- SECTION 5: WATER PARAMETERS (realistic aquarium readings)
-- ============================================================================
-- All temperatures in FAHRENHEIT. Check constraint: 32-120°F
-- All pH values between 0-14
-- All ppm values >= 0

-- James Wilson's beginner tank - poor water quality (cycling, high ammonia)
INSERT INTO public.water_parameters (
  tank_id, ph, temperature_f, ammonia_ppm, nitrite_ppm, nitrate_ppm,
  measured_at, created_at
) VALUES
('b2000001-0000-0000-0000-000000000001', 7.2, 76, 2.0, 1.5, 5, NOW() - INTERVAL '21 days', NOW() - INTERVAL '21 days'),
('b2000001-0000-0000-0000-000000000001', 7.1, 76, 1.6, 1.2, 8, NOW() - INTERVAL '18 days', NOW() - INTERVAL '18 days'),
('b2000001-0000-0000-0000-000000000001', 7.0, 76, 1.2, 0.8, 12, NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days'),
('b2000001-0000-0000-0000-000000000001', 6.9, 76, 0.8, 0.4, 18, NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),
('b2000001-0000-0000-0000-000000000001', 6.9, 75, 0.4, 0.2, 25, NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days');

-- Emily Chen's community tank - good, stable parameters
INSERT INTO public.water_parameters (
  tank_id, ph, temperature_f, ammonia_ppm, nitrite_ppm, nitrate_ppm,
  measured_at, created_at
) VALUES
('b3000001-0000-0000-0000-000000000001', 7.2, 76, 0, 0, 20, NOW() - INTERVAL '42 days', NOW() - INTERVAL '42 days'),
('b3000001-0000-0000-0000-000000000001', 7.2, 76, 0, 0, 22, NOW() - INTERVAL '35 days', NOW() - INTERVAL '35 days'),
('b3000001-0000-0000-0000-000000000001', 7.1, 76, 0, 0, 24, NOW() - INTERVAL '28 days', NOW() - INTERVAL '28 days'),
('b3000001-0000-0000-0000-000000000001', 7.1, 77, 0, 0, 23, NOW() - INTERVAL '21 days', NOW() - INTERVAL '21 days'),
('b3000001-0000-0000-0000-000000000001', 7.2, 76, 0, 0, 25, NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days'),
('b3000001-0000-0000-0000-000000000001', 7.2, 75, 0, 0, 26, NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days'),
('b3000001-0000-0000-0000-000000000001', 7.1, 76, 0, 0, 24, NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
('b3000001-0000-0000-0000-000000000001', 7.2, 76, 0, 0, 25, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day');

-- David Kim's reef tank - excellent parameters with calcium fluctuation
INSERT INTO public.water_parameters (
  tank_id, ph, temperature_f, ammonia_ppm, nitrite_ppm, nitrate_ppm,
  salinity, calcium_ppm, alkalinity_dkh, magnesium_ppm,
  measured_at, created_at
) VALUES
('b4000001-0000-0000-0000-000000000001', 8.2, 78, 0, 0, 5, 1.025, 380, 8.5, 1280, NOW() - INTERVAL '56 days', NOW() - INTERVAL '56 days'),
('b4000001-0000-0000-0000-000000000001', 8.2, 78, 0, 0, 3, 1.025, 385, 8.6, 1285, NOW() - INTERVAL '49 days', NOW() - INTERVAL '49 days'),
('b4000001-0000-0000-0000-000000000001', 8.1, 78, 0, 0, 4, 1.025, 390, 8.7, 1290, NOW() - INTERVAL '42 days', NOW() - INTERVAL '42 days'),
('b4000001-0000-0000-0000-000000000001', 8.2, 79, 0, 0, 5, 1.026, 400, 8.5, 1300, NOW() - INTERVAL '35 days', NOW() - INTERVAL '35 days'),
('b4000001-0000-0000-0000-000000000001', 8.2, 78, 0, 0, 4, 1.025, 395, 8.6, 1295, NOW() - INTERVAL '28 days', NOW() - INTERVAL '28 days'),
('b4000001-0000-0000-0000-000000000001', 8.3, 78, 0, 0, 5, 1.025, 405, 8.8, 1305, NOW() - INTERVAL '21 days', NOW() - INTERVAL '21 days'),
('b4000001-0000-0000-0000-000000000001', 8.2, 78, 0, 0, 3, 1.025, 398, 8.7, 1298, NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days'),
('b4000001-0000-0000-0000-000000000001', 8.2, 79, 0, 0, 4, 1.026, 410, 8.9, 1310, NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days'),
('b4000001-0000-0000-0000-000000000001', 8.2, 78, 0, 0, 5, 1.025, 402, 8.8, 1302, NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
('b4000001-0000-0000-0000-000000000001', 8.3, 78, 0, 0, 4, 1.026, 408, 8.7, 1308, NOW(), NOW());

-- David Kim's planted tank - good with slight pH drift
INSERT INTO public.water_parameters (
  tank_id, ph, temperature_f, ammonia_ppm, nitrite_ppm, nitrate_ppm,
  measured_at, created_at
) VALUES
('b4000002-0000-0000-0000-000000000002', 7.0, 74, 0, 0, 15, NOW() - INTERVAL '42 days', NOW() - INTERVAL '42 days'),
('b4000002-0000-0000-0000-000000000002', 6.95, 74, 0, 0, 14, NOW() - INTERVAL '35 days', NOW() - INTERVAL '35 days'),
('b4000002-0000-0000-0000-000000000002', 6.9, 74, 0, 0, 16, NOW() - INTERVAL '28 days', NOW() - INTERVAL '28 days'),
('b4000002-0000-0000-0000-000000000002', 6.8, 75, 0, 0, 15, NOW() - INTERVAL '21 days', NOW() - INTERVAL '21 days'),
('b4000002-0000-0000-0000-000000000002', 6.75, 74, 0, 0, 17, NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days'),
('b4000002-0000-0000-0000-000000000002', 6.7, 74, 0, 0, 18, NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days'),
('b4000002-0000-0000-0000-000000000002', 6.7, 75, 0, 0, 16, NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
('b4000002-0000-0000-0000-000000000002', 6.65, 74, 0, 0, 19, NOW(), NOW());

-- David Kim's brackish tank - moderate salinity
INSERT INTO public.water_parameters (
  tank_id, ph, temperature_f, ammonia_ppm, nitrite_ppm, nitrate_ppm,
  salinity, measured_at, created_at
) VALUES
('b4000003-0000-0000-0000-000000000003', 7.5, 76, 0, 0, 10, 1.008, NOW() - INTERVAL '28 days', NOW() - INTERVAL '28 days'),
('b4000003-0000-0000-0000-000000000003', 7.5, 76, 0, 0, 12, 1.009, NOW() - INTERVAL '21 days', NOW() - INTERVAL '21 days'),
('b4000003-0000-0000-0000-000000000003', 7.4, 76, 0, 0, 11, 1.007, NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days'),
('b4000003-0000-0000-0000-000000000003', 7.5, 77, 0, 0, 13, 1.010, NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days'),
('b4000003-0000-0000-0000-000000000003', 7.5, 76, 0, 0, 12, 1.008, NOW(), NOW());

-- Sarah Johnson's main reef tank - expert level monitoring
INSERT INTO public.water_parameters (
  tank_id, ph, temperature_f, ammonia_ppm, nitrite_ppm, nitrate_ppm,
  salinity, calcium_ppm, alkalinity_dkh, magnesium_ppm,
  measured_at, created_at
) VALUES
('b5000001-0000-0000-0000-000000000001', 8.3, 78, 0, 0, 3, 1.026, 420, 9.0, 1320, NOW() - INTERVAL '84 days', NOW() - INTERVAL '84 days'),
('b5000001-0000-0000-0000-000000000001', 8.3, 78, 0, 0, 2, 1.025, 418, 9.1, 1318, NOW() - INTERVAL '70 days', NOW() - INTERVAL '70 days'),
('b5000001-0000-0000-0000-000000000001', 8.2, 78, 0, 0, 4, 1.026, 425, 8.9, 1325, NOW() - INTERVAL '56 days', NOW() - INTERVAL '56 days'),
('b5000001-0000-0000-0000-000000000001', 8.3, 79, 0, 0, 3, 1.026, 430, 9.0, 1330, NOW() - INTERVAL '42 days', NOW() - INTERVAL '42 days'),
('b5000001-0000-0000-0000-000000000001', 8.2, 78, 0, 0, 2, 1.025, 422, 8.95, 1322, NOW() - INTERVAL '28 days', NOW() - INTERVAL '28 days'),
('b5000001-0000-0000-0000-000000000001', 8.3, 78, 0, 0, 5, 1.026, 428, 9.05, 1328, NOW() - INTERVAL '21 days', NOW() - INTERVAL '21 days'),
('b5000001-0000-0000-0000-000000000001', 8.2, 78, 0, 0, 3, 1.025, 423, 8.98, 1323, NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days'),
('b5000001-0000-0000-0000-000000000001', 8.3, 79, 0, 0, 4, 1.026, 432, 9.08, 1332, NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days'),
('b5000001-0000-0000-0000-000000000001', 8.2, 78, 0, 0, 3, 1.025, 425, 9.0, 1325, NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
('b5000001-0000-0000-0000-000000000001', 8.3, 78, 0, 0, 4, 1.026, 430, 9.05, 1330, NOW(), NOW());

-- Sarah Johnson's discus tank - warm, soft, acidic water
INSERT INTO public.water_parameters (
  tank_id, ph, temperature_f, ammonia_ppm, nitrite_ppm, nitrate_ppm,
  measured_at, created_at
) VALUES
('b5000002-0000-0000-0000-000000000002', 5.8, 85, 0, 0, 10, NOW() - INTERVAL '42 days', NOW() - INTERVAL '42 days'),
('b5000002-0000-0000-0000-000000000002', 5.9, 85, 0, 0, 12, NOW() - INTERVAL '35 days', NOW() - INTERVAL '35 days'),
('b5000002-0000-0000-0000-000000000002', 5.8, 85, 0, 0, 11, NOW() - INTERVAL '28 days', NOW() - INTERVAL '28 days'),
('b5000002-0000-0000-0000-000000000002', 6.0, 86, 0, 0, 13, NOW() - INTERVAL '21 days', NOW() - INTERVAL '21 days'),
('b5000002-0000-0000-0000-000000000002', 5.9, 85, 0, 0, 12, NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days'),
('b5000002-0000-0000-0000-000000000002', 5.8, 85, 0, 0, 14, NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days'),
('b5000002-0000-0000-0000-000000000002', 5.9, 84, 0, 0, 13, NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
('b5000002-0000-0000-0000-000000000002', 5.8, 85, 0, 0, 15, NOW(), NOW());

-- Sarah Johnson's koi pond - seasonal temperature variation
INSERT INTO public.water_parameters (
  tank_id, ph, temperature_f, ammonia_ppm, nitrite_ppm, nitrate_ppm,
  measured_at, created_at
) VALUES
('b5000003-0000-0000-0000-000000000003', 7.2, 48, 0, 0, 5, NOW() - INTERVAL '365 days', NOW() - INTERVAL '365 days'),
('b5000003-0000-0000-0000-000000000003', 7.3, 62, 0, 0, 8, NOW() - INTERVAL '250 days', NOW() - INTERVAL '250 days'),
('b5000003-0000-0000-0000-000000000003', 7.2, 75, 0, 0, 12, NOW() - INTERVAL '150 days', NOW() - INTERVAL '150 days'),
('b5000003-0000-0000-0000-000000000003', 7.1, 78, 0, 0, 14, NOW() - INTERVAL '60 days', NOW() - INTERVAL '60 days'),
('b5000003-0000-0000-0000-000000000003', 7.2, 70, 0, 0, 10, NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days'),
('b5000003-0000-0000-0000-000000000003', 7.3, 65, 0, 0, 6, NOW(), NOW());

-- Mike Thompson's office tank - neglected, degrading parameters
INSERT INTO public.water_parameters (
  tank_id, ph, temperature_f, ammonia_ppm, nitrite_ppm, nitrate_ppm,
  measured_at, created_at
) VALUES
('b6000001-0000-0000-0000-000000000001', 7.4, 76, 0.2, 0, 30, NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days'),
('b6000001-0000-0000-0000-000000000001', 7.2, 76, 0.4, 0.1, 45, NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 days'),
('b6000001-0000-0000-0000-000000000001', 7.0, 75, 0.6, 0.2, 60, NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),
('b6000001-0000-0000-0000-000000000001', 6.8, 75, 0.8, 0.3, 75, NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
('b6000001-0000-0000-0000-000000000001', 6.5, 74, 1.2, 0.4, 90, NOW(), NOW());

-- Lisa Anderson's reef tank - moderate parameters
INSERT INTO public.water_parameters (
  tank_id, ph, temperature_f, ammonia_ppm, nitrite_ppm, nitrate_ppm,
  salinity, calcium_ppm, alkalinity_dkh, magnesium_ppm,
  measured_at, created_at
) VALUES
('b7000001-0000-0000-0000-000000000001', 8.2, 78, 0, 0, 8, 1.025, 390, 8.5, 1290, NOW() - INTERVAL '48 days', NOW() - INTERVAL '48 days'),
('b7000001-0000-0000-0000-000000000001', 8.2, 78, 0, 0, 6, 1.025, 395, 8.6, 1295, NOW() - INTERVAL '36 days', NOW() - INTERVAL '36 days'),
('b7000001-0000-0000-0000-000000000001', 8.1, 78, 0, 0, 10, 1.024, 388, 8.4, 1288, NOW() - INTERVAL '24 days', NOW() - INTERVAL '24 days'),
('b7000001-0000-0000-0000-000000000001', 8.2, 79, 0, 0, 7, 1.025, 400, 8.7, 1300, NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days'),
('b7000001-0000-0000-0000-000000000001', 8.2, 78, 0, 0, 9, 1.025, 393, 8.5, 1293, NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days'),
('b7000001-0000-0000-0000-000000000001', 8.1, 78, 0, 0, 8, 1.024, 391, 8.6, 1291, NOW(), NOW());

-- Lisa Anderson's freshwater tank - stable parameters
INSERT INTO public.water_parameters (
  tank_id, ph, temperature_f, ammonia_ppm, nitrite_ppm, nitrate_ppm,
  measured_at, created_at
) VALUES
('b7000002-0000-0000-0000-000000000002', 7.2, 76, 0, 0, 20, NOW() - INTERVAL '36 days', NOW() - INTERVAL '36 days'),
('b7000002-0000-0000-0000-000000000002', 7.2, 76, 0, 0, 22, NOW() - INTERVAL '24 days', NOW() - INTERVAL '24 days'),
('b7000002-0000-0000-0000-000000000002', 7.1, 76, 0, 0, 21, NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days'),
('b7000002-0000-0000-0000-000000000002', 7.2, 76, 0, 0, 23, NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days'),
('b7000002-0000-0000-0000-000000000002', 7.1, 76, 0, 0, 22, NOW(), NOW());

-- ============================================================================
-- SECTION 6: LIVESTOCK (fish, invertebrates, plants in tanks)
-- ============================================================================
-- References species by species_id from section 1. Some tanks use custom_name only.

-- James Wilson's tank: 3 guppies, 2 mystery snails
INSERT INTO public.livestock (
  id, tank_id, species_id, custom_name, quantity, is_active,
  created_at, updated_at
) VALUES
('d2000001-0000-0000-0000-000000000001', 'b2000001-0000-0000-0000-000000000001', 'c0000006-0000-0000-0000-000000000006', NULL, 3, true, NOW(), NOW()),
('d2000002-0000-0000-0000-000000000002', 'b2000001-0000-0000-0000-000000000001', 'c0000018-0000-0000-0000-000000000018', NULL, 2, true, NOW(), NOW());

-- Emily Chen's tank: 10 neon tetras, 5 corydoras, 3 cherry shrimp, 1 pleco, java fern
INSERT INTO public.livestock (
  id, tank_id, species_id, custom_name, quantity, is_active,
  created_at, updated_at
) VALUES
('d3000001-0000-0000-0000-000000000001', 'b3000001-0000-0000-0000-000000000001', 'c0000001-0000-0000-0000-000000000001', NULL, 10, true, NOW(), NOW()),
('d3000002-0000-0000-0000-000000000002', 'b3000001-0000-0000-0000-000000000001', 'c0000004-0000-0000-0000-000000000004', NULL, 5, true, NOW(), NOW()),
('d3000003-0000-0000-0000-000000000003', 'b3000001-0000-0000-0000-000000000001', 'c0000016-0000-0000-0000-000000000016', NULL, 3, true, NOW(), NOW()),
('d3000004-0000-0000-0000-000000000004', 'b3000001-0000-0000-0000-000000000001', 'c0000009-0000-0000-0000-000000000009', NULL, 1, true, NOW(), NOW()),
('d3000005-0000-0000-0000-000000000005', 'b3000001-0000-0000-0000-000000000001', 'c0000021-0000-0000-0000-000000000021', NULL, 2, true, NOW(), NOW());

-- David Kim's reef tank: 2 clownfish, 1 royal gramma, 1 cleaner shrimp, 1 hermit crab
INSERT INTO public.livestock (
  id, tank_id, species_id, custom_name, quantity, is_active,
  created_at, updated_at
) VALUES
('d4000001-0000-0000-0000-000000000001', 'b4000001-0000-0000-0000-000000000001', 'c0000011-0000-0000-0000-000000000011', NULL, 2, true, NOW(), NOW()),
('d4000002-0000-0000-0000-000000000002', 'b4000001-0000-0000-0000-000000000001', 'c0000014-0000-0000-0000-000000000014', NULL, 1, true, NOW(), NOW()),
('d4000003-0000-0000-0000-000000000003', 'b4000001-0000-0000-0000-000000000001', 'c0000019-0000-0000-0000-000000000019', NULL, 1, true, NOW(), NOW()),
('d4000004-0000-0000-0000-000000000004', 'b4000001-0000-0000-0000-000000000001', 'c0000020-0000-0000-0000-000000000020', NULL, 1, true, NOW(), NOW());

-- David Kim's planted tank: 6 cherry barbs, 4 corydoras, 5 amano shrimp, java fern, anubias, monte carlo
INSERT INTO public.livestock (
  id, tank_id, species_id, custom_name, quantity, is_active,
  created_at, updated_at
) VALUES
('d4100001-0000-0000-0000-000000000001', 'b4000002-0000-0000-0000-000000000002', 'c0000010-0000-0000-0000-000000000010', NULL, 6, true, NOW(), NOW()),
('d4100002-0000-0000-0000-000000000002', 'b4000002-0000-0000-0000-000000000002', 'c0000004-0000-0000-0000-000000000004', NULL, 4, true, NOW(), NOW()),
('d4100003-0000-0000-0000-000000000003', 'b4000002-0000-0000-0000-000000000002', 'c0000017-0000-0000-0000-000000000017', NULL, 5, true, NOW(), NOW()),
('d4100004-0000-0000-0000-000000000004', 'b4000002-0000-0000-0000-000000000002', 'c0000021-0000-0000-0000-000000000021', NULL, 3, true, NOW(), NOW()),
('d4100005-0000-0000-0000-000000000005', 'b4000002-0000-0000-0000-000000000002', 'c0000022-0000-0000-0000-000000000022', NULL, 2, true, NOW(), NOW()),
('d4100006-0000-0000-0000-000000000006', 'b4000002-0000-0000-0000-000000000002', 'c0000024-0000-0000-0000-000000000024', NULL, 1, true, NOW(), NOW());

-- David Kim's brackish tank: custom names only (2 Bumblebee Gobies, 3 Indian Glassfish)
INSERT INTO public.livestock (
  id, tank_id, species_id, custom_name, quantity, is_active,
  created_at, updated_at
) VALUES
('d4200001-0000-0000-0000-000000000001', 'b4000003-0000-0000-0000-000000000003', NULL, 'Bumblebee Goby', 2, true, NOW(), NOW()),
('d4200002-0000-0000-0000-000000000002', 'b4000003-0000-0000-0000-000000000003', NULL, 'Indian Glassfish', 3, true, NOW(), NOW());

-- Sarah Johnson's main reef: 2 clownfish, 1 blue tang, 1 yellow tang, 1 mandarin dragonet, 2 cleaner shrimp
INSERT INTO public.livestock (
  id, tank_id, species_id, custom_name, quantity, is_active,
  created_at, updated_at
) VALUES
('d5000001-0000-0000-0000-000000000001', 'b5000001-0000-0000-0000-000000000001', 'c0000011-0000-0000-0000-000000000011', NULL, 2, true, NOW(), NOW()),
('d5000002-0000-0000-0000-000000000002', 'b5000001-0000-0000-0000-000000000001', 'c0000012-0000-0000-0000-000000000012', NULL, 1, true, NOW(), NOW()),
('d5000003-0000-0000-0000-000000000003', 'b5000001-0000-0000-0000-000000000001', 'c0000015-0000-0000-0000-000000000015', NULL, 1, true, NOW(), NOW()),
('d5000004-0000-0000-0000-000000000004', 'b5000001-0000-0000-0000-000000000001', 'c0000013-0000-0000-0000-000000000013', NULL, 1, true, NOW(), NOW()),
('d5000005-0000-0000-0000-000000000005', 'b5000001-0000-0000-0000-000000000001', 'c0000019-0000-0000-0000-000000000019', NULL, 2, true, NOW(), NOW());

-- Sarah Johnson's discus tank: 5 discus, 10 neon tetras, amazon sword
INSERT INTO public.livestock (
  id, tank_id, species_id, custom_name, quantity, is_active,
  created_at, updated_at
) VALUES
('d5100001-0000-0000-0000-000000000001', 'b5000002-0000-0000-0000-000000000002', 'c0000007-0000-0000-0000-000000000007', NULL, 5, true, NOW(), NOW()),
('d5100002-0000-0000-0000-000000000002', 'b5000002-0000-0000-0000-000000000002', 'c0000001-0000-0000-0000-000000000001', NULL, 10, true, NOW(), NOW()),
('d5100003-0000-0000-0000-000000000003', 'b5000002-0000-0000-0000-000000000002', 'c0000023-0000-0000-0000-000000000023', NULL, 3, true, NOW(), NOW());

-- Sarah Johnson's koi pond: custom names (8 Koi, 3 Goldfish)
INSERT INTO public.livestock (
  id, tank_id, species_id, custom_name, quantity, is_active,
  created_at, updated_at
) VALUES
('d5200001-0000-0000-0000-000000000001', 'b5000003-0000-0000-0000-000000000003', NULL, 'Koi', 8, true, NOW(), NOW()),
('d5200002-0000-0000-0000-000000000002', 'b5000003-0000-0000-0000-000000000003', NULL, 'Goldfish', 3, true, NOW(), NOW());

-- Mike Thompson's tank: 3 guppies (1 is_active=false, died)
INSERT INTO public.livestock (
  id, tank_id, species_id, custom_name, quantity, is_active,
  created_at, updated_at
) VALUES
('d6000001-0000-0000-0000-000000000001', 'b6000001-0000-0000-0000-000000000001', 'c0000006-0000-0000-0000-000000000006', NULL, 2, true, NOW(), NOW()),
('d6000002-0000-0000-0000-000000000002', 'b6000001-0000-0000-0000-000000000001', 'c0000006-0000-0000-0000-000000000006', 'Spot (deceased)', 1, false, NOW(), NOW());

-- Lisa Anderson's reef tank: 2 clownfish, 1 royal gramma
INSERT INTO public.livestock (
  id, tank_id, species_id, custom_name, quantity, is_active,
  created_at, updated_at
) VALUES
('d7000001-0000-0000-0000-000000000001', 'b7000001-0000-0000-0000-000000000001', 'c0000011-0000-0000-0000-000000000011', NULL, 2, true, NOW(), NOW()),
('d7000002-0000-0000-0000-000000000002', 'b7000001-0000-0000-0000-000000000001', 'c0000014-0000-0000-0000-000000000014', NULL, 1, true, NOW(), NOW());

-- Lisa Anderson's freshwater tank: 5 neon tetras, 2 mystery snails, 1 betta
INSERT INTO public.livestock (
  id, tank_id, species_id, custom_name, quantity, is_active,
  created_at, updated_at
) VALUES
('d7100001-0000-0000-0000-000000000001', 'b7000002-0000-0000-0000-000000000002', 'c0000001-0000-0000-0000-000000000001', NULL, 5, true, NOW(), NOW()),
('d7100002-0000-0000-0000-000000000002', 'b7000002-0000-0000-0000-000000000002', 'c0000018-0000-0000-0000-000000000018', NULL, 2, true, NOW(), NOW()),
('d7100003-0000-0000-0000-000000000003', 'b7000002-0000-0000-0000-000000000002', 'c0000002-0000-0000-0000-000000000002', NULL, 1, true, NOW(), NOW());

-- ============================================================================
-- SECTION 7: MAINTENANCE TASKS (recurring maintenance with varying frequencies)
-- ============================================================================
-- These tasks represent scheduled maintenance for tanks with varying frequencies.

-- James Wilson's tank: Water Change weekly (overdue by 3 days), Feed daily (current)
INSERT INTO public.maintenance_tasks (
  id, tank_id, type, title, frequency, custom_interval_days,
  next_due_date, is_active, created_at, updated_at
) VALUES
('e2000001-0000-0000-0000-000000000001', 'b2000001-0000-0000-0000-000000000001', 'water_change', 'Weekly Water Change', 'weekly', NULL,
 NOW() - INTERVAL '3 days', true, NOW() - INTERVAL '30 days', NOW()),
('e2000002-0000-0000-0000-000000000002', 'b2000001-0000-0000-0000-000000000001', 'feeding', 'Feed Fish', 'daily', NULL,
 NOW() + INTERVAL '12 hours', true, NOW() - INTERVAL '30 days', NOW());

-- Emily Chen's tank: 25% Water Change weekly (due tomorrow), Filter Cleaning monthly (due in 2 weeks), Water Testing weekly (due in 3 days)
INSERT INTO public.maintenance_tasks (
  id, tank_id, type, title, frequency, custom_interval_days,
  next_due_date, is_active, created_at, updated_at
) VALUES
('e3000001-0000-0000-0000-000000000001', 'b3000001-0000-0000-0000-000000000001', 'water_change', '25% Water Change', 'weekly', NULL,
 NOW() + INTERVAL '1 day', true, NOW() - INTERVAL '60 days', NOW()),
('e3000002-0000-0000-0000-000000000002', 'b3000001-0000-0000-0000-000000000001', 'filter_cleaning', 'Filter Cleaning', 'monthly', NULL,
 NOW() + INTERVAL '14 days', true, NOW() - INTERVAL '60 days', NOW()),
('e3000003-0000-0000-0000-000000000003', 'b3000001-0000-0000-0000-000000000001', 'water_testing', 'Water Testing', 'weekly', NULL,
 NOW() + INTERVAL '3 days', true, NOW() - INTERVAL '60 days', NOW());

-- David Kim's reef tank: 10% Water Change weekly, Test Calcium biweekly, Clean Skimmer monthly, Dose Alkalinity daily
INSERT INTO public.maintenance_tasks (
  id, tank_id, type, title, frequency, custom_interval_days,
  next_due_date, is_active, created_at, updated_at
) VALUES
('e4000001-0000-0000-0000-000000000001', 'b4000001-0000-0000-0000-000000000001', 'water_change', '10% Water Change', 'weekly', NULL,
 NOW() + INTERVAL '2 days', true, NOW() - INTERVAL '90 days', NOW()),
('e4000002-0000-0000-0000-000000000002', 'b4000001-0000-0000-0000-000000000001', 'water_testing', 'Test Calcium & Alk', 'biweekly', NULL,
 NOW() + INTERVAL '7 days', true, NOW() - INTERVAL '90 days', NOW()),
('e4000003-0000-0000-0000-000000000003', 'b4000001-0000-0000-0000-000000000001', 'equipment_maintenance', 'Clean Skimmer', 'monthly', NULL,
 NOW() + INTERVAL '20 days', true, NOW() - INTERVAL '90 days', NOW()),
('e4000004-0000-0000-0000-000000000004', 'b4000001-0000-0000-0000-000000000001', 'dosing', 'Dose Alkalinity', 'daily', NULL,
 NOW() + INTERVAL '1 day', true, NOW() - INTERVAL '90 days', NOW());

-- David Kim's planted tank: Trim Plants biweekly, Fertilizer Dosing daily, CO2 Check weekly
INSERT INTO public.maintenance_tasks (
  id, tank_id, type, title, frequency, custom_interval_days,
  next_due_date, is_active, created_at, updated_at
) VALUES
('e4100001-0000-0000-0000-000000000001', 'b4000002-0000-0000-0000-000000000002', 'equipment_maintenance', 'Trim Plants', 'biweekly', NULL,
 NOW() + INTERVAL '5 days', true, NOW() - INTERVAL '120 days', NOW()),
('e4100002-0000-0000-0000-000000000002', 'b4000002-0000-0000-0000-000000000002', 'dosing', 'Fertilizer Dosing', 'daily', NULL,
 NOW() + INTERVAL '1 day', true, NOW() - INTERVAL '120 days', NOW()),
('e4100003-0000-0000-0000-000000000003', 'b4000002-0000-0000-0000-000000000002', 'water_testing', 'CO2 Check', 'weekly', NULL,
 NOW() + INTERVAL '3 days', true, NOW() - INTERVAL '120 days', NOW());

-- Sarah Johnson's main reef: Water Change weekly, Test All Params biweekly, Clean Equipment monthly, Dose Trace Elements daily
INSERT INTO public.maintenance_tasks (
  id, tank_id, type, title, frequency, custom_interval_days,
  next_due_date, is_active, created_at, updated_at
) VALUES
('e5000001-0000-0000-0000-000000000001', 'b5000001-0000-0000-0000-000000000001', 'water_change', 'Water Change', 'weekly', NULL,
 NOW() + INTERVAL '2 days', true, NOW() - INTERVAL '180 days', NOW()),
('e5000002-0000-0000-0000-000000000002', 'b5000001-0000-0000-0000-000000000001', 'water_testing', 'Test All Parameters', 'biweekly', NULL,
 NOW() + INTERVAL '7 days', true, NOW() - INTERVAL '180 days', NOW()),
('e5000003-0000-0000-0000-000000000003', 'b5000001-0000-0000-0000-000000000001', 'equipment_maintenance', 'Clean Equipment', 'monthly', NULL,
 NOW() + INTERVAL '20 days', true, NOW() - INTERVAL '180 days', NOW()),
('e5000004-0000-0000-0000-000000000004', 'b5000001-0000-0000-0000-000000000001', 'dosing', 'Dose Trace Elements', 'daily', NULL,
 NOW() + INTERVAL '1 day', true, NOW() - INTERVAL '180 days', NOW());

-- Mike Thompson's tank: Water Change weekly (overdue by 14 days), Feed daily (overdue by 3 days)
INSERT INTO public.maintenance_tasks (
  id, tank_id, type, title, frequency, custom_interval_days,
  next_due_date, is_active, created_at, updated_at
) VALUES
('e6000001-0000-0000-0000-000000000001', 'b6000001-0000-0000-0000-000000000001', 'water_change', 'Water Change', 'weekly', NULL,
 NOW() - INTERVAL '14 days', true, NOW() - INTERVAL '100 days', NOW()),
('e6000002-0000-0000-0000-000000000002', 'b6000001-0000-0000-0000-000000000001', 'feeding', 'Feed Fish', 'daily', NULL,
 NOW() - INTERVAL '3 days', true, NOW() - INTERVAL '100 days', NOW());

-- ============================================================================
-- SECTION 8: MAINTENANCE LOGS (completed task records)
-- ============================================================================
-- Historical records of completed maintenance tasks.

-- Emily Chen's water change completions
INSERT INTO public.maintenance_logs (
  id, task_id, notes, completed_at, created_at
) VALUES
('f3000001-0000-0000-0000-000000000001', 'e3000001-0000-0000-0000-000000000001', 'Changed 25%, water looks clear', NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days'),
('f3000002-0000-0000-0000-000000000002', 'e3000001-0000-0000-0000-000000000001', 'Routine 25% change', NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days'),
('f3000003-0000-0000-0000-000000000003', 'e3000001-0000-0000-0000-000000000001', 'All parameters normal', NOW() - INTERVAL '21 days', NOW() - INTERVAL '21 days');

-- Emily Chen's water testing completions
INSERT INTO public.maintenance_logs (
  id, task_id, notes, completed_at, created_at
) VALUES
('f3100001-0000-0000-0000-000000000001', 'e3000003-0000-0000-0000-000000000003', 'pH 7.2, Ammonia 0, Nitrite 0, Nitrate 24', NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days'),
('f3100002-0000-0000-0000-000000000002', 'e3000003-0000-0000-0000-000000000003', 'All parameters in range', NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days'),
('f3100003-0000-0000-0000-000000000003', 'e3000003-0000-0000-0000-000000000003', 'Tested before water change', NOW() - INTERVAL '21 days', NOW() - INTERVAL '21 days');

-- David Kim's reef tank water change completions
INSERT INTO public.maintenance_logs (
  id, task_id, notes, completed_at, created_at
) VALUES
('f4000001-0000-0000-0000-000000000001', 'e4000001-0000-0000-0000-000000000001', '10% water change, used RO water', NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days'),
('f4000002-0000-0000-0000-000000000002', 'e4000001-0000-0000-0000-000000000001', 'Routine change, salinity stable', NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days');

-- David Kim's calcium test completions
INSERT INTO public.maintenance_logs (
  id, task_id, notes, completed_at, created_at
) VALUES
('f4100001-0000-0000-0000-000000000001', 'e4000002-0000-0000-0000-000000000002', 'Ca 400, Alk 8.7', NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days'),
('f4100002-0000-0000-0000-000000000002', 'e4000002-0000-0000-0000-000000000002', 'Ca 395, Alk 8.5', NOW() - INTERVAL '28 days', NOW() - INTERVAL '28 days');

-- Sarah Johnson's main reef water change completions
INSERT INTO public.maintenance_logs (
  id, task_id, notes, completed_at, created_at
) VALUES
('f5000001-0000-0000-0000-000000000001', 'e5000001-0000-0000-0000-000000000001', '10% change with RO water', NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days'),
('f5000002-0000-0000-0000-000000000002', 'e5000001-0000-0000-0000-000000000001', 'Fish looking healthy', NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days');

-- ============================================================================
-- SECTION 9: AI MESSAGES (conversation history)
-- ============================================================================
-- Chat conversations between users and the AI assistant about their tanks.

-- James Wilson's messages (beginner questions)
INSERT INTO public.ai_messages (
  id, tank_id, user_id, role, content, created_at
) VALUES
('0a020001-0000-0000-0000-000000000001', 'b2000001-0000-0000-0000-000000000001', 'a2222222-2222-2222-2222-222222222222', 'user',
 'Why is my water cloudy?', NOW() - INTERVAL '14 days'),
('0a020002-0000-0000-0000-000000000002', 'b2000001-0000-0000-0000-000000000001', 'a2222222-2222-2222-2222-222222222222', 'assistant',
 'Cloudy water in a new tank is common and usually caused by a bacterial bloom or suspended particles. This typically clears up within a few days as your tank cycle completes. Make sure you are doing water changes and avoiding overfeeding.', NOW() - INTERVAL '14 days'),
('0a020003-0000-0000-0000-000000000003', 'b2000001-0000-0000-0000-000000000001', 'a2222222-2222-2222-2222-222222222222', 'user',
 'My ammonia reading is 2.0 ppm, is that bad?', NOW() - INTERVAL '10 days'),
('0a020004-0000-0000-0000-000000000004', 'b2000001-0000-0000-0000-000000000001', 'a2222222-2222-2222-2222-222222222222', 'assistant',
 'Yes, ammonia at 2.0 ppm is dangerous for fish. Ammonia should be 0 ppm. Your tank is likely still cycling. Continue doing partial water changes (25-50%) every other day until ammonia drops below 0.5 ppm. Avoid overfeeding which produces excess ammonia.', NOW() - INTERVAL '10 days');

-- Emily Chen's messages (intermediate questions)
INSERT INTO public.ai_messages (
  id, tank_id, user_id, role, content, created_at
) VALUES
('0a030001-0000-0000-0000-000000000001', 'b3000001-0000-0000-0000-000000000001', 'a3333333-3333-3333-3333-333333333333', 'user',
 'Can I add more neon tetras to my 29 gallon?', NOW() - INTERVAL '20 days'),
('0a030002-0000-0000-0000-000000000002', 'b3000001-0000-0000-0000-000000000001', 'a3333333-3333-3333-3333-333333333333', 'assistant',
 'Your 29-gallon community tank can support 10 neon tetras nicely. They prefer to be in groups of at least 6. With your current setup of corydoras and cherry shrimp, you have room for a few more tetras. Just monitor water parameters closely after adding new fish.', NOW() - INTERVAL '20 days'),
('0a030003-0000-0000-0000-000000000003', 'b3000001-0000-0000-0000-000000000001', 'a3333333-3333-3333-3333-333333333333', 'user',
 'My pH has been dropping slowly, what should I do?', NOW() - INTERVAL '15 days'),
('0a030004-0000-0000-0000-000000000004', 'b3000001-0000-0000-0000-000000000001', 'a3333333-3333-3333-3333-333333333333', 'assistant',
 'A gradual pH decline is often caused by organic matter accumulating in the substrate. Perform a larger water change (40-50%) and vacuum the substrate thoroughly. Ensure your filter is clean and consider adding driftwood or almond leaves which naturally lower pH. Monitor weekly.', NOW() - INTERVAL '15 days'),
('0a030005-0000-0000-0000-000000000005', 'b3000001-0000-0000-0000-000000000001', 'a3333333-3333-3333-3333-333333333333', 'user',
 'Are my cherry shrimp doing okay in this setup?', NOW() - INTERVAL '8 days'),
('0a030006-0000-0000-0000-000000000006', 'b3000001-0000-0000-0000-000000000001', 'a3333333-3333-3333-3333-333333333333', 'assistant',
 'Your cherry shrimp should be fine in your community tank. They prefer slightly soft, slightly acidic water (your current conditions are good). They will help with algae control and feed on uneaten food. Watch for predation by larger fish.', NOW() - INTERVAL '8 days');

-- David Kim's messages (advanced reef questions)
INSERT INTO public.ai_messages (
  id, tank_id, user_id, role, content, created_at
) VALUES
('0a040001-0000-0000-0000-000000000001', 'b4000001-0000-0000-0000-000000000001', 'a4444444-4444-4444-4444-444444444444', 'user',
 'My calcium is at 380 ppm, should I dose more?', NOW() - INTERVAL '25 days'),
('0a040002-0000-0000-0000-000000000002', 'b4000001-0000-0000-0000-000000000001', 'a4444444-4444-4444-4444-444444444444', 'assistant',
 '380 ppm calcium is slightly below the ideal range of 400-450 ppm. You can start supplementing with liquid calcium or two-part additives. Your current alkalinity is good which will help absorption. Dose gradually and retest every few days to avoid overshooting.', NOW() - INTERVAL '25 days'),
('0a040003-0000-0000-0000-000000000003', 'b4000001-0000-0000-0000-000000000001', 'a4444444-4444-4444-4444-444444444444', 'user',
 'I noticed a small white spot on my clownfish, what is it?', NOW() - INTERVAL '12 days'),
('0a040004-0000-0000-0000-000000000004', 'b4000001-0000-0000-0000-000000000001', 'a4444444-4444-4444-4444-444444444444', 'assistant',
 'White spots on clownfish could indicate Ich (marine ich), a parasitic infection. Monitor closely for increased spots or labored breathing. Maintain excellent water parameters and increased aeration. Consider observation tank. If it spreads, UV sterilization or copper-free treatment may be needed. Your parameters look good which is a good sign.', NOW() - INTERVAL '12 days');

-- Sarah Johnson's messages (expert level)
INSERT INTO public.ai_messages (
  id, tank_id, user_id, role, content, created_at
) VALUES
('0a050001-0000-0000-0000-000000000001', 'b5000001-0000-0000-0000-000000000001', 'a5555555-5555-5555-5555-555555555555', 'user',
 'What is the ideal alkalinity-calcium-magnesium ratio for my reef?', NOW() - INTERVAL '30 days'),
('0a050002-0000-0000-0000-000000000002', 'b5000001-0000-0000-0000-000000000001', 'a5555555-5555-5555-5555-555555555555', 'assistant',
 'The ideal ratio for a thriving reef is roughly: Calcium 420-450 ppm, Alkalinity 8.5-9.5 dKH, Magnesium 1350-1400 ppm. This maintains a 1:3:5 ratio. Your current levels are excellent and maintaining a stable dKH of 8.7-8.9 is key to controlling pH and supporting coral growth.', NOW() - INTERVAL '30 days'),
('0a050003-0000-0000-0000-000000000003', 'b5000001-0000-0000-0000-000000000001', 'a5555555-5555-5555-5555-555555555555', 'user',
 'My discus are showing stress bars, water params look fine', NOW() - INTERVAL '18 days'),
('0a050004-0000-0000-0000-000000000004', 'b5000002-0000-0000-0000-000000000002', 'a5555555-5555-5555-5555-555555555555', 'assistant',
 'Stress bars in discus can indicate non-chemical stressors: social stress, aggressive tank mates, poor feeding schedule, or sudden environmental changes. Your parameters are excellent, so observe social dynamics. Ensure they are in a peaceful tank with hiding spots and consistent feeding routines (3-4 times daily with high-quality food).', NOW() - INTERVAL '18 days'),
('0a050005-0000-0000-0000-000000000005', 'b5000001-0000-0000-0000-000000000001', 'a5555555-5555-5555-5555-555555555555', 'user',
 'Planning to upgrade my reef lighting, any suggestions?', NOW() - INTERVAL '5 days'),
('0a050006-0000-0000-0000-000000000006', 'b5000001-0000-0000-0000-000000000001', 'a5555555-5555-5555-5555-555555555555', 'assistant',
 'For your 150-gallon reef, LED fixtures like Kessil A360X or AI Prime would be excellent. PAR values should be 150-250 μmol for most corals. Consider 2-3 units with proper spacing. Gradually acclimate corals to new lighting over 2 weeks to avoid bleaching. Quality lighting will transform coral coloration and growth.', NOW() - INTERVAL '5 days');

-- ============================================================================
-- SECTION 10: AI USAGE (daily token tracking for rate limiting)
-- ============================================================================
-- Tracks API usage by feature to enforce limits per subscription tier.

-- James Wilson: 3 chat messages today (beginner limit ~50)
INSERT INTO public.ai_usage (
  id, user_id, feature, input_tokens, output_tokens, message_count, date, created_at
) VALUES
('0b200001-0000-0000-0000-000000000001', 'a2222222-2222-2222-2222-222222222222', 'chat', 50, 200, 3, CURRENT_DATE, NOW());

-- Emily Chen: 15 chat messages today (intermediate, approaching limit ~500)
INSERT INTO public.ai_usage (
  id, user_id, feature, input_tokens, output_tokens, message_count, date, created_at
) VALUES
('0b300001-0000-0000-0000-000000000001', 'a3333333-3333-3333-3333-333333333333', 'chat', 500, 2000, 15, CURRENT_DATE, NOW());

-- David Kim: 8 chat + 2 diagnosis today
INSERT INTO public.ai_usage (
  id, user_id, feature, input_tokens, output_tokens, message_count, date, created_at
) VALUES
('0b400001-0000-0000-0000-000000000001', 'a4444444-4444-4444-4444-444444444444', 'chat', 300, 1200, 8, CURRENT_DATE, NOW()),
('0b400002-0000-0000-0000-000000000002', 'a4444444-4444-4444-4444-444444444444', 'diagnosis', 400, 800, 2, CURRENT_DATE, NOW());

-- Sarah Johnson: 25 chat + 5 diagnosis + 1 report today
INSERT INTO public.ai_usage (
  id, user_id, feature, input_tokens, output_tokens, message_count, date, created_at
) VALUES
('0b500001-0000-0000-0000-000000000001', 'a5555555-5555-5555-5555-555555555555', 'chat', 1200, 3500, 25, CURRENT_DATE, NOW()),
('0b500002-0000-0000-0000-000000000002', 'a5555555-5555-5555-5555-555555555555', 'diagnosis', 600, 1400, 5, CURRENT_DATE, NOW()),
('0b500003-0000-0000-0000-000000000003', 'a5555555-5555-5555-5555-555555555555', 'report', 800, 2200, 1, CURRENT_DATE, NOW());

-- ============================================================================
-- SECTION 11: FEEDBACK (user feedback submissions)
-- ============================================================================
-- User feedback about the application and features.

-- Emily Chen: bug report about chart rendering
INSERT INTO public.feedback (
  id, type, message, submitted_by, status, created_at, updated_at
) VALUES
('fb-emily-bug-001', 'bug',
 'Chart rendering issue on mobile: The water parameter chart is not displaying correctly on iPhone. The axes overlap and some data points are cut off.',
 'Emily Chen', 'pending', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days');

-- David Kim: feature request about auto-dosing reminders
INSERT INTO public.feedback (
  id, type, message, submitted_by, status, created_at, updated_at
) VALUES
('fb-david-feat-001', 'feature',
 'Auto-dosing reminders: Would love to set up automatic reminders for daily dosing tasks like calcium and alkalinity supplements. Maybe even integrate with smart dosers?',
 'David Kim', 'pending', NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days');

-- James Wilson: question about reading pH
INSERT INTO public.feedback (
  id, type, message, submitted_by, status, created_at, updated_at
) VALUES
('fb-james-q-001', 'question',
 'How do I read pH correctly? I have a test kit and I am not sure if I am reading the color correctly. Is there a guide?',
 'James Wilson', 'pending', NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days');

-- ============================================================================
-- SECTION 12: AUDIT LOGS (admin activity tracking)
-- ============================================================================
-- Records of administrative actions for compliance and security.

-- Admin Sam viewed user list
INSERT INTO public.audit_logs (
  id, user_id, admin_id, action, entity_type, entity_id, old_values, new_values, ip_address,
  created_at
) VALUES
('0c000001-0000-0000-0000-000000000001', NULL, '76027b2e-8b76-4ff8-9948-9e759d72c914',
 'VIEW', 'users', NULL, NULL, NULL, '192.168.1.100'::inet, NOW() - INTERVAL '2 hours');

-- Admin Sam changed John Doe's role
INSERT INTO public.audit_logs (
  id, user_id, admin_id, action, entity_type, entity_id, old_values, new_values, ip_address,
  created_at
) VALUES
('0c000002-0000-0000-0000-000000000002', '23fba86d-2aca-49dc-a467-79f25851a066', '76027b2e-8b76-4ff8-9948-9e759d72c914',
 'UPDATE', 'users', '23fba86d-2aca-49dc-a467-79f25851a066', '{"role": "user"}'::jsonb, '{"role": "admin"}'::jsonb, '192.168.1.100'::inet, NOW() - INTERVAL '1 day');

-- ============================================================================
-- TRANSACTION COMPLETE
-- ============================================================================
-- All test data inserted successfully. Verify with:
-- SELECT COUNT(*) FROM public.users;
-- SELECT COUNT(*) FROM public.subscriptions;
-- SELECT COUNT(*) FROM public.tanks;
-- SELECT COUNT(*) FROM public.livestock;
-- SELECT COUNT(*) FROM public.water_parameters;

COMMIT;
