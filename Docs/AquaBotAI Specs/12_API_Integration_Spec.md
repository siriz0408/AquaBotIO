# API & Integration Layer — Feature Specification
**Aquatic AI | Spec 12 | P0 — Must-Have**
**Version 1.0 | February 2026**

---

## Problem Statement

Aquatic AI's frontend (Next.js PWA) needs a reliable, secure, and performant API layer to communicate with the database, AI engine, payment system, and notification infrastructure. Without a well-defined API contract, frontend and backend development cannot proceed in parallel, error handling becomes inconsistent, and integrations with external services (Anthropic, Stripe, Web Push) become fragile. This spec defines every endpoint, payload, auth method, rate limit, webhook handler, and failure mode so engineering can build with confidence.

---

## Goals

- Define every internal API endpoint the frontend consumes, with exact request/response payloads aligned to the data model schema (Spec 00)
- Specify integration contracts for all external services: Anthropic API, Stripe, Supabase Auth, Web Push API
- Define the AI orchestration layer in detail: system prompt architecture, context injection pipeline, tool use schema, token management, summarization strategy, and model routing
- Establish consistent error handling, retry policies, and failure modes across all integrations
- Define rate limiting strategy per endpoint and per user tier
- Ensure all endpoints enforce authentication and tier-based feature gating server-side

---

## Non-Goals

- **NG1**: Public developer API — no third-party API access in v1. Public API is a Phase 3 consideration.
- **NG2**: GraphQL — REST-style Edge Functions only. GraphQL adds complexity without clear v1 benefit.
- **NG3**: WebSocket-based real-time chat — use request/response for AI chat. Supabase Realtime used only for data sync (parameter alerts, notification badges).
- **NG4**: API versioning — single version in v1. Versioning strategy defined when public API ships.
- **NG5**: API documentation portal (Swagger/OpenAPI) — internal spec only. Auto-generated docs are P2.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                   FRONTEND (Next.js PWA)                 │
│                     Deployed on Vercel                   │
└────────────────────────┬────────────────────────────────┘
                         │ HTTPS + JWT
                         ▼
┌─────────────────────────────────────────────────────────┐
│              SUPABASE EDGE FUNCTIONS (Deno)              │
│                                                         │
│  ┌──────────┐ ┌──────────┐ ┌────────┐ ┌─────────────┐  │
│  │ AI Chat  │ │Tank CRUD │ │Billing │ │Notifications│  │
│  │ Engine   │ │& Params  │ │Webhooks│ │  & Push     │  │
│  └────┬─────┘ └────┬─────┘ └───┬────┘ └──────┬──────┘  │
└───────┼────────────┼───────────┼─────────────┼──────────┘
        │            │           │             │
   ┌────▼────┐ ┌─────▼─────┐ ┌──▼───┐ ┌──────▼──────┐
   │Anthropic│ │ Supabase  │ │Stripe│ │  Web Push   │
   │  API    │ │ PostgreSQL│ │  API │ │    API      │
   └─────────┘ └───────────┘ └──────┘ └─────────────┘
