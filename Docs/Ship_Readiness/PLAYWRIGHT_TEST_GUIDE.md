# AquaBotAI — Playwright MCP Test Guide

> **Purpose:** This document provides pre-defined test user profiles, test data, and step-by-step browser workflows for automated testing via Playwright MCP. Use these profiles instead of creating new accounts each run.
>
> **App URL:** `http://localhost:3000`
> **Supabase Project:** `mtwyezkbmyrgxqmskblu.supabase.co`

---

## Quick Reference: Test Accounts

| Profile | Email | Password | Tier | Auth Method | Tanks |
|---------|-------|----------|------|-------------|-------|
| Marina (Beginner) | `marina.test@aquabotio.com` | `TestMarina2026!` | Free | Email/Password | 1 |
| Derek (Hobbyist) | `derek.test@aquabotio.com` | `TestDerek2026!` | Starter | Email/Password | 1 |
| Priya (Enthusiast) | `priya.test@aquabotio.com` | `TestPriya2026!` | Plus | Email/Password | 3 |
| Marcus (Expert) | `marcus.test@aquabotio.com` | `TestMarcus2026!` | Pro | Email/Password | 5 |
| Sofia (New Trial) | `sofia.test@aquabotio.com` | `TestSofia2026!` | Free (14-day Pro trial active) | Email/Password | 0 |

---

## Profile 1: Marina Chen — Free Tier Beginner

**Persona:** First-time fishkeeper, just set up her first tank. Exploring the app, hasn't upgraded.

### Account Details
- **Email:** `marina.test@aquabotio.com`
- **Password:** `TestMarina2026!`
- **Full Name:** Marina Chen
- **Subscription Tier:** Free (on `subscriptions` table)
- **Subscription Status:** active
- **Skill Level:** beginner
- **Trial Status:** Expired (used up 14-day trial)
- **Onboarding:** Completed
- **Unit Preferences:** fahrenheit, gallons

### Tank Data
**Tank 1: "Betta Paradise"**
- Type: `freshwater`
- Volume: 10 gallons
- Substrate: sand
- Setup Date: 2026-01-15

### Livestock
| Species | Quantity | Nickname | Date Added |
|---------|----------|----------|------------|
| Betta Fish (Betta splendens) | 1 | Ruby | 2026-01-20 |
| Nerite Snail | 2 | — | 2026-01-25 |

### Water Parameters (5 entries)
| Date | pH | Ammonia | Nitrite | Nitrate | Temp (°F) |
|------|----|---------|---------|---------|-----------|
| 2026-01-20 | 7.2 | 0.25 | 0.0 | 5 | 78 |
| 2026-01-27 | 7.0 | 0.0 | 0.0 | 10 | 78 |
| 2026-02-03 | 7.1 | 0.0 | 0.0 | 15 | 77 |
| 2026-02-07 | 6.8 | 0.0 | 0.0 | 20 | 78 |
| 2026-02-09 | 7.0 | 0.0 | 0.0 | 15 | 78 |

### Maintenance Tasks
| Task | Type | Frequency | Next Due |
|------|------|-----------|----------|
| Weekly Water Change | water_change | weekly | 2026-02-14 |

### AI Chat History
- 8 messages used today (2 remaining before daily limit of 10)
- Last conversation topic: "Is my betta healthy?"

### Tier Limits to Test
- **Cannot** create a 2nd tank (Free limit: 1)
- **Cannot** access photo diagnosis
- **Cannot** access equipment tracking
- **Can** send 10 AI messages/day (hard cutoff on 11th)
- **Can** have 3 total maintenance tasks

---

## Profile 2: Derek Owens — Starter Tier Hobbyist

**Persona:** Casual hobbyist with a community tank. Paying $3.99/mo. Uses AI chat regularly for advice.

### Account Details
- **Email:** `derek.test@aquabotio.com`
- **Password:** `TestDerek2026!`
- **Full Name:** Derek Owens
- **Subscription Tier:** Starter ($3.99/mo) (on `subscriptions` table)
- **Subscription Status:** active
- **Skill Level:** intermediate
- **Trial Status:** Consumed
- **Onboarding:** Completed
- **Unit Preferences:** fahrenheit, gallons

### Tank Data
**Tank 1: "Living Room Community"**
- Type: `freshwater`
- Volume: 55 gallons
- Substrate: gravel
- Setup Date: 2025-11-01

### Livestock
| Species | Quantity | Nickname | Date Added | Notes |
|---------|----------|----------|------------|-------|
| Neon Tetra | 12 | School Alpha | 2025-11-15 | Wild-caught batch |
| Corydoras Catfish | 6 | Cleanup Crew | 2025-11-15 | — |
| Cardinal Tetra | 8 | — | 2025-12-01 | — |
| Amano Shrimp | 5 | — | 2026-01-10 | Great algae control |
| Bristlenose Pleco | 1 | Whiskers | 2026-01-10 | — |

### Water Parameters (15 entries — last 3 months)
| Date | pH | Ammonia | Nitrite | Nitrate | Temp (°F) | GH (dGH) | KH (dKH) |
|------|----|---------|---------|---------|-----------|-----------|-----------|
| 2025-11-15 | 7.0 | 0.5 | 0.25 | 5 | 76 | 8 | 4 |
| 2025-11-22 | 7.2 | 0.25 | 0.0 | 10 | 76 | 8 | 4 |
| 2025-11-29 | 7.0 | 0.0 | 0.0 | 15 | 77 | 7 | 4 |
| 2025-12-06 | 6.8 | 0.0 | 0.0 | 20 | 76 | 8 | 5 |
| 2025-12-13 | 7.0 | 0.0 | 0.0 | 15 | 76 | 8 | 4 |
| 2025-12-20 | 7.2 | 0.0 | 0.0 | 20 | 75 | 7 | 4 |
| 2025-12-27 | 7.0 | 0.0 | 0.0 | 15 | 76 | 8 | 5 |
| 2026-01-03 | 6.8 | 0.0 | 0.0 | 25 | 76 | 8 | 4 |
| 2026-01-10 | 7.0 | 0.0 | 0.0 | 20 | 77 | 7 | 4 |
| 2026-01-17 | 7.2 | 0.0 | 0.0 | 15 | 76 | 8 | 4 |
| 2026-01-24 | 7.0 | 0.0 | 0.0 | 20 | 76 | 8 | 5 |
| 2026-01-31 | 6.8 | 0.0 | 0.0 | 15 | 76 | 7 | 4 |
| 2026-02-03 | 7.0 | 0.0 | 0.0 | 20 | 76 | 8 | 4 |
| 2026-02-07 | 7.2 | 0.0 | 0.0 | 15 | 77 | 8 | 4 |
| 2026-02-09 | 7.0 | 0.0 | 0.0 | 20 | 76 | 8 | 5 |

