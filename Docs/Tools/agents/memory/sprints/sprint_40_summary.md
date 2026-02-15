# Sprint 40 Summary — Scheduled Cron Jobs

> Date: 2026-02-15 | Status: COMPLETE

## Goals
1. Implement scheduled weekly email reports for Pro users
2. Create daily trend analysis cron job for Plus+ users
3. Add email_reports_enabled preference column
4. Update notification settings UI

## Deliverables

### Weekly Email Reports Edge Function (`supabase/functions/send-weekly-reports/`)

**index.ts**
- Queries all Pro users with email reports enabled
- Generates tank health summaries with health scores
- Creates HTML email using inline template
- Sends via Resend API
- Supports `dry_run` and `user_id` parameters for testing

Features:
- Health score calculation matching client-side algorithm
- Color-coded status badges (excellent/good/fair/poor/critical)
- Parameter alerts section
- Maintenance issues section
- Upcoming tasks (next 7 days)
- "View Full Dashboard" CTA
- Unsubscribe link in footer

### Daily Trend Analysis Edge Function (`supabase/functions/run-daily-trend-analysis/`)

**index.ts**
- Iterates through all tanks
- Filters to Plus+/Pro tier users only
- Calls existing `analyze-parameter-trends` function for each tank
- Aggregates results and returns summary
- Supports `dry_run` mode

### Database Migration

**`20260215074332_add_email_reports_enabled.sql`**
- Adds `email_reports_enabled` BOOLEAN column to `notification_preferences`
- Defaults to `true` for new users
- Separate from general `email_enabled` setting

### Notification Settings Update

**`src/app/(dashboard)/settings/notifications/page.tsx`**
- Added `email_reports_enabled` to preferences interface
- Updated fetch to read new column
- Updated save to persist new column
- Email Reports toggle now uses dedicated column

## Commits
- `bfb76b4` - Add scheduled cron jobs for email reports and trend analysis (Sprint 40)

## Verification
- TypeScript: PASS
- Build: PASS

## Cron Schedule (To Be Configured in Supabase Dashboard)

| Function | Recommended Schedule | Purpose |
|----------|---------------------|---------|
| `send-weekly-reports` | Every Sunday 8am UTC | Weekly tank health digest |
| `run-daily-trend-analysis` | Daily 6am UTC | Proactive trend detection |
| `send-maintenance-reminders` | Every 15 min | Task reminders |

## What This Unlocks

- **Passive Engagement**: Pro users stay informed without opening the app
- **Automated Alerts**: Plus+ users get trend alerts without manual triggers
- **Scheduled Delivery**: Foundation for R-104.2 weekly report delivery
- **User Control**: Email reports can be enabled/disabled per user preference

## Files Created
| File | Purpose |
|------|---------|
| `supabase/functions/send-weekly-reports/index.ts` | Weekly email report Edge Function |
| `supabase/functions/run-daily-trend-analysis/index.ts` | Daily trend analysis cron |
| `supabase/migrations/20260215074332_add_email_reports_enabled.sql` | New preference column |

## Files Modified
| File | Changes |
|------|---------|
| `src/app/(dashboard)/settings/notifications/page.tsx` | Added email_reports_enabled support |

## Remaining Setup

To activate cron jobs in production:
1. Go to Supabase Dashboard → Database → pg_cron
2. Or use Supabase CLI to configure schedules
3. Set `RESEND_API_KEY` in Supabase Edge Function secrets

Example pg_cron setup:
```sql
-- Weekly reports every Sunday at 8am UTC
SELECT cron.schedule(
  'weekly-email-reports',
  '0 8 * * 0',
  $$SELECT net.http_post(
    url := 'https://mtwyezkbmyrgxqmskblu.supabase.co/functions/v1/send-weekly-reports',
    headers := '{"Authorization": "Bearer YOUR_SERVICE_KEY"}'::jsonb
  )$$
);

-- Daily trend analysis at 6am UTC
SELECT cron.schedule(
  'daily-trend-analysis',
  '0 6 * * *',
  $$SELECT net.http_post(
    url := 'https://mtwyezkbmyrgxqmskblu.supabase.co/functions/v1/run-daily-trend-analysis',
    headers := '{"Authorization": "Bearer YOUR_SERVICE_KEY"}'::jsonb
  )$$
);
```
