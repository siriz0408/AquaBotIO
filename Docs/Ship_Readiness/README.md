# AquaBotAI Ship Readiness Documentation

This directory contains comprehensive operational documentation for AquaBotAI, an AI-powered aquarium management PWA targeting launch in late May 2026 (Week 14).

## Documents

### 05_Release_Notes_Launch_Checklist.md
**Comprehensive launch preparation document** for AquaBotAI v1.0.0 MVP.

**Contains:**

1. **Public Release Notes (User-Facing)**
   - Elevator pitch: What is AquaBotAI?
   - Feature highlights (auth, tanks, AI chat, parameters, species DB, tasks, billing, PWA, admin v1)
   - Pricing table (Free, Starter $3.99, Plus $7.99, Pro $14.99)
   - System requirements & PWA installation
   - Known limitations & honest workarounds (photo diagnosis, equipment tracking, streaming, iOS push, email reports, etc.)
   - What's coming next (P1 teaser: photo diagnosis, equipment tracking, dashboards, admin v2, streaming)
   - Support contact info

2. **Internal Release Notes (Developer-Facing)**
   - Tech stack choices & rationale (Next.js, TypeScript, Supabase, Claude Sonnet 4.5, Stripe, etc.)
   - Key design decisions (non-streaming v1, per-tank AI context, tier-gated tanks, offline queue, SQL admin)
   - Database schema v1.0.0 (users, tanks, parameters, species, tasks, ai_messages, subscriptions, audit_logs)
   - Technical debt carried forward (acceptable list with timelines)
   - Outstanding questions resolution (8 items, all addressed)
   - API versioning strategy (URL-based for MVP)

3. **Launch Day Checklist (T-7 to T+7)**
   - **T-7:** Staging verification, security checklist, backup verification
   - **T-3:** Environment freeze, final data seed, DNS/SSL verification
   - **T-1:** Smoke tests, Stripe live mode, monitoring alerts
   - **T-0 (Launch Day):** Pre-launch, deploy sequence, smoke tests, announcement, live monitoring
   - **T+1:** First 24-hour metrics, error review, support triage, cost monitoring
   - **T+3:** User feedback, hotfix deployment, feature monitoring
   - **T+7:** Week 1 retrospective, metrics summary, hotfix prioritization, production health check
   - Each checkpoint has specific checkbox items (50+ total)

4. **Support Handoff & Operations**
   - **FAQ (User-Facing):** 20+ FAQs covering auth, billing, features, technical support
   - **Admin Operations:** SQL queries for:
     - User lookup (by email, ID, week-1 signups)
     - Reset AI usage counter
     - Subscription management (view, extend trial, upgrade/downgrade)
     - Tank management (view, soft-delete)
     - Audit logs (recent actions, user-specific)
   - **Troubleshooting Guide:** 5 common scenarios with diagnosis & resolution steps
     - User can't log in
     - AI responses not generating
     - Push notifications not firing
     - Stripe subscription not syncing
   - **Escalation Paths:** When to contact Anthropic, Stripe, Supabase, Vercel

5. **Analytics Validation Checklist**
   - Event tracking infrastructure setup
   - User journey events (signup, login, onboarding completion, tank creation, parameter logging)
   - Feature usage events (tanks, parameters, AI chat, species, tasks, notifications)
   - Billing events (trial, subscriptions, payments)
   - Engagement metrics (DAU, WAU, MAU, session duration)
   - 25+ specific metric queries
   - Pre-launch & launch-day validation items

6. **Go/No-Go Decision Framework**
   - **Hard Blockers:** Must fix before launch (security, critical features, data integrity, infrastructure)
   - **Soft Blockers:** Launch but acknowledge (deferred features, platform limitations, minor issues)
   - **Decision Criteria:** 48 hours before, 24 hours before, what to do if bugs found
   - **Solo Dev Decision Log:** Fill-in-the-blanks template for final call

7. **Appendices**
   - Vercel deployment commands
   - Stripe test card numbers
   - Monitoring commands
   - Rollback procedure
   - Support SQL queries (DAU, revenue, errors, tier limits)
   - Document version history

**Key Features:**
- 1,309 lines of launch-focused guidance
- Checkbox format throughout (easy to follow & track progress)
- Practical & honest tone (known limitations clearly documented)
- Solo dev friendly (decision framework designed for one person)
- Comprehensive yet focused (only MVP v1.0 scope)
- Ready-to-use queries & commands

---

## Documents

### 04_Runbook_Ops_Guide.md
The primary operational reference for solo developers and on-call engineers.

**Contains:**

1. **Service Health Dashboard** (6 services monitored)
   - Vercel (frontend/API routes)
   - Supabase (database, auth, storage, edge functions)
   - Anthropic Claude API (AI backbone)
   - Stripe (billing)
   - Resend (email delivery)
   - SerpAPI (web search)
   
   For each service: what to monitor, tools, alert thresholds, health checks

2. **Alert Definitions** (16 alerts)
   - Critical: 5 alerts (page immediately)
   - Warning: 6 alerts (morning check)
   - Info: 5 alerts (log only)

