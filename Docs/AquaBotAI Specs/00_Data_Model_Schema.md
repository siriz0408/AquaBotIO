# Aquatic AI — Unified Data Model & Schema
**Version 1.1 | February 2026**
**Status:** DRAFT — Aligned to PRD v1 and Feature Specs 01–13

---

## Purpose

This document is the single source of truth for Aquatic AI's database schema. It consolidates every entity, relationship, index, RLS policy, and business rule referenced across all 13 feature specifications into one unified reference for engineering.

**Tech Stack:** Supabase (hosted PostgreSQL 15), Supabase Auth, Supabase Storage, Supabase Edge Functions (Deno), Stripe, Anthropic API

---

## Entity Relationship Overview

```
users (1) ──────── (N) tanks
  │                      │
  │                      ├── (N) water_parameters
  │                      ├── (N) livestock ──── species (reference)
  │                      ├── (N) maintenance_tasks ──── (N) maintenance_logs
  │                      ├── (N) equipment
  │                      ├── (N) ai_conversations
  │                      ├── (N) photo_diagnoses
  │                      └── (N) compatibility_checks
  │
  ├── (1) subscriptions
  ├── (N) ai_usage
  ├── (1) notification_preferences
  ├── (N) push_subscriptions
  ├── (1) report_preferences
  └── (N) report_history

admin_profiles (1) ──── (N) admin_audit_log
  └── (N) species_revisions

webhook_events (standalone — Stripe idempotency)
```

**Total Tables:** 22 | **Total Columns:** ~320 | **FK Relationships:** 29

---

## Table Definitions

### 1. `users`
> Source: Spec 06 (Auth & Onboarding), Spec 07 (Subscription & Billing)

Core user account table. Extends Supabase Auth `auth.users` with application-specific fields.

| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| `id` | `UUID` | PK | `auth.uid()` | Maps to Supabase Auth user |
| `email` | `VARCHAR(255)` | NOT NULL, UNIQUE | — | From Supabase Auth |
| `display_name` | `VARCHAR(255)` | — | `NULL` | Optional display name |
| `avatar_url` | `TEXT` | — | `NULL` | Profile photo URL |
| `subscription_tier` | `VARCHAR(20)` | NOT NULL | `'free'` | `'free'`, `'starter'`, `'plus'`, `'pro'` |
| `trial_end_date` | `TIMESTAMPTZ` | — | `NOW() + INTERVAL '14 days'` | NULL after trial consumed |
| `stripe_customer_id` | `VARCHAR(255)` | UNIQUE | `NULL` | Created on first Stripe interaction |
| `skill_level` | `VARCHAR(20)` | — | `NULL` | `'beginner'`, `'intermediate'`, `'advanced'` |
| `onboarding_completed` | `BOOLEAN` | NOT NULL | `false` | Tracks onboarding progress |
| `unit_preference_temp` | `VARCHAR(5)` | NOT NULL | `'F'` | `'F'` or `'C'` |
| `unit_preference_volume` | `VARCHAR(10)` | NOT NULL | `'gallons'` | `'gallons'` or `'liters'` |
| `timezone` | `VARCHAR(50)` | — | `'America/New_York'` | For notification scheduling |
| `auth_method` | `TEXT` | — | — | Primary auth method: 'email_password', 'google', 'magic_link' |
| `email_verified` | `BOOLEAN` | — | `false` | Required for email/password signup |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | `NOW()` | Registration timestamp |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL | `NOW()` | Auto-updated via trigger |

**Indexes:**
- `idx_users_email` on `(email)` — UNIQUE, auth lookups
- `idx_users_tier` on `(subscription_tier)` — tier-based queries
- `idx_users_created` on `(created_at DESC)` — growth analytics

**RLS:**
- SELECT/UPDATE: `auth.uid() = id`
- INSERT: via Supabase Auth trigger only

---

### 2. `tanks`
> Source: Spec 02 (Tank Profile Management)

| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| `id` | `UUID` | PK | `gen_random_uuid()` | |
| `user_id` | `UUID` | FK → `users(id)`, NOT NULL | — | Owner |
| `name` | `VARCHAR(100)` | NOT NULL | — | User-defined tank name |
| `type` | `VARCHAR(20)` | NOT NULL | — | `'freshwater'`, `'saltwater'`, `'reef'`, `'brackish'`, `'pond'` |
| `volume_gallons` | `DECIMAL(8,2)` | NOT NULL | — | Primary volume storage |
| `dimensions_length` | `DECIMAL(8,2)` | — | `NULL` | Inches |
| `dimensions_width` | `DECIMAL(8,2)` | — | `NULL` | Inches |
| `dimensions_height` | `DECIMAL(8,2)` | — | `NULL` | Inches |
| `substrate` | `VARCHAR(100)` | — | `NULL` | e.g., 'sand', 'gravel', 'bare bottom' |
| `setup_date` | `DATE` | — | `NULL` | When tank was established |
| `photo_url` | `TEXT` | — | `NULL` | Supabase Storage URL |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | `NOW()` | |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL | `NOW()` | |
| `deleted_at` | `TIMESTAMPTZ` | — | `NULL` | Soft-delete; NULL = active |

**Indexes:**
- `idx_tanks_user_active` on `(user_id, deleted_at)` — active tanks per user
- `idx_tanks_user_recent` on `(user_id, created_at DESC)` — tank switcher

**RLS:** Standard user isolation pattern (SELECT/INSERT/UPDATE/DELETE: `auth.uid() = user_id`)

**Soft-delete:** `deleted_at` set on delete; hard-delete via cron after 90 days. CASCADE deletes dependent records.