### Maintenance Tasks
| Task | Type | Frequency | Next Due | Last Completed |
|------|------|-----------|----------|----------------|
| Weekly Water Change (30%) | water_change | weekly | 2026-02-14 | 2026-02-07 |
| Filter Rinse | filter_cleaning | biweekly | 2026-02-21 | 2026-02-07 |
| Gravel Vacuum | custom | biweekly | 2026-02-14 | 2026-01-31 |
| Water Testing | water_testing | weekly | 2026-02-14 | 2026-02-09 |

### AI Chat History
- 45 messages used today (55 remaining before daily limit of 100)
- Last topic: "My nitrate is creeping up, what should I do?"

### Tier Limits to Test
- **Cannot** create a 2nd tank (Starter limit: 1)
- **Cannot** access photo diagnosis
- **Cannot** access equipment tracking
- **Can** send 100 AI messages/day
- **Can** have 10 maintenance tasks per tank

---

## Profile 3: Priya Sharma — Plus Tier Enthusiast

**Persona:** Serious hobbyist with multiple tanks including a reef. Uses photo diagnosis. Tracks equipment.

### Account Details
- **Email:** `priya.test@aquabotio.com`
- **Password:** `TestPriya2026!`
- **Full Name:** Priya Sharma
- **Subscription Tier:** Plus ($7.99/mo) (on `subscriptions` table)
- **Subscription Status:** active
- **Skill Level:** intermediate
- **Trial Status:** Consumed
- **Onboarding:** Completed
- **Unit Preferences:** celsius, liters

### Tank Data

**Tank 1: "Reef Dream" (Primary)**
- Type: `saltwater` (reef setup — DB enum uses 'saltwater' for reef tanks)
- Volume: 75 gallons (284 liters)
- Substrate: live sand
- Setup Date: 2025-08-01

**Tank 2: "Planted Paradise"**
- Type: `freshwater`
- Volume: 40 gallons (151 liters)
- Substrate: soil
- Setup Date: 2025-10-15

**Tank 3: "Quarantine Station"**
- Type: `freshwater`
- Volume: 10 gallons (38 liters)
- Substrate: bare bottom
- Setup Date: 2026-01-01

### Livestock — Reef Dream (Tank 1)
| Species | Quantity | Nickname | Date Added |
|---------|----------|----------|------------|
| Ocellaris Clownfish | 2 | Nemo & Coral | 2025-08-15 |
| Royal Gramma | 1 | Royal | 2025-09-01 |
| Firefish Goby | 2 | — | 2025-09-15 |
| Turbo Snail | 5 | — | 2025-08-15 |
| Emerald Crab | 2 | — | 2025-10-01 |

### Livestock — Planted Paradise (Tank 2)
| Species | Quantity | Nickname | Date Added |
|---------|----------|----------|------------|
| Neon Tetra | 15 | — | 2025-10-20 |
| Otocinclus Catfish | 4 | Otto Gang | 2025-10-20 |
| Cherry Shrimp | 20 | — | 2025-11-01 |
| Endler's Livebearer | 6 | — | 2025-12-01 |

### Livestock — Quarantine Station (Tank 3)
| Species | Quantity | Nickname | Date Added |
|---------|----------|----------|------------|
| (currently empty) | — | — | — |

### Water Parameters — Reef Dream (last 5 entries, saltwater params)
| Date | pH | Ammonia | Nitrite | Nitrate | Temp (°F) | Salinity (ppt) | Calcium | Alkalinity (dKH) | Magnesium |
|------|----|---------|---------|---------|-----------|----------------|---------|-------------------|-----------|
| 2026-01-26 | 8.2 | 0.0 | 0.0 | 3 | 78 | 35 | 420 | 8.5 | 1350 |
| 2026-02-02 | 8.3 | 0.0 | 0.0 | 2 | 78 | 35 | 430 | 9.0 | 1340 |
| 2026-02-05 | 8.1 | 0.0 | 0.0 | 5 | 77 | 34 | 410 | 8.2 | 1360 |
| 2026-02-07 | 8.2 | 0.0 | 0.0 | 3 | 78 | 35 | 425 | 8.8 | 1350 |
| 2026-02-09 | 8.3 | 0.0 | 0.0 | 2 | 78 | 35 | 430 | 9.0 | 1355 |

### Water Parameters — Planted Paradise (last 5 entries)
| Date | pH | Ammonia | Nitrite | Nitrate | Temp (°F) | GH (dGH) | KH (dKH) | Phosphate |
|------|----|---------|---------|---------|-----------|-----------|-----------|-----------|
| 2026-01-26 | 6.8 | 0.0 | 0.0 | 10 | 76 | 6 | 3 | 0.5 |
| 2026-02-02 | 6.6 | 0.0 | 0.0 | 15 | 76 | 6 | 3 | 0.8 |
| 2026-02-05 | 6.8 | 0.0 | 0.0 | 10 | 77 | 5 | 3 | 0.5 |
| 2026-02-07 | 6.7 | 0.0 | 0.0 | 12 | 76 | 6 | 3 | 0.6 |
| 2026-02-09 | 6.8 | 0.0 | 0.0 | 10 | 76 | 6 | 3 | 0.5 |

### Maintenance Tasks (across tanks)
| Task | Tank | Type | Frequency | Next Due |
|------|------|------|-----------|----------|
| Reef Water Change (10%) | Reef Dream | water_change | weekly | 2026-02-14 |
| Alk/Ca/Mg Dosing | Reef Dream | dosing | daily | 2026-02-10 |
| Skimmer Cup Clean | Reef Dream | equipment_maintenance | weekly | 2026-02-14 |
| Planted Water Change (25%) | Planted Paradise | water_change | weekly | 2026-02-14 |
| CO2 Check | Planted Paradise | custom | daily | 2026-02-10 |
| Filter Clean | Planted Paradise | filter_cleaning | monthly | 2026-03-01 |
| Plant Trimming | Planted Paradise | custom | biweekly | 2026-02-21 |

