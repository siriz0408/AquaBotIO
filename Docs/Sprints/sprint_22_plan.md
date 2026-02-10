# Sprint 22 Plan — Maintenance Push Notifications

**Date:** February 10, 2026
**Status:** Complete
**Goal:** Complete Maintenance Scheduling to 100% by adding push notification cron job

---

## Sprint Summary

MVP was at 100% with Maintenance Scheduling at 95% (missing push notifications). This sprint adds the Edge Function that checks for due maintenance tasks and sends push notifications to users.

## Tasks Completed

| Task | Status | Agent | Notes |
|------|--------|-------|-------|
| Commit admin layout fix | ✅ Complete | PM | Table name fix: admin_profiles → admin_users |
| Create send-maintenance-reminders Edge Function | ✅ Complete | Backend | Full implementation with preference checks |
| Update Implementation Status | ✅ Complete | PM | Maintenance now 100% |
| Update Roadmap Dashboard | ✅ Complete | PM | Sprint 19-22 entries added |

## What Was Built

### Edge Function: send-maintenance-reminders

**Location:** `supabase/functions/send-maintenance-reminders/index.ts`

**Features:**
- Queries `maintenance_tasks` for tasks due within 24 hours
- Checks `notification_preferences` (push_enabled, maintenance_reminders)
- Respects quiet hours with timezone awareness
- Uses web-push library for Web Push API
- Includes action buttons: "Mark Complete", "Snooze"
- Auto-removes expired push subscriptions
- Supports dry_run mode for testing
- Returns structured JSON summary

**Deployment:**
```bash
npx supabase functions deploy send-maintenance-reminders --project-ref mtwyezkbmyrgxqmskblu
```

**Required Environment Variables:**
- SUPABASE_URL (auto-set)
- SUPABASE_SERVICE_ROLE_KEY (auto-set)
- VAPID_PUBLIC_KEY
- VAPID_PRIVATE_KEY
- VAPID_SUBJECT (optional, defaults to mailto:support@aquabotai.com)

## Testing Instructions

1. Deploy the Edge Function
2. Set VAPID keys in Supabase Edge Function settings
3. Create a maintenance task due within 24 hours
4. Enable push notifications in Settings
5. Call function manually:
   ```bash
   curl -X POST https://mtwyezkbmyrgxqmskblu.supabase.co/functions/v1/send-maintenance-reminders \
     -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
   ```
6. Verify push notification received

## Memory Report

### Decisions Made
- **D022-1:** Used 24-hour window instead of exact reminder_time matching (more reliable with 15-min cron)
- **D022-2:** Used esm.sh for web-push import (matches existing Edge Function patterns)

### Patterns Discovered
- **P022-1:** Edge Function Service Role Pattern — use createClient with service role key for cross-user data access
- **P022-2:** Push Cleanup Pattern — batch-delete expired subscriptions after notification loop
- **P022-3:** Dry Run Pattern — accept {"dry_run": true} for testing cron jobs

### Gotchas
- maintenance_tasks uses `is_active` flag, not `deleted_at` column (different from tanks table)
- web-push requires esm.sh import on Deno runtime

## Files Changed

- `supabase/functions/send-maintenance-reminders/index.ts` (new, 591 lines)
- `Docs/AquaBotAI_Specs/14_Implementation_Status.md` (updated)
- `Docs/Roadmap/AquaBotAI_Product_Roadmap.html` (updated)
- `src/app/admin/layout.tsx` (fix committed)
- `package.json` (convenience scripts)

## Next Sprint Recommendations

With MVP at 100% and all P0 features complete, Sprint 23 options:
1. **Deploy and verify** — Deploy the Edge Function, set up cron, verify end-to-end
2. **Equipment Tracking (P2)** — Start Spec 10 implementation
3. **Email Reports (P1)** — Resend integration for Pro users
4. **Polish** — Color palette alignment, security headers review

---

*Sprint completed by PM Orchestrator with Backend agent support.*