**Tier enforcement trigger:** Before INSERT, check `COUNT(*) WHERE user_id = NEW.user_id AND deleted_at IS NULL` against tier limit (Starter: 1, Plus: 5, Pro: unlimited).

---

### 3. `water_parameters`
> Source: Spec 03 (Water Parameters & Analysis)

| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| `id` | `UUID` | PK | `gen_random_uuid()` | |
| `tank_id` | `UUID` | FK → `tanks(id)` ON DELETE CASCADE, NOT NULL | — | |
| `user_id` | `UUID` | FK → `users(id)`, NOT NULL | — | For RLS |
| `test_date` | `TIMESTAMPTZ` | NOT NULL | `NOW()` | When test was performed |
| `ph` | `DECIMAL(4,2)` | CHECK (4.0–10.0) | `NULL` | |
| `ammonia_ppm` | `DECIMAL(6,3)` | CHECK (≥ 0) | `NULL` | |
| `nitrite_ppm` | `DECIMAL(6,3)` | CHECK (≥ 0) | `NULL` | |
| `nitrate_ppm` | `DECIMAL(6,2)` | CHECK (≥ 0) | `NULL` | |
| `temperature_f` | `DECIMAL(5,2)` | CHECK (32–120) | `NULL` | Stored in °F; converted on display |
| `gh_dgh` | `DECIMAL(6,2)` | CHECK (≥ 0) | `NULL` | General hardness |
| `kh_dkh` | `DECIMAL(6,2)` | CHECK (≥ 0) | `NULL` | Carbonate hardness |
| `salinity_ppt` | `DECIMAL(6,2)` | CHECK (≥ 0) | `NULL` | Saltwater only |
| `calcium_ppm` | `DECIMAL(6,2)` | CHECK (≥ 0) | `NULL` | Reef only |
| `alkalinity_dkh` | `DECIMAL(6,2)` | CHECK (≥ 0) | `NULL` | Reef only |
| `magnesium_ppm` | `DECIMAL(7,2)` | CHECK (≥ 0) | `NULL` | Reef only |
| `phosphate_ppm` | `DECIMAL(6,3)` | CHECK (≥ 0) | `NULL` | |
| `notes` | `TEXT` | — | `NULL` | User observations |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | `NOW()` | |

**Indexes:**
- `idx_params_tank_date` on `(tank_id, test_date DESC)` — chart rendering (primary query path)
- `idx_params_user_date` on `(user_id, test_date DESC)` — user history
- `idx_params_tank_date_asc` on `(tank_id, test_date)` — range queries for AI analysis

**RLS:** Standard user isolation pattern.

**Performance:** Chart rendering target < 2 seconds for 90 days of data. Partition by year if table exceeds 10M rows (P2).

---

### 4. `species`
> Source: Spec 04 (Species Database & Livestock)

Reference table — public read, admin write. Seeded with 500+ species at launch.

| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| `id` | `UUID` | PK | `gen_random_uuid()` | |
| `common_name` | `VARCHAR(255)` | NOT NULL | — | e.g., "Neon Tetra" |
| `scientific_name` | `VARCHAR(255)` | NOT NULL | — | e.g., "Paracheirodon innesi" |
| `type` | `VARCHAR(20)` | NOT NULL | — | `'freshwater'`, `'saltwater'`, `'brackish'` |
| `care_level` | `VARCHAR(20)` | NOT NULL | — | `'beginner'`, `'intermediate'`, `'advanced'` |
| `min_tank_size_gallons` | `INTEGER` | — | `NULL` | Minimum recommended tank size |
| `temp_min_f` | `DECIMAL(5,2)` | — | `NULL` | Temperature range min |
| `temp_max_f` | `DECIMAL(5,2)` | — | `NULL` | Temperature range max |
| `ph_min` | `DECIMAL(4,2)` | — | `NULL` | pH range min |
| `ph_max` | `DECIMAL(4,2)` | — | `NULL` | pH range max |
| `hardness_min_dgh` | `DECIMAL(6,2)` | — | `NULL` | |
| `hardness_max_dgh` | `DECIMAL(6,2)` | — | `NULL` | |
| `temperament` | `VARCHAR(20)` | NOT NULL | — | `'peaceful'`, `'semi-aggressive'`, `'aggressive'` |
| `diet` | `VARCHAR(20)` | — | `NULL` | `'carnivore'`, `'omnivore'`, `'herbivore'` |
| `max_adult_size_inches` | `DECIMAL(6,2)` | — | `NULL` | |
| `lifespan_years` | `INTEGER` | — | `NULL` | |
| `description` | `TEXT` | — | `NULL` | Detailed care information |
| `compatibility_notes` | `TEXT` | — | `NULL` | Known conflicts |
| `photo_url` | `VARCHAR(500)` | — | `NULL` | CDN URL |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | `NOW()` | |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL | `NOW()` | |

**Indexes:**
- `idx_species_common_name` GIN index for full-text search on `common_name`
- `idx_species_scientific_name` GIN index for full-text search on `scientific_name`
- `idx_species_type_care` on `(type, care_level)` — browse filters
- `idx_species_temperament` on `(temperament)` — compatibility queries

**RLS:**
- SELECT: `USING (true)` — public read for all authenticated users
- INSERT/UPDATE/DELETE: admin role only (via Supabase service role key)

---

### 5. `livestock`
> Source: Spec 04 (Species Database & Livestock)

| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| `id` | `UUID` | PK | `gen_random_uuid()` | |
| `tank_id` | `UUID` | FK → `tanks(id)` ON DELETE CASCADE, NOT NULL | — | |
| `user_id` | `UUID` | FK → `users(id)`, NOT NULL | — | For RLS |
| `species_id` | `UUID` | FK → `species(id)` ON DELETE SET NULL | `NULL` | NULL for custom entries |
| `custom_species_name` | `VARCHAR(255)` | — | `NULL` | Used when species_id is NULL |
| `quantity` | `INTEGER` | NOT NULL, CHECK (≥ 1) | `1` | |
| `nickname` | `VARCHAR(255)` | — | `NULL` | User-defined name |
| `date_added` | `DATE` | NOT NULL | `CURRENT_DATE` | |
| `date_removed` | `DATE` | — | `NULL` | Soft-remove; NULL = active |
| `removal_reason` | `VARCHAR(20)` | — | `NULL` | `'died'`, `'rehomed'`, `'sold'`, `'other'` |
| `removal_notes` | `TEXT` | — | `NULL` | |
| `notes` | `TEXT` | — | `NULL` | |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | `NOW()` | |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL | `NOW()` | |

**Indexes:**
- `idx_livestock_tank_active` on `(tank_id, date_removed)` — current livestock list
- `idx_livestock_species` on `(species_id)` — FK lookups

**RLS:** Standard user isolation pattern.

**Soft-delete:** `date_removed` set on removal (not hard-deleted). Removed livestock accessible in tank history for AI context. Current list: `WHERE date_removed IS NULL`.

**Constraint:** CHECK (`species_id IS NOT NULL OR custom_species_name IS NOT NULL`) — must have one or the other.

---

### 6. `ai_conversations`
> Source: Spec 01 (AI Chat Engine)

| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| `id` | `UUID` | PK | `gen_random_uuid()` | |
| `user_id` | `UUID` | FK → `users(id)` ON DELETE CASCADE, NOT NULL | — | |
| `tank_id` | `UUID` | FK → `tanks(id)` ON DELETE CASCADE, NOT NULL | — | Per-tank conversations |
| `messages` | `JSONB` | NOT NULL | `'[]'::jsonb` | Array of message objects |
| `summary` | `TEXT` | — | `NULL` | AI-generated rolling summary |
| `message_count` | `INTEGER` | NOT NULL | `0` | Denormalized for quick checks |
| `total_tokens` | `INTEGER` | NOT NULL | `0` | Running token total |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | `NOW()` | |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL | `NOW()` | |

**Message JSONB structure:**
```json
{
  "id": "msg_abc123",
  "role": "user" | "assistant",
  "content": "Markdown text...",
  "timestamp": "2026-02-07T15:30:00Z",
  "tokens": { "input": 150, "output": 300 },
  "action": null | { "type": "add_livestock", "payload": {...}, "status": "completed" }
}
```

**Indexes:**
- `idx_ai_conv_user_tank` on `(user_id, tank_id, updated_at DESC)` — chat load
- `idx_ai_conv_updated` on `(updated_at DESC)` — recent conversations

**RLS:** Standard user isolation pattern (SELECT/INSERT/UPDATE).

**Summarization:** When `total_tokens > 8000`, trigger auto-summarization. Compress older messages into `summary` field; keep last 50 messages in `messages` array.

---

### 7. `ai_usage`
> Source: Spec 01 (AI Chat Engine), Spec 07 (Subscription & Billing)

Daily usage aggregation for tier enforcement and cost tracking.

| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| `id` | `UUID` | PK | `gen_random_uuid()` | |
| `user_id` | `UUID` | FK → `users(id)` ON DELETE CASCADE, NOT NULL | — | |
| `date` | `DATE` | NOT NULL | `CURRENT_DATE` | |
| `feature` | `VARCHAR(50)` | NOT NULL | — | `'chat'`, `'diagnosis'`, `'report'`, `'search'` |
| `message_count` | `INTEGER` | NOT NULL | `0` | |
| `input_tokens` | `INTEGER` | NOT NULL | `0` | |
| `output_tokens` | `INTEGER` | NOT NULL | `0` | |
| `estimated_cost` | `DECIMAL(10,6)` | — | `NULL` | USD cost at Anthropic rates |
| `model` | `VARCHAR(100)` | — | — | Model used (e.g., 'claude-sonnet-4-5', 'claude-haiku-4-5') |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | `NOW()` | |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL | `NOW()` | |

**Indexes:**
- `idx_ai_usage_user_date` on `(user_id, date DESC)` — daily limit checks
- `idx_ai_usage_user_feature` on `(user_id, feature)` — feature breakdown
- UNIQUE on `(user_id, date, feature)` — one row per user per day per feature

**RLS:**
- SELECT: `auth.uid() = user_id`
- INSERT/UPDATE: via Edge Function only (not direct user access)

**Tier limits (daily message count):**
- Free: 10 | Starter: 100 | Plus: 200 | Pro: Unlimited

---

### 8. `maintenance_tasks`
> Source: Spec 05 (Maintenance Scheduling)

| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| `id` | `UUID` | PK | `gen_random_uuid()` | |
| `tank_id` | `UUID` | FK → `tanks(id)` ON DELETE CASCADE, NOT NULL | — | |
| `user_id` | `UUID` | FK → `users(id)`, NOT NULL | — | For RLS |
| `title` | `VARCHAR(100)` | NOT NULL | — | e.g., "Weekly Water Change" |
| `type` | `VARCHAR(30)` | NOT NULL | — | `'water_change'`, `'filter_clean'`, `'feeding'`, `'dosing'`, `'equipment_maintenance'`, `'water_testing'`, `'custom'` |
| `description` | `TEXT` | — | `NULL` | |
| `frequency` | `VARCHAR(20)` | — | `NULL` | `'daily'`, `'every_X_days'`, `'weekly'`, `'biweekly'`, `'monthly'` |
| `frequency_days` | `INTEGER` | — | `NULL` | Custom interval in days |
| `next_due_date` | `DATE` | NOT NULL | — | |
| `last_completed_date` | `TIMESTAMPTZ` | — | `NULL` | |
| `reminder_time` | `TIME` | NOT NULL | `'09:00:00'` | |
| `is_recurring` | `BOOLEAN` | NOT NULL | `false` | |
| `is_active` | `BOOLEAN` | NOT NULL | `true` | Soft-delete flag |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | `NOW()` | |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL | `NOW()` | |