### Photo Diagnoses (2 completed)
1. **2026-01-28:** Identified white spots on clownfish → diagnosis: "Possible Ich (Marine)" → severity: moderate → treatment: copper-based medication recommended
2. **2026-02-05:** Algae on reef rock photo → diagnosis: "Bubble algae (Valonia)" → severity: minor → treatment: manual removal recommended

### Tier Limits to Test
- **Can** have up to 5 tanks (currently using 3)
- **Can** access photo diagnosis (10/day limit)
- **Cannot** access email reports
- **Can** send 200 AI messages/day
- **Can** have 10 maintenance tasks per tank

---

## Profile 4: Marcus Williams — Pro Tier Expert

**Persona:** Experienced aquarist running a fish room. Multiple tanks, heavy AI user, uses all features.

### Account Details
- **Email:** `marcus.test@aquabotio.com`
- **Password:** `TestMarcus2026!`
- **Full Name:** Marcus Williams
- **Subscription Tier:** Pro ($14.99/mo) (on `subscriptions` table)
- **Subscription Status:** active
- **Skill Level:** advanced
- **Trial Status:** Consumed
- **Onboarding:** Completed
- **Unit Preferences:** fahrenheit, gallons

### Tank Data

**Tank 1: "75g Reef Display"**
- Type: `saltwater` (reef setup)
- Volume: 75 gallons
- Substrate: live sand
- Setup Date: 2025-05-01

**Tank 2: "40g Planted Community"**
- Type: `freshwater`
- Volume: 40 gallons
- Substrate: soil (ADA Amazonia)
- Setup Date: 2025-06-15

**Tank 3: "20g Quarantine"**
- Type: `freshwater`
- Volume: 20 gallons
- Substrate: bare bottom
- Setup Date: 2025-07-01

**Tank 4: "Brackish 30g"**
- Type: `brackish`
- Volume: 30 gallons
- Substrate: sand
- Setup Date: 2025-09-01

**Tank 5: "Nano Reef 20g"**
- Type: `saltwater` (nano reef setup)
- Volume: 20 gallons
- Substrate: live sand
- Setup Date: 2026-01-01

### Livestock — 75g Reef Display
| Species | Quantity | Nickname | Date Added |
|---------|----------|----------|------------|
| Ocellaris Clownfish | 2 | Bonded Pair | 2025-05-15 |
| Yellow Tang | 1 | Sunny | 2025-06-01 |
| Royal Gramma | 1 | — | 2025-06-01 |
| Cleaner Shrimp | 2 | — | 2025-05-15 |
| Blue/Green Chromis | 5 | — | 2025-07-01 |
| Turbo Snail | 10 | — | 2025-05-15 |

### Livestock — 40g Planted Community
| Species | Quantity | Nickname | Date Added |
|---------|----------|----------|------------|
| Cardinal Tetra | 20 | — | 2025-07-01 |
| Corydoras Catfish | 8 | Cory Squad | 2025-07-01 |
| Otocinclus | 6 | — | 2025-07-15 |
| Amano Shrimp | 10 | — | 2025-08-01 |
| Bristlenose Pleco | 1 | Tank Boss | 2025-08-01 |

### Livestock — Brackish 30g
| Species | Quantity | Nickname | Date Added |
|---------|----------|----------|------------|
| Figure 8 Puffer | 1 | Puff Daddy | 2025-09-15 |
| Bumblebee Goby | 4 | — | 2025-10-01 |

### Maintenance Tasks (15+ across all tanks)
| Task | Tank | Type | Frequency | Next Due |
|------|------|------|-----------|----------|
| Reef Water Change | 75g Reef | water_change | weekly | 2026-02-14 |
| Alk/Ca/Mg Test & Dose | 75g Reef | dosing | daily | 2026-02-10 |
| Skimmer Clean | 75g Reef | equipment_maintenance | weekly | 2026-02-14 |
| ATO Reservoir Refill | 75g Reef | custom | weekly | 2026-02-14 |
| Planted Water Change | 40g Planted | water_change | weekly | 2026-02-14 |
| CO2 Refill Check | 40g Planted | custom | monthly | 2026-03-01 |
| Filter Media Rinse | 40g Planted | filter_cleaning | biweekly | 2026-02-21 |
| Fert Dosing | 40g Planted | dosing | daily | 2026-02-10 |
| Quarantine Check | 20g QT | water_testing | daily | 2026-02-10 |
| Brackish Salinity Check | Brackish 30g | water_testing | weekly | 2026-02-14 |
| Brackish Water Change | Brackish 30g | water_change | biweekly | 2026-02-21 |
| Nano Reef ATO Check | Nano Reef | custom | daily | 2026-02-10 |
| Nano Reef Water Change | Nano Reef | water_change | weekly | 2026-02-14 |
| Equipment Inspection | ALL | equipment_maintenance | monthly | 2026-03-01 |
| Water Test Day (all tanks) | ALL | water_testing | weekly | 2026-02-14 |

### AI Chat History
- 350+ total messages across all tanks
- Heavy user — unlimited messages (Pro)
- Topics: reef chemistry, planted tank CO2, brackish salinity management, disease treatment

### Tier Limits to Test
- **Unlimited** tanks
- **Unlimited** AI messages
- **Can** access photo diagnosis (30/day)
- **Can** access equipment tracking
- **Can** access email reports
- **Can** access multi-tank comparison

---

## Profile 5: Sofia Rivera — New Trial User

**Persona:** Just signed up today. In the middle of onboarding. 14-day Pro trial active. Fresh account for testing new-user flows.

### Account Details
- **Email:** `sofia.test@aquabotio.com`
- **Password:** `TestSofia2026!`
- **Full Name:** Sofia Rivera
- **Subscription Tier:** Free (on `subscriptions` table, status: `trialing`)
- **Subscription Status:** trialing
- **Skill Level:** beginner
- **Trial Status:** Active — 13 days remaining (`trial_ends_at` on subscriptions table)
- **Trial End Date:** 2026-02-22
- **Onboarding:** In progress (completed step 1 welcome, needs tank creation)
- **Unit Preferences:** fahrenheit, gallons (defaults)