```

### Authentication Flow (All Endpoints)

Every Edge Function call follows this pattern:

1. Frontend includes `Authorization: Bearer {supabase_jwt}` header
2. Edge Function initializes Supabase client with the JWT — the client automatically scopes all queries via RLS
3. If JWT is expired or invalid → `401 AUTH_EXPIRED`
4. If user lacks tier access for the feature → `403 TIER_LIMIT_REACHED` with upgrade prompt payload
5. Exception: Stripe webhook endpoint uses Stripe signature verification instead of JWT

### Standard Response Envelope

All endpoints return this structure:

**Success:**
```json
{
  "success": true,
  "data": { },
  "meta": {
    "timestamp": "2026-02-07T15:30:00Z",
    "request_id": "req_abc123"
  }
}
```

**Error:**
```json
{
  "success": false,
  "error": {
    "code": "TIER_LIMIT_REACHED",
    "message": "Your Starter plan allows 1 tank. Upgrade to Plus for up to 5.",
    "details": { "current_tier": "starter", "limit": 1, "current_count": 1 },
    "upgrade_url": "/pricing"
  },
  "meta": {
    "timestamp": "2026-02-07T15:30:00Z",
    "request_id": "req_abc124"
  }
}
```

### Standard Error Codes

| Code | HTTP | Description |
|------|------|-------------|
| `AUTH_REQUIRED` | 401 | Missing or invalid JWT |
| `AUTH_EXPIRED` | 401 | JWT expired; client should re-authenticate via magic link |
| `FORBIDDEN` | 403 | Authenticated but lacks permission for this resource |
| `TIER_LIMIT_REACHED` | 403 | Feature or resource gated by subscription tier |
| `DAILY_LIMIT_REACHED` | 429 | AI message limit for tier exceeded for today |
| `RATE_LIMITED` | 429 | Too many requests per minute |
| `NOT_FOUND` | 404 | Resource does not exist or not owned by user |
| `VALIDATION_ERROR` | 400 | Invalid request payload (includes field-level errors) |
| `CONFLICT` | 409 | Duplicate or conflicting operation |
| `AI_UNAVAILABLE` | 503 | Anthropic API unreachable or returning errors |
| `PAYMENT_REQUIRED` | 402 | Trial expired with no active subscription |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

### Rate Limiting Strategy

| Scope | Limit | Window | Enforcement |
|-------|-------|--------|-------------|
| Per-user global | 120 req/min | Sliding window | Edge Function middleware |
| AI chat messages | Tier-based: Free 10, Starter 100, Plus 200, Pro ∞ per day | Daily reset midnight UTC | `ai_usage` table check |
| Photo diagnosis | Plus: 10/day, Pro: 30/day | Daily reset midnight UTC | `ai_usage` table check |
| Parameter logging | 50 entries/day/tank | Daily reset | Application logic |
| Stripe webhooks | No limit (Stripe-initiated) | — | Signature verification only |

Rate limit headers on every response:
```
X-RateLimit-Limit: 120
X-RateLimit-Remaining: 115
X-RateLimit-Reset: 1707321600
```

### Rate Limit Implementation Details

**Storage**: The `ai_usage` table stores daily usage rows per user per feature type.

**Atomic Check/Increment**: Use Supabase RPC function for atomic rate limit checking:

```sql
CREATE OR REPLACE FUNCTION check_and_increment_usage(
  p_user_id UUID,
  p_feature TEXT,
  p_limit INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
  current_count INTEGER;
BEGIN
  -- Get or create today's usage row
  INSERT INTO ai_usage (user_id, date, feature, message_count)
  VALUES (p_user_id, CURRENT_DATE, p_feature, 0)
  ON CONFLICT (user_id, date, feature) DO NOTHING;

  -- Lock and check
  SELECT message_count INTO current_count
  FROM ai_usage
  WHERE user_id = p_user_id AND date = CURRENT_DATE AND feature = p_feature
  FOR UPDATE;

  IF current_count >= p_limit THEN
    RETURN FALSE;  -- Limit exceeded
  END IF;

  -- Increment
  UPDATE ai_usage
  SET message_count = message_count + 1, updated_at = NOW()
  WHERE user_id = p_user_id AND date = CURRENT_DATE AND feature = p_feature;

  RETURN TRUE;  -- Success
END;
$$ LANGUAGE plpgsql;
```

**Cleanup**: Daily cron archives rows older than 90 days for cost reporting while keeping database lean.

### Scheduled Jobs (Cron)

All cron jobs run as Supabase Edge Functions with scheduled triggers:

| Job | Schedule | Function | Description |
|-----|----------|----------|-------------|
| Maintenance reminders | Every 15 min | `cron-maintenance-reminders` | Check `maintenance_tasks.next_due_date`, send push/email for tasks due within 1 hour |
| Report generation | Daily 6 AM UTC | `cron-generate-reports` | Generate daily/weekly reports for Pro users with `report_preferences.enabled = true` |
| Trial expiration warnings | Daily midnight UTC | `cron-trial-warnings` | Send 3-day and 1-day warning emails for expiring trials |
| Usage cleanup | Daily midnight UTC | `cron-usage-cleanup` | Archive `ai_usage` rows older than 90 days to `ai_usage_archive` |
| Storage cleanup | Weekly Sunday 3 AM UTC | `cron-storage-cleanup` | Delete expired photos from Supabase Storage (photo diagnosis images > 90 days) |
| Equipment lifespan alerts | Daily 6 AM UTC | `cron-equipment-alerts` | Check equipment approaching end-of-life, send push notifications |
| Stripe sync reconciliation | Daily 2 AM UTC | `cron-stripe-sync` | Verify Supabase subscription data matches Stripe (catch missed webhooks) |

---

## Internal API Endpoints

All endpoints are Supabase Edge Functions invoked via `POST https://{project-ref}.supabase.co/functions/v1/{function-name}`. Unless noted, every endpoint requires `Authorization: Bearer {jwt}` and returns the standard response envelope.

---

### 2.1 User Profile

#### `POST /functions/v1/user-profile` — Get or Update Profile

**Action: `get`**

Request:
```json
{ "action": "get" }
```

Response `data`:
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "display_name": "Sam",
  "avatar_url": "https://...",
  "subscription_tier": "plus",
  "trial_end_date": "2026-02-21T00:00:00Z",
  "skill_level": "intermediate",
  "onboarding_completed": true,
  "unit_preference_temp": "F",
  "unit_preference_volume": "gallons",
  "timezone": "America/New_York",
  "created_at": "2026-02-07T00:00:00Z",
  "tank_count": 3,
  "ai_messages_today": 42,
  "ai_message_limit": 200
}
```

Side effects: None. Read-only.

**Action: `update`**

Request:
```json
{
  "action": "update",
  "fields": {
    "display_name": "Sam R.",
    "skill_level": "advanced",
    "unit_preference_temp": "C",
    "unit_preference_volume": "liters",
    "timezone": "America/Los_Angeles"
  }
}
```

Validation:
- `display_name`: max 255 chars
- `skill_level`: enum `['beginner', 'intermediate', 'advanced']`
- `unit_preference_temp`: enum `['F', 'C']`
- `unit_preference_volume`: enum `['gallons', 'liters']`
- `timezone`: valid IANA timezone string

Response `data`: Updated user object (same shape as `get`).

**Action: `complete_onboarding`**

Request:
```json
{
  "action": "complete_onboarding",
  "skill_level": "beginner",
  "unit_preference_temp": "F",
  "unit_preference_volume": "gallons",
  "timezone": "America/New_York"
}
```

Side effects: Sets `onboarding_completed = true`, updates preferences, creates default `notification_preferences` row and default `report_preferences` row.

Response `data`: Updated user object.

---

### 2.2 Tank Management

#### `POST /functions/v1/tanks` — Tank CRUD

**Action: `list`**

Request:
```json
{ "action": "list" }
```

Response `data`:
```json
{
  "tanks": [
    {
      "id": "uuid",
      "name": "Reef Display",
      "type": "reef",
      "volume_gallons": 120.00,
      "dimensions_length": 48.00,
      "dimensions_width": 24.00,
      "dimensions_height": 24.00,
      "substrate": "sand",
      "setup_date": "2025-06-15",
      "photo_url": "https://...",
      "created_at": "2025-06-15T...",
      "livestock_count": 12,
      "next_maintenance": "2026-02-10",
      "latest_params": {
        "test_date": "2026-02-06T...",
        "ph": 8.20,
        "ammonia_ppm": 0.00,
        "nitrite_ppm": 0.00,
        "nitrate_ppm": 5.00,
        "temperature_f": 78.00
      }
    }
  ],
  "count": 3,
  "tier_limit": 5
}
```

Query: `SELECT * FROM tanks WHERE user_id = auth.uid() AND deleted_at IS NULL ORDER BY created_at DESC`. Joins to `livestock` (count), `maintenance_tasks` (next due), and `water_parameters` (latest row) via subqueries.

**Action: `get`**

Request:
```json
{ "action": "get", "tank_id": "uuid" }
```

Response `data`: Single tank object with same shape as list item, plus `equipment_count` and `conversation_id` (latest AI conversation for this tank).

Errors: `NOT_FOUND` if tank doesn't exist or not owned by user (RLS enforces).

**Action: `create`**

Request:
```json
{
  "action": "create",
  "name": "Planted 40 Breeder",
  "type": "freshwater",
  "volume_gallons": 40,
  "dimensions_length": 36.00,
  "dimensions_width": 18.00,
  "dimensions_height": 16.00,
  "substrate": "aquasoil",
  "setup_date": "2026-02-01"
}
```

Validation:
- `name`: required, 1–100 chars
- `type`: required, enum `['freshwater', 'saltwater', 'reef', 'brackish']`
- `volume_gallons`: required, > 0, max 99999.99
- `dimensions_*`: optional, > 0
- `substrate`: optional, max 100 chars
- `setup_date`: optional, valid date, not future

Tier check: Before INSERT, count active tanks for user. If count ≥ tier limit → `403 TIER_LIMIT_REACHED` with details:
```json
{
  "current_tier": "starter",
  "limit": 1,
  "current_count": 1,
  "upgrade_url": "/pricing"
}
```

Side effects: Creates an `ai_conversations` row for this tank (empty messages). Returns created tank with `id`.

**Action: `update`**

Request:
```json
{
  "action": "update",
  "tank_id": "uuid",
  "fields": {
    "name": "Updated Name",
    "volume_gallons": 45
  }
}
```

All fields optional. Same validation as `create`.

**Action: `delete`**

Request:
```json
{ "action": "delete", "tank_id": "uuid" }
```

Side effects: Sets `deleted_at = NOW()` (soft delete). Does NOT cascade immediately — tank and children accessible for 90 days. Returns `{ "deleted_at": "2026-02-07T..." }`.

**Action: `upload_photo`**

Request: `multipart/form-data` with `tank_id` and `photo` (JPEG/PNG, max 5 MB).

Side effects: Uploads to Supabase Storage `tank-photos/{user_id}/{tank_id}/{timestamp}.jpg`. Updates `tanks.photo_url`. Returns `{ "photo_url": "https://..." }`.

---

### 2.3 Water Parameters

#### `POST /functions/v1/water-parameters` — Parameter CRUD & Chart Data

**Action: `log`**

Request:
```json
{
  "action": "log",
  "tank_id": "uuid",
  "test_date": "2026-02-07T14:30:00Z",
  "ph": 7.2,
  "ammonia_ppm": 0.0,
  "nitrite_ppm": 0.0,
  "nitrate_ppm": 15.0,
  "temperature_f": 78.5,
  "gh_dgh": 8.0,
  "kh_dkh": 5.0,
  "notes": "After 25% water change"
}
```

Validation:
- `tank_id`: required, must be owned by user
- `test_date`: optional (defaults to NOW), not future
- `ph`: 4.0–10.0
- `ammonia_ppm`, `nitrite_ppm`: ≥ 0
- `nitrate_ppm`: ≥ 0
- `temperature_f`: 32–120
- `gh_dgh`, `kh_dkh`, `salinity_ppt`, `calcium_ppm`, `alkalinity_dkh`, `magnesium_ppm`, `phosphate_ppm`: all ≥ 0
- At least one parameter must be provided

Rate limit: 50 entries per day per tank.

Side effects: INSERT into `water_parameters`. Returns created row with `id`.

**Action: `list`**

Request:
```json
{
  "action": "list",
  "tank_id": "uuid",
  "days": 90,
  "limit": 100,
  "offset": 0
}
```

Response `data`:
```json
{
  "parameters": [ { "id": "...", "test_date": "...", "ph": 7.2, ... } ],
  "count": 45,
  "has_more": false
}
```

Query: `SELECT * FROM water_parameters WHERE tank_id = $1 AND user_id = auth.uid() AND test_date >= NOW() - INTERVAL '$days days' ORDER BY test_date DESC LIMIT $limit OFFSET $offset`.

**Action: `chart_data`**

Optimized endpoint for chart rendering — returns only the fields needed for visualization.

Request:
```json
{
  "action": "chart_data",
  "tank_id": "uuid",
  "parameters": ["ph", "ammonia_ppm", "nitrate_ppm", "temperature_f"],
  "days": 90
}
```

Response `data`:
```json
{
  "series": {
    "ph": [
      { "date": "2026-01-10T...", "value": 7.1 },
      { "date": "2026-01-17T...", "value": 7.2 }
    ],
    "ammonia_ppm": [ ... ],
    "nitrate_ppm": [ ... ],
    "temperature_f": [ ... ]
  },
  "ranges": {
    "ph": { "min": 6.8, "max": 7.6, "ideal_min": 7.0, "ideal_max": 7.4 },
    "ammonia_ppm": { "min": 0, "max": 0.25, "ideal_min": 0, "ideal_max": 0 }
  }
}
```

Performance target: < 2 seconds for 90 days of data across 4 parameters.

**Action: `delete`**

Request:
```json
{ "action": "delete", "parameter_id": "uuid" }
```

Hard delete. Returns `{ "deleted": true }`.

---

### 2.4 Species Database

#### `POST /functions/v1/species` — Search & Browse (Read-Only)

**Action: `search`**

Request:
```json
{
  "action": "search",
  "query": "neon tetra",
  "type": "freshwater",
  "care_level": "beginner",
  "limit": 20,
  "offset": 0
}
```

Response `data`:
```json
{
  "species": [
    {
      "id": "uuid",
      "common_name": "Neon Tetra",
      "scientific_name": "Paracheirodon innesi",
      "type": "freshwater",
      "care_level": "beginner",
      "min_tank_size_gallons": 10,
      "temp_min_f": 70.0,
      "temp_max_f": 81.0,
      "ph_min": 6.0,
      "ph_max": 7.0,
      "temperament": "peaceful",
      "diet": "omnivore",
      "max_adult_size_inches": 1.5,
      "lifespan_years": 5,
      "photo_url": "https://..."
    }
  ],
  "count": 1,
  "total": 1
}
```

Query: GIN index full-text search on `common_name` and `scientific_name`. Filterable by `type`, `care_level`, `temperament`. No auth required beyond valid JWT (species table is public read).

**Action: `get`**

Request:
```json
{ "action": "get", "species_id": "uuid" }
```

Response `data`: Full species object including `description` and `compatibility_notes`.

**Action: `check_compatibility`**

Request:
```json
{
  "action": "check_compatibility",
  "tank_id": "uuid",
  "species_id": "uuid"
}
```

Side effects: Queries current livestock for the tank, compares species parameters (temp range, pH range, temperament, tank size) against new species and existing stock. Invokes Claude Haiku 4.5 for nuanced compatibility assessment if basic checks pass. Logs result to `compatibility_checks` table.

Response `data`:
```json
{
  "result": "caution",
  "warnings": [
    {
      "type": "temperament",
      "severity": "moderate",
      "message": "Neon Tetras may be stressed by the semi-aggressive Tiger Barbs already in your tank."
    },
    {
      "type": "space",
      "severity": "low",
      "message": "Adding 6 Neon Tetras brings your estimated bioload to 85% capacity."
    }
  ],
  "recommendation": "Proceed with caution. Consider adding more hiding places and monitoring closely for the first week.",
  "ai_assessment": true
}
```

Tier check: Compatibility checking is available to all tiers, but AI-enhanced assessment (Claude Haiku call) is Starter+ only. Free tier gets rule-based checks only.

---

### 2.5 Livestock Management

#### `POST /functions/v1/livestock` — Livestock CRUD

**Action: `list`**

Request:
```json
{
  "action": "list",
  "tank_id": "uuid",
  "include_removed": false
}
```

Response `data`:
```json
{
  "livestock": [
    {
      "id": "uuid",
      "species_id": "uuid",
      "species": {
        "common_name": "Neon Tetra",
        "scientific_name": "Paracheirodon innesi",
        "photo_url": "https://..."
      },
      "custom_species_name": null,
      "quantity": 10,
      "nickname": "The School",
      "date_added": "2025-08-10",
      "date_removed": null,
      "notes": "Added from local fish store"
    }
  ],
  "active_count": 22,
  "total_species": 5
}
```

Query: `SELECT l.*, s.common_name, s.scientific_name, s.photo_url FROM livestock l LEFT JOIN species s ON l.species_id = s.id WHERE l.tank_id = $1 AND l.user_id = auth.uid()`. Filter by `date_removed IS NULL` unless `include_removed = true`.

**Action: `add`**

Request:
```json
{
  "action": "add",
  "tank_id": "uuid",
  "species_id": "uuid",
  "quantity": 6,
  "nickname": "New School",
  "date_added": "2026-02-07",
  "notes": "From online retailer"
}
```

OR for custom species:
```json
{
  "action": "add",
  "tank_id": "uuid",
  "custom_species_name": "Mystery Snail (Gold)",
  "quantity": 2,
  "date_added": "2026-02-07"
}
```

Validation:
- `tank_id`: required, must be owned by user
- One of `species_id` or `custom_species_name` required (not both)
- `quantity`: required, ≥ 1
- `date_added`: optional (defaults to today), not future

Side effects: INSERT into `livestock`. Returns created row with species join data.

**Action: `update`**

Request:
```json
{
  "action": "update",
  "livestock_id": "uuid",
  "fields": {
    "quantity": 8,
    "nickname": "Updated Name"
  }
}
```

**Action: `remove`**

Request:
```json
{
  "action": "remove",
  "livestock_id": "uuid",
  "removal_reason": "died",
  "removal_notes": "Found behind filter intake",
  "quantity_removed": 1
}
```

Side effects: If `quantity_removed < current quantity`, decrements `quantity`. If `quantity_removed >= current quantity`, sets `date_removed = CURRENT_DATE` and `removal_reason`. Does NOT hard-delete — retained for AI history context.

---

### 2.6 AI Chat

#### `POST /functions/v1/ai-chat` — AI Conversation

**Action: `send_message`**

This is the primary AI endpoint. Full orchestration details in Section 3.

Request:
```json
{
  "action": "send_message",
  "tank_id": "uuid",
  "message": "My ammonia levels spiked to 0.5 ppm after adding new fish last week. What should I do?"
}
```

Tier check: Query `ai_usage` for today's row. If `message_count >= daily_limit` → `429 DAILY_LIMIT_REACHED`:
```json
{
  "code": "DAILY_LIMIT_REACHED",
  "message": "You've used all 100 AI messages for today. Resets at midnight UTC.",
  "details": {
    "used": 100,
    "limit": 100,
    "resets_at": "2026-02-08T00:00:00Z",
    "current_tier": "starter"
  },
  "upgrade_url": "/pricing"
}
```

Response `data`:
```json
{
  "message": {
    "id": "msg_abc123",
    "role": "assistant",
    "content": "An ammonia spike after adding new fish is a common issue called \"new tank syndrome\"...\n\n**Immediate steps:**\n1. Perform a 25-30% water change now...",
    "timestamp": "2026-02-07T15:30:00Z",
    "actions": [
      {
        "id": "action_001",
        "type": "schedule_maintenance",
        "description": "Schedule 25% water change for today",
        "confirmation_required": true,
        "payload": {
          "task_type": "water_change",
          "title": "Emergency Water Change — Ammonia Spike",
          "due_date": "2026-02-07"
        }
      },
      {
        "id": "action_002",
        "type": "log_parameter",
        "description": "Log current ammonia reading of 0.5 ppm",
        "confirmation_required": true,
        "payload": {
          "ammonia_ppm": 0.5
        }
      }
    ]
  },
  "usage": {
    "input_tokens": 1850,
    "output_tokens": 620,
    "model": "claude-sonnet-4-5-20250929",
    "messages_used_today": 43,
    "messages_remaining": 157
  },
  "conversation_id": "uuid"
}
```

Performance target: First token < 1.5s, full response < 3s P95.

Side effects: Appends user message and assistant response to `ai_conversations.messages` JSONB. Increments `ai_conversations.message_count` and `total_tokens`. Upserts `ai_usage` row for today with incremented `message_count`, `input_tokens`, `output_tokens`.

**Action: `get_history`**

Request:
```json
{
  "action": "get_history",
  "tank_id": "uuid",
  "limit": 50,
  "before_message_id": "msg_xyz"
}
```

Response `data`:
```json
{
  "conversation_id": "uuid",
  "messages": [ { "id": "...", "role": "...", "content": "...", "timestamp": "...", "actions": [...] } ],
  "summary": "Previous conversation covered tank cycling, ammonia management...",
  "has_more": true,
  "total_messages": 142
}
```

**Action: `execute_action`**

User confirms a suggested action from the AI response.

Request:
```json
{
  "action": "execute_action",
  "conversation_id": "uuid",
  "message_id": "msg_abc123",
  "action_id": "action_001"
}
```

Side effects: Executes the action payload against the appropriate endpoint internally:
- `schedule_maintenance` → creates `maintenance_tasks` row
- `add_livestock` → creates `livestock` row
- `log_parameter` → creates `water_parameters` row

Updates the action status in the conversation JSONB from `"pending"` to `"completed"`. Returns the result of the executed action.

Response `data`:
```json
{
  "action_id": "action_001",
  "status": "completed",
  "result": {
    "task_id": "uuid",
    "title": "Emergency Water Change — Ammonia Spike",
    "next_due_date": "2026-02-07"
  }
}
```

**Action: `clear_history`**

Request:
```json
{
  "action": "clear_history",
  "tank_id": "uuid"
}
```

Side effects: Creates new `ai_conversations` row for this tank. Old conversation retained for 90 days.

---

### 2.7 Photo Diagnosis

#### `POST /functions/v1/photo-diagnosis` — Image Analysis

Tier check: Plus and Pro only. Free/Starter → `403 TIER_LIMIT_REACHED`.

Rate limit: Plus 10/day, Pro 30/day. Checked via `ai_usage` where `feature = 'diagnosis'`.

**Action: `diagnose`**

Request: `multipart/form-data`:
- `tank_id`: UUID (required)
- `photo`: JPEG/PNG file (required, max 10 MB)
- `diagnosis_type`: `'species_id'`, `'disease'`, or `'both'` (required)
- `symptoms`: text description (optional, for disease diagnosis)

Processing pipeline:
1. Upload photo to Supabase Storage `photo-diagnosis/{user_id}/{tank_id}/{timestamp}.jpg`
2. Resize to max 1024px on longest side (Edge Function using sharp or Deno image library)
3. Convert to base64 for Anthropic API
4. Send to Claude Sonnet 4.5 with vision capability (see Section 3 for prompt details)
5. Parse structured response
6. INSERT into `photo_diagnoses` table
7. Return result

Response `data`:
```json
{
  "id": "uuid",
  "diagnosis_type": "both",
  "species_identification": {
    "species_id": "uuid",
    "common_name": "Blue Tang",
    "scientific_name": "Paracanthurus hepatus",
    "confidence": "high",
    "match_source": "database"
  },
  "disease_diagnosis": {
    "diagnosis": "Ich (White Spot Disease)",
    "confidence": "high",
    "symptoms": ["white spots on body and fins", "flashing/rubbing against objects"],
    "severity": "moderate",
    "treatment_plan": {
      "immediate": "Raise temperature to 82°F gradually over 24 hours",
      "medication": "Ich-X or copper-based treatment per manufacturer dosing",
      "duration": "14 days minimum",
      "water_changes": "25% every other day during treatment",
      "notes": "Remove carbon filtration during medication. Treat entire tank, not just affected fish."
    }
  },
  "photo_url": "https://...",
  "created_at": "2026-02-07T15:30:00Z"
}
```

**Action: `history`**

Request:
```json
{
  "action": "history",
  "tank_id": "uuid",
  "limit": 20,
  "offset": 0
}
```

Response `data`: Array of past diagnosis objects with pagination.

---

### 2.8 Maintenance Scheduling

#### `POST /functions/v1/maintenance` — Tasks & Logs

**Action: `list_tasks`**

Request:
```json
{
  "action": "list_tasks",
  "tank_id": "uuid",
  "include_inactive": false
}
```

Response `data`:
```json
{
  "tasks": [
    {
      "id": "uuid",
      "tank_id": "uuid",
      "title": "Weekly Water Change",
      "type": "water_change",
      "description": "25% water change with dechlorinated water",
      "frequency": "weekly",
      "frequency_days": null,
      "next_due_date": "2026-02-10",
      "last_completed_date": "2026-02-03T10:00:00Z",
      "reminder_time": "09:00:00",
      "is_recurring": true,
      "is_active": true,
      "is_overdue": false
    }
  ],
  "overdue_count": 1,
  "due_today_count": 2
}
```

Tier check: Maintenance scheduling is Plus and Pro only.

**Action: `create_task`**

Request:
```json
{
  "action": "create_task",
  "tank_id": "uuid",
  "title": "Weekly Water Change",
  "type": "water_change",
  "description": "25% water change",
  "frequency": "weekly",
  "next_due_date": "2026-02-10",
  "reminder_time": "09:00:00",
  "is_recurring": true
}
```

Validation:
- `title`: required, 1–100 chars
- `type`: required, enum `['water_change', 'filter_clean', 'feeding', 'dosing', 'equipment_maintenance', 'water_testing', 'custom']`
- `frequency`: enum `['daily', 'every_X_days', 'weekly', 'biweekly', 'monthly']`
- `frequency_days`: required if frequency = `'every_X_days'`, 1–365
- `next_due_date`: required, valid date
- `reminder_time`: valid time string, defaults to `'09:00:00'`

**Action: `update_task`**

Request:
```json
{
  "action": "update_task",
  "task_id": "uuid",
  "fields": { "title": "Biweekly Water Change", "frequency": "biweekly" }
}
```

**Action: `complete_task`**

Request:
```json
{
  "action": "complete_task",
  "task_id": "uuid",
  "notes": "Changed 30% instead of 25% — nitrates were high"
}
```

Side effects:
1. INSERT into `maintenance_logs` with `completed_date = NOW()`
2. If `is_recurring = true`, trigger `advance_task_due_date()` to calculate next due date
3. Update `maintenance_tasks.last_completed_date`
4. Return next due date

Response `data`:
```json
{
  "log_id": "uuid",
  "completed_date": "2026-02-07T14:30:00Z",
  "next_due_date": "2026-02-14"
}
```

**Action: `delete_task`**

Request:
```json
{ "action": "delete_task", "task_id": "uuid" }
```

Side effects: Sets `is_active = false` (soft delete). Logs retained.

**Action: `list_logs`**

Request:
```json
{
  "action": "list_logs",
  "tank_id": "uuid",
  "limit": 50,
  "offset": 0
}
```

Response `data`: Array of maintenance log entries ordered by `completed_date DESC`.

---

### 2.9 Equipment Tracking

#### `POST /functions/v1/equipment` — Equipment CRUD

Tier check: Plus and Pro tiers for equipment tracking endpoints (add, list, update, delete). Web search recommendation endpoint (`search_recommendations`) is Pro tier only. Starter users → `403 TIER_LIMIT_REACHED`.

**Action: `list`**

Request:
```json
{
  "action": "list",
  "tank_id": "uuid"
}
```

Response `data`:
```json
{
  "equipment": [
    {
      "id": "uuid",
      "type": "filter",
      "custom_type": null,
      "brand": "Fluval",
      "model": "FX6",
      "purchase_date": "2024-06-15",
      "last_serviced_date": "2026-01-15",
      "settings": "Flow rate: max, media replaced Jan 2026",
      "expected_lifespan_months": 36,
      "default_lifespan": { "min": 3, "max": 6 },
      "age_months": 20,
      "health_status": "good",
      "replacement_window": null,
      "photo_url": "https://..."
    }
  ],
  "alerts": [
    {
      "equipment_id": "uuid",
      "type": "approaching_end_of_life",
      "message": "Your Aqueon Pro 150W heater is 30 months old (typical lifespan: 24–36 months). Consider planning a replacement."
    }
  ]
}
```

The `health_status` field is computed: `good` (< 75% of min lifespan), `aging` (75–100% of min lifespan), `replace_soon` (> min lifespan), `overdue` (> max lifespan).

**Action: `add`**

Request:
```json
{
  "action": "add",
  "tank_id": "uuid",
  "type": "heater",
  "brand": "Aqueon",
  "model": "Pro 150W",
  "purchase_date": "2023-08-01",
  "settings": "Set to 78°F",
  "expected_lifespan_months": 30
}
```

Validation:
- `type`: required, enum `['filter', 'heater', 'light', 'skimmer', 'powerhead', 'pump', 'controller', 'test_kit', 'other']`
- `custom_type`: required if type = `'other'`
- `purchase_date`: required, valid date, not future
- `expected_lifespan_months`: optional, > 0 (falls back to `equipment_lifespan_defaults`)

**Action: `update`**

Request:
```json
{
  "action": "update",
  "equipment_id": "uuid",
  "fields": { "last_serviced_date": "2026-02-07", "settings": "Media replaced" }
}
```

**Action: `delete`**

Request:
```json
{
  "action": "delete",
  "equipment_id": "uuid",
  "deletion_reason": "replaced"
}
```

Side effects: Sets `deleted_at = NOW()` and `deletion_reason`. Soft delete.

**Action: `search_recommendations`**

AI-powered equipment recommendation using Anthropic tool use + SerpAPI web search.

Request:
```json
{
  "action": "search_recommendations",
  "tank_id": "uuid",
  "equipment_type": "filter",
  "budget_max": 150
}
```

Response `data`:
```json
{
  "recommendations": [
    {
      "product_name": "Fluval 207",
      "brand": "Fluval",
      "price_range": "$90–$110",
      "rating": "4.7/5",
      "source_url": "https://...",
      "why_recommended": "Ideal flow rate for your 40-gallon planted tank. Quiet operation, easy media access.",
      "tank_compatibility": "excellent"
    }
  ],
  "search_context": "Based on your 40-gallon freshwater planted tank with current livestock of 22 fish."
}
```

Rate limit: Counted under `ai_usage` where `feature = 'search'`. Pro tier only.

---

### 2.10 Notifications & Push

#### `POST /functions/v1/notifications` — Preferences & Subscriptions

**Action: `get_preferences`**

Request:
```json
{ "action": "get_preferences" }
```

Response `data`: Full `notification_preferences` row.

**Action: `update_preferences`**

Request:
```json
{
  "action": "update_preferences",
  "fields": {
    "push_enabled": true,
    "reminder_timing": "1_hour_before",
    "quiet_hours_enabled": true,
    "quiet_hours_start": "22:00:00",
    "quiet_hours_end": "07:00:00"
  }
}
```

**Action: `register_push`**

Registers a Web Push subscription for the current device.

Request:
```json
{
  "action": "register_push",
  "subscription": {
    "endpoint": "https://fcm.googleapis.com/fcm/send/...",
    "keys": {
      "auth": "base64_auth_key",
      "p256dh": "base64_p256dh_key"
    }
  },
  "user_agent": "Mozilla/5.0..."
}
```

Side effects: UPSERT into `push_subscriptions` (unique on `endpoint`). Returns `{ "registered": true, "subscription_id": "uuid" }`.

**Action: `unregister_push`**

Request:
```json
{ "action": "unregister_push", "endpoint": "https://fcm.googleapis.com/fcm/send/..." }
```

Side effects: DELETE from `push_subscriptions` where `endpoint` matches and `user_id = auth.uid()`.

**Action: `send_test`**

Sends a test push notification to verify the subscription works.

Request:
```json
{ "action": "send_test" }
```

Side effects: Sends a push notification to all registered endpoints for the user. Returns count of successful deliveries.

---

### 2.11 Billing & Subscription

#### `POST /functions/v1/billing` — Stripe Integration

**Action: `get_subscription`**

Request:
```json
{ "action": "get_subscription" }
```

Response `data`:
```json
{
  "tier": "plus",
  "status": "active",
  "trial_active": false,
  "trial_end_date": null,
  "current_period_start": "2026-01-07T00:00:00Z",
  "current_period_end": "2026-02-07T00:00:00Z",
  "cancel_at_period_end": false,
  "stripe_customer_id": "cus_...",
  "usage_this_period": {
    "ai_messages": 843,
    "photo_diagnoses": 5,
    "equipment_searches": 3
  }
}
```

**Action: `create_checkout`**

Creates a Stripe Checkout session for new subscription or upgrade.

Request:
```json
{
  "action": "create_checkout",
  "tier": "plus",
  "success_url": "https://app.aquaticai.com/settings?checkout=success",
  "cancel_url": "https://app.aquaticai.com/pricing"
}
```

Side effects: Creates Stripe Checkout Session via Stripe API. If user has no `stripe_customer_id`, creates Stripe Customer first and saves to `users.stripe_customer_id`.

Response `data`:
```json
{
  "checkout_url": "https://checkout.stripe.com/c/pay/cs_...",
  "session_id": "cs_..."
}
```

Frontend redirects user to `checkout_url`.

**Action: `create_portal_session`**

Opens Stripe Customer Portal for subscription management (upgrade, downgrade, cancel, update payment method).

Request:
```json
{
  "action": "create_portal_session",
  "return_url": "https://app.aquaticai.com/settings"
}
```

Response `data`:
```json
{
  "portal_url": "https://billing.stripe.com/p/session/..."
}
```

**Action: `get_usage`**

Request:
```json
{
  "action": "get_usage",
  "days": 30
}
```

Response `data`:
```json
{
  "daily_usage": [
    {
      "date": "2026-02-07",
      "chat_messages": 15,
      "photo_diagnoses": 1,
      "input_tokens": 22500,
      "output_tokens": 8400,
      "estimated_cost": 0.0924
    }
  ],
  "totals": {
    "chat_messages": 843,
    "photo_diagnoses": 5,
    "total_tokens": 945000,
    "estimated_cost": 2.87
  }
}
```

---

### 2.12 Reports & Dashboards

#### `POST /functions/v1/reports` — Report Management

Tier check: Email reports and advanced dashboards are Pro only. Basic dashboard data available to all tiers.

**Action: `get_preferences`**

Request:
```json
{ "action": "get_preferences" }
```

Response `data`: `report_preferences` row.

**Action: `update_preferences`**

Request:
```json
{
  "action": "update_preferences",
  "fields": {
    "frequency": "weekly",
    "tank_ids": ["uuid1", "uuid2"],
    "delivery_time": "07:00:00",
    "enabled": true
  }
}
```

Tier check: Pro only.

**Action: `generate_now`**

Generates an on-demand report for the user's tanks.

Request:
```json
{
  "action": "generate_now",
  "tank_ids": ["uuid1", "uuid2"]
}
```

Side effects: Gathers last 7 days of data per tank (parameters, maintenance logs, livestock changes, AI conversation highlights). Sends to Claude Haiku 4.5 for narrative summary. Stores in `report_history`. Counts against `ai_usage` where `feature = 'report'`.

Response `data`:
```json
{
  "report_id": "uuid",
  "generated_at": "2026-02-07T15:30:00Z",
  "tanks": [
    {
      "tank_id": "uuid",
      "tank_name": "Reef Display",
      "summary": "Water parameters have been stable this week. Nitrates trending slightly upward (from 5 to 8 ppm) — consider a water change...",
      "parameter_trends": { "ph": "stable", "nitrate": "rising", "temperature": "stable" },
      "maintenance_compliance": { "completed": 3, "missed": 0, "upcoming": 2 },
      "livestock_changes": [],
      "recommendations": [ "Schedule a 15% water change to address rising nitrates" ]
    }
  ]
}
```

**Action: `get_history`**

Request:
```json
{
  "action": "get_history",
  "limit": 10,
  "offset": 0
}
```

Response `data`: Array of past report objects from `report_history`.

#### `POST /functions/v1/dashboard` — Dashboard Data

**Action: `overview`**

Returns aggregated data for the multi-tank dashboard view.

Request:
```json
{
  "action": "overview"
}
```

Response `data`:
```json
{
  "tanks": [
    {
      "id": "uuid",
      "name": "Reef Display",
      "type": "reef",
      "health_score": 92,
      "alerts": [
        { "type": "parameter", "severity": "warning", "message": "Nitrates rising — 8 ppm (target: < 5)" }
      ],
      "latest_params": { "ph": 8.2, "ammonia_ppm": 0, "temperature_f": 78 },
      "overdue_tasks": 0,
      "livestock_count": 12
    }
  ],
  "global_alerts": [
    { "tank_name": "Planted 40B", "message": "Filter maintenance overdue by 3 days" }
  ],
  "ai_usage_today": { "used": 42, "limit": 200 }
}
```

The `health_score` is computed from: parameter stability (40%), maintenance compliance (30%), no active alerts (20%), livestock stability (10%). Calculated in the Edge Function, not stored.

**Action: `tank_detail`**

Request:
```json
{
  "action": "tank_detail",
  "tank_id": "uuid",
  "days": 30
}
```

Response `data`: Deep tank data including parameter history, livestock list, maintenance schedule, equipment list, recent AI conversation highlights, and photo diagnosis history. Used for the single-tank detail dashboard.

---

## AI Orchestration Layer — Deep Detail

This section defines the complete AI pipeline: how every Anthropic API call is constructed, what context is injected, how tool use works, how tokens are managed, and how the system decides which model to use.

---

### 3.1 System Prompt Architecture

The system prompt is dynamically assembled per request. It consists of four layers concatenated in order:

```
┌─────────────────────────────────────────┐
│  Layer 1: PERSONA & RULES (static)      │  ~800 tokens
│  Layer 2: TANK CONTEXT (dynamic)        │  ~1,200–3,000 tokens
│  Layer 3: CONVERSATION SUMMARY (dynamic)│  ~200–500 tokens
│  Layer 4: AVAILABLE TOOLS (static)      │  ~600 tokens
└─────────────────────────────────────────┘
Total system prompt budget: ≤ 5,000 tokens
```

#### Layer 1: Persona & Rules (~800 tokens, static)

```
You are Aqua, an expert aquarium advisor built into the Aquatic AI platform. You provide personalized advice based on the user's actual tank data, livestock, parameters, and maintenance history.