**Indexes:**
- `idx_maint_tasks_tank` on `(tank_id)` — tasks per tank
- `idx_maint_tasks_due` on `(next_due_date, is_active)` — notification scheduling (cron job query)
- `idx_maint_tasks_user` on `(user_id)` — user's task overview

**RLS:** Standard user isolation pattern.

---

### 9. `maintenance_logs`
> Source: Spec 05 (Maintenance Scheduling)

| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| `id` | `UUID` | PK | `gen_random_uuid()` | |
| `task_id` | `UUID` | FK → `maintenance_tasks(id)` ON DELETE SET NULL | `NULL` | NULL for ad-hoc completions |
| `tank_id` | `UUID` | FK → `tanks(id)` ON DELETE CASCADE, NOT NULL | — | |
| `user_id` | `UUID` | FK → `users(id)`, NOT NULL | — | For RLS |
| `completed_date` | `TIMESTAMPTZ` | NOT NULL | `NOW()` | |
| `notes` | `TEXT` | — | `NULL` | |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | `NOW()` | |

**Indexes:**
- `idx_maint_logs_tank` on `(tank_id, completed_date DESC)` — tank maintenance history
- `idx_maint_logs_task` on `(task_id)` — per-task history

**RLS:** Standard user isolation pattern.

---

### 10. `equipment`
> Source: Spec 10 (Equipment Tracking & Recommendations)

| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| `id` | `UUID` | PK | `gen_random_uuid()` | |
| `tank_id` | `UUID` | FK → `tanks(id)` ON DELETE CASCADE, NOT NULL | — | |
| `user_id` | `UUID` | FK → `users(id)`, NOT NULL | — | For RLS |
| `type` | `VARCHAR(50)` | NOT NULL | — | `'filter'`, `'heater'`, `'light'`, `'skimmer'`, `'powerhead'`, `'pump'`, `'controller'`, `'test_kit'`, `'other'` |
| `custom_type` | `VARCHAR(100)` | — | `NULL` | When type = 'other' |
| `brand` | `VARCHAR(100)` | — | `NULL` | |
| `model` | `VARCHAR(100)` | — | `NULL` | |
| `purchase_date` | `DATE` | NOT NULL | — | |
| `last_serviced_date` | `DATE` | — | `NULL` | |
| `settings` | `TEXT` | — | `NULL` | Flow rate, wattage, schedule, etc. |
| `notes` | `TEXT` | — | `NULL` | |
| `expected_lifespan_months` | `INTEGER` | CHECK (> 0) | `NULL` | User override; falls back to defaults table |
| `photo_url` | `VARCHAR(500)` | — | `NULL` | |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | `NOW()` | |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL | `NOW()` | |
| `deleted_at` | `TIMESTAMPTZ` | — | `NULL` | Soft-delete |
| `deletion_reason` | `VARCHAR(20)` | — | `NULL` | `'replaced'`, `'removed'`, `'failed'`, `'sold'` |

**Indexes:**
- `idx_equipment_tank` on `(tank_id, deleted_at)` — active equipment per tank
- `idx_equipment_type` on `(type)` — filter queries

**RLS:** Standard user isolation pattern.

---

### 11. `equipment_lifespan_defaults`
> Source: Spec 10 (Equipment Tracking)

System reference table — admin managed. Provides default lifespans when users don't set custom values.

| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| `id` | `UUID` | PK | `gen_random_uuid()` | |
| `equipment_type` | `VARCHAR(50)` | NOT NULL, UNIQUE | — | Matches `equipment.type` |
| `lifespan_months_min` | `INTEGER` | NOT NULL | — | Conservative estimate |
| `lifespan_months_max` | `INTEGER` | NOT NULL | — | Optimistic estimate |
| `maintenance_interval_months` | `INTEGER` | — | `NULL` | Recommended service interval |
| `notes` | `TEXT` | — | `NULL` | |

**Seed data:**

| Type | Min (months) | Max (months) | Service Interval |
|------|-------------|-------------|-----------------|
| filter | 3 | 6 | 1 |
| heater | 24 | 36 | 6 |
| light | 12 | 18 | — |
| light_led | 36 | 60 | — |
| skimmer | 24 | 60 | 3 |
| powerhead | 24 | 48 | 3 |
| pump | 36 | 84 | 6 |
| controller | 36 | 60 | — |
| test_kit | 6 | 12 | — |

**RLS:** Public read (authenticated), admin write.

---

### 12. `subscriptions`
> Source: Spec 07 (Subscription & Billing)

| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| `id` | `UUID` | PK | `gen_random_uuid()` | |
| `user_id` | `UUID` | FK → `users(id)` ON DELETE CASCADE, UNIQUE | — | One active subscription per user |
| `stripe_subscription_id` | `VARCHAR(255)` | NOT NULL, UNIQUE | — | |
| `tier` | `VARCHAR(20)` | NOT NULL | — | `'starter'`, `'plus'`, `'pro'` |
| `status` | `VARCHAR(20)` | NOT NULL | — | `'active'`, `'past_due'`, `'canceled'`, `'expired'` |
| `current_period_start` | `TIMESTAMPTZ` | NOT NULL | — | |
| `current_period_end` | `TIMESTAMPTZ` | NOT NULL | — | |
| `cancel_at_period_end` | `BOOLEAN` | NOT NULL | `false` | |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | `NOW()` | |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL | `NOW()` | |