3. **Common Failure Scenarios** (15 detailed runbooks)
   1. Anthropic API outage / rate limited
   2. Stripe webhook delivery failure
   3. Supabase database connection limit hit
   4. Push notification delivery failure
   5. Service worker stuck on old cache
   6. User locked out (magic link not arriving)
   7. AI response hanging / timeout
   8. Billing state mismatch (user paid but features locked)
   9. Photo upload failure (storage limit, file too large)
   10. Cron job failure (maintenance notifications not sending)
   11. RLS policy misconfiguration (users seeing other users' data)
   12. Memory/CPU spikes on Edge Functions
   13. DNS/SSL certificate issues
   14. Species data corruption
   15. Trial expiration not triggering correctly

   Each scenario includes: symptoms, diagnosis steps, resolution steps, prevention

4. **Backup & Restore Procedures**
   - Supabase database backups (automatic + manual)
   - Point-in-time recovery
   - Species seed data backup
   - Storage backup strategy
   - Stripe data reconciliation

5. **Scheduled Jobs & Cron Tasks** (7 jobs)
   - Notification scheduling (every 15 min)
   - Email report generation (daily/weekly)
   - Soft-delete cleanup (daily/weekly)
   - AI usage counter reset (midnight UTC)
   - Equipment lifespan alerts (daily)
   - Subscription grace period check (daily)
   - Database maintenance (weekly)

6. **Operational Procedures** (8 procedures)
   - Add new admin user
   - Override user subscription tier
   - Ban/suspend user
   - Issue credit or extend trial
   - Add new species
   - Update AI system prompts
   - Toggle feature flag
   - Clear user's offline queue

7. **Incident Response Template**
   - Fill-in-the-blanks format
   - Timeline, root cause, impact, resolution, follow-up

8. **On-Call Guide for Solo Dev**
   - What pages you (critical only)
   - What to check in morning
   - Emergency checklist (when paged at 2am)
   - Degraded mode examples
   - Automation strategies
   - Self-care rules
   - Post-incident checklist

9. **Quick Command Reference**
   - Health checks
   - Log viewing
   - Database access
   - Cache clearing
   - Webhook replay
   - Deployment commands

## Key Features

- **903 lines** of detailed operational guidance
- **Practical CLI commands** for every scenario
- **SQL queries** for diagnosis and remediation
- **API calls** for webhook replay, Stripe operations, email sending
- **Step-by-step procedures** suitable for 2am emergency response
- **Prevention measures** to reduce incident frequency
- **Real-world scenarios** based on AquaBotAI's architecture

## Usage

### For Daily Operations
1. Review "Service Health Dashboard" weekly
2. Monitor alert definitions via Sentry, Vercel, Supabase dashboards
3. Run scheduled jobs via cron (see Section 5)

### For Emergencies
1. Jump to "Common Failure Scenarios" matching your symptoms
2. Follow "Diagnosis Steps" to confirm issue
3. Execute "Resolution Steps" in order
4. Use "Quick Command Reference" for CLI help
5. Document in "Incident Response Template"

### For Routine Tasks
1. Refer to "Operational Procedures" for admin tasks
2. Use "Scheduled Jobs" section for cron maintenance
3. Check "Backup & Restore" before major migrations

## Solo Dev Best Practices

From Section 8 (On-Call Guide):

**Critical Issues (Page immediately):**
- Anthropic API down > 1 hour
- Database connection pool exhausted
- Stripe webhooks failing repeatedly
- Auth system down
- Active security breach

**Non-Critical (Check in morning):**
- Error rate > 5%
- Storage quota > 90%
- Failed payments not recovering
- Slow queries
- Email delivery issues

**Automation Strategy:**
- Auto-retry failed API calls with exponential backoff
- Auto-queue failed jobs for retry
- Auto-detect anomalies in error rates
- Let batch jobs run unattended (Resend will retry, crons queue)

## Technology Stack

- **Frontend/API:** Next.js 14, TypeScript, Vercel
- **Database:** Supabase (PostgreSQL 15)
- **Auth:** Supabase Auth + Magic Links
- **Storage:** Supabase Storage (tank photos, diagnosis images)
- **Edge Functions:** Supabase Edge Functions (Node.js runtime)
- **AI:** Anthropic Claude Sonnet 3.5
- **Billing:** Stripe (subscriptions, webhooks)
- **Email:** Resend (transactional + reports)
- **Search:** SerpAPI (for aquarium care research)
- **Push Notifications:** Web Push API (Service Worker)
- **Monitoring:** Sentry, Vercel Analytics

## Database

- **22 tables** with RLS policies
- **Soft deletes** (90-day retention for tanks, 30-day for photos)
- **Subscription tiers:** Free (10 msgs/day), Starter (100), Plus (200), Pro (unlimited)
- **Species catalog** (100+ aquatic species with care parameters)

## Maintenance Schedule

**Daily:**
- Notification scheduler (15-min intervals)
- Email reports generation (6am UTC)
- Soft-delete cleanup (photos, 2am UTC)
- Equipment lifespan alerts (9am UTC)
- Grace period payment retry (6am UTC)

**Weekly:**
- Soft-delete cleanup (tanks, Sunday 3am UTC)
- Database maintenance/VACUUM (Sunday 4am UTC)

**Monthly:**
- Stripe data export/reconciliation
- Feature flag review
- Slow query analysis

**As-needed:**
- Backup before migrations
- Species data updates
- AI system prompt improvements

## Contact & Escalation

For production incidents:
1. Check this runbook first
2. Follow diagnosis steps
3. If unresolved in 30 min: escalate to Supabase/Anthropic support
4. Document in incident template
5. Post-mortem within 24 hours

---

**Document Updated:** February 2026
**For:** AquaBotAI Solo Development Team
**Scope:** Production Operational Procedures