PERSONALITY:
- Friendly, knowledgeable, and patient
- Adapt complexity to the user's skill level (provided below)
- Use markdown formatting for clarity: bold for emphasis, lists for steps, tables for comparisons
- When uncertain, say so honestly — never fabricate care advice
- Always reference the user's actual data when relevant (e.g., "Your pH of 7.2 is...")

RULES:
1. Never recommend medications without noting potential risks and suggesting veterinary consultation for severe cases
2. Never suggest actions that could harm fish — always err on the side of caution
3. When the user's parameters are dangerous (ammonia > 0.25 ppm, nitrite > 0.5 ppm), lead with urgency
4. If the user asks about a species not in their tank, still provide accurate information but note it's general advice
5. When suggesting actions (add livestock, schedule maintenance, log parameters), use the provided tool functions
6. Respect the user's unit preferences for temperature and volume
7. If conversation history includes a summary of prior topics, reference it naturally — don't repeat advice already given unless asked

SKILL LEVEL ADAPTATION:
- Beginner: Use simple language. Explain terms. Provide step-by-step instructions. Warn about common mistakes.
- Intermediate: Use standard aquarium terminology. Provide context for recommendations. Discuss trade-offs.
- Advanced: Use technical terminology freely. Discuss nuanced topics (trace elements, coral biochemistry, breeding triggers). Cite scientific rationale when relevant.
```

#### Layer 2: Tank Context (dynamic, ~1,200–3,000 tokens)

Assembled from database queries at request time. Cached in Edge Function memory for 5 minutes per tank, invalidated on any tank data write.

```
CURRENT TANK CONTEXT:
Tank: "{tank.name}" | Type: {tank.type} | Volume: {tank.volume_gallons} gal | Setup Date: {tank.setup_date}
Substrate: {tank.substrate} | Dimensions: {dimensions_length}" x {dimensions_width}" x {dimensions_height}"

USER PROFILE:
Skill Level: {user.skill_level}
Temperature Units: {user.unit_preference_temp}
Volume Units: {user.unit_preference_volume}

LATEST WATER PARAMETERS (tested {water_parameters.test_date}):
pH: {ph} | Ammonia: {ammonia_ppm} ppm | Nitrite: {nitrite_ppm} ppm | Nitrate: {nitrate_ppm} ppm
Temperature: {temperature_f}°F | GH: {gh_dgh} dGH | KH: {kh_dkh} dKH
[If saltwater/reef]: Salinity: {salinity_ppt} ppt | Calcium: {calcium_ppm} ppm | Alk: {alkalinity_dkh} dKH | Mag: {magnesium_ppm} ppm | Phosphate: {phosphate_ppm} ppm

CURRENT LIVESTOCK ({active_count} animals, {species_count} species):
- {quantity}x {common_name} ({scientific_name}) — added {date_added} [nickname: {nickname}]
- ... (all active livestock)

EQUIPMENT:
- {type}: {brand} {model} — purchased {purchase_date}, last serviced {last_serviced_date}, health: {health_status}
- ... (all active equipment)

RECENT MAINTENANCE (last 30 days):
- {completed_date}: {task_title} — {notes}
- ... (last 10 completed tasks)

UPCOMING MAINTENANCE:
- {next_due_date}: {task_title} [{"OVERDUE" if overdue}]
- ... (next 5 upcoming tasks)
```

**Context size management:**
- If livestock exceeds 30 entries, summarize: "32 animals across 8 species (full list available if needed)"
- If maintenance history exceeds 10 entries, truncate to most recent 10
- Equipment section omitted for Free/Starter/Plus users (not a feature for those tiers, except Pro)
- Reef-specific parameters only included for reef/saltwater tanks

#### Layer 3: Conversation Summary (dynamic, ~200–500 tokens)

Injected only when `ai_conversations.summary` is not null (i.e., after summarization has occurred).

```
CONVERSATION HISTORY SUMMARY:
{ai_conversations.summary}

Note: The above summarizes earlier conversation. The recent message history follows in the messages array.
```

#### Layer 4: Available Tools (static, ~600 tokens)

Defined using Anthropic's tool use format. See Section 3.3 for full tool schemas.

---

### 3.2 Context Injection Pipeline

The full request assembly pipeline executes in the Edge Function before calling the Anthropic API:

```
Step 1: AUTH (< 5ms)
  └─ Verify JWT, extract user_id

Step 2: PARALLEL DATA FETCH (< 150ms target)
  ├─ users → user profile, tier, skill_level, preferences
  ├─ tanks → tank profile for tank_id
  ├─ water_parameters → latest row for tank_id (ORDER BY test_date DESC LIMIT 1)
  ├─ livestock → active entries for tank_id (WHERE date_removed IS NULL)
  ├─ equipment → active entries for tank_id (WHERE deleted_at IS NULL) [Pro only]
  ├─ maintenance_tasks → upcoming + last 10 completed for tank_id
  ├─ ai_conversations → current conversation for (user_id, tank_id)
  └─ ai_usage → today's row for user_id WHERE feature = 'chat'

Step 3: TIER CHECK (< 5ms)
  └─ If ai_usage.message_count >= tier_limit → return 429 DAILY_LIMIT_REACHED

Step 4: ASSEMBLE SYSTEM PROMPT (< 10ms)
  └─ Concatenate Layer 1 + Layer 2 (from fetched data) + Layer 3 (if summary exists) + Layer 4

Step 5: ASSEMBLE MESSAGES ARRAY (< 10ms)
  ├─ If summary exists: include only last 50 messages from ai_conversations.messages
  ├─ If no summary: include all messages from ai_conversations.messages
  └─ Append new user message

Step 6: TOKEN COUNT ESTIMATE (< 5ms)
  └─ Estimate total tokens (system + messages + new message)
  └─ If estimate > 12,000 tokens → trigger summarization BEFORE API call (Step 6a)
      Step 6a: Call Claude Haiku 4.5 with summarization prompt (see 3.5)
      Step 6a result: New summary text, truncated message array

Step 7: MODEL SELECTION (< 5ms)
  └─ Route to Claude Sonnet 4.5 or Claude Haiku 4.5 based on rules (see 3.6)

Step 8: ANTHROPIC API CALL (< 2,500ms P95)
  └─ POST to Anthropic Messages API with assembled payload
  └─ Stream response for real-time token delivery (future P1; v1 uses non-streaming)

Step 9: RESPONSE PROCESSING (< 50ms)
  ├─ Parse assistant message content
  ├─ Extract any tool_use blocks → map to action objects
  ├─ Calculate token usage from API response
  └─ Build response envelope

Step 10: PERSIST (< 100ms, async)
  ├─ Append user message + assistant message to ai_conversations.messages JSONB
  ├─ Update ai_conversations.message_count, total_tokens, updated_at
  └─ UPSERT ai_usage: increment message_count, input_tokens, output_tokens

Step 11: RETURN RESPONSE
  └─ Return standard envelope with message, actions, usage data