**Indexes:**
- `idx_subs_user` on `(user_id)` — user lookup
- `idx_subs_stripe` on `(stripe_subscription_id)` — webhook lookups
- `idx_subs_status` on `(status)` — failed payment queries

**RLS:**
- SELECT: `auth.uid() = user_id`
- INSERT/UPDATE/DELETE: Edge Function only (Stripe webhook-driven)

**Webhook event mapping:**
- `customer.subscription.created` → INSERT
- `customer.subscription.updated` → UPDATE tier, status, period
- `customer.subscription.deleted` → UPDATE status = 'canceled'
- `invoice.payment_succeeded` → UPDATE period_end
- `invoice.payment_failed` → UPDATE status = 'past_due'

---

### 13. `notification_preferences`
> Source: Spec 05 (Maintenance), Spec 08 (PWA Shell)

| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| `id` | `UUID` | PK | `gen_random_uuid()` | |
| `user_id` | `UUID` | FK → `users(id)` ON DELETE CASCADE, UNIQUE | — | One per user |
| `push_enabled` | `BOOLEAN` | NOT NULL | `false` | |
| `email_enabled` | `BOOLEAN` | NOT NULL | `true` | |
| `reminder_timing` | `VARCHAR(20)` | NOT NULL | `'morning_of'` | `'day_before'`, `'morning_of'`, `'1_hour_before'` |
| `quiet_hours_enabled` | `BOOLEAN` | NOT NULL | `false` | |
| `quiet_hours_start` | `TIME` | — | `'22:00:00'` | |
| `quiet_hours_end` | `TIME` | — | `'08:00:00'` | |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | `NOW()` | |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL | `NOW()` | |

**RLS:** SELECT/UPDATE: `auth.uid() = user_id`

---

### 14. `push_subscriptions`
> Source: Spec 08 (PWA Shell)

Stores Web Push API subscription tokens. One user can have multiple devices.

| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| `id` | `UUID` | PK | `gen_random_uuid()` | |
| `user_id` | `UUID` | FK → `users(id)` ON DELETE CASCADE, NOT NULL | — | |
| `endpoint` | `TEXT` | NOT NULL, UNIQUE | — | Web Push endpoint URL |
| `auth_key` | `TEXT` | NOT NULL | — | Authentication key |
| `p256dh_key` | `TEXT` | NOT NULL | — | ECDH public key |
| `user_agent` | `TEXT` | — | `NULL` | Device identification |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | `NOW()` | |

**RLS:** SELECT/INSERT/DELETE: `auth.uid() = user_id`

---

### 15. `report_preferences`
> Source: Spec 11 (Dashboards & Reports)

| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| `id` | `UUID` | PK | `gen_random_uuid()` | |
| `user_id` | `UUID` | FK → `users(id)` ON DELETE CASCADE, UNIQUE | — | |
| `frequency` | `VARCHAR(10)` | NOT NULL | `'weekly'` | `'daily'`, `'weekly'` |
| `tank_ids` | `UUID[]` | NOT NULL | `'{}'` | Which tanks to include |
| `delivery_time` | `TIME` | NOT NULL | `'07:00:00'` | Local time |
| `enabled` | `BOOLEAN` | NOT NULL | `true` | |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | `NOW()` | |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL | `NOW()` | |

**RLS:** SELECT/UPDATE: `auth.uid() = user_id`

**Tier gating:** Pro tier only. Edge Function checks tier before generating/sending.

---

### 16. `report_history`
> Source: Spec 11 (Dashboards & Reports)

| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| `id` | `UUID` | PK | `gen_random_uuid()` | |
| `user_id` | `UUID` | FK → `users(id)` ON DELETE CASCADE, NOT NULL | — | |
| `generated_at` | `TIMESTAMPTZ` | NOT NULL | `NOW()` | |
| `content` | `JSONB` | NOT NULL | — | Full report payload |
| `email_sent` | `BOOLEAN` | NOT NULL | `false` | |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | `NOW()` | |

**Indexes:**
- `idx_reports_user` on `(user_id, generated_at DESC)` — report archive

**RLS:** SELECT: `auth.uid() = user_id`. INSERT: Edge Function only.

---

### 17. `photo_diagnoses`
> Source: Spec 09 (Photo Diagnosis)

| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| `id` | `UUID` | PK | `gen_random_uuid()` | |
| `user_id` | `UUID` | FK → `users(id)` ON DELETE CASCADE, NOT NULL | — | |
| `tank_id` | `UUID` | FK → `tanks(id)`, NOT NULL | — | |
| `photo_url` | `VARCHAR(500)` | NOT NULL | — | Supabase Storage URL |
| `diagnosis_type` | `VARCHAR(20)` | NOT NULL | — | `'species_id'`, `'disease'`, `'both'` |
| `identified_species_id` | `UUID` | FK → `species(id)` ON DELETE SET NULL | `NULL` | |
| `identified_species_name` | `VARCHAR(255)` | — | `NULL` | Fallback when not in DB |
| `identification_confidence` | `VARCHAR(10)` | — | `NULL` | `'high'`, `'medium'`, `'low'` |
| `diagnosis` | `VARCHAR(255)` | — | `NULL` | Disease/condition name |
| `diagnosis_confidence` | `VARCHAR(10)` | — | `NULL` | `'high'`, `'medium'`, `'low'` |
| `symptoms` | `TEXT` | — | `NULL` | |
| `severity` | `VARCHAR(10)` | — | `NULL` | `'minor'`, `'moderate'`, `'severe'` |
| `treatment_plan` | `JSONB` | — | `NULL` | Medication, dosing, duration |
| `ai_response` | `TEXT` | — | `NULL` | Full AI response for reference |
| `user_feedback` | `TEXT` | CHECK IN ('helpful', 'not_helpful', NULL) | `NULL` | User rating of diagnosis quality |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | `NOW()` | |