### Tank Data
- **No tanks yet** — onboarding tank creation step is pending

### Livestock
- None

### Water Parameters
- None

### Maintenance Tasks
- None

### AI Chat History
- 0 messages (brand new account)

### What to Test with This Profile
- Complete onboarding flow (create first tank)
- First AI interaction after tank setup
- Trial banner showing "13 days remaining"
- All Pro features accessible during trial
- Trial expiration behavior (when simulated)

---

## Supabase Seed SQL — Create All Test Profiles

Run this SQL against the Supabase project to create the test accounts and data. **Execute via Supabase SQL Editor or `supabase db execute`.**

> **IMPORTANT:** These users must first be created in `auth.users` via the Supabase Auth Admin API or signup flow. The SQL below handles the `public.users` profile data and related tables. You may need to sign up each user via the app UI first, then run the data seeding below.

### Option A: Create Users via App Signup (Recommended)

For each test profile, navigate to `http://localhost:3000/auth/signup` and create the account with the email/password listed above. Then run the seed SQL below to populate their data.

### Option B: Seed SQL for Profile Data

> **Schema Notes (read before running):**
> - `full_name` is the column on `public.users` (NOT `display_name`)
> - Subscription tier lives on `public.subscriptions` table (NOT `users`)
> - `trial_ends_at` is on `subscriptions` table (NOT `users`)
> - Tank type enum: `'freshwater'`, `'saltwater'`, `'brackish'`, `'pond'` — **no 'reef'** (use `'saltwater'`)
> - Water parameter date column: `measured_at` (NOT `test_date`)
> - Maintenance task filter type: `'filter_cleaning'` (NOT `'filter_clean'`)
> - Unit preference values: `'fahrenheit'`/`'celsius'` and `'gallons'`/`'liters'`
> - Livestock custom species column: `custom_name` (NOT `custom_species_name`)
> - There is no `timezone` column on users
> - There is no `last_completed_date` on maintenance_tasks — completions go in `maintenance_logs`
> - There is no `is_recurring` on maintenance_tasks — use `frequency` != `'once'` to indicate recurring