```

**Total pipeline target: < 3,000ms P95** (dominated by Anthropic API call at ~2,500ms).

---

### 3.3 Anthropic Tool Use Schema

The AI is provided with tools via the Anthropic Messages API `tools` parameter. When the AI determines an action is appropriate, it responds with a `tool_use` content block. The Edge Function intercepts this, does NOT execute automatically — it translates the tool call into an `action` object returned to the frontend for user confirmation.

#### Tool Definitions

```json
{
  "tools": [
    {
      "name": "schedule_maintenance",
      "description": "Create a maintenance task for the user's tank. Use when the user asks to schedule a water change, filter cleaning, feeding routine, or any recurring or one-time tank maintenance activity.",
      "input_schema": {
        "type": "object",
        "properties": {
          "title": {
            "type": "string",
            "description": "Short title for the task, e.g. 'Weekly Water Change'"
          },
          "type": {
            "type": "string",
            "enum": ["water_change", "filter_clean", "feeding", "dosing", "equipment_maintenance", "water_testing", "custom"],
            "description": "Category of maintenance task"
          },
          "description": {
            "type": "string",
            "description": "Detailed description of what the task involves"
          },
          "due_date": {
            "type": "string",
            "format": "date",
            "description": "When the task should be done, in YYYY-MM-DD format"
          },
          "is_recurring": {
            "type": "boolean",
            "description": "Whether this task repeats on a schedule"
          },
          "frequency": {
            "type": "string",
            "enum": ["daily", "weekly", "biweekly", "monthly", "every_X_days"],
            "description": "How often the task repeats (only if is_recurring is true)"
          },
          "frequency_days": {
            "type": "integer",
            "description": "Custom interval in days (only if frequency is every_X_days)"
          }
        },
        "required": ["title", "type", "due_date"]
      }
    },
    {
      "name": "add_livestock",
      "description": "Add a species to the user's tank livestock list. Use when the user says they've added fish, corals, invertebrates, or other livestock, or when they want to record a new addition. Always run a compatibility assessment before confirming.",
      "input_schema": {
        "type": "object",
        "properties": {
          "species_name": {
            "type": "string",
            "description": "Common name of the species to add"
          },
          "scientific_name": {
            "type": "string",
            "description": "Scientific name if known"
          },
          "quantity": {
            "type": "integer",
            "description": "Number of individuals to add",
            "minimum": 1
          },
          "notes": {
            "type": "string",
            "description": "Any additional notes about the addition"
          }
        },
        "required": ["species_name", "quantity"]
      }
    },
    {
      "name": "log_parameter",
      "description": "Record a water test result for the user's tank. Use when the user reports specific water parameter values they've just tested.",
      "input_schema": {
        "type": "object",
        "properties": {
          "ph": { "type": "number", "description": "pH value (4.0–10.0)" },
          "ammonia_ppm": { "type": "number", "description": "Ammonia in ppm" },
          "nitrite_ppm": { "type": "number", "description": "Nitrite in ppm" },
          "nitrate_ppm": { "type": "number", "description": "Nitrate in ppm" },
          "temperature_f": { "type": "number", "description": "Temperature in Fahrenheit" },
          "gh_dgh": { "type": "number", "description": "General hardness in dGH" },
          "kh_dkh": { "type": "number", "description": "Carbonate hardness in dKH" },
          "salinity_ppt": { "type": "number", "description": "Salinity in ppt (saltwater only)" },
          "calcium_ppm": { "type": "number", "description": "Calcium in ppm (reef only)" },
          "alkalinity_dkh": { "type": "number", "description": "Alkalinity in dKH (reef only)" },
          "magnesium_ppm": { "type": "number", "description": "Magnesium in ppm (reef only)" },
          "phosphate_ppm": { "type": "number", "description": "Phosphate in ppm" },
          "notes": { "type": "string", "description": "User notes about the test" }
        },
        "required": []
      }
    },
    {
      "name": "remove_livestock",
      "description": "Record a livestock removal (death, rehoming, sale). Use when the user reports a fish has died, been rehomed, or removed from the tank.",
      "input_schema": {
        "type": "object",
        "properties": {
          "species_name": {
            "type": "string",
            "description": "Common name of the species to remove"
          },
          "quantity": {
            "type": "integer",
            "description": "Number removed",
            "minimum": 1
          },
          "reason": {
            "type": "string",
            "enum": ["died", "rehomed", "sold", "other"],
            "description": "Reason for removal"
          },
          "notes": {
            "type": "string",
            "description": "Additional details"
          }
        },
        "required": ["species_name", "quantity", "reason"]
      }
    }
  ]
}
```

#### Tool Use Flow

```
1. User: "Schedule a 25% water change for this Saturday"
2. AI responds with tool_use:
   {
     "type": "tool_use",
     "name": "schedule_maintenance",
     "input": {
       "title": "25% Water Change",
       "type": "water_change",
       "description": "Perform a 25% water change with dechlorinated, temperature-matched water",
       "due_date": "2026-02-08",
       "is_recurring": false
     }
   }
3. Edge Function intercepts → does NOT execute
4. Edge Function transforms to action object:
   {
     "id": "action_abc123",
     "type": "schedule_maintenance",
     "description": "Schedule 25% Water Change for Saturday, Feb 8",
     "confirmation_required": true,
     "payload": { ... tool input ... }
   }
5. Frontend renders action card with Confirm/Cancel buttons
6. User taps Confirm → POST /functions/v1/ai-chat { action: "execute_action", action_id: "..." }
7. Edge Function executes: INSERT into maintenance_tasks
8. Edge Function updates conversation: action.status = "completed"
9. Return confirmation to user
```

**Important**: The AI NEVER executes actions directly. All tool use results in confirmation prompts. This is enforced by the Edge Function — the Anthropic API `tool_result` is never sent back automatically. Instead, the assistant message is returned with `stop_reason: "tool_use"`, and the Edge Function maps the tool call to a user-facing action.

---

### 3.4 Token Management Strategy

#### Token Budget Per Request

| Component | Budget | Notes |
|-----------|--------|-------|
| System prompt (Layer 1–4) | ≤ 5,000 | Persona + context + tools |
| Conversation history | ≤ 6,000 | Recent messages + summary |
| User's new message | ≤ 1,000 | Typical user message ~50–200 tokens |
| **Total input** | **≤ 12,000** | Triggers summarization if exceeded |
| AI response output | ≤ 2,000 | `max_tokens` parameter |
| **Total per exchange** | **≤ 14,000** | Cost target: ~$0.003 per exchange |

#### Token Counting

Token estimation uses a simple heuristic in the Edge Function (not an exact tokenizer, which would add latency):

```
estimated_tokens = ceil(character_count / 3.5)
```

This over-estimates by ~10%, which is acceptable for budget management. Exact token counts come from the Anthropic API response (`usage.input_tokens`, `usage.output_tokens`) and are stored in `ai_usage`.

#### Cost Estimates (Anthropic Pricing)

| Model | Input | Output | Typical Exchange Cost |
|-------|-------|--------|----------------------|
| Claude Sonnet 4.5 | $3.00/M tokens | $15.00/M tokens | ~$0.066 |
| Claude Haiku 4.5 | $0.80/M tokens | $4.00/M tokens | ~$0.017 |

**Blended cost target**: $0.03/exchange average (assuming 50% Haiku routing — see 3.6).

**Monthly cost per user (at target engagement of 5 msgs/day)**:
- 150 messages/month × $0.03 = **$4.50/month**
- With Haiku routing optimization: ~$2.50/month

---

### 3.5 Summarization Strategy

When `ai_conversations.total_tokens > 8,000` (or when pre-request token estimate exceeds 12,000 input tokens), the system triggers automatic conversation summarization.

#### Summarization Prompt (sent to Claude Haiku 4.5)

```
Summarize the following aquarium conversation history into a concise summary. Preserve:
1. Key facts about the tank that were discussed (problems identified, diagnoses made)
2. Actions taken (livestock added/removed, maintenance scheduled, parameters logged)
3. Advice given that the user should remember (medication schedules, cycling progress, etc.)
4. Any unresolved issues or pending follow-ups

Do NOT include:
- Greetings or pleasantries
- Repeated information
- Generic advice that can be re-derived from tank context

Format as a brief paragraph, max 300 tokens.

CONVERSATION TO SUMMARIZE:
{older_messages_json}
```

#### Summarization Flow

```
1. Check: ai_conversations.total_tokens > 8,000?
2. If yes:
   a. Split messages: keep last 50 in messages array
   b. Take messages 1 through (N-50) as "older messages"
   c. Call Claude Haiku 4.5 with summarization prompt + older messages
   d. Store result in ai_conversations.summary
   e. Remove older messages from ai_conversations.messages JSONB
   f. Recalculate ai_conversations.total_tokens
   g. Log summarization in ai_usage (feature = 'chat', separate token tracking)
3. Continue with normal request pipeline
```

**Summarization cost**: ~500 input tokens + ~300 output tokens = ~$0.0016 per summarization (Haiku pricing). Occurs roughly every 40–60 messages per conversation.

**Edge case**: If a conversation is very long and summary + last 50 messages still exceed 12,000 tokens, the system will re-summarize (appending new summary to old summary, then compressing).

---

### 3.6 Model Routing Strategy

v1 uses a simple rule-based router. ML-based routing is a P2 consideration.

#### Routing Rules

| Condition | Model | Rationale |
|-----------|-------|-----------|
| Photo diagnosis request | Claude Sonnet 4.5 (vision) | Vision capability required |
| User message contains "emergency", "dying", "dead", "urgent", "help" | Claude Sonnet 4.5 | Complex reasoning needed for crisis situations |
| User message > 200 tokens | Claude Sonnet 4.5 | Long messages typically involve complex questions |
| Tool use in last assistant message (follow-up) | Claude Sonnet 4.5 | Maintain context quality for action sequences |
| User's skill_level = 'advanced' | Claude Sonnet 4.5 | Advanced users ask complex questions |
| Simple parameter lookup ("what's my pH?") | Claude Haiku 4.5 | Data retrieval, minimal reasoning |
| General care questions ("how often should I feed?") | Claude Haiku 4.5 | Standard knowledge, low complexity |
| Conversation summarization | Claude Haiku 4.5 | Summarization is routine |
| Report generation | Claude Haiku 4.5 | Structured output, template-driven |
| Default (no rule matched) | Claude Sonnet 4.5 | Err on the side of quality |

#### Routing Implementation

```
function selectModel(message, user, conversation):
  // Always Sonnet for vision
  if request.has_image:
    return "claude-sonnet-4-5-20250929"

  // Emergency keywords
  emergency_keywords = ["emergency", "dying", "dead", "urgent", "help", "sos", "critical"]
  if any(keyword in message.lower() for keyword in emergency_keywords):
    return "claude-sonnet-4-5-20250929"

  // Long messages → complex questions
  if estimate_tokens(message) > 200:
    return "claude-sonnet-4-5-20250929"

  // Active tool use sequence
  if conversation.last_message.has_tool_use:
    return "claude-sonnet-4-5-20250929"

  // Advanced users
  if user.skill_level == "advanced":
    return "claude-sonnet-4-5-20250929"

  // Simple lookups (regex patterns)
  simple_patterns = [
    r"what('s| is) my (ph|temperature|ammonia|nitrate|nitrite)",
    r"when('s| is) my next (water change|maintenance|task)",
    r"how many fish",
    r"list my (fish|livestock|equipment)"
  ]
  if any(pattern.match(message.lower()) for pattern in simple_patterns):
    return "claude-haiku-4-5-20251001"

  // Default: Sonnet for quality
  return "claude-sonnet-4-5-20250929"
```

**Target routing split**: 30–40% Haiku, 60–70% Sonnet. Monitored via `ai_usage` table — model field added to usage tracking.

---

### 3.7 Photo Diagnosis AI Pipeline

Photo diagnosis uses Claude Sonnet 4.5's vision capability via a separate, specialized prompt.

#### Vision Request Assembly

```json
{
  "model": "claude-sonnet-4-5-20250929",
  "max_tokens": 1500,
  "system": "You are an expert aquatic veterinarian and fish identification specialist...",
  "messages": [
    {
      "role": "user",
      "content": [
        {
          "type": "image",
          "source": {
            "type": "base64",
            "media_type": "image/jpeg",
            "data": "{base64_encoded_image}"
          }
        },
        {
          "type": "text",
          "text": "{diagnosis_prompt}"
        }
      ]
    }
  ]
}
```

#### Diagnosis System Prompt

```
You are an expert aquatic veterinarian and marine biologist specializing in ornamental fish identification and disease diagnosis. Analyze the provided image carefully.

TANK CONTEXT:
Type: {tank.type} | Volume: {tank.volume_gallons} gal
Current Livestock: {livestock_summary}
Latest Parameters: pH {ph}, Temp {temperature_f}°F, Ammonia {ammonia_ppm} ppm

DIAGNOSIS TYPE: {diagnosis_type}

If SPECIES IDENTIFICATION:
- Identify the species in the image
- Provide common name, scientific name, and confidence level (high/medium/low)
- Note any distinguishing features you used for identification
- If multiple possible species, list top 3 with confidence for each

If DISEASE DIAGNOSIS:
- Identify visible symptoms
- Provide likely diagnosis with confidence level
- Rate severity: minor, moderate, severe
- Provide treatment plan with:
  - Immediate actions
  - Medication recommendations (name, dosing, duration)
  - Water change protocol during treatment
  - Monitoring instructions
  - When to escalate to a veterinarian

RESPONSE FORMAT (JSON):
{
  "species_identification": {
    "common_name": "...",
    "scientific_name": "...",
    "confidence": "high|medium|low",
    "distinguishing_features": "...",
    "alternatives": [...]
  },
  "disease_diagnosis": {
    "diagnosis": "...",
    "confidence": "high|medium|low",
    "symptoms_observed": [...],
    "severity": "minor|moderate|severe",
    "treatment_plan": {
      "immediate": "...",
      "medication": "...",
      "duration": "...",
      "water_changes": "...",
      "monitoring": "...",
      "escalation_criteria": "..."
    }
  }
}
```

**User-reported symptoms** (if provided) are appended to the text portion of the message:
```
The user reports these additional symptoms: {symptoms}
```

---

### 3.8 Anthropic API Call Configuration

All calls to the Anthropic API use these shared settings:

```json
{
  "model": "{selected_model}",
  "max_tokens": 2000,
  "temperature": 0.7,
  "top_p": 0.95,
  "stop_sequences": [],
  "metadata": {
    "user_id": "{user_id}"
  }
}
```

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| `temperature` | 0.7 | Balance between creativity and consistency for care advice |
| `top_p` | 0.95 | Slight nucleus sampling for natural language variety |
| `max_tokens` | 2000 | Sufficient for detailed responses; prevents runaway generation |
| `metadata.user_id` | User UUID | Required for Anthropic's abuse monitoring and rate limiting |

**Exception**: Photo diagnosis uses `temperature: 0.3` for more deterministic identification results.

**Exception**: Summarization uses `max_tokens: 500` to keep summaries concise.

---

## External Service Integration Contracts

### 4.1 Anthropic API

**Service**: Anthropic Messages API
**Base URL**: `https://api.anthropic.com/v1/messages`
**Authentication**: `x-api-key: {ANTHROPIC_API_KEY}` header (stored in Supabase Vault, accessed by Edge Functions via `Deno.env.get()`)
**API Version Header**: `anthropic-version: 2023-06-01`

#### Request Contract

```json
POST https://api.anthropic.com/v1/messages
Headers:
  x-api-key: {ANTHROPIC_API_KEY}
  anthropic-version: 2023-06-01
  content-type: application/json

Body:
{
  "model": "claude-sonnet-4-5-20250929",
  "max_tokens": 2000,
  "temperature": 0.7,
  "system": "{assembled_system_prompt}",
  "messages": [
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." },
    { "role": "user", "content": "{new_message}" }
  ],
  "tools": [ ... ],
  "metadata": { "user_id": "{user_uuid}" }
}
```

#### Response Contract

```json
{
  "id": "msg_...",
  "type": "message",
  "role": "assistant",
  "content": [
    { "type": "text", "text": "Markdown response..." },
    { "type": "tool_use", "id": "toolu_...", "name": "schedule_maintenance", "input": { ... } }
  ],
  "model": "claude-sonnet-4-5-20250929",
  "stop_reason": "end_turn" | "tool_use" | "max_tokens",
  "usage": {
    "input_tokens": 1850,
    "output_tokens": 620
  }
}
```

#### Error Responses from Anthropic