**Indexes:**
- `idx_photo_diag_user_tank` on `(user_id, tank_id, created_at DESC)` — diagnosis history

**RLS:** SELECT/INSERT: `auth.uid() = user_id`

**Tier gating:** Plus and Pro tiers only.

---

### 18. `compatibility_checks`
> Source: Spec 04 (Species Database & Livestock)

Analytics/audit table for AI compatibility checks.

| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| `id` | `UUID` | PK | `gen_random_uuid()` | |
| `user_id` | `UUID` | FK → `users(id)`, NOT NULL | — | |
| `tank_id` | `UUID` | FK → `tanks(id)`, NOT NULL | — | |
| `species_id` | `UUID` | FK → `species(id)`, NOT NULL | — | Species being checked |
| `result` | `VARCHAR(20)` | NOT NULL | — | `'compatible'`, `'caution'`, `'incompatible'` |
| `warnings` | `JSONB` | — | `NULL` | Array of warning objects |
| `user_proceeded` | `BOOLEAN` | NOT NULL | `false` | Added despite warnings? |
| `checked_at` | `TIMESTAMPTZ` | NOT NULL | `NOW()` | |

**Indexes:**
- `idx_compat_user_tank` on `(user_id, tank_id)` — user's history

**RLS:** SELECT: `auth.uid() = user_id`. INSERT: via application.

---

### 19. `webhook_events`
> Source: Spec 12 (Stripe Payment Processing)

Idempotency tracking for Stripe webhook processing.

| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| `id` | `UUID` | PK | `gen_random_uuid()` | |
| `stripe_event_id` | `VARCHAR(255)` | NOT NULL, UNIQUE | — | Stripe event ID for idempotency |
| `event_type` | `VARCHAR(100)` | NOT NULL | — | e.g., 'checkout.session.completed' |
| `processed_at` | `TIMESTAMPTZ` | NOT NULL | `NOW()` | |
| `payload` | `JSONB` | — | `NULL` | Full event payload for audit |

**RLS:** Service role only. No user access.

**Retention:** 90 days; purge via weekly cron.

**Indexes:** UNIQUE on `stripe_event_id`

---

### 20. `admin_profiles`
> Source: Spec 13 (Admin Portal)

Admin role assignments for platform management.

| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| `id` | `UUID` | PK | `gen_random_uuid()` | |
| `user_id` | `UUID` | NOT NULL, UNIQUE, FK → auth.users(id) ON DELETE CASCADE | — | Links to auth user |
| `role` | `TEXT` | NOT NULL, CHECK IN ('super_admin', 'ops_admin', 'content_admin', 'support_admin', 'analytics_viewer') | — | Admin role level |
| `is_active` | `BOOLEAN` | NOT NULL | `true` | Soft-disable admin access |
| `granted_by` | `UUID` | FK → auth.users(id) | — | Who granted this role |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | `NOW()` | |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL | `NOW()` | |

**RLS:** Admins read own profile. Super admins manage all.

---

### 21. `admin_audit_log`
> Source: Spec 13 (Admin Portal)

Immutable log of all admin actions for accountability.

| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| `id` | `UUID` | PK | `gen_random_uuid()` | |
| `admin_user_id` | `UUID` | NOT NULL, FK → auth.users(id) | — | Admin who performed action |
| `action` | `TEXT` | NOT NULL | — | e.g., 'user.suspend', 'species.update' |
| `target_type` | `TEXT` | NOT NULL | — | e.g., 'user', 'species', 'equipment_default' |
| `target_id` | `UUID` | — | — | Entity being acted upon |
| `old_value` | `JSONB` | — | — | Previous state (null for creates) |
| `new_value` | `JSONB` | — | — | New state (null for deletes) |
| `reason` | `TEXT` | — | — | Required for destructive actions |
| `ip_address` | `INET` | — | — | Admin's IP address |
| `user_agent` | `TEXT` | — | — | Admin's browser user agent |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | `NOW()` | Append-only, no updates |

**RLS:** Super Admin and Ops Admin read-only. No UPDATE or DELETE policies (append-only).

**Indexes:** admin_user_id, action, (target_type, target_id), created_at DESC

---

### 22. `species_revisions`
> Source: Spec 13 (Admin Portal)

Revision history for species database content changes.

| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| `id` | `UUID` | PK | `gen_random_uuid()` | |
| `species_id` | `UUID` | NOT NULL, FK → species(id) ON DELETE CASCADE | — | Species being revised |
| `revision_data` | `JSONB` | NOT NULL | — | Full species record snapshot |
| `changed_by` | `UUID` | NOT NULL, FK → auth.users(id) | — | Admin who made change |
| `change_type` | `TEXT` | NOT NULL, CHECK IN ('create', 'update', 'archive', 'restore') | — | Type of change |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | `NOW()` | |

**Indexes:** (species_id, created_at DESC)

---

## Supabase Storage Buckets

| Bucket | Path Pattern | Max Size | Formats | Retention |
|--------|-------------|----------|---------|-----------|
| `tank-photos` | `{user_id}/{tank_id}/{timestamp}.{ext}` | 5 MB | JPEG, PNG | Deleted on tank hard-delete |
| `equipment-photos` | `{user_id}/{equipment_id}/{timestamp}.{ext}` | 5 MB | JPEG, PNG, WebP | Deleted on equipment hard-delete |
| `photo-diagnosis` | `{user_id}/{tank_id}/{timestamp}.jpg` | 10 MB | JPEG, PNG | Configurable cleanup (P2) |