```sql
-- ============================================================
-- SEED DATA: Test User Profiles for AquaBotAI
-- Run AFTER users are created via auth signup
-- ============================================================

-- Step 0: Find your user IDs after signup
-- SELECT id, email FROM auth.users WHERE email LIKE '%test@aquabotio.com';

-- ============================================================
-- MARINA (Free Tier) — Profile, Subscription, Tank & Livestock
-- ============================================================

-- Update Marina's profile
UPDATE public.users SET
  full_name = 'Marina Chen',
  skill_level = 'beginner',
  onboarding_completed = true,
  unit_preference_temp = 'fahrenheit',
  unit_preference_volume = 'gallons'
WHERE email = 'marina.test@aquabotio.com';

-- Set Marina's subscription to Free
UPDATE public.subscriptions SET
  tier = 'free',
  status = 'active',
  trial_ends_at = NULL
WHERE user_id = (SELECT id FROM public.users WHERE email = 'marina.test@aquabotio.com');

-- Marina's Tank
INSERT INTO public.tanks (user_id, name, type, volume_gallons, substrate, setup_date)
SELECT id, 'Betta Paradise', 'freshwater', 10, 'sand', '2026-01-15'
FROM public.users WHERE email = 'marina.test@aquabotio.com';

-- Marina's Livestock (join to species if exists, otherwise use custom_name)
INSERT INTO public.livestock (tank_id, species_id, custom_name, quantity, nickname, date_added)
SELECT t.id, s.id, NULL, 1, 'Ruby', '2026-01-20'
FROM public.tanks t
JOIN public.users u ON t.user_id = u.id
LEFT JOIN public.species s ON s.common_name ILIKE '%betta%'
WHERE u.email = 'marina.test@aquabotio.com' AND t.name = 'Betta Paradise'
LIMIT 1;

INSERT INTO public.livestock (tank_id, custom_name, quantity, date_added)
SELECT t.id, 'Nerite Snail', 2, '2026-01-25'
FROM public.tanks t
JOIN public.users u ON t.user_id = u.id
WHERE u.email = 'marina.test@aquabotio.com' AND t.name = 'Betta Paradise';

-- Marina's Water Parameters (5 entries)
INSERT INTO public.water_parameters (tank_id, ph, ammonia_ppm, nitrite_ppm, nitrate_ppm, temperature_f, measured_at)
SELECT t.id, vals.ph, vals.ammonia, vals.nitrite, vals.nitrate, vals.temp, vals.measured_at::timestamptz
FROM public.tanks t
JOIN public.users u ON t.user_id = u.id
CROSS JOIN (VALUES
  (7.2, 0.25, 0.0, 5.0, 78.0, '2026-01-20 10:00:00'),
  (7.0, 0.0,  0.0, 10.0, 78.0, '2026-01-27 10:00:00'),
  (7.1, 0.0,  0.0, 15.0, 77.0, '2026-02-03 10:00:00'),
  (6.8, 0.0,  0.0, 20.0, 78.0, '2026-02-07 10:00:00'),
  (7.0, 0.0,  0.0, 15.0, 78.0, '2026-02-09 10:00:00')
) AS vals(ph, ammonia, nitrite, nitrate, temp, measured_at)
WHERE u.email = 'marina.test@aquabotio.com' AND t.name = 'Betta Paradise';

-- Marina's Maintenance Task
INSERT INTO public.maintenance_tasks (tank_id, title, type, frequency, next_due_date, is_active)
SELECT t.id, 'Weekly Water Change', 'water_change', 'weekly', '2026-02-14', true
FROM public.tanks t
JOIN public.users u ON t.user_id = u.id
WHERE u.email = 'marina.test@aquabotio.com' AND t.name = 'Betta Paradise';


-- ============================================================
-- DEREK (Starter Tier) — Tank, Livestock & Parameters
-- ============================================================

UPDATE public.users SET
  full_name = 'Derek Owens',
  skill_level = 'intermediate',
  onboarding_completed = true,
  unit_preference_temp = 'fahrenheit',
  unit_preference_volume = 'gallons'
WHERE email = 'derek.test@aquabotio.com';

UPDATE public.subscriptions SET
  tier = 'starter',
  status = 'active',
  trial_ends_at = NULL
WHERE user_id = (SELECT id FROM public.users WHERE email = 'derek.test@aquabotio.com');

-- Derek's Tank
INSERT INTO public.tanks (user_id, name, type, volume_gallons, substrate, setup_date)
SELECT id, 'Living Room Community', 'freshwater', 55, 'gravel', '2025-11-01'
FROM public.users WHERE email = 'derek.test@aquabotio.com';

-- Derek's Livestock (5 species — use species_id when available, custom_name as fallback)
INSERT INTO public.livestock (tank_id, species_id, custom_name, quantity, nickname, date_added, notes)
SELECT t.id, s.id, NULL, 12, 'School Alpha', '2025-11-15', 'Wild-caught batch'
FROM public.tanks t JOIN public.users u ON t.user_id = u.id
LEFT JOIN public.species s ON s.common_name ILIKE '%neon tetra%'
WHERE u.email = 'derek.test@aquabotio.com' AND t.name = 'Living Room Community'
LIMIT 1;

INSERT INTO public.livestock (tank_id, species_id, custom_name, quantity, nickname, date_added)
SELECT t.id, s.id, NULL, 6, 'Cleanup Crew', '2025-11-15'
FROM public.tanks t JOIN public.users u ON t.user_id = u.id
LEFT JOIN public.species s ON s.common_name ILIKE '%corydoras%'
WHERE u.email = 'derek.test@aquabotio.com' AND t.name = 'Living Room Community'
LIMIT 1;

INSERT INTO public.livestock (tank_id, custom_name, quantity, date_added)
SELECT t.id, 'Cardinal Tetra', 8, '2025-12-01'
FROM public.tanks t JOIN public.users u ON t.user_id = u.id
WHERE u.email = 'derek.test@aquabotio.com' AND t.name = 'Living Room Community';

INSERT INTO public.livestock (tank_id, custom_name, quantity, date_added, notes)
SELECT t.id, 'Amano Shrimp', 5, '2026-01-10', 'Great algae control'
FROM public.tanks t JOIN public.users u ON t.user_id = u.id
WHERE u.email = 'derek.test@aquabotio.com' AND t.name = 'Living Room Community';

INSERT INTO public.livestock (tank_id, custom_name, quantity, nickname, date_added)
SELECT t.id, 'Bristlenose Pleco', 1, 'Whiskers', '2026-01-10'
FROM public.tanks t JOIN public.users u ON t.user_id = u.id
WHERE u.email = 'derek.test@aquabotio.com' AND t.name = 'Living Room Community';

-- Derek's Maintenance Tasks (4 tasks)
INSERT INTO public.maintenance_tasks (tank_id, title, type, frequency, next_due_date, is_active)
SELECT t.id, task.title, task.type, task.freq, task.due::date, true
FROM public.tanks t JOIN public.users u ON t.user_id = u.id
CROSS JOIN (VALUES
  ('Weekly Water Change (30%)', 'water_change', 'weekly', '2026-02-14'),
  ('Filter Rinse', 'filter_cleaning', 'biweekly', '2026-02-21'),
  ('Gravel Vacuum', 'custom', 'biweekly', '2026-02-14'),
  ('Water Testing', 'water_testing', 'weekly', '2026-02-14')
) AS task(title, type, freq, due)
WHERE u.email = 'derek.test@aquabotio.com' AND t.name = 'Living Room Community';

-- Derek's Maintenance Logs (record past completions)
INSERT INTO public.maintenance_logs (task_id, completed_at, notes)
SELECT mt.id, log.completed::timestamptz, log.notes
FROM public.maintenance_tasks mt
JOIN public.tanks t ON mt.tank_id = t.id
JOIN public.users u ON t.user_id = u.id
CROSS JOIN (VALUES
  ('Weekly Water Change (30%)', '2026-02-07 09:00:00', 'Routine change, water clear'),
  ('Filter Rinse', '2026-02-07 09:30:00', NULL),
  ('Gravel Vacuum', '2026-01-31 09:00:00', NULL),
  ('Water Testing', '2026-02-09 10:00:00', 'All params normal')
) AS log(task_title, completed, notes)
WHERE u.email = 'derek.test@aquabotio.com' AND mt.title = log.task_title;


-- ============================================================
-- PRIYA (Plus Tier) — Multiple Tanks
-- ============================================================

UPDATE public.users SET
  full_name = 'Priya Sharma',
  skill_level = 'intermediate',
  onboarding_completed = true,
  unit_preference_temp = 'celsius',
  unit_preference_volume = 'liters'
WHERE email = 'priya.test@aquabotio.com';

UPDATE public.subscriptions SET
  tier = 'plus',
  status = 'active',
  trial_ends_at = NULL
WHERE user_id = (SELECT id FROM public.users WHERE email = 'priya.test@aquabotio.com');

-- Priya's Tanks (3) — Note: 'saltwater' type for reef tanks
INSERT INTO public.tanks (user_id, name, type, volume_gallons, substrate, setup_date)
SELECT id, 'Reef Dream', 'saltwater', 75, 'live sand', '2025-08-01'
FROM public.users WHERE email = 'priya.test@aquabotio.com';

INSERT INTO public.tanks (user_id, name, type, volume_gallons, substrate, setup_date)
SELECT id, 'Planted Paradise', 'freshwater', 40, 'soil', '2025-10-15'
FROM public.users WHERE email = 'priya.test@aquabotio.com';

INSERT INTO public.tanks (user_id, name, type, volume_gallons, substrate, setup_date)
SELECT id, 'Quarantine Station', 'freshwater', 10, 'bare bottom', '2026-01-01'
FROM public.users WHERE email = 'priya.test@aquabotio.com';

-- Priya's Reef Dream Water Parameters (saltwater-specific columns)
INSERT INTO public.water_parameters (tank_id, ph, ammonia_ppm, nitrite_ppm, nitrate_ppm, temperature_f, salinity, calcium_ppm, alkalinity_dkh, magnesium_ppm, measured_at)
SELECT t.id, v.ph, v.amm, v.nit, v.na, v.temp, v.sal, v.ca, v.alk, v.mg, v.ts::timestamptz
FROM public.tanks t JOIN public.users u ON t.user_id = u.id
CROSS JOIN (VALUES
  (8.2, 0.0, 0.0, 3.0, 78.0, 35.0, 420.0, 8.5, 1350.0, '2026-01-26 10:00:00'),
  (8.3, 0.0, 0.0, 2.0, 78.0, 35.0, 430.0, 9.0, 1340.0, '2026-02-02 10:00:00'),
  (8.1, 0.0, 0.0, 5.0, 77.0, 34.0, 410.0, 8.2, 1360.0, '2026-02-05 10:00:00'),
  (8.2, 0.0, 0.0, 3.0, 78.0, 35.0, 425.0, 8.8, 1350.0, '2026-02-07 10:00:00'),
  (8.3, 0.0, 0.0, 2.0, 78.0, 35.0, 430.0, 9.0, 1355.0, '2026-02-09 10:00:00')
) AS v(ph, amm, nit, na, temp, sal, ca, alk, mg, ts)
WHERE u.email = 'priya.test@aquabotio.com' AND t.name = 'Reef Dream';


-- ============================================================
-- MARCUS (Pro Tier) — 5 Tanks, Full Feature Access
-- ============================================================

UPDATE public.users SET
  full_name = 'Marcus Williams',
  skill_level = 'advanced',
  onboarding_completed = true,
  unit_preference_temp = 'fahrenheit',
  unit_preference_volume = 'gallons'
WHERE email = 'marcus.test@aquabotio.com';

UPDATE public.subscriptions SET
  tier = 'pro',
  status = 'active',
  trial_ends_at = NULL
WHERE user_id = (SELECT id FROM public.users WHERE email = 'marcus.test@aquabotio.com');

-- Marcus's Tanks (5) — 'saltwater' for reef tanks
INSERT INTO public.tanks (user_id, name, type, volume_gallons, substrate, setup_date)
SELECT id, tank.name, tank.type, tank.vol, tank.sub, tank.setup::date
FROM public.users u
CROSS JOIN (VALUES
  ('75g Reef Display', 'saltwater', 75, 'live sand', '2025-05-01'),
  ('40g Planted Community', 'freshwater', 40, 'soil', '2025-06-15'),
  ('20g Quarantine', 'freshwater', 20, 'bare bottom', '2025-07-01'),
  ('Brackish 30g', 'brackish', 30, 'sand', '2025-09-01'),
  ('Nano Reef 20g', 'saltwater', 20, 'live sand', '2026-01-01')
) AS tank(name, type, vol, sub, setup)
WHERE u.email = 'marcus.test@aquabotio.com';


-- ============================================================
-- SOFIA (Trial User) — Minimal data, onboarding incomplete
-- ============================================================

UPDATE public.users SET
  full_name = 'Sofia Rivera',
  skill_level = 'beginner',
  onboarding_completed = false,
  onboarding_step = 1,
  unit_preference_temp = 'fahrenheit',
  unit_preference_volume = 'gallons'
WHERE email = 'sofia.test@aquabotio.com';

-- Sofia gets a trialing subscription with trial_ends_at in the future
UPDATE public.subscriptions SET
  tier = 'free',
  status = 'trialing',
  trial_ends_at = NOW() + INTERVAL '13 days'
WHERE user_id = (SELECT id FROM public.users WHERE email = 'sofia.test@aquabotio.com');

-- Sofia has NO tanks, NO parameters, NO tasks (she's mid-onboarding)
```