| HTTP Code | Error Type | Our Handling |
|-----------|-----------|-------------|
| 400 | `invalid_request_error` | Log error, return `INTERNAL_ERROR` to user with generic message |
| 401 | `authentication_error` | Alert ops team immediately, return `AI_UNAVAILABLE` |
| 403 | `permission_error` | Alert ops team, return `AI_UNAVAILABLE` |
| 429 | `rate_limit_error` | Retry with exponential backoff (max 3 attempts), then `AI_UNAVAILABLE` |
| 500 | `api_error` | Retry once after 1s, then `AI_UNAVAILABLE` |
| 529 | `overloaded_error` | Retry with backoff, then `AI_UNAVAILABLE` with "AI is busy, please try again" |

#### Rate Limits (Anthropic Side)

Anthropic enforces per-organization rate limits. At launch scale (< 10K users):
- RPM (requests per minute): 1,000 (Tier 2)
- TPM (tokens per minute): 80,000 (Tier 2)
- TPD (tokens per day): 2,500,000 (Tier 2)

**Monitoring**: Track via response headers `x-ratelimit-*`. If approaching 80% of any limit, activate request queuing in the Edge Function.

---

### 4.2 Stripe API

**Service**: Stripe Payment Processing
**Base URL**: `https://api.stripe.com/v1`
**Authentication**: `Authorization: Bearer {STRIPE_SECRET_KEY}` (Supabase Vault)
**Client Library**: Stripe Deno SDK (`stripe@latest` for Deno runtime)

#### Checkout Session Creation

```
POST https://api.stripe.com/v1/checkout/sessions

Body:
  customer: {stripe_customer_id}          // Created on first interaction
  mode: "subscription"
  line_items[0][price]: {price_id}        // Stripe Price ID per tier
  success_url: {success_url}?session_id={CHECKOUT_SESSION_ID}
  cancel_url: {cancel_url}
  subscription_data[trial_period_days]: 14  // Only for new customers
  allow_promotion_codes: true
  billing_address_collection: "auto"
  customer_update[address]: "auto"
```

#### Stripe Price IDs (Environment Variables)

| Tier | Monthly Price ID | Annual Price ID (P2) |
|------|-----------------|---------------------|
| Starter ($3.99/mo) | `STRIPE_PRICE_STARTER_MONTHLY` | — |
| Plus ($7.99/mo) | `STRIPE_PRICE_PLUS_MONTHLY` | — |
| Pro ($14.99/mo) | `STRIPE_PRICE_PRO_MONTHLY` | — |

#### Customer Portal Session

```
POST https://api.stripe.com/v1/billing_portal/sessions

Body:
  customer: {stripe_customer_id}
  return_url: {return_url}
```

Portal configured to allow: subscription upgrades/downgrades, cancellation, payment method update.

#### Stripe Customer Creation (First Interaction)

```
POST https://api.stripe.com/v1/customers

Body:
  email: {user.email}
  metadata[user_id]: {user.id}
  metadata[environment]: "production"
```

Side effect: Updates `users.stripe_customer_id` in database.

---

### 4.3 Supabase Auth

**Service**: Supabase GoTrue (Auth)
**Authentication**: Managed by Supabase client library; JWT issued on login

#### Authentication Methods

Aquatic AI supports three authentication methods via Supabase Auth:

**Method 1: Email/Password**
```
1. Signup: supabase.auth.signUp({ email, password, options: { emailRedirectTo } })
2. Supabase sends verification email → user clicks link → verified
3. Login: supabase.auth.signInWithPassword({ email, password })
4. Returns JWT on success
5. Password reset: supabase.auth.resetPasswordForEmail(email, { redirectTo })
```

**Method 2: Google OAuth**
```
1. supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo, queryParams: { access_type: 'offline', prompt: 'consent' } } })
2. User redirected to Google consent screen
3. On authorization → redirected to /auth/callback with auth code
4. Supabase exchanges code for tokens, creates/links user
5. JWT issued, user redirected to app
```

**Method 3: Magic Link**
```
1. supabase.auth.signInWithOtp({ email, options: { emailRedirectTo } })
2. Supabase sends magic link email (expires in 15 minutes)
3. User clicks link → redirected to app with auth tokens
4. JWT stored in browser; included in all subsequent API calls
```

**Account Linking**: If a user signs up with one method and later authenticates with another using the same email, accounts are automatically linked by Supabase Auth.

#### JWT Token Details

- **Issuer**: Supabase project
- **Expiry**: 1 hour (configurable in Supabase dashboard)
- **Refresh token**: 30-day expiry
- **Claims**: `sub` (user UUID), `email`, `role` (always `authenticated`)
- **RLS integration**: `auth.uid()` in PostgreSQL resolves to `sub` claim from JWT

#### New User Registration Flow

```
1. Any auth method (email/password, Google OAuth, or magic link) creates auth.users record
2. Supabase Auth trigger fires → creates public.users record:
   INSERT INTO users (id, email, display_name, avatar_url, subscription_tier, trial_end_date)
   VALUES (
     NEW.id,
     NEW.email,
     COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
     NEW.raw_user_meta_data->>'avatar_url',
     'free',
     NOW() + INTERVAL '14 days'
   )
3. Google OAuth auto-populates display_name and avatar_url from Google profile
4. Email/password and magic link use email username as default display_name
5. Frontend detects onboarding_completed = false → redirects to onboarding flow
```

#### Session Management

| Event | Handling |
|-------|---------|
| JWT expired (1 hour) | Auto-refresh via Supabase client; transparent to user |
| Refresh token expired (30 days) | Redirect to login |
| User signs out | `supabase.auth.signOut()` → clears local tokens, redirect to login |
| Multiple tabs/devices | All share same session via Supabase Realtime auth sync |

---

### 4.4 Web Push API

**Service**: W3C Push API / Web Push Protocol (RFC 8030)
**Authentication**: VAPID (Voluntary Application Server Identification) keys
**Library**: `web-push` npm package (Deno-compatible fork) in Edge Functions

#### VAPID Key Configuration

```
VAPID_PUBLIC_KEY: {base64url_encoded_public_key}   // Shared with frontend for subscription
VAPID_PRIVATE_KEY: {base64url_encoded_private_key} // Edge Function only (Supabase Vault)
VAPID_SUBJECT: "mailto:support@aquaticai.com"
```

#### Push Subscription Flow (Frontend)

```javascript
// 1. Request permission
const permission = await Notification.requestPermission();
if (permission !== 'granted') return;

// 2. Register service worker
const registration = await navigator.serviceWorker.register('/sw.js');

// 3. Subscribe to push
const subscription = await registration.pushManager.subscribe({
  userVisibleOnly: true,
  applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
});

// 4. Send subscription to backend
await fetch('/functions/v1/notifications', {
  method: 'POST',
  body: JSON.stringify({
    action: 'register_push',
    subscription: subscription.toJSON(),
    user_agent: navigator.userAgent
  })
});
```

#### Sending Push Notifications (Edge Function)

```javascript
import webPush from 'web-push';

webPush.setVapidDetails(
  VAPID_SUBJECT,
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

// Fetch user's push subscriptions
const { data: subscriptions } = await supabase
  .from('push_subscriptions')
  .select('endpoint, auth_key, p256dh_key')
  .eq('user_id', userId);

// Send to each device
for (const sub of subscriptions) {
  try {
    await webPush.sendNotification(
      {
        endpoint: sub.endpoint,
        keys: { auth: sub.auth_key, p256dh: sub.p256dh_key }
      },
      JSON.stringify({
        title: 'Maintenance Reminder',
        body: 'Weekly Water Change is due today for Reef Display',
        icon: '/icons/icon-192.png',
        badge: '/icons/badge-72.png',
        data: {
          url: '/tanks/{tank_id}/maintenance',
          tank_id: '{tank_id}',
          task_id: '{task_id}'
        }
      }),
      { TTL: 86400 }  // 24-hour expiry
    );
  } catch (err) {
    if (err.statusCode === 410) {
      // Subscription expired — remove from database
      await supabase.from('push_subscriptions')
        .delete().eq('endpoint', sub.endpoint);
    }
  }
}
```

#### Push Notification Types

| Type | Trigger | Payload |
|------|---------|---------|
| Maintenance reminder | Cron: 15-min check against `maintenance_tasks.next_due_date` | Task title, tank name, due date |
| Parameter alert | AI analysis detects concerning trend | Parameter name, value, recommendation |
| Equipment end-of-life | Cron: daily check against lifespan | Equipment name, age, replacement suggestion |
| Trial expiring | Cron: 3 days and 1 day before `trial_end_date` | Days remaining, upgrade CTA |
| Payment failed | Stripe webhook `invoice.payment_failed` | Update payment method CTA |
| Report ready | Cron: after report generation | Report summary, view link |

---

### 4.5 Resend (Transactional Email)

**Service**: Resend Email API
**Base URL**: `https://api.resend.com`
**Authentication**: `Authorization: Bearer {RESEND_API_KEY}` (stored in Supabase Vault)
**Client Library**: Resend SDK for Deno/Node (`resend@latest`)

#### Use Cases

Resend handles all transactional email needs beyond Supabase Auth's built-in magic link emails:

| Email Type | Trigger | Template |
|------------|---------|----------|
| Daily/Weekly Report | Cron job for Pro users | Tank health summary with parameter trends, maintenance compliance, recommendations |
| Trial Expiring (3 days) | Cron: 3 days before `trial_end_date` | Upgrade CTA, feature highlights |
| Trial Expiring (1 day) | Cron: 1 day before `trial_end_date` | Urgent upgrade CTA |
| Payment Failed | Stripe webhook `invoice.payment_failed` | Update payment method link |
| Welcome Email | After onboarding completion | Getting started tips, feature overview |
| Subscription Confirmed | Stripe webhook `checkout.session.completed` | Receipt, tier benefits, next steps |

#### Request Contract

```javascript
import { Resend } from 'resend';

const resend = new Resend(RESEND_API_KEY);

// Send email report
const { data, error } = await resend.emails.send({
  from: 'Aquatic AI <reports@aquaticai.com>',
  to: user.email,
  subject: `Weekly Tank Report — ${tank.name}`,
  react: EmailReportTemplate({ tanks, report }),  // React Email template
  headers: {
    'X-Entity-Ref-ID': `report_${report.id}`,  // Idempotency key
  },
});
```

#### Response Contract

```json
{
  "id": "email_abc123...",
  "from": "reports@aquaticai.com",
  "to": ["user@example.com"],
  "created_at": "2026-02-07T10:00:00.000Z"
}
```

#### Email Templates (React Email)

All email templates are built with React Email for maintainability and consistent styling:

```
/supabase/functions/_shared/email-templates/
├── WeeklyReportEmail.tsx
├── TrialExpiringEmail.tsx
├── PaymentFailedEmail.tsx
├── WelcomeEmail.tsx
└── SubscriptionConfirmedEmail.tsx
```

#### Error Handling

| HTTP Code | Error Type | Our Handling |
|-----------|-----------|-------------|
| 400 | `validation_error` | Log error, do not retry (template/payload issue) |
| 401 | `authentication_error` | Alert ops team, emails queued for retry |
| 429 | `rate_limit_error` | Exponential backoff, max 3 retries |
| 500 | `server_error` | Retry after 5s, max 3 attempts |

#### Rate Limits

| Tier | Daily Limit | Burst Rate |
|------|-------------|------------|
| Free (Resend) | 100 emails/day | 1 req/sec |
| Pro (Resend) | 50,000 emails/month | 10 req/sec |

**Monitoring**: Track via Resend Dashboard → Logs. Alert if delivery rate drops below 95%.

#### Environment Variables

```
RESEND_API_KEY=re_...              # From Resend Dashboard → API Keys
RESEND_FROM_ADDRESS=reports@aquaticai.com
RESEND_REPLY_TO=support@aquaticai.com
```

#### Domain Configuration

1. Add domain `aquaticai.com` in Resend Dashboard → Domains
2. Configure DNS records (DKIM, SPF, DMARC) per Resend instructions
3. Verify domain before sending production emails
4. Use subdomain for transactional emails: `reports@aquaticai.com` or `noreply@aquaticai.com`

---

### 4.6 Sentry (Error Monitoring & Performance)

**Service**: Sentry Error Tracking & Performance Monitoring
**Base URL**: `https://sentry.io` (SaaS) or `https://{org}.sentry.io`
**Authentication**: DSN (Data Source Name) contains auth credentials
**Client Libraries**:
- Frontend: `@sentry/nextjs` for Next.js integration
- Edge Functions: `@sentry/deno` for Supabase Edge Functions

#### Integration Points

| Layer | SDK | What's Captured |
|-------|-----|-----------------|
| Next.js Frontend | `@sentry/nextjs` | React errors, route changes, Web Vitals, user sessions |
| API Routes | `@sentry/nextjs` | Server-side errors, API latency, failed requests |
| Edge Functions | `@sentry/deno` | Function errors, Anthropic/Stripe failures, timeout issues |

#### Frontend Configuration (Next.js)

```javascript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,

  // Performance monitoring
  tracesSampleRate: 0.1,  // 10% of transactions for performance

  // Session replay for debugging (Pro tier feature)
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,  // Capture 100% of sessions with errors

  // Filter out noise
  ignoreErrors: [
    'ResizeObserver loop limit exceeded',
    'Non-Error promise rejection',
  ],

  // User context
  beforeSend(event) {
    // Don't send PII to Sentry
    if (event.user) {
      delete event.user.email;
      delete event.user.ip_address;
    }
    return event;
  },
});
```

#### Edge Function Configuration (Supabase)

```typescript
// supabase/functions/_shared/sentry.ts
import * as Sentry from '@sentry/deno';

Sentry.init({
  dsn: Deno.env.get('SENTRY_DSN'),
  environment: Deno.env.get('ENVIRONMENT') || 'development',
  tracesSampleRate: 0.2,  // 20% of Edge Function calls
});

// Wrapper for Edge Functions
export function withSentry(handler: (req: Request) => Promise<Response>) {
  return async (req: Request): Promise<Response> => {
    try {
      return await handler(req);
    } catch (error) {
      Sentry.captureException(error, {
        extra: {
          url: req.url,
          method: req.method,
        },
      });
      throw error;
    }
  };
}
```

#### Error Context Enrichment

Add context to errors for faster debugging:

```typescript
// Set user context on auth
Sentry.setUser({
  id: user.id,
  subscription_tier: user.subscription_tier,
});

// Add breadcrumbs for AI chat flow
Sentry.addBreadcrumb({
  category: 'ai',
  message: 'Anthropic API called',
  level: 'info',
  data: {
    model: 'claude-sonnet-4-5-20250929',
    tank_id: tankId,
    input_tokens: usage.input_tokens,
  },
});

// Tag errors for filtering
Sentry.setTag('feature', 'photo_diagnosis');
Sentry.setTag('tank_type', tank.type);
```

#### Performance Monitoring

Track critical user journeys:

```typescript
// AI Chat response time
const transaction = Sentry.startTransaction({
  name: 'ai.chat.send_message',
  op: 'ai.request',
});

const span = transaction.startChild({
  op: 'anthropic.api',
  description: 'Claude API call',
});

// ... API call ...

span.finish();
transaction.finish();
```

#### Alert Configuration (Sentry Dashboard)

| Alert | Condition | Action |
|-------|-----------|--------|
| Error spike | > 10 errors/min (same issue) | Slack notification + PagerDuty |
| AI unavailable | `AI_UNAVAILABLE` error > 5 in 5 min | Slack notification (urgent) |
| Stripe webhook failure | `stripe-webhook` function error | Slack notification |
| High latency | P95 > 5s for `ai-chat` endpoint | Slack notification |
| New issue in production | Any new error type | Email digest |

#### Environment Variables

```
# Frontend (public)
NEXT_PUBLIC_SENTRY_DSN=https://abc123@o123456.ingest.sentry.io/456789

# Backend (secret)
SENTRY_DSN=https://abc123@o123456.ingest.sentry.io/456789
SENTRY_AUTH_TOKEN=sntrys_...  # For source map uploads

# Sentry project config
SENTRY_ORG=aquatic-ai
SENTRY_PROJECT=aquatic-ai-web
```

#### Source Maps (Production Debugging)

Configure automatic source map upload in `next.config.js`:

```javascript
const { withSentryConfig } = require('@sentry/nextjs');

module.exports = withSentryConfig(nextConfig, {
  org: 'aquatic-ai',
  project: 'aquatic-ai-web',
  silent: true,
  hideSourceMaps: true,  // Don't expose maps publicly
});
```