**All buckets:** Authenticated uploads only. Signed URLs for reads (7-day expiry). RLS on storage objects matching `user_id` in path.

---

## Row-Level Security (RLS) Policy Template

All user-scoped tables follow this standard pattern:

```sql
ALTER TABLE {table} ENABLE ROW LEVEL SECURITY;

-- Users see only their own data
CREATE POLICY "{table}_select_own" ON {table}
  FOR SELECT USING (auth.uid() = user_id);

-- Users create only their own data
CREATE POLICY "{table}_insert_own" ON {table}
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users update only their own data
CREATE POLICY "{table}_update_own" ON {table}
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users delete only their own data
CREATE POLICY "{table}_delete_own" ON {table}
  FOR DELETE USING (auth.uid() = user_id);
```

**Exceptions:**
- `species` — public read, admin write
- `equipment_lifespan_defaults` — public read, admin write
- `subscriptions` — user read, Edge Function write (webhook-driven)
- `ai_usage` — user read, Edge Function write
- `report_history` — user read, Edge Function write

---

## Additional Tables (Referenced in Feature Specs)

### `ai_usage`

Tracks AI feature usage per user per day for rate limiting and billing.

```sql
CREATE TABLE ai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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

CREATE INDEX idx_ai_usage_user_date ON ai_usage(user_id, date);
```

---

### `photo_diagnoses`

Stores results from AI photo diagnosis feature.

```sql
CREATE TABLE photo_diagnoses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tank_id UUID NOT NULL REFERENCES tanks(id) ON DELETE CASCADE,
  diagnosis_type TEXT NOT NULL CHECK (diagnosis_type IN ('species_id', 'disease', 'both')),
  photo_url TEXT NOT NULL,
  species_result JSONB,
  disease_result JSONB,
  confidence TEXT CHECK (confidence IN ('high', 'medium', 'low')),
  user_feedback TEXT CHECK (user_feedback IN ('helpful', 'not_helpful')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_photo_diagnoses_user ON photo_diagnoses(user_id);
CREATE INDEX idx_photo_diagnoses_tank ON photo_diagnoses(tank_id);
```

---

### `report_preferences`

Stores user preferences for scheduled email reports (Pro tier).

```sql
CREATE TABLE report_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  frequency TEXT DEFAULT 'weekly' CHECK (frequency IN ('daily', 'weekly', 'monthly')),
  tank_ids UUID[] DEFAULT '{}',
  delivery_time TIME DEFAULT '07:00:00',
  enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### `report_history`

Archives generated reports for user access.

```sql
CREATE TABLE report_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  content JSONB NOT NULL,
  email_sent BOOLEAN DEFAULT false,
  email_sent_at TIMESTAMPTZ
);

CREATE INDEX idx_report_history_user ON report_history(user_id);
```

---

### `push_subscriptions`

Stores Web Push API subscription tokens for push notifications.

```sql
CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  auth_key TEXT NOT NULL,
  p256dh_key TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ
);

CREATE INDEX idx_push_subscriptions_user ON push_subscriptions(user_id);
```

---

### `compatibility_checks`

Logs species compatibility checks for audit and improvement.

```sql
CREATE TABLE compatibility_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tank_id UUID NOT NULL REFERENCES tanks(id) ON DELETE CASCADE,
  species_id UUID REFERENCES species(id),
  result TEXT CHECK (result IN ('compatible', 'caution', 'incompatible')),
  warnings JSONB,
  ai_assessment BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_compatibility_checks_tank ON compatibility_checks(tank_id);
```

---

### `equipment_lifespan_defaults`

Reference table for typical equipment lifespans (used by Equipment Tracking feature).

```sql
CREATE TABLE equipment_lifespan_defaults (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_type TEXT NOT NULL UNIQUE,
  min_lifespan_months INTEGER NOT NULL,
  max_lifespan_months INTEGER NOT NULL,
  notes TEXT
);

-- Seed data
INSERT INTO equipment_lifespan_defaults (equipment_type, min_lifespan_months, max_lifespan_months, notes)
VALUES
  ('filter_media', 3, 6, 'Varies by type (sponge, cartridge, biological)'),
  ('heater', 24, 36, 'Standard aquarium heaters'),
  ('light_bulb', 12, 18, 'Conventional T8, T5 fluorescent'),
  ('light_led', 36, 60, 'Modern LED fixtures'),
  ('protein_skimmer', 24, 60, 'Marine/reef only'),
  ('powerhead', 24, 48, 'Circulation pump'),
  ('dosing_pump', 36, 84, 'Peristaltic/stepper'),
  ('controller', 36, 60, 'Aquarium controller'),
  ('carbon', 1, 1, 'Activated carbon (weeks, stored as 1 month minimum)'),
  ('substrate', 60, 120, 'Gravel, sand — very stable');
