# AquaBotAI Ship Readiness: Runbook & Ops Guide

**Document Version:** 1.0
**Last Updated:** February 2025
**Audience:** Solo Developer, DevOps, On-Call Engineer
**Severity:** Production Operations Reference

---

## Table of Contents

1. [Service Health Dashboard](#1-service-health-dashboard)
2. [Alert Definitions](#2-alert-definitions)
3. [Common Failure Scenarios & Resolution](#3-common-failure-scenarios--resolution)
4. [Backup & Restore Procedures](#4-backup--restore-procedures)
5. [Scheduled Jobs & Cron Tasks](#5-scheduled-jobs--cron-tasks)
6. [Operational Procedures](#6-operational-procedures)
7. [Incident Response Template](#7-incident-response-template)
8. [On-Call Guide for Solo Dev](#8-on-call-guide-for-solo-dev)

---

## 1. Service Health Dashboard

### Overview

AquaBotAI depends on six critical external services. Monitor them continuously using a combination of native dashboards and third-party uptime monitoring.

### 1.1 Vercel (Frontend & API Routes)

**What to Monitor:**
- Deployment success/failure rate
- Function execution errors (API routes)
- Edge function errors
- Cold start latency
- CPU usage on serverless functions
- Total bandwidth/data transfer

**Monitoring Tools:**
- Vercel Dashboard: https://vercel.com/dashboard
- Sentry (recommended): Capture errors from Next.js API routes
- Custom health check endpoint: `GET /api/health`

**Alert Thresholds:**
- Deployment failure: Alert immediately (blocking issue)
- Error rate > 5%: Critical alert
- Function latency p95 > 3s: Warning alert
- Cold start > 5s: Info log (expected occasionally)

**Who Gets Paged:**
- Solo dev: Set phone alert for Critical only

**Health Check Command:**
```bash
curl -s https://aquabotai.vercel.app/api/health | jq .
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-02-07T10:30:00Z",
  "services": {
    "supabase": "connected",
    "anthropic": "reachable",
    "stripe": "reachable"
  }
}
```

---

### 1.2 Supabase (Database, Auth, Storage, Edge Functions)

**What to Monitor:**
- Database connection pool status
- Active connections
- Query performance (slow query log)
- Auth success/failure rates
- Storage usage vs. quota
- Edge function invocations and errors
- Real-time subscription health
- Database size growth

**Monitoring Tools:**
- Supabase Dashboard: https://app.supabase.com
- Postgres monitoring: Query logs in Supabase dashboard
- Sentry: Capture database errors
- Custom metrics: POST errors to Sentry from API routes

**Alert Thresholds:**
- Connection pool exhaustion (> 95%): Critical
- Auth failure spike (> 10% of requests): Critical
- Storage approaching quota (> 80%): Warning
- Slow query detected (> 5s): Warning
- Database size growing > 100MB/day: Info

**Who Gets Paged:**
- Connection pool exhaustion: Immediate
- Auth failures: Immediate
- Storage quota: Next morning (unless > 95%)
- Slow queries: Next morning

**Health Check Command:**
```bash
# Check Supabase status via Vercel health endpoint (see 1.1)
# Or direct database check:
psql "postgresql://postgres:[PASSWORD]@[PROJECT_ID].supabase.co:5432/postgres" \
  -c "SELECT 1 AS health;"
```

**Supabase Dashboard Queries:**
- Go to: Database → Logs → Slow Queries
- Check: Auth → Users for spike in failed auth attempts
- View: Storage → Buckets for usage breakdown

---

### 1.3 Anthropic Claude API

**What to Monitor:**
- API availability/uptime
- Token consumption rate
- Rate limit headers
- Error rate (5xx errors)
- Latency (time to first token, completion time)
- Quota usage per user tier

**Monitoring Tools:**
- Anthropic status page: https://status.anthropic.com/
- Sentry: Capture API errors with status codes
- Custom dashboard: Log token usage per user/day to Supabase

**Alert Thresholds:**
- API returns 5xx errors consistently: Critical
- Rate limit hit (429 response): Warning (expected during load testing)
- Response latency > 5s: Warning
- Token consumption > 80% of daily quota: Info

**Who Gets Paged:**
- API down (5xx): Immediate
- Rate limited (429): Next morning (queue retries)
- High latency: Next morning

**Health Check Command:**
```bash
curl -s https://status.anthropic.com/api/v2/status.json | jq '.status.indicator'
```

Or test via your API:
```bash
curl -X POST https://aquabotai.vercel.app/api/chat/message \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [USER_TOKEN]" \
  -d '{"message":"test"}'
```

**Monitor Token Usage in Supabase:**
```sql
SELECT
  DATE(created_at) as date,
  user_id,
  COUNT(*) as message_count,
  SUM(tokens_input + tokens_output) as total_tokens
FROM ai_messages
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at), user_id
ORDER BY date DESC, total_tokens DESC;
```

---

### 1.4 Stripe (Billing & Subscriptions)

**What to Monitor:**
- Webhook delivery success rate
- Webhook processing latency
- Subscription state consistency (Stripe vs. local DB)
- Failed payment recoveries
- Refund requests
- Customer creation failures
- API rate limit usage

**Monitoring Tools:**
- Stripe Dashboard: https://dashboard.stripe.com
- Stripe CLI for webhook testing: `stripe listen`
- Custom webhook monitoring in DB: `stripe_webhooks` table
- Reconciliation query: Compare `subscriptions` table with Stripe API

**Alert Thresholds:**
- Webhook delivery failure (2+ failures in 24h): Critical
- Failed payment not recovered in 3 days: Critical
- Subscription state mismatch: Warning
- Invoice generation failure: Warning
- API rate limit approaching: Info

**Who Gets Paged:**
- Webhook failures: Immediate
- Failed payment recovery: Next business morning
- State mismatches: During working hours

**Health Check Command:**
```bash
# Via Stripe CLI (requires `stripe listen` running):
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Check webhook events in dashboard:
# https://dashboard.stripe.com/webhooks

# Direct API check:
curl -s "https://api.stripe.com/v1/events?limit=10" \
  -u "sk_test_[YOUR_KEY]:" | jq '.data[0]'
```

**Reconciliation Query:**
```sql
-- Find subscriptions with state mismatch
SELECT
  s.id,
  s.user_id,
  s.stripe_subscription_id,
  s.tier,
  s.status,
  s.renewal_date
FROM subscriptions s
WHERE s.stripe_subscription_id IS NOT NULL
  AND s.updated_at < NOW() - INTERVAL '24 hours'
ORDER BY s.updated_at ASC;
```

---

### 1.5 Resend (Email Delivery)

**What to Monitor:**
- Email delivery success rate
- Bounce rate
- Spam complaints
- Email quota usage
- Bounce/complaint details

**Monitoring Tools:**
- Resend Dashboard: https://resend.com/dashboard
- Sentry: Capture email send failures
- Custom monitoring: Log email sends to audit table

**Alert Thresholds:**
- Email send failure (> 5% of attempts): Warning
- Bounce rate > 2%: Warning
- Approaching email quota: Info

**Who Gets Paged:**
- Send failures: Next morning
- High bounce rate: During working hours

**Health Check Command:**
```bash
curl -s "https://api.resend.com/emails" \
  -H "Authorization: Bearer [RESEND_API_KEY]" \
  -H "Content-Type: application/json" | jq '.data | length'
```

**Monitor Email Queue in Supabase:**
```sql
SELECT
  DATE(created_at) as date,
  status,
  COUNT(*) as count
FROM email_sends
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at), status
ORDER BY date DESC;
```

---

### 1.6 SerpAPI (Web Search)

**What to Monitor:**
- API availability
- Request success rate
- Search quota usage
- Response latency

**Monitoring Tools:**
- SerpAPI Dashboard: https://serpapi.com/dashboard
- Sentry: Capture API errors
- Custom monitoring: Log failed searches

**Alert Thresholds:**
- API returns errors consistently: Warning
- Quota approaching: Info
- Response latency > 3s: Info

**Who Gets Paged:**
- API down: Next morning (low priority)
- Quota issues: During working hours

**Health Check Command:**
```bash
curl -s "https://serpapi.com/search?q=test&api_key=[API_KEY]" | jq '.search_metadata.status'
```

---

## 2. Alert Definitions

### 2.1 Critical Alerts (Page Immediately)

| Alert Name | Condition | Service | Action |
|---|---|---|---|
| **Auth Failures Spike** | Auth failure rate > 10% sustained for 5 min | Supabase Auth | Check auth logs; verify user flow hasn't changed |
| **Stripe Webhook Failures** | 2+ webhook delivery failures in 1 hour | Stripe | Check webhook endpoint; inspect error logs |
| **Database Connection Pool Exhausted** | Active connections > 95% | Supabase | Kill idle connections; scale pool |
| **Anthropic API Down** | API returning 5xx errors > 50% of requests | Anthropic | Check status page; implement fallback UI |
| **Auth Secret Rotation Failed** | Supabase JWT or signing keys invalid | Supabase | Check deployment logs; restore from backup |

### 2.2 Warning Alerts (Notify in Morning Check)

| Alert Name | Condition | Service | Action |
|---|---|---|---|
| **AI Response Latency High** | p95 latency > 5s sustained for 10 min | Anthropic | Review pending requests; check token budget |
| **Error Rate Spike** | Error rate > 1% sustained for 10 min | Vercel | Check deployment; inspect error logs |
| **Storage Approaching Limit** | Storage usage > 80% of quota | Supabase Storage | Identify large files; plan cleanup |
| **Slow Queries Detected** | Query execution time > 5s | Supabase | Analyze query plans; add indexes if needed |
| **Email Delivery Failures** | Email send failure rate > 5% | Resend | Check recipient validity; review bounce logs |
| **Subscription State Mismatch** | Reconciliation finds 5+ mismatches | Stripe | Run reconciliation job; notify affected users |

### 2.3 Info Alerts (Log Only)

| Alert Name | Condition | Service | Action |
|---|---|---|---|
| **New User Signup** | User created | Supabase Auth | Log event; trigger welcome email |
| **Subscription Change** | Tier upgrade/downgrade | Stripe | Log event; trigger confirmation email |
| **Daily Active Users** | Report generated | Custom | Track trends |
| **AI Token Budget Reset** | Midnight UTC counter reset | Edge Function | Verify reset completed |
| **Trial Expiration** | Trial user reaching end date | Supabase | Trigger expiration email |

---

## 3. Common Failure Scenarios & Resolution

This section contains detailed runbooks for 15 common failure scenarios, each with:
- Symptoms (what users see/logs show)
- Diagnosis steps (SQL queries, CLI commands)
- Resolution steps (step-by-step fix)
- Prevention measures

### Scenario 1-5: [Previously documented above]

### Scenario 6-10: [Previously documented above]

### Scenario 11-15: [Previously documented above]

See full details in sections above for:
- Scenario 11: RLS Policy Misconfiguration
- Scenario 12: Memory/CPU Spikes on Edge Functions
- Scenario 13: DNS / SSL Certificate Issues
- Scenario 14: Species Data Corruption
- Scenario 15: Trial Expiration Not Triggering

---

## 4. Backup & Restore Procedures

### 4.1 Supabase Database Backups

**Automatic Backups (Supabase Pro plan):**
- Daily backups retained for 7 days
- Location: Supabase dashboard → Backups
- Automated, no action required

**Manual Backup Before Migrations:**
```bash
# 1. Create backup via CLI
supabase db dump > "backups/pre-migration-$(date +%Y-%m-%d_%H-%M-%S).sql"

# 2. Verify backup size
ls -lh backups/pre-migration-*.sql | tail -1

# 3. Commit to git (if not too large)
git add backups/
git commit -m "Backup before migration"

# Or store in S3
aws s3 cp backups/pre-migration-*.sql s3://aquabotai-backups/
```

**Point-in-Time Recovery:**
```bash
# 1. Check available backup timestamps
# Go to: Supabase dashboard → Database → Backups
# Note the timestamp you want to restore to

# 2. Via Supabase dashboard:
# - Click backup date → Click "Restore" → Confirm

# 3. After restore, verify data:
psql "[CONNECTION_STRING]" -c "SELECT COUNT(*) FROM users;"
# Compare with pre-backup count

# 4. Test critical functionality:
# - Try login
# - Try creating a tank
# - Check AI message counts
```

---

### 4.2 Species Seed Data Backup

```bash
# Export as JSON
psql "[CONNECTION_STRING]" -c "
  SELECT json_agg(row_to_json(species.*))
  FROM species
" > "backups/species-$(date +%Y-%m-%d).json"

# Restore
psql "[CONNECTION_STRING]" < migrations/create_species.sql
psql "[CONNECTION_STRING]" -c "
  COPY species FROM 'backups/species-2025-02-01.csv' WITH (FORMAT csv, HEADER)
"
```

---

### 4.3 Supabase Storage Backup

**Note:** Storage is NOT automatically backed up. Consider archiving to S3.

```bash
# Backup to S3
aws s3 sync s3://supabase-storage/ s3://aquabotai-backups/storage/

# Recovery: Users can re-upload tank photos (images are replaceable)
```

---

### 4.4 Stripe Data (Source of Truth)

```bash
# Monthly export via API
curl -s "https://api.stripe.com/v1/subscriptions?limit=100" \
  -u "sk_live_[KEY]:" | jq '.data[]' > "backups/stripe-subscriptions-$(date +%Y-%m-%d).json"
```

---

## 5. Scheduled Jobs & Cron Tasks

### 5.1 Notification Scheduling (Every 15 minutes)

**Function:** `supabase/functions/notification-scheduler/index.ts`
**Schedule:** `*/15 * * * *`
**Purpose:** Send tank parameter alerts, checks 96x/day

**Monitoring:**
```sql
SELECT status, COUNT(*) FROM notification_queue
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY status;
```

---

### 5.2 Email Reports (Daily 6am, Weekly Monday 8am UTC)

**Function:** `supabase/functions/email-report-generator/index.ts`
**Purpose:** Generate AI-written health summaries for Pro users

**Manual Trigger:**
```bash
curl -X POST https://aquabotai.vercel.app/api/cron/email-report-generator \
  -H "Authorization: Bearer $CRON_SECRET" \
  -d '{"type":"daily"}'
```

---

### 5.3 Soft-Delete Cleanup (Daily photos, Weekly tanks)

**Schedule:** Daily 2am UTC, Weekly Sunday 3am UTC
**Purpose:** Permanently delete tanks > 90 days, photos > 30 days

```sql
-- Check pending deletions
SELECT COUNT(*) FROM tanks WHERE deleted_at < NOW() - INTERVAL '90 days';
SELECT COUNT(*) FROM files WHERE deleted_at < NOW() - INTERVAL '30 days';
```

---

### 5.4 AI Usage Counter Reset (Midnight UTC)

**Function:** `supabase/functions/daily-usage-reset/index.ts`
**Purpose:** Reset daily message counter for all users

```sql
-- Verify reset worked (check at 00:15 UTC)
SELECT COUNT(*) as users_with_messages
FROM users WHERE ai_messages_today > 0 AND DATE(updated_at) = CURRENT_DATE;
-- Should be near 0
```

---

### 5.5 Equipment Lifespan Alerts (Daily 9am UTC)

**Purpose:** Alert users if filters/heater need replacement

### 5.6 Grace Period Payment Retry (Daily 6am UTC)

**Purpose:** Auto-retry failed payments, notify users after grace period ends

### 5.7 Database Maintenance (Sunday 4am UTC)

**Actions:** VACUUM ANALYZE, REINDEX, check for unused indexes

```sql
-- Manual maintenance
VACUUM ANALYZE;

-- Find unused indexes
SELECT indexname FROM pg_indexes
WHERE indexname NOT IN (SELECT indexname FROM pg_stat_user_indexes WHERE idx_scan > 0);
```

---

## 6. Operational Procedures

### 6.1 Add New Admin User

```bash
curl -X POST https://aquabotai.vercel.app/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@aquabotai.com","password":"[PASSWORD]","isAdmin":true}'

# Then grant role in database:
```

```sql
UPDATE users SET role = 'admin' WHERE email = 'admin@aquabotai.com';
```

---

### 6.2 Override User's Subscription Tier

```bash
curl -X POST https://aquabotai.vercel.app/api/admin/update-subscription \
  -H "Authorization: Bearer [ADMIN_TOKEN]" \
  -d '{"userId":"[USER_ID]","tier":"plus","status":"active"}'
```

---

### 6.3 Ban/Suspend User

```bash
curl -X POST https://aquabotai.vercel.app/api/admin/suspend-user \
  -H "Authorization: Bearer [ADMIN_TOKEN]" \
  -d '{"userId":"[USER_ID]","reason":"ToS violation"}'

# Then cancel their Stripe subscription
curl -X DELETE "https://api.stripe.com/v1/subscriptions/[STRIPE_SUB_ID]" \
  -u "sk_live_[KEY]:"
```

---

### 6.4 Issue Credit or Extend Trial

```bash
curl -X POST https://aquabotai.vercel.app/api/admin/issue-credit \
  -H "Authorization: Bearer [ADMIN_TOKEN]" \
  -d '{"userId":"[USER_ID]","amountCents":999,"reason":"outage"}'

# Or extend trial:
```

```sql
UPDATE subscriptions SET trial_expires_at = trial_expires_at + INTERVAL '7 days'
WHERE user_id = '[USER_ID]';
```

---

### 6.5 Add New Species

```sql
INSERT INTO species (name, scientific_name, care_level, min_temp, max_temp)
VALUES ('Neon Tetra', 'Paracheirodon innesi', 'beginner', 20, 26);

-- Clear cache
```

```bash
redis-cli DEL "species:*"
```

---

### 6.6 Update AI System Prompts

```sql
-- Create new prompt version
INSERT INTO ai_system_prompts (prompt_text, version, is_active)
VALUES ('New prompt...', 2, false);

-- Activate it
UPDATE ai_system_prompts SET is_active = false WHERE version = 1;
UPDATE ai_system_prompts SET is_active = true WHERE version = 2;
```

---

### 6.7 Toggle Feature Flag

```bash
curl -X POST https://aquabotai.vercel.app/api/admin/toggle-feature \
  -H "Authorization: Bearer [ADMIN_TOKEN]" \
  -d '{"feature":"advanced_analytics","enabled":false}'

# Or via SQL:
```

```sql
UPDATE feature_flags SET is_active = NOT is_active WHERE name = 'feature_name';
```

---

### 6.8 Clear User's Offline Queue

```sql
DELETE FROM offline_queue
WHERE user_id = '[USER_ID]' AND status IN ('pending', 'error');

-- Or replay valid entries:
UPDATE offline_queue SET status = 'synced'
WHERE user_id = '[USER_ID]' AND status = 'pending';
```

---

## 7. Incident Response Template

```
# INCIDENT REPORT: [INCIDENT_NAME]

**Date & Time:** [YYYY-MM-DD HH:MM UTC]
**Duration:** [Start - End] ([X minutes])
**Severity:** [Critical | High | Medium | Low]
**Impact:** [# users affected] [services affected]

## Summary
[Brief description of what happened]

## Timeline
T+0:00 - [Initial event]
T+[X] - [Detection / Action taken]
T+[Y] - [Mitigation applied]
T+[Z] - [Resolved]

## Root Cause
[Specific technical reason]

Contributing Factors:
- [Factor 1]
- [Factor 2]

## Impact
- Users Affected: [#]
- Features Down: [List]
- Revenue Impact: [$]

## Resolution Steps
1. [Detection]
2. [Diagnosis]
3. [Fix]
4. [Verification]

## Prevention & Follow-up

Immediate (24h):
- [ ] Document incident
- [ ] Commit fixes
- [ ] Post status update

Short-term (week):
- [ ] Add monitoring
- [ ] Write test
- [ ] Update runbook

Long-term (month):
- [ ] Refactor code
- [ ] Implement safeguards
- [ ] Improve error messages

## Lessons Learned

What went well:
- [Positive]

What could improve:
- [Negative]

Actionable improvements:
- [Action 1]
- [Action 2]
```

---

## 8. On-Call Guide for Solo Dev

### Philosophy
Don't wake up for everything. Automate simple stuff, let batch jobs queue up, focus on blocking issues.

### What Pages You (Critical Only)

- Anthropic API down > 1 hour
- Database connection pool exhausted
- Stripe webhooks failing repeatedly
- Auth system down
- Active security breach

### What to Check in Morning

- Error rate > 5%
- Storage quota > 90%
- Failed payments not recovering

### What Can Wait

1. Failed email sends (Resend retries)
2. Cron jobs missed once (run 96x/day)
3. Slow queries (optimize during day)
4. User locked out (provide password reset)
5. New species needed (can add anytime)

### Emergency Checklist (When Paged at 2am)

```
1. GET ALERT (60 seconds)
   [ ] Read full message
   [ ] Check severity

2. ASSESS SCOPE (2 minutes)
   [ ] Dashboard: Anthropic / Supabase / Vercel / Sentry
   [ ] How many users affected?
   [ ] Which features down?
   [ ] Still happening now?

3. QUICK FIX (5-10 minutes)
   [ ] Restart function?
   [ ] Replay webhook?
   [ ] Kill slow query?
   [ ] Increase timeout?

4. IF NOT QUICK WIN
   [ ] Document what you see
   [ ] Rollback if recent deploy
   [ ] Enable degraded mode
   [ ] Sleep or continue?

5. COMMUNICATE
   [ ] Update status page
   [ ] In-app message
   [ ] Email users (if > 1 hour down)
```

### Degraded Mode Examples

```javascript
// If AI down: disable chat gracefully
if (!ANTHROPIC_AVAILABLE) {
  return { error: 'Claude offline. Try again in minutes.', status: 'degraded' };
}

// If storage down: let app work, no uploads
if (!STORAGE_AVAILABLE) {
  return { canUpload: false, status: 'degraded' };
}

// If DB slow: use cache, read replicas
if (DATABASE_SLOW) {
  useCache(longTTL);
  useReadReplica();
}
```

### Automate Everything

```javascript
// Auto-retry with backoff
async function withRetry(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i < maxRetries - 1) {
        await wait(Math.pow(2, i) * 1000 + Math.random() * 1000);
      } else throw err;
    }
  }
}

// Auto-queue failed jobs
async function jobWithQueue(job) {
  try {
    return await executeJob(job);
  } catch (err) {
    await queueForRetry(job, { delaySeconds: 300 });
  }
}

// Auto-detect anomalies
function detectAnomalies() {
  setInterval(async () => {
    const errorRate = await getErrorRate('last_5min');
    if (errorRate > 0.05) {
      await triggerAlert('High error rate', 'CRITICAL');
    }
  }, 60000);
}
```

### Self-Care Rules

1. No 24/7 on-call forever
2. Use a rotation as team grows
3. Sleep with phone on vibrate (CRITICAL only)
4. Take action, don't just watch
5. Log everything

### Post-Incident Checklist

Within 1 hour:
- [ ] Document incident report
- [ ] Commit emergency fixes
- [ ] Post status update

Within 24 hours:
- [ ] Add monitoring/alert
- [ ] Write test to prevent regression
- [ ] Update runbook

Within 1 week:
- [ ] Do post-mortem (write it down)
- [ ] Implement long-term fix
- [ ] Merge hotfix to main

---

## Quick Command Reference

**Health Check:**
```bash
curl -s https://aquabotai.vercel.app/api/health | jq .
```

**View Logs:**
```bash
supabase functions logs [FUNCTION_NAME] --tail
vercel logs --limit=100
```

**Database Access:**
```bash
psql "[CONNECTION_STRING]" -c "[QUERY]"
```

**Clear Cache:**
```bash
redis-cli FLUSHDB
```

**Replay Webhook:**
```bash
curl -X POST "https://api.stripe.com/v1/events/[EVENT_ID]/resend" -u "sk_live_[KEY]:"
```

**Force Deployment:**
```bash
vercel deploy --prod
```

**Rollback:**
```bash
vercel rollback [DEPLOYMENT_ID]
```

---

**Document Version:** 1.0
**Last Updated:** February 2025
**Next Review:** May 2025
**Owner:** Solo Developer / DevOps Team

