# Sprint 34 Summary

**Date:** February 14, 2026
**Goal:** Coaching History + User Preferences UI
**Status:** Complete

## What Was Built

### Backend (Backend Engineer)

**New Files:**
- `supabase/migrations/20260214000000_coaching_history.sql` — coaching_history table with RLS
- `supabase/migrations/20260214000001_coaching_cron_setup.sql` — Cron scheduling documentation
- `src/app/api/ai/coaching/history/route.ts` — GET endpoint with pagination

**Modified Files:**
- `src/app/api/ai/coaching/route.ts` — Saves messages to coaching_history
- `src/types/database.ts` — Added CoachingHistory interface
- `supabase/functions/daily-ai-coaching/index.ts` — Saves history after sending

**Key Features:**
- coaching_history table with SELECT-only RLS (system writes via service role)
- Paginated history API: `GET /api/ai/coaching/history?limit=10&offset=0`
- Non-blocking history saves (logs errors but doesn't fail requests)
- Four cron scheduling options documented (pg_cron, GitHub Actions, Vercel Cron, manual)

### Frontend (Frontend Engineer)

**New Files:**
- `src/app/(dashboard)/coaching/page.tsx` — Coaching history page
- `src/components/coaching/coaching-history-card.tsx` — Card with relative dates
- `src/components/coaching/index.ts` — Barrel export
- `src/hooks/use-coaching-history.ts` — Fetches history with pagination

**Modified Files:**
- `src/app/(dashboard)/settings/page.tsx` — Added AI preferences editor
- `src/components/navigation/desktop-navbar.tsx` — Added coaching link
- `src/components/navigation/top-bar.tsx` — Added coaching link (mobile)

**Key Features:**
- Coaching history page with loading, empty, and error states
- Two empty state variants (onboarding complete vs. not)
- Relative date formatting (Today, Yesterday, Feb 12)
- Inline AI preferences editor (experience, goal, challenges)
- Lightbulb icon nav link to coaching page

## Files Changed

### Created (7 files)
- `supabase/migrations/20260214000000_coaching_history.sql`
- `supabase/migrations/20260214000001_coaching_cron_setup.sql`
- `src/app/api/ai/coaching/history/route.ts`
- `src/app/(dashboard)/coaching/page.tsx`
- `src/components/coaching/coaching-history-card.tsx`
- `src/components/coaching/index.ts`
- `src/hooks/use-coaching-history.ts`

### Modified (6 files)
- `src/app/api/ai/coaching/route.ts`
- `src/types/database.ts`
- `supabase/functions/daily-ai-coaching/index.ts`
- `src/app/(dashboard)/settings/page.tsx`
- `src/components/navigation/desktop-navbar.tsx`
- `src/components/navigation/top-bar.tsx`

## Metrics
- Files created: 7
- Files modified: 6
- Lines added: ~1,696
- Build: Pass
- Lint: Pass
- Commit: 9d95886

## Decisions Made

1. **Service Role Client for History Inserts** — Users can only SELECT from coaching_history; system inserts via service role. Prevents fake history entries.

2. **Non-Blocking History Saves** — If history save fails, log error but still return coaching message. Better UX.

3. **Graceful API Degradation** — Frontend handles 404 from missing API as empty state, allowing parallel development.

4. **Inline Preferences Editing** — Quick edit in settings vs. always opening full wizard. "Run Full Setup" button for comprehensive changes.

5. **Relative Date Formatting** — "Today at 9:00 AM", "Yesterday", then absolute dates for older entries.

## Patterns Discovered

- **P034-1:** Service Role Client for Admin Inserts — use getServiceRoleClient() for tables where users should only SELECT
- **P034-2:** Graceful API Degradation — check for 404 and show empty state instead of error for parallel development
- **P034-3:** Dual Empty State — show different CTAs based on user journey stage

## What Sam Should Test

1. **Coaching History Page:** Navigate to /coaching (lightbulb icon in nav)
   - Should show empty state if no coaching messages yet
   - "Complete Onboarding" CTA if not onboarded

2. **AI Preferences Editor:** Go to Settings → AI Personalization section
   - Edit experience level, primary goal, challenges
   - Save and verify persistence

3. **Full Flow:**
   - Complete AI onboarding (if not done)
   - Call coaching API: `POST /api/ai/coaching` with tank_id
   - Refresh /coaching page — new tip should appear

## Next Sprint Recommendations

1. **Deploy migration** — Run `npx supabase db push` to create coaching_history table
2. **Set up cron** — Choose and configure one of the 4 scheduling options
3. **Email fallback** — Send coaching via email if push notification fails
4. **Coaching feedback** — Let users rate coaching helpfulness