```

---

## Tier Enforcement Matrix

**Canonical Tier Structure (4-tier model):**
| Tier | Price | Description |
|------|-------|-------------|
| **Free** | $0 | Limited access, no credit card required |
| **Starter** | $3.99/mo | Entry paid tier, unlocks basic features |
| **Plus** | $7.99/mo | Mid-tier, unlocks photo diagnosis + equipment |
| **Pro** | $14.99/mo | Full access, unlimited everything |

- 14-day trial gives **Pro** access, then drops to **Free** unless subscribed

**Feature Access by Tier:**

| Feature | Free | Starter ($3.99) | Plus ($7.99) | Pro ($14.99) |
|---------|------|-----------------|--------------|--------------|
| Max tanks | 1 | 1 | 5 | Unlimited |
| AI messages/day | 10 | 100 | 200 | Unlimited |
| Maintenance tasks | 3 total | 10/tank | 10/tank | Unlimited |
| Photo diagnosis | — | — | 10/day | 30/day |
| Equipment tracking | — | — | ✓ | ✓ |
| AI Equipment Recs | — | — | — | 10/day |
| Email reports | — | — | — | ✓ |
| Multi-tank comparison | — | — | — | ✓ |
| Parameter tracking | ✓ | ✓ | ✓ | ✓ |
| Species database | ✓ | ✓ | ✓ | ✓ |
| Livestock management | ✓ | ✓ | ✓ | ✓ |
| Interactive dashboards | Basic | Basic | Full | Advanced |

**Enforcement:** Server-side checks in Edge Functions. Tank creation enforced via DB trigger. AI limits enforced via `ai_usage` table check before API call. Feature access gated via middleware checking `users.subscription_tier`.

---

## Soft-Delete & Retention Rules

| Table | Strategy | Grace Period | Hard-Delete |
|-------|----------|-------------|-------------|
| `tanks` | `deleted_at` timestamp | 90 days | Cron: weekly cleanup |
| `livestock` | `date_removed` + reason | Never | Retained for AI history |
| `equipment` | `deleted_at` + reason | Never | Retained for AI history |
| `maintenance_tasks` | `is_active = false` | Never | Retained for history |
| All other tables | No soft-delete | N/A | CASCADE from parent |

**Cascade behavior:** When a tank is hard-deleted (after 90-day grace), all child records (parameters, livestock, conversations, equipment, tasks, logs, diagnoses) are CASCADE deleted. Storage bucket objects cleaned up via Edge Function trigger.

---

## Migration Sequencing

### Phase 1 — MVP (P0)
Execute in this order due to FK dependencies:

1. `users` (extends Supabase Auth)
2. `tanks` (depends on users)
3. `species` (reference data, no FKs)
4. `water_parameters` (depends on tanks, users)
5. `livestock` (depends on tanks, users, species)
6. `ai_conversations` (depends on tanks, users)
7. `ai_usage` (depends on users)
8. `subscriptions` (depends on users)
9. `maintenance_tasks` (depends on tanks, users)
10. `maintenance_logs` (depends on maintenance_tasks, tanks, users)
11. `notification_preferences` (depends on users)
12. `push_subscriptions` (depends on users)

### Phase 2 — Fast Follow (P1)
13. `equipment` (depends on tanks, users)
14. `equipment_lifespan_defaults` (reference data)
15. `photo_diagnoses` (depends on tanks, users, species)
16. `report_preferences` (depends on users)
17. `report_history` (depends on users)
18. `compatibility_checks` (depends on tanks, users, species)

### Phase 3 — Admin & Stripe (P1)
19. `webhook_events` (reference data, no FKs except audit)
20. `admin_profiles` (depends on auth.users)
21. `admin_audit_log` (depends on auth.users, no RLS-blocked DELETEs)
22. `species_revisions` (depends on species, auth.users)

---

## Database Functions & Triggers

### Auto-update `updated_at`
```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```
Applied to: all tables with `updated_at` column.

### Tank count enforcement
```sql
CREATE OR REPLACE FUNCTION check_tank_limit()
RETURNS TRIGGER AS $$
DECLARE
  current_count INTEGER;
  max_tanks INTEGER;
  user_tier VARCHAR;
BEGIN
  SELECT subscription_tier INTO user_tier FROM users WHERE id = NEW.user_id;

  SELECT COUNT(*) INTO current_count
  FROM tanks WHERE user_id = NEW.user_id AND deleted_at IS NULL;

  max_tanks := CASE user_tier
    WHEN 'free' THEN 1
    WHEN 'starter' THEN 1
    WHEN 'plus' THEN 5
    WHEN 'pro' THEN 999999
    ELSE 1
  END;

  IF current_count >= max_tanks THEN
    RAISE EXCEPTION 'Tank limit reached for % tier', user_tier;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Maintenance task recurrence
```sql
-- After completion log, advance next_due_date
CREATE OR REPLACE FUNCTION advance_task_due_date()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE maintenance_tasks
  SET next_due_date = CASE frequency
    WHEN 'daily' THEN NEW.completed_date::date + INTERVAL '1 day'
    WHEN 'weekly' THEN NEW.completed_date::date + INTERVAL '7 days'
    WHEN 'biweekly' THEN NEW.completed_date::date + INTERVAL '14 days'
    WHEN 'monthly' THEN NEW.completed_date::date + INTERVAL '1 month'
    ELSE NEW.completed_date::date + (frequency_days || ' days')::INTERVAL
  END,
  last_completed_date = NEW.completed_date
  WHERE id = NEW.task_id AND is_recurring = true;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## Scheduled Jobs (Supabase Edge Functions + Cron)

| Job | Schedule | Description |
|-----|----------|-------------|
| `check-maintenance-reminders` | Every 15 min | Query upcoming tasks, send push notifications |
| `generate-daily-reports` | Daily 6:00 AM UTC | Generate AI reports for Pro users |
| `send-email-reports` | Daily 6:30 AM UTC | Email generated reports |
| `check-equipment-lifespans` | Daily 8:00 AM UTC | Alert on equipment approaching end-of-life |
| `cleanup-soft-deletes` | Weekly Sunday 3:00 AM UTC | Hard-delete tanks past 90-day grace period |
| `trial-expiration-reminders` | Daily 9:00 AM UTC | Send 3-day and 1-day trial ending reminders |
| `ai-usage-aggregation` | Daily midnight UTC | Roll up token costs for internal reporting |

---

*Document generated from Aquatic AI PRD v1 and Feature Specs 01–13. Last updated: February 2026.*