#### Error Handling Flow

```
┌─────────────────────────────────────────────────────────┐
│  Error occurs in frontend/backend                        │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│  Sentry SDK captures error with context                  │
│  - Stack trace                                          │
│  - User ID (anonymized)                                 │
│  - Breadcrumbs (recent actions)                         │
│  - Tags (feature, tier, tank_type)                      │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│  Sentry Dashboard                                        │
│  - Groups similar errors                                │
│  - Assigns to team members                              │
│  - Tracks regression/resolution                         │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│  Alerts sent to Slack/PagerDuty if thresholds exceeded   │
└─────────────────────────────────────────────────────────┘
```

#### Privacy Considerations

- **No PII in error reports**: Email, IP addresses stripped before sending
- **User ID only**: Allows correlating errors without exposing identity
- **Subscription tier included**: Helps prioritize Pro user issues
- **Data retention**: 90 days (configurable in Sentry settings)

---

## Webhook Handlers

### 5.1 Stripe Webhooks

#### Endpoint: `POST /functions/v1/stripe-webhook`

**Authentication**: Stripe signature verification (NO JWT required).

```javascript
import Stripe from 'stripe';
const stripe = new Stripe(STRIPE_SECRET_KEY);

// Verify webhook signature
const sig = request.headers.get('stripe-signature');
const event = stripe.webhooks.constructEvent(
  await request.text(),  // raw body
  sig,
  STRIPE_WEBHOOK_SECRET
);
```

**Webhook Signing Secret**: `STRIPE_WEBHOOK_SECRET` stored in Supabase Vault. Registered in Stripe Dashboard → Webhooks.

#### Event Handlers

**`checkout.session.completed`**

Fired when a user completes Stripe Checkout.

```
Handler:
1. Extract customer_id and subscription_id from event
2. Retrieve subscription details from Stripe API
3. Map Stripe Price ID → tier name (starter/plus/pro)
4. UPSERT subscriptions table:
   INSERT INTO subscriptions (user_id, stripe_subscription_id, tier, status, current_period_start, current_period_end)
   VALUES (...) ON CONFLICT (user_id) DO UPDATE ...
5. UPDATE users SET subscription_tier = {tier} WHERE stripe_customer_id = {customer_id}
6. Log event for audit
```

**`customer.subscription.updated`**

Fired on plan changes (upgrade/downgrade), renewal, trial end.

```
Handler:
1. Extract subscription object from event
2. Map new Price ID → tier name
3. UPDATE subscriptions: tier, status, current_period_start, current_period_end, cancel_at_period_end
4. UPDATE users SET subscription_tier = {new_tier}
5. If downgrade: check if user now exceeds tank limit
   - If tanks > new_limit: do NOT delete tanks, but flag for next login prompt
6. Log event
```

**`customer.subscription.deleted`**

Fired when subscription is fully canceled (after period end if `cancel_at_period_end` was true).

```
Handler:
1. UPDATE subscriptions SET status = 'canceled'
2. UPDATE users SET subscription_tier = 'free'
3. Send push notification: "Your subscription has ended. You're now on the Free plan."
4. Log event
```

**`invoice.payment_succeeded`**

Fired on successful recurring payment.

```
Handler:
1. UPDATE subscriptions SET current_period_end = {new_period_end}, status = 'active'
2. If status was 'past_due', clear past_due state
3. Log event
```

**`invoice.payment_failed`**

Fired when payment attempt fails.

```
Handler:
1. UPDATE subscriptions SET status = 'past_due'
2. Send push notification: "Your payment failed. Update your payment method to keep your {tier} features."
3. Send email notification (via Supabase Edge Function → SMTP)
4. Log event
5. Stripe automatically retries (Smart Retries) — up to 4 attempts over ~3 weeks
```

**`customer.subscription.trial_will_end`**

Fired 3 days before trial expires.

```
Handler:
1. Send push notification: "Your free trial ends in 3 days. Subscribe to keep your features."
2. Send email with comparison of plans
3. Log event
```

#### Webhook Idempotency

All webhook handlers are idempotent — processing the same event twice produces the same result:

- Use `event.id` as idempotency key
- Before processing, check: `SELECT 1 FROM webhook_events WHERE stripe_event_id = $1`
- If exists, return 200 immediately (already processed)
- If not, process and INSERT into `webhook_events` table
- `webhook_events` table: `id`, `stripe_event_id` (UNIQUE), `event_type`, `processed_at`, `payload` (JSONB for audit)

#### Webhook Response

Always return `200 OK` within 5 seconds, even if processing is async. Stripe retries on non-2xx responses with exponential backoff for up to 3 days.

```json
{ "received": true }
```

---

## Failure Handling & Resilience

### 6.1 Retry Policies

| Service | Strategy | Max Retries | Backoff | Timeout |
|---------|----------|-------------|---------|---------|
| Anthropic API | Exponential backoff | 3 | 1s, 2s, 4s | 30s per attempt |
| Stripe API | Exponential backoff | 2 | 500ms, 1s | 10s per attempt |
| Supabase DB | Immediate retry | 1 | 0ms | 5s per query |
| Web Push | Fire-and-forget | 0 | — | 5s |
| Supabase Storage | Exponential backoff | 2 | 500ms, 1s | 15s per upload |

#### Anthropic API Retry Logic

```
attempt = 0
max_attempts = 3
base_delay = 1000  // ms

while attempt < max_attempts:
  try:
    response = await fetch(anthropic_url, { signal: AbortSignal.timeout(30000) })

    if response.status == 200:
      return parse(response)

    if response.status == 429:  // Rate limited
      retry_after = response.headers.get('retry-after') ?? base_delay * (2 ^ attempt)
      await sleep(retry_after)
      attempt++
      continue

    if response.status >= 500:  // Server error
      await sleep(base_delay * (2 ^ attempt))
      attempt++
      continue

    // 4xx (except 429): don't retry
    return error_response(response)

  catch TimeoutError:
    attempt++
    if attempt < max_attempts:
      await sleep(base_delay * (2 ^ attempt))
    continue

// All retries exhausted
return { error: "AI_UNAVAILABLE", message: "Our AI assistant is temporarily unavailable. Please try again in a moment." }
```

### 6.2 Circuit Breaker Pattern

Applied to the Anthropic API integration to prevent cascading failures.

```
State machine:
  CLOSED (normal) → OPEN (after 5 failures in 60s) → HALF_OPEN (after 30s cooldown)

CLOSED:
  - All requests pass through normally
  - Track failure count in KV store (Deno.env or Supabase table)
  - If failures >= 5 in rolling 60s window → transition to OPEN

OPEN:
  - All AI requests immediately return AI_UNAVAILABLE
  - No calls made to Anthropic API
  - After 30s cooldown → transition to HALF_OPEN

HALF_OPEN:
  - Allow 1 test request through
  - If success → transition to CLOSED, reset failure counter
  - If failure → transition back to OPEN, restart 30s cooldown
```

**Implementation**: Lightweight state stored in Supabase table `system_state` (key-value), checked before every Anthropic API call. Adds < 5ms latency.

### 6.3 Graceful Degradation

When external services are unavailable, the app degrades gracefully:

| Scenario | User Experience | Technical Handling |
|----------|----------------|-------------------|
| Anthropic API down | "AI assistant is temporarily unavailable. Your tank data and manual features still work normally." | Circuit breaker; all non-AI features remain functional |
| Stripe API down | Billing page shows cached subscription info; new checkouts unavailable | Return last-known subscription state from DB; queue checkout attempts |
| Web Push delivery fails | Silent failure; user sees no notification | Log failure; subscription cleanup on 410 (expired) |
| Supabase DB slow (> 5s) | Timeout error with retry prompt | Single retry; return cached data if available |
| Image upload fails | "Photo upload failed. Please try again." | Retry once; return user-friendly error |

### 6.4 Timeout Configuration

| Operation | Timeout | Rationale |
|-----------|---------|-----------|
| Edge Function total execution | 60s | Supabase Edge Function hard limit |
| Anthropic API call | 30s | Generous for complex responses |
| DB query (single) | 5s | All queries should be < 200ms with indexes |
| Stripe API call | 10s | External payment processing |
| Web Push send (per device) | 5s | Network variability |
| Photo upload to Storage | 15s | Large file uploads on slow connections |
| Photo resize/processing | 10s | Image manipulation in Deno |

### 6.5 Error Logging & Monitoring

All errors are logged to a structured format for debugging and alerting:

```json
{
  "timestamp": "2026-02-07T15:30:00Z",
  "request_id": "req_abc123",
  "user_id": "uuid",
  "function": "ai-chat",
  "error_code": "AI_UNAVAILABLE",
  "error_source": "anthropic",
  "http_status": 503,
  "details": {
    "anthropic_status": 529,
    "anthropic_error": "overloaded_error",
    "retry_count": 3,
    "total_latency_ms": 12500
  }
}
```

**Alerting thresholds** (monitored via Supabase Logs + external monitoring):

| Metric | Warning | Critical |
|--------|---------|----------|
| AI error rate | > 5% of requests in 5 min | > 15% of requests in 5 min |
| AI P95 latency | > 5s | > 10s |
| Stripe webhook failures | > 3 failures in 1 hour | > 10 failures in 1 hour |
| DB query P95 latency | > 500ms | > 2,000ms |
| Edge Function errors | > 10 per minute | > 50 per minute |

---

## Stripe Integration Mapping — Complete Setup Guide

This section provides a step-by-step, implementation-ready mapping of the entire Stripe integration. An engineer should be able to follow this document from account setup through going live.

---

### 7.1 Stripe Account Setup Checklist

Before writing any code, complete the following in the Stripe Dashboard:

- [ ] Create Stripe account at stripe.com
- [ ] Complete identity verification (business type: Software/SaaS)
- [ ] Business name: **Aquatic AI**
- [ ] Statement descriptor: **AQUATIC AI** (appears on customer card statements, max 22 chars)
- [ ] Support email: support@aquaticai.app
- [ ] Support URL: https://aquaticai.app/support
- [ ] Connect bank account for payouts
- [ ] Configure payout schedule (recommend: daily automatic with 2-day rolling)
- [ ] Upload business logo (brand teal `#1B998B` background)
- [ ] Set brand color to `#1B998B` in Stripe Branding settings
- [ ] Enable test mode (all development uses test keys)
- [ ] Add team members with appropriate roles:
  - Developer: full API access, test mode
  - Administrator: billing, products, payouts
  - View-only: analytics, reporting (for investors/advisors)
- [ ] Enable Stripe Tax (recommended for automatic sales tax calculation)
- [ ] Enable Stripe Radar for basic fraud prevention (included free)

---

### 7.2 Product & Price Configuration

Create the following in Stripe Dashboard → Products:

#### Products (3 total)

| Product Name | Internal ID (metadata) | Description | Statement Descriptor Suffix |
|---|---|---|---|
| **Aquatic AI Starter** | `tier: starter` | Basic aquarium management with AI chat — 1 tank, 100 AI messages/day | STARTER |
| **Aquatic AI Plus** | `tier: plus` | Advanced features with photo diagnosis — up to 5 tanks, 200 AI messages/day | PLUS |
| **Aquatic AI Pro** | `tier: pro` | Full platform access with unlimited AI — unlimited tanks, unlimited messages | PRO |

**Product Metadata** (set on each product):

```json
{
  "tier": "starter",           // or "plus" or "pro"
  "app": "aquatic_ai",         // for multi-product filtering
  "max_tanks": "1",            // or "5" or "unlimited"
  "daily_ai_messages": "100"   // or "200" or "unlimited"
}
```

#### Prices (3 monthly — use Lookup Keys)

| Lookup Key | Product | Amount | Currency | Interval | Tax Behavior |
|---|---|---|---|---|---|
| `starter_monthly` | Aquatic AI Starter | $3.99 | USD | Monthly | Exclusive |
| `plus_monthly` | Aquatic AI Plus | $7.99 | USD | Monthly | Exclusive |
| `pro_monthly` | Aquatic AI Pro | $14.99 | USD | Monthly | Exclusive |

**Why lookup keys?** Lookup keys let you reference prices by a stable string (`starter_monthly`) rather than Stripe-generated IDs (`price_1Abc123...`). This means you can recreate prices (e.g., for a price change) without updating application code — just create a new price with the same lookup key and Stripe transfers it automatically.

**Price Creation (Stripe API or Dashboard):**

```javascript
// Example: Create Starter Monthly price
const price = await stripe.prices.create({
  product: STRIPE_PRODUCT_STARTER,
  unit_amount: 399,        // $3.99 in cents
  currency: 'usd',
  recurring: { interval: 'month' },
  lookup_key: 'starter_monthly',
  transfer_lookup_key: true,  // Steal lookup_key from existing price if one exists
  tax_behavior: 'exclusive',  // Tax added on top of price
  metadata: { tier: 'starter' }
});
```

#### Future: Annual Prices (P2)

| Lookup Key | Product | Amount | Savings vs Monthly |
|---|---|---|---|
| `starter_annual` | Aquatic AI Starter | $39.99/yr | ~16% ($47.88 → $39.99) |
| `plus_annual` | Aquatic AI Plus | $79.99/yr | ~17% ($95.88 → $79.99) |
| `pro_annual` | Aquatic AI Pro | $149.99/yr | ~17% ($179.88 → $149.99) |

---

### 7.3 Checkout Session Configuration

#### When to Create a Stripe Customer

Stripe customers are created **at the time the user first initiates checkout** (not at signup). This avoids creating orphan customers for users who never subscribe.

