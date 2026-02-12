# Sprint 33 Summary

**Date:** February 12, 2026
**Goal:** Daily AI Coaching - Proactive Tips & Reminders
**Status:** Complete

## What Was Built

### 1. Daily AI Coaching Edge Function

Created `supabase/functions/daily-ai-coaching/index.ts` (~773 lines):

**User Selection:**
- Queries users with `wants_reminders = true` in notification_preferences
- Filters to users with at least one active tank
- Respects quiet hours (checks `quiet_hours_start`, `quiet_hours_end`, user timezone)

**Context Building:**
- Fetches user preferences (experience_level, primary_goal, current_challenges)
- Gets tank info (most recently updated tank)
- Pulls latest water parameters
- Counts pending maintenance tasks

**AI Generation:**
- Builds personalized system prompt with user context
- Calls Claude Haiku (`claude-haiku-4-5-20251001`)
- Generates brief coaching tip (1-2 sentences, max 200 chars)
- Tracks token usage in `ai_usage` table

**Notification Delivery:**
- Fetches active push subscriptions for each user
- Sends web-push notifications with coaching message
- Cleans up expired subscriptions (410 status)
- Supports `dry_run` mode for testing

### 2. Manual Coaching API Endpoint

**New File: `src/lib/ai/coaching.ts`**
- `CoachingContext` interface for typed context
- `buildCoachingSystemPrompt()` — Creates personalized prompt
- `generateCoachingMessage()` — Calls Claude Haiku API
- Handles missing context gracefully

**New Endpoint: `POST /api/ai/coaching`**
- Request body: `{ tank_id?: string, dry_run?: boolean }`
- Validates user auth and ownership
- Builds context from database
- Generates coaching message via AI
- Optionally sends push notification
- Returns coaching message and metadata

## Files Changed

### Created (3 files)
- `supabase/functions/daily-ai-coaching/index.ts`
- `src/lib/ai/coaching.ts`
- `src/app/api/ai/coaching/route.ts`

## Metrics
- Files created: 3
- Lines added: ~1,144
- Build: Pass
- Commit: f97ad65

## Technical Details

### Coaching Context Interface
```typescript
interface CoachingContext {
  user: {
    experience_level: string;
    primary_goal: string;
    current_challenges: string[];
  };
  tank: {
    name: string;
    type: string;
  };
  parameters?: {
    ph?: number;
    ammonia?: number;
    nitrite?: number;
    nitrate?: number;
    temperature?: number;
    test_date?: string;
  };
  pending_tasks_count: number;
}
```

### Edge Function Cron Schedule
Add to Supabase cron config:
```sql
SELECT cron.schedule(
  'daily-ai-coaching',
  '0 9 * * *',  -- 9 AM UTC daily
  $$SELECT net.http_post(
    url := 'https://{project-ref}.supabase.co/functions/v1/daily-ai-coaching',
    headers := '{"Authorization": "Bearer {service_role_key}"}'::jsonb
  )$$
);
```

## What Sam Should Test

### 1. Manual API Endpoint
```bash
# Get coaching message for a tank
curl -X POST http://localhost:3000/api/ai/coaching \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {your-jwt}" \
  -d '{"tank_id": "your-tank-id"}'

# Dry run (generates message, no notification)
curl -X POST http://localhost:3000/api/ai/coaching \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {your-jwt}" \
  -d '{"tank_id": "your-tank-id", "dry_run": true}'
```

### 2. Edge Function (dry run)
```bash
# Test edge function locally
curl -X POST https://{project-ref}.supabase.co/functions/v1/daily-ai-coaching \
  -H "Authorization: Bearer {service_role_key}" \
  -H "Content-Type: application/json" \
  -d '{"dry_run": true}'
```

### 3. Verify AI Personalization
- Complete AI onboarding wizard (if not done)
- Call the coaching API
- Message should reference your experience level and goals

## Feedback Status Update

The Daily AI Coaching feature (FB-MLH5MQTR) is now **complete**:
- Edge Function for scheduled delivery
- API endpoint for manual trigger
- Personalized messages based on user context
- Push notification integration

## Next Sprint (34) Recommendations

1. **Cron scheduling** — Set up actual cron job in Supabase
2. **Coaching history** — Store coaching messages for review
3. **Message variety** — Rotate coaching focus areas
4. **Feedback loop** — Let users rate coaching helpfulness
5. **Email fallback** — Send email if push fails