---

## Test Workflows — Step-by-Step Browser Instructions

### Workflow 1: Login & Navigate Dashboard

**Use with:** Any profile (start with Derek for a populated dashboard)

```
1. Navigate to http://localhost:3000/auth/login
2. Enter email: derek.test@aquabotio.com
3. Enter password: TestDerek2026!
4. Click "Sign In" button
5. VERIFY: Redirected to /dashboard
6. VERIFY: "Living Room Community" tank appears
7. VERIFY: Tier badge shows "Starter"
8. VERIFY: Bottom nav shows: Home, Parameters, Species, Maintenance, Chat
```

### Workflow 2: AI Chat Conversation

**Use with:** Derek (Starter, 100 msg limit) or Marcus (Pro, unlimited)

```
1. Login as derek.test@aquabotio.com
2. Navigate to /chat OR click Chat in bottom nav
3. VERIFY: Chat interface loads with tank context selector
4. Select tank "Living Room Community" if not auto-selected
5. Type message: "My neon tetras seem less active than usual. My last water test showed nitrate at 20ppm. Should I be concerned?"
6. Click Send
7. VERIFY: Loading indicator appears
8. VERIFY: AI response appears within 5 seconds
9. VERIFY: Response references "Neon Tetra" and "nitrate" (context-aware)
10. VERIFY: Message counter increments in usage tracking
11. Type follow-up: "Should I do a water change today?"
12. Click Send
13. VERIFY: AI references previous message context (conversation continuity)
14. VERIFY: Response may suggest specific water change percentage
```

### Workflow 3: Log Water Parameters

**Use with:** Derek or Priya

```
1. Login as derek.test@aquabotio.com
2. Navigate to tank "Living Room Community"
3. Click "Log Parameters" button (or navigate to /tanks/{id}/log)
4. Fill in the parameter form:
   - pH: 7.4
   - Ammonia: 0.0
   - Nitrite: 0.0
   - Nitrate: 25
   - Temperature: 77°F
   - GH: 8 dGH
   - KH: 5 dKH
5. Click "Save" / "Log Parameters"
6. VERIFY: Success toast notification appears
7. VERIFY: New entry visible in parameter history
8. Navigate to /tanks/{id}/parameters
9. VERIFY: Chart shows the new data point
10. VERIFY: Current readings show color-coded status:
    - pH 7.4: GREEN (safe for community tank)
    - Ammonia 0.0: GREEN
    - Nitrate 25: GREEN (under 40 threshold)
    - Temp 77: GREEN
```

**For Priya (reef tank with saltwater params):**
```
1. Login as priya.test@aquabotio.com
2. Navigate to tank "Reef Dream"
3. Click "Log Parameters"
4. Fill in saltwater-specific fields:
   - pH: 8.2
   - Ammonia: 0.0
   - Nitrite: 0.0
   - Nitrate: 3
   - Temperature: 78°F
   - Salinity: 35 ppt
   - Calcium: 425 ppm
   - Alkalinity: 8.8 dKH
   - Magnesium: 1350 ppm
5. VERIFY: Reef-specific fields visible (salinity, calcium, alk, mag)
6. VERIFY: All values show GREEN status (within reef safe zones)
```