```javascript
// Edge Function: /functions/v1/billing { action: "create_checkout" }

async function createCheckoutSession(userId, userEmail, lookupKey) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // 1. Fetch or create Stripe customer
  const { data: user } = await supabase
    .from('users')
    .select('stripe_customer_id, trial_end_date')
    .eq('id', userId)
    .single();

  let customerId = user.stripe_customer_id;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: userEmail,
      metadata: {
        user_id: userId,
        environment: Deno.env.get('ENVIRONMENT') || 'production'
      }
    });
    customerId = customer.id;

    // Store Stripe customer ID
    await supabase
      .from('users')
      .update({ stripe_customer_id: customerId })
      .eq('id', userId);
  }

  // 2. Prevent duplicate subscriptions
  const existingSubs = await stripe.subscriptions.list({
    customer: customerId,
    status: 'active',
    limit: 1
  });

  if (existingSubs.data.length > 0) {
    // User already has active subscription — redirect to Customer Portal instead
    return { redirect: 'portal', message: 'You already have an active subscription. Use Manage Subscription to change plans.' };
  }

  // 3. Calculate remaining trial days
  let trialDays = null;
  if (user.trial_end_date) {
    const remaining = Math.ceil(
      (new Date(user.trial_end_date) - new Date()) / (1000 * 60 * 60 * 24)
    );
    // Only apply trial to Pro plan (trial = full Pro access)
    // If user picks Starter or Plus, charge immediately (they're choosing less than trial)
    if (lookupKey === 'pro_monthly' && remaining > 0) {
      trialDays = remaining;
    }
  }

  // 4. Resolve price from lookup key
  const prices = await stripe.prices.list({ lookup_keys: [lookupKey], limit: 1 });
  if (prices.data.length === 0) throw new Error(`No price found for key: ${lookupKey}`);
  const priceId = prices.data[0].id;

  // 5. Create Checkout Session
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{
      price: priceId,
      quantity: 1
    }],
    success_url: `${APP_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${APP_URL}/pricing`,
    subscription_data: {
      ...(trialDays ? { trial_period_days: trialDays } : {}),
      metadata: {
        user_id: userId,
        tier: lookupKey.replace('_monthly', '').replace('_annual', '')
      }
    },
    allow_promotion_codes: true,
    billing_address_collection: 'auto',
    customer_update: {
      address: 'auto',
      name: 'auto'
    },
    payment_method_types: ['card'],  // Apple Pay + Google Pay auto-enabled when card is specified
    tax_id_collection: { enabled: true },
    // Stripe Tax (if enabled)
    automatic_tax: { enabled: true },
    // Consent collection for terms
    consent_collection: {
      terms_of_service: 'required'
    },
    custom_text: {
      terms_of_service_acceptance: {
        message: 'I agree to the [Terms of Service](https://aquaticai.app/terms) and [Privacy Policy](https://aquaticai.app/privacy). No refunds.'
      }
    }
  });

  return { checkout_url: session.url };
}
```

**Key Decisions:**
- **Trial on Pro only**: If user chooses Pro during trial, their existing trial continues on Stripe (no charge until trial ends). If they choose Starter or Plus, they are charged immediately because they're selecting a tier below their current trial access.
- **Apple Pay / Google Pay**: Automatically available when `payment_method_types: ['card']` is set and configured in Stripe Dashboard under Settings → Payment Methods.
- **Promotion codes**: Enabled via `allow_promotion_codes: true` — create coupon codes in Stripe Dashboard → Coupons.
- **Terms consent**: Required checkbox at checkout referencing terms and no-refund policy.

#### Success Page Handling

```javascript
// /app/billing/success/page.tsx

// On success page load:
// 1. Extract session_id from URL query params
// 2. Call backend to verify session
// 3. Show confirmation + redirect to dashboard after 3 seconds

// Edge Function: /functions/v1/billing { action: "verify_checkout" }
async function verifyCheckout(sessionId) {
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['subscription']
  });

  if (session.payment_status === 'paid' || session.status === 'complete') {
    // Subscription is active — webhook will handle DB updates
    // But we can provide immediate feedback to the user
    return {
      success: true,
      tier: session.subscription.metadata.tier,
      message: `Welcome to Aquatic AI ${session.subscription.metadata.tier}!`
    };
  }

  return { success: false, message: 'Payment is still processing.' };
}
```

---

### 7.4 Customer Portal Configuration

Configure in Stripe Dashboard → Settings → Customer Portal, or via API:

```javascript
const portalConfig = await stripe.billingPortal.configurations.create({
  business_profile: {
    headline: 'Manage your Aquatic AI subscription',
    privacy_policy_url: 'https://aquaticai.app/privacy',
    terms_of_service_url: 'https://aquaticai.app/terms'
  },
  features: {
    // Payment method management
    payment_method_update: { enabled: true },

    // Subscription cancellation
    subscription_cancel: {
      enabled: true,
      mode: 'at_period_end',  // Access continues until period ends
      cancellation_reason: {
        enabled: true,
        options: [
          'too_expensive',
          'missing_features',
          'switched_service',
          'unused',
          'too_complex',
          'other'
        ]
      }
    },

    // Plan switching (upgrades/downgrades)
    subscription_update: {
      enabled: true,
      default_allowed_updates: ['price'],
      proration_behavior: 'create_prorations',  // Immediate charge difference for upgrades
      products: [
        {
          product: STRIPE_PRODUCT_STARTER,
          prices: [STRIPE_PRICE_STARTER_MONTHLY]
        },
        {
          product: STRIPE_PRODUCT_PLUS,
          prices: [STRIPE_PRICE_PLUS_MONTHLY]
        },
        {
          product: STRIPE_PRODUCT_PRO,
          prices: [STRIPE_PRICE_PRO_MONTHLY]
        }
      ]
    },

    // Subscription pausing
    subscription_pause: { enabled: false },  // Not supported in v1

    // Invoice history
    invoice_history: { enabled: true },

    // Customer update (email, tax ID)
    customer_update: {
      enabled: true,
      allowed_updates: ['email', 'tax_id']
    }
  }
});

// Save portal config ID for use in portal session creation
// STRIPE_PORTAL_CONFIG_ID = portalConfig.id
```

**Portal Session Creation (Edge Function):**

```javascript
// /functions/v1/billing { action: "create_portal_session" }
async function createPortalSession(stripeCustomerId) {
  const session = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: `${APP_URL}/settings/billing`,
    configuration: STRIPE_PORTAL_CONFIG_ID
  });

  return { portal_url: session.url };
}
```

**Proration Behavior:**
- **Upgrades** (e.g., Starter → Plus): Charged the prorated difference immediately. User gets access to new tier immediately.
- **Downgrades** (e.g., Pro → Starter): Change takes effect at the end of the current billing period. User keeps current tier access until period ends. No refund or credit for unused time (per no-refund policy).
- **Cancellation**: Access continues until end of current billing period. After that, tier reverts to `free`.

---

### 7.5 Subscription Lifecycle State Machine

```
                                    ┌──────────────────┐
                                    │  NO SUBSCRIPTION │
                                    │    (Free Tier)   │
                                    └────────┬─────────┘
                                             │
                                  User completes checkout
                                             │
                                             ▼
                              ┌──────────────────────────┐
                    ┌─────────│        TRIALING           │──────────────┐
                    │         │  (Pro access, no charge)  │              │
                    │         └──────────┬───────────────┘              │
                    │                    │                               │
            trial_will_end        Trial ends +                   Payment fails
          (3 days before)       payment succeeds                at trial end
                    │                    │                               │
                    ▼                    ▼                               ▼
             Send reminder     ┌─────────────────┐            ┌──────────────┐
             notification      │     ACTIVE       │            │   PAST DUE   │
                               │  (Paid, current) │            │ (7-day grace)│
                               └──┬──────┬──────┘            └──────┬───────┘
                                  │      │                          │     │
                     invoice.     │      │ User clicks         Payment  After
                     payment_     │      │ "Cancel"            recovers grace
                     succeeded    │      │                          │   period
                        │         │      │                          │     │
                        ▼         │      ▼                          │     │
                   (Renews ─      │   ┌──────────────────┐         │     │
                    stays         │   │ ACTIVE + CANCEL   │         │     │
                    ACTIVE)       │   │ AT PERIOD END     │         │     │
                                  │   └────────┬─────────┘         │     │
                       payment    │            │                    │     │
                       fails      │     Period ends                │     │
                          │       │            │                    │     │
                          ▼       │            ▼                    │     │
                    ┌─────────────┤   ┌─────────────────┐          │     │
                    │  PAST DUE   │   │    CANCELED      │◄─────────┘─────┘
                    │ (7-day      │   │  (Reverts to     │
                    │   grace)    │   │   Free Tier)     │
                    └──────┬──────┘   └────────┬─────────┘
                           │                   │
                    Payment │            User re-subscribes
                    recovers│            (new checkout)
                           │                   │
                           ▼                   ▼
                     Back to ACTIVE     Back to TRIALING or ACTIVE
                                        (new subscription created)
```

#### State Transition Table

| Current State | Event | New State | Database Action |
|---|---|---|---|
| None | `checkout.session.completed` | Trialing or Active | INSERT subscription, UPDATE user.tier |
| Trialing | `subscription.updated` (trial ends, payment OK) | Active | UPDATE subscription.status = 'active', UPDATE user.tier |
| Trialing | `invoice.payment_failed` (at trial end) | Past Due | UPDATE subscription.status = 'past_due' |
| Trialing | `trial_will_end` | Trialing (unchanged) | Send reminder notification |
| Active | `invoice.payment_succeeded` | Active (renewed) | UPDATE subscription.current_period_end |
| Active | `invoice.payment_failed` | Past Due | UPDATE subscription.status = 'past_due', notify user |
| Active | `subscription.updated` (cancel_at_period_end=true) | Active (cancel pending) | UPDATE subscription.cancel_at_period_end = true |
| Active (cancel pending) | `subscription.deleted` (period ends) | Canceled | UPDATE subscription.status = 'canceled', UPDATE user.tier = 'free' |
| Past Due | `invoice.payment_succeeded` (recovery) | Active | UPDATE subscription.status = 'active', clear past_due |
| Past Due | `subscription.deleted` (grace expired) | Canceled | UPDATE subscription.status = 'canceled', UPDATE user.tier = 'free' |
| Canceled | User initiates new checkout | Trialing or Active | New subscription created |

---

### 7.6 Tier Mapping Logic

```javascript
// utils/stripe-tier-mapping.ts

/**
 * Maps Stripe Price lookup keys to internal tier names.
 * Uses lookup keys (not price IDs) for stability across price recreations.
 */
const LOOKUP_KEY_TO_TIER = {
  'starter_monthly': 'starter',
  'starter_annual': 'starter',
  'plus_monthly': 'plus',
  'plus_annual': 'plus',
  'pro_monthly': 'pro',
  'pro_annual': 'pro',
};

/**
 * Fallback: Map price IDs directly (populated from env vars).
 * Used when lookup_key is not available on the price object.
 */
const PRICE_ID_TO_TIER = {
  [Deno.env.get('STRIPE_PRICE_STARTER_MONTHLY')]: 'starter',
  [Deno.env.get('STRIPE_PRICE_PLUS_MONTHLY')]: 'plus',
  [Deno.env.get('STRIPE_PRICE_PRO_MONTHLY')]: 'pro',
};

/**
 * Determines the internal tier from a Stripe subscription object.
 */
function getTierFromSubscription(subscription) {
  // Trial = full Pro access regardless of selected plan
  if (subscription.status === 'trialing') {
    return 'pro';
  }

  // Active or past_due — resolve from the price
  if (['active', 'past_due'].includes(subscription.status)) {
    const price = subscription.items.data[0]?.price;

    // Try lookup key first (most stable)
    if (price.lookup_key && LOOKUP_KEY_TO_TIER[price.lookup_key]) {
      return LOOKUP_KEY_TO_TIER[price.lookup_key];
    }

    // Fallback to price ID
    if (PRICE_ID_TO_TIER[price.id]) {
      return PRICE_ID_TO_TIER[price.id];
    }

    // Fallback to metadata
    if (price.metadata?.tier) {
      return price.metadata.tier;
    }

    // Last resort: check subscription metadata
    if (subscription.metadata?.tier) {
      return subscription.metadata.tier;
    }

    console.error(`Unknown price: ${price.id}, lookup_key: ${price.lookup_key}`);
    return 'free'; // Safe default
  }

  // Canceled, incomplete, unpaid → free
  return 'free';
}

/**
 * Tier feature limits — single source of truth.
 */
const TIER_LIMITS = {
  free:    { max_tanks: 1,  daily_ai_messages: 10,  photo_diagnosis: false, maintenance: false, equipment: false, reports: false, web_search: false },
  starter: { max_tanks: 1,  daily_ai_messages: 100, photo_diagnosis: false, maintenance: false, equipment: false, reports: false, web_search: false },
  plus:    { max_tanks: 5,  daily_ai_messages: 200, photo_diagnosis: true,  maintenance: true,  equipment: true,  reports: true,  web_search: false },
  pro:     { max_tanks: -1, daily_ai_messages: -1,  photo_diagnosis: true,  maintenance: true,  equipment: true,  reports: true,  web_search: true  },
  // -1 = unlimited
};
```

---

### 7.7 Trial Management Strategy

#### Trial Lifecycle

```
Day 0:  User signs up → trial_end_date = NOW() + 14 days
        User gets full Pro access (tracked in users table, NOT Stripe)

Day 1-14: User explores platform with all Pro features
          No Stripe subscription exists yet

Day 11:  Stripe trial_will_end notification (if subscribed with trial)
         OR in-app reminder: "Your trial ends in 3 days"

Day 13:  In-app + email: "Your trial ends tomorrow"

Day 14:  Trial expires:
         - If subscribed during trial → Stripe begins billing
         - If NOT subscribed → user.subscription_tier = 'free'
```

#### Trial + Subscription Scenarios

| Scenario | Stripe Trial Days | Charge Timing |
|---|---|---|
| User subscribes to Pro on Day 5 | 9 days remaining | Charge on Day 14 |
| User subscribes to Plus on Day 5 | 0 (no Stripe trial) | Charge immediately |
| User subscribes to Starter on Day 5 | 0 (no Stripe trial) | Charge immediately |
| User subscribes to Pro on Day 14 | 0 (trial expired) | Charge immediately |
| User never subscribes | N/A | No charge; downgrade to free |

**Rationale**: Since the trial gives Pro access, subscribing to Pro during trial continues that access seamlessly. Subscribing to a lower tier (Starter/Plus) means the user is explicitly choosing fewer features — they should get that tier immediately with immediate billing.

#### Trial Expiration Handler (Cron Job)

```javascript
// Runs daily at midnight UTC via Supabase Edge Function cron

async function handleExpiredTrials() {
  const now = new Date().toISOString();

  // Find users whose trial has expired and still show as 'free' with trial features
  const { data: expiredUsers } = await supabase
    .from('users')
    .select('id, email, subscription_tier, trial_end_date')
    .lt('trial_end_date', now)
    .is('stripe_customer_id', null)  // Never subscribed
    .neq('subscription_tier', 'free');

  for (const user of expiredUsers) {
    // Downgrade to free
    await supabase
      .from('users')
      .update({ subscription_tier: 'free' })
      .eq('id', user.id);

    // Send "trial expired" email via Resend
    await sendTrialExpiredEmail(user.email);

    console.log(`Trial expired for user ${user.id}, downgraded to free`);
  }
}
```

---

### 7.8 Failed Payment Recovery

#### Stripe Smart Retries

Enable **Stripe Smart Retries** in Stripe Dashboard → Settings → Subscriptions and emails → Manage failed payments:

- **Retry schedule**: Smart (Stripe uses ML to pick optimal retry times)
- **Maximum retries**: Up to 4 attempts over ~3 weeks
- **After all retries fail**: Cancel subscription

#### Application-Side Grace Period

Our grace period runs in parallel with Stripe's retries:

| Day | Action |
|---|---|
| Day 0 (payment fails) | `invoice.payment_failed` webhook fires. Set `subscriptions.status = 'past_due'`. Send in-app banner + email: "Payment failed — please update your payment method." |
| Day 3 | Cron job checks `past_due` subscriptions > 3 days old. Send email reminder + push notification: "Your payment is still failing. Update now to keep your features." |
| Day 7 | Cron job checks `past_due` subscriptions > 7 days old. Send final warning email: "Your access will be restricted tomorrow if payment is not updated." |
| Day 8 | Downgrade to free tier in our database. User sees "subscription suspended" message. Stripe may still be retrying in the background. |
| Day 8+ | If Stripe retry succeeds (`invoice.payment_succeeded`), immediately restore the user's tier. Send "Welcome back" notification. |
| ~Day 21 | If all Stripe retries fail, `subscription.deleted` fires. Clean up subscription record. User remains on free tier. |

#### Recovery Flow

```
User sees "Payment failed" banner
       │
       ▼
User clicks "Update Payment Method"
       │
       ▼
Redirect to Stripe Customer Portal
       │
       ▼
User updates card / adds Apple Pay
       │
       ▼
Stripe retries payment with new method
       │
       ├─── Success → invoice.payment_succeeded webhook
       │                → UPDATE subscription.status = 'active'
       │                → Restore tier immediately
       │                → Send "Payment recovered" notification
       │
       └─── Failure → invoice.payment_failed webhook (again)
                       → Continue grace period countdown
```

---

### 7.9 Refund Policy Enforcement

**Policy: NO REFUNDS.**

This is a firm business decision. Implementation:

- **Stripe Dashboard**: Do NOT configure automatic refunds. Dispute resolution handled manually.
- **Customer Portal**: Cancellation = access until period end. No refund or credit issued.
- **Checkout consent**: "No refunds" explicitly stated in terms acceptance at checkout (see Section 7.3 `custom_text`).
- **Admin Portal**: No refund button exists. If a refund is legally required (regulatory, chargeback), it must be processed directly in Stripe Dashboard by a Super Admin with documented justification.
- **Downgrade behavior**: User keeps current tier until period ends. No prorated refund for unused days.
- **Support scripts**: Standard response template: "Aquatic AI subscriptions are non-refundable. Your access will continue until the end of your current billing period. We'd love to help resolve any issues — what can we assist with?"

**Chargeback handling**: Enable Stripe Radar for basic fraud prevention. If a chargeback is filed, Stripe will notify via `charge.dispute.created` webhook. Respond via Stripe Dashboard with evidence (account usage logs, terms acceptance, IP address).

---

### 7.10 Environment Variables — Complete List

```bash
# ═══════════════════════════════════════════════════
# ANTHROPIC AI CONFIGURATION — Store in Supabase Vault
# ═══════════════════════════════════════════════════

ANTHROPIC_API_KEY=sk-ant-...           # From Anthropic Console
ANTHROPIC_MODEL_SONNET=claude-sonnet-4-5-20250929    # Primary model for chat, analysis
ANTHROPIC_MODEL_HAIKU=claude-haiku-4-5-20251001      # Fast/cheap model for simple queries

# ═══════════════════════════════════════════════════
# STRIPE CONFIGURATION — Store in Supabase Vault
# ═══════════════════════════════════════════════════

# API Keys (NEVER commit to source control)
STRIPE_SECRET_KEY=sk_test_...          # Test mode (sk_live_... for production)
STRIPE_PUBLISHABLE_KEY=pk_test_...     # Test mode (pk_live_... for production)

# Webhook Signing Secret
STRIPE_WEBHOOK_SECRET=whsec_...        # From Stripe Dashboard → Webhooks

# Price IDs (from Stripe Dashboard → Products → Prices)
# These are the Stripe-generated IDs, not lookup keys
STRIPE_PRICE_STARTER_MONTHLY=price_...
STRIPE_PRICE_PLUS_MONTHLY=price_...
STRIPE_PRICE_PRO_MONTHLY=price_...

# Product IDs (for reference / portal configuration)
STRIPE_PRODUCT_STARTER=prod_...
STRIPE_PRODUCT_PLUS=prod_...
STRIPE_PRODUCT_PRO=prod_...

# Customer Portal Configuration ID
STRIPE_PORTAL_CONFIG_ID=bpc_...

# Application URLs (used in Checkout and Portal sessions)
APP_URL=https://app.aquaticai.app     # No trailing slash
STRIPE_SUCCESS_URL=${APP_URL}/billing/success
STRIPE_CANCEL_URL=${APP_URL}/pricing
STRIPE_PORTAL_RETURN_URL=${APP_URL}/settings/billing
```

**Storage**: All secret keys stored in **Supabase Vault** (encrypted at rest). Publishable key can be in client-side environment variables (`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`).

---

### 7.11 Testing Strategy

#### Test Mode Setup

All development and staging use Stripe **test mode** keys. No real charges are made.

#### Test Card Numbers

| Card Number | Scenario |
|---|---|
| `4242 4242 4242 4242` | Payment succeeds |
| `4000 0000 0000 3220` | 3D Secure required (completes successfully) |
| `4000 0000 0000 9995` | Payment is declined (insufficient funds) |
| `4000 0000 0000 0341` | Card attaches, but first charge fails |
| `4000 0025 0000 3155` | Requires authentication (3D Secure 2) |
| `4000 0000 0000 0002` | Card declined (generic) |
| `4000 0000 0000 0069` | Charge expires |
| `4242 4242 4242 4243` | CVC check fails |

**Test clock (for trials)**: Use Stripe Test Clocks (Dashboard → Developers → Test Clocks) to simulate trial expiration without waiting 14 days.

#### Webhook Testing with Stripe CLI

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login to Stripe
stripe login

# Forward webhook events to local Supabase Edge Function
stripe listen --forward-to http://localhost:54321/functions/v1/stripe-webhook

# In another terminal, trigger specific events:
stripe trigger checkout.session.completed
stripe trigger invoice.payment_succeeded
stripe trigger invoice.payment_failed
stripe trigger customer.subscription.updated
stripe trigger customer.subscription.deleted
stripe trigger customer.subscription.trial_will_end
```

#### Test Scenarios Checklist

**Subscription Lifecycle:**
- [ ] New user subscribes to Starter via Checkout → tier updates to 'starter'
- [ ] New user subscribes to Plus via Checkout → tier updates to 'plus'
- [ ] New user subscribes to Pro during trial → trial continues, no immediate charge
- [ ] New user subscribes to Starter during trial → charged immediately, tier changes
- [ ] Trial expires without subscription → user downgraded to 'free'
- [ ] Trial expiration emails sent at 3 days and 1 day before

**Plan Changes:**
- [ ] Starter → Plus upgrade → immediate charge for prorated difference, immediate access
- [ ] Plus → Pro upgrade → immediate charge, immediate access
- [ ] Pro → Starter downgrade → change at period end, current access retained
- [ ] Plus → Starter downgrade → change at period end

**Cancellation:**
- [ ] User cancels via Customer Portal → `cancel_at_period_end` = true
- [ ] Canceled user retains access until period ends
- [ ] At period end, subscription.deleted fires → tier reverts to 'free'
- [ ] Canceled user can resubscribe (new Checkout session)

**Payment Failures:**
- [ ] Payment fails → user receives email + in-app banner
- [ ] User updates payment method → Stripe retries → payment succeeds → tier restored
- [ ] Payment fails, not recovered within 7 days → downgraded to free
- [ ] Smart Retry succeeds after grace period → tier restored automatically
- [ ] All retries fail → subscription.deleted → permanent downgrade to free

**Idempotency:**
- [ ] Same webhook event replayed → processed only once (webhook_events table check)
- [ ] Rapid duplicate webhooks → no race conditions (UNIQUE constraint on stripe_event_id)

**Edge Cases:**
- [ ] User attempts checkout while already subscribed → redirect to Portal
- [ ] User's Stripe customer ID is null → customer created before checkout
- [ ] Multiple tabs open during checkout → only one subscription created
- [ ] Browser closed during checkout → webhook still processes subscription
- [ ] Stripe is down → billing endpoints return graceful error, existing access unaffected

---

### 7.12 Going Live Checklist

When ready to launch with real payments:

**Stripe Account:**
- [ ] Complete Stripe account verification (identity + business documents)
- [ ] Set up bank account and verify micro-deposits
- [ ] Configure payout schedule (daily, 2-day rolling recommended)
- [ ] Review and accept Stripe's terms of service

**Products & Prices:**
- [ ] Create live Products (3) with same metadata as test products
- [ ] Create live Prices (3 monthly) with same lookup keys as test prices
- [ ] Verify amounts: Starter $3.99, Plus $7.99, Pro $14.99

**Keys & Configuration:**
- [ ] Generate live API keys (Stripe Dashboard → Developers → API keys)
- [ ] Update `STRIPE_SECRET_KEY` in Supabase Vault to live key (`sk_live_...`)
- [ ] Update `STRIPE_PUBLISHABLE_KEY` in Vercel env vars (`pk_live_...`)
- [ ] Update all `STRIPE_PRICE_*` env vars with live price IDs
- [ ] Update `STRIPE_PRODUCT_*` env vars with live product IDs

**Webhooks:**
- [ ] Create live webhook endpoint in Stripe Dashboard → Webhooks
- [ ] Endpoint URL: `https://{supabase-project-ref}.supabase.co/functions/v1/stripe-webhook`
- [ ] Select events: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`, `invoice.payment_failed`, `customer.subscription.trial_will_end`
- [ ] Copy live webhook signing secret to Supabase Vault as `STRIPE_WEBHOOK_SECRET`
- [ ] Verify webhook is receiving events (Stripe Dashboard → Webhooks → Recent Events)

**Customer Portal:**
- [ ] Create live Portal configuration (or verify test config carries over)
- [ ] Update `STRIPE_PORTAL_CONFIG_ID` in Supabase Vault

**Security & Compliance:**
- [ ] Enable Stripe Radar for fraud prevention
- [ ] Review statement descriptor ("AQUATIC AI" — visible on card statements)
- [ ] Enable receipt emails in Stripe settings
- [ ] Configure Stripe to send invoice emails
- [ ] Ensure Terms of Service and Privacy Policy URLs are live and correct

**Testing:**
- [ ] Make a real $0.50 test charge and refund it (one-time verification)
- [ ] Complete one full checkout flow with a real card in live mode
- [ ] Verify webhook processes live events correctly
- [ ] Verify Customer Portal works in live mode
- [ ] Monitor first 10 real subscriptions manually for correctness

**Monitoring:**
- [ ] Set up Stripe Dashboard alerts for: failed payments, disputes, high refund rate
- [ ] Set up application monitoring for webhook failures (see Section 6.5)
- [ ] Create daily reconciliation cron (compare Stripe subscriptions vs Supabase subscriptions table)

---

### 7.13 Daily Reconciliation Job

Stripe is the **source of truth** for billing state. A daily cron job ensures Supabase stays in sync:

```javascript
// Runs daily at 2:00 AM UTC via scheduled Edge Function

async function reconcileSubscriptions() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // Fetch all users with a stripe_customer_id
  const { data: users } = await supabase
    .from('users')
    .select('id, stripe_customer_id, subscription_tier')
    .not('stripe_customer_id', 'is', null);

  let mismatches = 0;

  for (const user of users) {
    // Get active subscription from Stripe
    const subs = await stripe.subscriptions.list({
      customer: user.stripe_customer_id,
      status: 'all',
      limit: 1,
      expand: ['data.items.data.price']
    });

    const activeSub = subs.data.find(s =>
      ['active', 'trialing', 'past_due'].includes(s.status)
    );

    const expectedTier = activeSub ? getTierFromSubscription(activeSub) : 'free';

    if (expectedTier !== user.subscription_tier) {
      mismatches++;
      console.warn(`MISMATCH: User ${user.id} — DB: ${user.subscription_tier}, Stripe: ${expectedTier}`);

      // Stripe wins — update Supabase
      await supabase
        .from('users')
        .update({ subscription_tier: expectedTier })
        .eq('id', user.id);

      // Also sync subscription record
      if (activeSub) {
        await supabase
          .from('subscriptions')
          .upsert({
            user_id: user.id,
            stripe_subscription_id: activeSub.id,
            tier: expectedTier,
            status: activeSub.status,
            current_period_start: new Date(activeSub.current_period_start * 1000).toISOString(),
            current_period_end: new Date(activeSub.current_period_end * 1000).toISOString(),
            cancel_at_period_end: activeSub.cancel_at_period_end,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id' });
      }
    }
  }

  console.log(`Reconciliation complete. ${mismatches} mismatches corrected out of ${users.length} users.`);
}
```

**Rate limiting note**: This job iterates users and calls Stripe API for each. For >1,000 users, implement batching with `stripe.subscriptions.list()` pagination to avoid Stripe rate limits (100 requests/sec).

---

### 7.14 Stripe Dashboard Configuration Reference

Quick reference for what to configure in each Stripe Dashboard section:

| Section | Configuration |
|---|---|
| **Products** | 3 products (Starter, Plus, Pro) with tier metadata |
| **Prices** | 3 monthly prices with lookup keys |
| **Customer Portal** | See Section 7.4 — cancellation, plan switching, payment methods |
| **Webhooks** | 1 endpoint, 7 event types (see Section 5.1) |
| **Billing → Subscriptions** | Smart Retries enabled, invoice settings, trial behavior |
| **Billing → Customer emails** | Enable: successful payment receipt, upcoming renewal, failed payment |
| **Radar** | Basic fraud rules enabled (included free) |
| **Tax** | Stripe Tax enabled if selling internationally |
| **Branding** | Logo, brand color #1B998B, accent color |
| **Settings → Payment Methods** | Cards enabled, Apple Pay + Google Pay enabled |
| **Settings → Customer Portal** | See Section 7.4 |

---

## Success Metrics

### Leading Indicators (Days to Weeks)

| Metric | Target | Measurement |
|--------|--------|-------------|
| API P95 latency (non-AI) | < 500ms | Edge Function logs |
| API P95 latency (AI chat) | < 3,000ms | Edge Function logs |
| API error rate | < 1% | Error logs / total requests |
| Webhook processing success | > 99.9% | Webhook event logs |
| AI action execution success | > 95% | ai_usage + action status tracking |
| Push notification delivery | > 90% | Web Push API response codes |

### Lagging Indicators (Weeks to Months)

| Metric | Target | Measurement |
|--------|--------|-------------|
| AI cost per user per month | < $4.50 | ai_usage aggregation (input/output tokens × pricing) |
| Haiku routing percentage | > 30% | ai_usage model field tracking |
| Stripe payment success rate | > 97% | Stripe dashboard |
| Trial-to-paid conversion | > 5% | users + subscriptions analysis |
| API uptime | > 99.5% | Synthetic monitoring |

---

## Decisions (Resolved)
- ✅ Streaming vs non-streaming: Non-streaming for v1 MVP. Streaming added as P1 fast-follow. Non-streaming simplifies error handling and frontend implementation.
- ✅ Edge Function cold starts: Accept cold start cost and optimize function bundle size. Keep functions small and focused. Use Supabase's edge function warm-up configuration for critical paths (AI chat, auth).
- ✅ Webhook event queue: Synchronous processing for v1. Webhook handlers are simple DB updates (< 500ms). Move to async queue if delivery failures are observed in production.
- ✅ AI usage cost attribution: Per-user-per-day-per-feature via ai_usage table. Granularity is sufficient for tier enforcement and monthly cost reporting. Add `model` column to track Sonnet vs Haiku usage.

---

## Timeline Considerations

### Phase 1 — MVP (P0)

**Target**: All endpoints functional with standard auth, error handling, and tier enforcement.

| Component | Dependency | Estimated Effort |
|-----------|-----------|-----------------|
| Auth middleware + response envelope | Supabase project setup | 2 days |
| User profile endpoints | Auth middleware | 1 day |
| Tank CRUD endpoints | Auth + DB schema | 2 days |
| Water parameters endpoints | Tanks | 2 days |
| Species search endpoints | Species seed data | 1 day |
| Livestock CRUD endpoints | Tanks + Species | 2 days |
| AI chat endpoint + orchestration layer | Anthropic API key, all tank data endpoints | 5 days |
| Maintenance endpoints | Tanks | 2 days |
| Billing endpoints + Stripe integration | Stripe account setup | 3 days |
| Stripe webhook handler | Billing endpoints | 2 days |
| Notification preferences + push registration | VAPID keys | 2 days |
| Push notification cron jobs | Push registration | 2 days |
| Dashboard/overview endpoint | All data endpoints | 2 days |
| Rate limiting middleware | Auth middleware | 1 day |
| Error handling + monitoring | All endpoints | 2 days |
| **Total** | | **~30 days** |

### Phase 2 — Fast Follow (P1)

- Photo diagnosis endpoint + vision pipeline (3 days)
- Equipment tracking endpoints (2 days)
- Report generation + email delivery (3 days)
- AI streaming responses (2 days)
- Equipment recommendation web search (2 days)
- Multi-tank comparison dashboard endpoint (2 days)

### Critical Dependencies

- **Anthropic API key** must be provisioned before AI development begins
- **Stripe account** must be configured with products/prices before billing work
- **VAPID keys** must be generated before push notification work
- **Supabase project** must have all tables migrated before any endpoint work
- **Species seed data** (500+ species) must be loaded before species search work

---

## Appendix A: Additional Tables Referenced in This Spec

The following table is introduced by this spec and should be added to the Data Model Schema (Spec 00):

### `webhook_events`

Idempotency tracking for Stripe webhook processing.

| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| `id` | `UUID` | PK | `gen_random_uuid()` | |
| `stripe_event_id` | `VARCHAR(255)` | NOT NULL, UNIQUE | — | Stripe event ID for idempotency |
| `event_type` | `VARCHAR(100)` | NOT NULL | — | e.g., `'checkout.session.completed'` |
| `processed_at` | `TIMESTAMPTZ` | NOT NULL | `NOW()` | |
| `payload` | `JSONB` | — | `NULL` | Full event for audit |

**RLS**: Edge Function only (service role). No user access.

**Retention**: Retain 90 days; purge via weekly cron.

---

## Appendix B: Schema Alignment Notes

The following notes document decisions about computed vs. stored fields and cross-spec alignment:

1. **`health_score`** (dashboard endpoint): Computed at query time from parameter stability, maintenance compliance, alert count, and livestock stability. Not stored in DB.

2. **`health_status`** (equipment endpoint): Computed from `purchase_date` vs `expected_lifespan_months` (or `equipment_lifespan_defaults` fallback). Not stored.

3. **`model`** in AI usage response: The model used per request (Sonnet vs Haiku) is ephemeral — returned in the API response for transparency but tracked in aggregate via `ai_usage`. To support model routing analytics, add `model VARCHAR(100)` to the `ai_usage` table in the next data model revision.

4. **Photo diagnosis response** uses nested objects (`species_identification`, `disease_diagnosis`) for frontend ergonomics, but stores as flat columns in `photo_diagnoses`. The Edge Function maps between the two formats. The `treatment_plan` JSONB column stores the nested treatment object as-is.

5. **Equipment lifespan defaults** — read-only reference table in v1. Admin CRUD endpoint deferred to P2 when content management tooling is built. Data managed via SQL migrations.

6. **Maintenance logs** — ad-hoc logs (without a parent task) can be created via the `complete_task` action with `task_id: null`. The endpoint should support this pattern for manual one-off logging.

---

*Document generated from Aquatic AI PRD v1, Feature Specs 01–11, and Data Model Schema (Spec 00). Last updated: February 2026.*