### Workflow 4: Create a New Tank

**Use with:** Priya (Plus tier, can have up to 5 tanks, currently has 3)

```
1. Login as priya.test@aquabotio.com
2. Navigate to /tanks or click Tanks in nav
3. VERIFY: 3 existing tanks listed (Reef Dream, Planted Paradise, Quarantine Station)
4. Click "Add Tank" / "New Tank" button
5. Fill in tank creation form:
   - Name: "Betta Sorority"
   - Type: freshwater
   - Volume: 20 gallons
   - Substrate: sand
   - Setup Date: 2026-02-09
6. Click "Create Tank"
7. VERIFY: Success message
8. VERIFY: Redirected to new tank detail page
9. VERIFY: Tank count is now 4 of 5 (Plus limit)
10. Navigate back to tank list
11. VERIFY: "Betta Sorority" appears in list
```

**Test tier limit (try creating 6th tank with Plus):**
```
1. (After creating tanks 4 and 5)
2. Click "Add Tank" again
3. VERIFY: Upgrade modal appears: "Upgrade to Pro for unlimited tanks"
4. VERIFY: Cannot proceed without upgrading
```

**Test with Marina (Free tier, already has 1 tank):**
```
1. Login as marina.test@aquabotio.com
2. Navigate to /tanks
3. Click "Add Tank"
4. VERIFY: Upgrade modal appears: "Upgrade to manage multiple tanks"
5. VERIFY: Shows tier comparison (Free: 1 tank → Starter: 5 tanks → Pro: unlimited)
```

### Workflow 5: Update Profile / Settings

**Use with:** Any profile

```
1. Login as derek.test@aquabotio.com
2. Navigate to /settings
3. VERIFY: Current settings displayed:
   - Display Name: Derek Owens
   - Email: derek.test@aquabotio.com
   - Tier: Starter
   - Unit: °F / gallons
4. Change Display Name to "Derek O."
5. Change Unit Preference Temperature to °C
6. Click "Save Changes"
7. VERIFY: Success toast
8. VERIFY: Temperature displays now show °C throughout app
9. Navigate to a tank's parameters
10. VERIFY: Temperature values converted to °C (e.g., 76°F → 24.4°C)
```

### Workflow 6: Manage Livestock

**Use with:** Derek

```
1. Login as derek.test@aquabotio.com
2. Navigate to tank "Living Room Community" → Livestock tab
3. VERIFY: 5 species listed with quantities
4. Click "Add Species"
5. Search for "Cherry Barb" in species search
6. Select Cherry Barb from results
7. Set quantity: 6
8. Set nickname: "Cherry Gang"
9. Click "Add to Tank"
10. VERIFY: AI compatibility check runs
11. VERIFY: Result should be GREEN (Cherry Barbs are peaceful community fish)
12. VERIFY: Cherry Barb appears in livestock list with quantity 6
13. VERIFY: AI chat context now includes Cherry Barbs

To test incompatible species:
14. Click "Add Species" again
15. Search for "Oscar"
16. Select Oscar Fish
17. VERIFY: Compatibility warning appears (RED):
    - "Oscars are aggressive and will eat small fish like Neon Tetras"
    - "Minimum tank size: 55+ gallons (borderline for your 55g with current stock)"
18. VERIFY: User can still add with "I understand the risks" checkbox
```

### Workflow 7: Maintenance Task Completion

**Use with:** Derek

```
1. Login as derek.test@aquabotio.com
2. Navigate to /tanks/{id}/maintenance
3. VERIFY: 4 tasks listed with due dates
4. Find "Weekly Water Change (30%)" — should show due date
5. Click on the task or click "Mark Complete"
6. (Optional) Add completion notes: "Changed 30%, added water conditioner"
7. Click "Complete"
8. VERIFY: Task marked as completed
9. VERIFY: Next due date advances by 7 days (weekly frequency)
10. VERIFY: Completion logged in maintenance_logs
11. Check for overdue tasks:
12. VERIFY: "Gravel Vacuum" may show as overdue (last completed 2026-01-31, biweekly = due 2026-02-14)
13. VERIFY: Overdue tasks highlighted in red/orange
```

### Workflow 8: AI Chat — Hit Free Tier Limit

**Use with:** Marina (Free, 8/10 messages used)

```
1. Login as marina.test@aquabotio.com
2. Navigate to /chat
3. Send message 1: "How often should I feed my betta?"
4. VERIFY: Response received (9/10 used)
5. Send message 2: "What temperature is best for bettas?"
6. VERIFY: Response received (10/10 used)
7. Send message 3: "Can I add a snail to my tank?"
8. VERIFY: Message BLOCKED
9. VERIFY: Upgrade prompt modal appears:
   - "You've reached your daily limit of 10 messages"
   - "Upgrade to Starter for 100 messages/day"
   - Button: "View Plans" → navigates to /billing
10. VERIFY: Cannot send more messages until daily reset (midnight UTC)
```

### Workflow 9: New User Onboarding (Sofia)

**Use with:** Sofia (trial user, onboarding incomplete)

```
1. Login as sofia.test@aquabotio.com
2. VERIFY: Redirected to onboarding flow (not dashboard)
3. Step 1 — Welcome Screen:
   - VERIFY: Greeting message and AI intro displayed
   - Click "Get Started"
4. Step 2 — Create Your First Tank:
   - Enter name: "My First Goldfish Tank"
   - Select type: freshwater
   - Enter volume: 30 gallons
   - Click "Create Tank"
5. Step 3 — Initial Parameter Entry (optional):
   - Enter pH: 7.0
   - Enter Temperature: 72°F
   - Click "Save" or "Skip"
6. Step 4 — First AI Interaction:
   - VERIFY: AI greeting appears with tank-specific context
   - VERIFY: Message references "30-gallon freshwater" tank
7. VERIFY: Redirected to dashboard after onboarding
8. VERIFY: Trial banner shows "13 days remaining" (or similar)
9. VERIFY: All Pro features accessible (photo diagnosis, unlimited tanks, etc.)
```

### Workflow 10: Species Search & Browse

**Use with:** Any profile

```
1. Login as any test user
2. Navigate to /species
3. VERIFY: Species library page loads
4. Search for "tetra" in search bar
5. VERIFY: Results include Neon Tetra, Cardinal Tetra, etc.
6. Apply filter: Care Level = "beginner"
7. VERIFY: Results filtered to beginner-friendly species
8. Apply filter: Type = "freshwater"
9. VERIFY: Only freshwater species shown
10. Click on a species card (e.g., Neon Tetra)
11. VERIFY: Species detail shows:
    - Common name, scientific name
    - Temperature range, pH range
    - Care level, temperament
    - Min tank size
    - Diet, lifespan
    - Description and compatibility notes
12. Clear all filters
13. VERIFY: Full species list restored
```

---

## Edge Cases & Error Scenarios to Test

### Authentication Edge Cases
| Scenario | Steps | Expected |
|----------|-------|----------|
| Wrong password | Login with correct email, wrong password | Error: "Invalid credentials" |
| Nonexistent email | Login with `fake@test.com` | Error: "No account found" |
| Empty form submit | Click Sign In with empty fields | Validation errors on required fields |
| Session expired | Wait for JWT to expire (1 hour) or clear cookies | Redirect to /auth/login |
| Double-click submit | Click Sign In twice rapidly | Only one auth request processed |

### Tank Management Edge Cases
| Scenario | Steps | Expected |
|----------|-------|----------|
| Duplicate tank name | Create tank with same name as existing | Allowed (names don't need to be unique) |
| Very long tank name | Enter 100+ character name | Truncated at 100 chars or validation error |
| Zero volume | Enter 0 for tank volume | Validation error: "Volume must be greater than 0" |
| Negative volume | Enter -10 for volume | Validation error |
| Delete tank with data | Delete a tank that has parameters, livestock, tasks | Soft delete — data preserved but hidden |

### AI Chat Edge Cases
| Scenario | Steps | Expected |
|----------|-------|----------|
| Empty message | Click send with empty input | Send button disabled or validation error |
| Very long message | Paste 5000+ character message | Message accepted (token limit handled server-side) |
| Rapid messages | Send 5 messages in 2 seconds | Rate limiting — messages queued or limited |
| No tank selected | Open chat without any tank context | Generic AI response or prompt to select tank |
| Offensive content | Send inappropriate message | AI refuses politely, no action taken |

### Parameter Logging Edge Cases
| Scenario | Steps | Expected |
|----------|-------|----------|
| pH out of range | Enter pH = 15.0 | Validation error: "pH must be between 0-14" |
| Negative ammonia | Enter ammonia = -1 | Validation error: "Must be ≥ 0" |
| Temperature extremes | Enter temp = 200°F | Validation error or warning |
| Missing required field | Submit with only pH filled | Accepted (most params are optional per entry) |
| Future date | Set test_date to tomorrow | Validation error or warning |

---

## Test Data Validation Checklist

After seeding data, verify these queries return expected results:

```sql
-- Verify user count and profiles
SELECT u.email, u.full_name, u.skill_level, u.onboarding_completed, s.tier, s.status
FROM public.users u
LEFT JOIN public.subscriptions s ON s.user_id = u.id
WHERE u.email LIKE '%test@aquabotio.com'
ORDER BY u.email;
-- Expected: 5 rows (derek=starter, marcus=pro, marina=free, priya=plus, sofia=free/trialing)

-- Verify tank count per user
SELECT u.email, COUNT(t.id) as tank_count
FROM public.users u
LEFT JOIN public.tanks t ON t.user_id = u.id
WHERE u.email LIKE '%test@aquabotio.com'
GROUP BY u.email ORDER BY u.email;
-- Expected: derek=1, marcus=5, marina=1, priya=3, sofia=0

-- Verify livestock per tank
SELECT u.email, t.name, COUNT(l.id) as species_count
FROM public.users u
JOIN public.tanks t ON t.user_id = u.id
LEFT JOIN public.livestock l ON l.tank_id = t.id
WHERE u.email LIKE '%test@aquabotio.com'
GROUP BY u.email, t.name ORDER BY u.email;

-- Verify parameter entries
SELECT u.email, t.name, COUNT(wp.id) as param_entries
FROM public.users u
JOIN public.tanks t ON t.user_id = u.id
LEFT JOIN public.water_parameters wp ON wp.tank_id = t.id
WHERE u.email LIKE '%test@aquabotio.com'
GROUP BY u.email, t.name ORDER BY u.email;

-- Verify maintenance tasks
SELECT u.email, COUNT(mt.id) as task_count
FROM public.users u
JOIN public.tanks t ON t.user_id = u.id
LEFT JOIN public.maintenance_tasks mt ON mt.tank_id = t.id
WHERE u.email LIKE '%test@aquabotio.com'
GROUP BY u.email ORDER BY u.email;

-- Verify maintenance logs exist for Derek
SELECT u.email, mt.title, ml.completed_at, ml.notes
FROM public.maintenance_logs ml
JOIN public.maintenance_tasks mt ON ml.task_id = mt.id
JOIN public.tanks t ON mt.tank_id = t.id
JOIN public.users u ON t.user_id = u.id
WHERE u.email LIKE '%test@aquabotio.com'
ORDER BY ml.completed_at;
```

---

## Notes for Playwright MCP Agent

1. **Always login fresh** at the start of each test workflow. Don't assume session state persists between workflows.
2. **Wait for navigation** after login — the redirect to `/dashboard` may take 1-2 seconds.
3. **AI responses take time** — wait up to 10 seconds for Claude responses in chat.
4. **Tank context matters** — make sure the correct tank is selected before logging parameters or chatting.
5. **Tier enforcement is server-side** — the UI should show upgrade modals, but always verify the API also rejects unauthorized actions.
6. **Screenshots on failure** — capture screenshots when assertions fail for debugging.
7. **Clean state between test suites** — if a workflow modifies data (e.g., creates a tank), note that it affects subsequent runs. Consider resetting via SQL if needed.
8. **Sofia's profile resets** — re-run the Sofia seed SQL before testing onboarding flows, since completing onboarding changes her state permanently.
