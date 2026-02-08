# AquaBotAI MVP Release Notes & Launch Checklist
## v1.0.0 — Late May 2026

---

## Table of Contents
1. [Public Release Notes](#public-release-notes-v100)
2. [Internal Release Notes](#internal-release-notes)
3. [Launch Day Checklist (T-7 to T+7)](#launch-day-checklist-t-7-to-t7)
4. [Support Handoff & Operations](#support-handoff--operations)
5. [Analytics Validation Checklist](#analytics-validation-checklist)
6. [Go/No-Go Decision Framework](#gono-go-decision-framework)

---

# PUBLIC RELEASE NOTES (v1.0.0)

## What is AquaBotAI?

**AquaBotAI** is an AI-powered aquarium management assistant that helps you keep your fish, plants, and invertebrates thriving. Create digital profiles for your tanks, log water parameters in seconds, get AI-powered insights from Claude Sonnet 4.5, and never miss a maintenance task again.

Perfect for hobbyists, breeders, and aquarium enthusiasts who want smarter, data-driven aquarium care—without the complexity.

**Available as a Progressive Web App (PWA)** — install on your phone, tablet, or desktop. Works offline. Push notifications keep you on top of maintenance.

---

## What's Included in v1.0

### Authentication & Onboarding
- **Email/Password Sign-Up** — Create an account in seconds with email verification.
- **Google OAuth** — Log in instantly with your Google account (no new passwords to remember).
- **Magic Link Authentication** — Passwordless login via email link (perfect for shared devices).
- **Guided Onboarding** — Create your first tank and log your first water parameter in a ~2-minute setup flow.

### Tank Profiles
- **Tank CRUD** — Create, edit, delete, and view multiple tanks with custom names and photos.
- **Tank Photos** — Upload and store high-resolution tank photos for easy identification.
- **Tier-Gated Multi-Tank** — Starter users get 1 tank, Plus users get 5, Pro users get unlimited tanks.

### AI Chat Engine
- **Smart Aquarium Assistant** — Chat with Claude Sonnet 4.5 tuned for aquarium care questions.
- **Per-Tank Context** — The AI understands your specific tank setup, parameters, and livestock when you ask questions.
- **Action Execution** — The AI can suggest and help you log new parameters, schedule maintenance tasks, or add species notes directly.
- **Usage Tracking** — Keep track of your AI message count within your subscription tier.
- **Non-Streaming Responses** — Get complete, full responses (optimized for readability; streaming comes in a future update).

### Water Parameter Tracking
- **Quick Parameter Logging** — Log pH, ammonia, nitrite, nitrate, temperature, GH, KH, salinity, and custom parameters in seconds.
- **Beautiful Dashboards** — Visualize parameter trends over 7, 30, or 90 days using interactive Recharts graphs.
- **AI Trend Analysis** — Ask the AI about your parameter trends. Is pH drift normal? Should you worry about ammonia?
- **Safety Zones** — Each parameter displays safe (green), warning (yellow), and danger (red) zones for common aquarium setups.

### Species Database & Compatibility
- **800+ Aquatic Species** — Comprehensive database covering fish, plants, invertebrates, and more.
- **Full-Text Search** — Search by common name, scientific name, or type to find species instantly.
- **Livestock Tracking** — Log the species in your tank with photos and notes.
- **AI Compatibility Checking** — Ask the AI "Can I keep bettas with neon tetras?" and get instant species compatibility advice.

### Maintenance Scheduling
- **Task CRUD** — Create, edit, delete, and check off maintenance tasks (water changes, filter cleaning, etc.).
- **Recurring Tasks** — Set up weekly water changes or monthly deep cleans that automatically repeat.
- **Push Notifications** — Get browser and mobile push notifications so you never miss a maintenance deadline.
- **AI-Suggested Schedules** — Chat with the AI to get personalized maintenance schedules based on your tank type.

### Subscription & Billing
- **14-Day Free Trial** — Try all Premium features without entering a credit card.
- **Simple Pricing** — Three tiers: Starter ($3.99/mo), Plus ($7.99/mo), Pro ($14.99/mo).
- **Stripe Checkout** — Secure, trusted payment processing. Cancel anytime.

### Progressive Web App (PWA)
- **Install Anywhere** — Add AquaBotAI to your home screen on iOS, Android, or desktop. Feels like a native app.
- **Works Offline** — Parameter logs and tasks work even without internet. Syncs when you're back online.
- **Push Notifications** — Stay on top of maintenance tasks with browser and mobile push alerts.
- **Fast Loading** — Optimized service worker caches essential data for instant load times.

### Admin Portal v1
- **Supabase Dashboard Access** — Direct SQL-based admin access for bug investigation and user support.
- **Role-Based Access Control** — Admin accounts marked in the database.
- **Audit Logging** — All admin actions logged for accountability.
- **User Lookup & Support** — SQL queries to view accounts, reset AI usage, adjust subscriptions, and more.

---

## Pricing Breakdown

| Feature | Free | Starter ($3.99/mo) | Plus ($7.99/mo) | Pro ($14.99/mo) |
|---------|------|---------|--------|---------|
| **Tanks** | 1 | 1 | 5 | Unlimited |
| **AI Messages/Month** | 10 | Unlimited | Unlimited | Unlimited |
| **Water Parameters** | Yes | Yes | Yes | Yes |
| **Species Database** | Yes | Yes | Yes | Yes |
| **Maintenance Tasks** | Yes | Yes | Yes | Yes |
| **Push Notifications** | Yes | Yes | Yes | Yes |
| **Tank Photos** | Yes | Yes | Yes | Yes |
| **Priority Support** | — | — | Yes | Yes |
| **Beta Features** | — | — | — | Yes |
| **Trial** | 14 days | — | — | — |

All paid tiers include a **14-day free trial** with full feature access. No credit card required to start the trial.

---

## System Requirements

### Supported Browsers
- **Chrome/Edge:** Version 80+
- **Firefox:** Version 75+
- **Safari:** Version 13+
- **Mobile Safari (iOS):** Version 13+

### Device Requirements
- **Minimum RAM:** 2GB
- **Recommended RAM:** 4GB+
- **Network:** Broadband or LTE/4G (offline parameter queue works on slower connections)

### PWA Installation
- Supported on Chrome, Edge, Firefox, and mobile browsers (Android Chrome, iOS Safari).
- iOS users: Use "Add to Home Screen" from Safari menu.
- Android users: "Install" prompt appears automatically.

---

## Known Issues & Limitations

### Current Limitations (v1.0)

1. **No Photo Diagnosis Yet**
   - You can't upload a photo of your fish to get instant disease diagnosis.
   - **Workaround:** Describe symptoms in the AI chat for troubleshooting advice.
   - **Status:** Coming in Q2 2026 (Photo Diagnosis feature).

2. **No Equipment Tracking**
   - Can't log your heater, filter, or substrate details in a centralized inventory.
   - **Workaround:** Use tank notes to keep equipment records.
   - **Status:** Coming in Q2 2026.

3. **Non-Streaming AI Responses**
   - AI responses appear all at once instead of typing in real-time.
   - **Status:** Streaming responses coming in Q2 2026 for faster perceived responsiveness.

4. **No Email Reports**
   - Can't get weekly summary emails of parameter trends or maintenance reminders.
   - **Workaround:** Check your dashboard weekly, or set push notification reminders.
   - **Status:** Coming in Q2 2026.

5. **iOS Push Notifications — Limited Support**
   - Web push notifications don't work on iOS Safari due to platform limitations.
   - **Workaround:** iOS users receive email reminders for tasks instead. Enable email notifications in settings.
   - **Status:** This is a browser platform limitation; we'll explore alternatives in Q2.

6. **Admin Portal is SQL-Based**
   - No custom admin UI. Support tasks require direct database access via Supabase Studio.
   - **Status:** Custom admin dashboard coming in Phase 2 (post-MVP).

7. **USD Only**
   - Pricing only available in US Dollars.
   - **Workaround:** Use your credit card's currency conversion.
   - **Status:** Multi-currency support planned for Phase 2.

8. **No CSV/PDF Export**
   - Can't export your parameter data or maintenance logs.
   - **Workaround:** Screenshot graphs or ask the AI to summarize trends.
   - **Status:** Export features coming in Phase 2.

9. **Species Database is Curated (Not Exhaustive)**
   - 800+ species at launch, but not all aquatic species are included yet.
   - **Workaround:** Use the AI to ask about unlisted species—it has general aquarium knowledge.

10. **No Annual Billing or Promo Codes**
    - Only monthly subscription available at launch.
    - **Workaround:** You can pause your subscription and restart anytime.
    - **Status:** Annual billing and discount codes planned for Phase 2.

### Reported Bugs (Fixed in v1.0)
- ~~Token usage counter not resetting on billing cycle~~ Fixed
- ~~Google OAuth redirect loop on Firefox~~ Fixed
- ~~Service worker cache invalidation on updates~~ Fixed

---

## What's Coming Next (P1 — Jun-Aug 2026)

### Photo Diagnosis
- Upload a photo of your fish or plant, get instant AI diagnosis of diseases, nutritional deficiencies, and more using Claude Vision.

### Equipment Tracking & AI Recommendations
- Log your heater, filter, lighting, substrates, and fertilizers.
- Get AI-powered equipment recommendations and maintenance reminders tailored to your setup.

### Interactive Dashboards & Email Reports
- Beautiful multi-tank dashboards showing all tanks at a glance.
- Weekly or monthly email summaries of parameter trends and maintenance status.

### Admin Portal v2
- Custom React dashboard for support operations (no more SQL).
- User lookup, subscription management, analytics, and audit logs all in a polished UI.

### Streaming AI Responses
- Real-time AI response streaming for a more interactive chat experience.

---

## Feedback & Support

### Report a Bug
Email **support@aquabotai.io** with:
- **What happened:** Describe the issue clearly.
- **When it happened:** Approximate time and which action triggered it.
- **Your setup:** Browser, OS, device type.
- **Steps to reproduce:** If you can reliably trigger it again.

### Feature Requests
Have an idea? Share it at **support@aquabotai.io** with "Feature Request:" in the subject.

### Technical Support
- **Billing issues:** support@aquabotai.io
- **Account access:** support@aquabotai.io (include account email)
- **Feature help:** Use the in-app AI chat or email support@aquabotai.io

---

# INTERNAL RELEASE NOTES

## Architecture Decisions & Rationale

### Tech Stack Choices

| Component | Choice | Why |
|-----------|--------|-----|
| **Frontend Framework** | Next.js 14 (App Router) | Unified TypeScript, SSR support, built-in middleware, Vercel deployment |
| **Language** | TypeScript | Type safety catches bugs early, better IDE support, reduces runtime errors in production |
| **Backend/Database** | Supabase (PostgreSQL) | Open-source, managed Postgres, built-in auth, real-time subscriptions, Edge Functions for serverless |
| **Auth** | Supabase Auth + NextAuth.js | Multi-method auth (email/password, OAuth, magic link) with secure session management |
| **AI Engine** | Claude Sonnet 4.5 | Best speed/intelligence balance, vision support (future), affordable token pricing |
| **Payments** | Stripe | Industry standard, webhooks for subscription management, trusted by users |
| **Hosting** | Vercel | Zero-config Next.js deployments, edge functions, automatic scaling, free tier for testing |
| **Push Notifications** | Web Push API + Firebase Cloud Messaging | Browser-native, works offline, no vendor lock-in |
| **Charts/Dashboards** | Recharts | React-native, TypeScript support, responsive design, lightweight |
| **Storage** | Supabase Storage (S3-compatible) | Integrated with auth, CDN delivery, cheap per-GB |

---

## Database Schema Version

**Schema Version:** `v1.0.0`

Key tables at launch:
- `users` (auth, subscription tier, trial status)
- `tanks` (user-owned tanks with photos)
- `parameters` (logged water parameters)
- `species` (800+ species database)
- `tank_species` (livestock tracking)
- `tasks` (maintenance tasks)
- `ai_messages` (usage tracking)
- `subscriptions` (Stripe metadata)
- `audit_logs` (admin actions)

---

## Technical Debt Carried Into Launch

### Acceptable Debt

1. **Non-Streaming AI (v1)**
   - Impact: UX feels less interactive
   - Mitigation: Fast Sonnet response times (<2s)
   - Timeline: P1 priority, June 2026

2. **SQL-Based Admin Portal**
   - Impact: Higher friction for support
   - Mitigation: Comprehensive runbook documentation
   - Timeline: Custom UI in Phase 2

3. **No Photo Diagnosis**
   - Impact: Users describe symptoms in text
   - Mitigation: AI is capable at text-based troubleshooting
   - Timeline: P1 priority, June 2026

4. **iOS Push Limitations**
   - Impact: Email reminders instead of push
   - Mitigation: Email fallback functional
   - Timeline: Low priority (platform limitation)

5. **Species Database Curated**
   - Impact: ~800 species, not exhaustive
   - Mitigation: AI fallback for unlisted species
   - Timeline: Grows over time

---

## Outstanding Questions (Reference Open_Questions_Decisions.md)

| # | Question | Status | Decision | Impact |
|---|----------|--------|----------|--------|
| 1 | Streaming AI responses? | Deferred P1 | Non-streaming v1.0, streaming June 2026 | Low risk |
| 2 | iOS push notifications? | Resolved | Email fallback for iOS | Acceptable |
| 3 | Annual billing + promos? | Deferred Phase 2 | Monthly only v1.0 | Low risk |
| 4 | Species database scaling? | Resolved | Manual curation + AI fallback | Good fit |
| 5 | Admin UI or SQL? | Resolved | SQL v1.0, custom UI Phase 2 | Acceptable |
| 6 | Multi-currency? | Deferred Phase 2 | USD only v1.0 | Low risk |
| 7 | Rate limiting strategy? | Resolved | Token-based: 10 messages/month free | Good balance |
| 8 | AI streaming token tracking? | Resolved v1 | Non-streaming simplifies this | Simplified |

---

## API Versioning Strategy

**Strategy:** URL-based versioning (conservative, MVP approach)

```
/api/v1/auth/signup
/api/v1/tanks
/api/v1/parameters
/api/v1/ai/chat
/api/v1/subscriptions
```

**Rules:**
- Breaking changes increment major version
- Feature additions don't require new version
- All endpoints return api-version header

---

# LAUNCH DAY CHECKLIST (T-7 to T+7)

## T-7 (One Week Before Launch)

### Final Staging Verification

- [ ] **Database:** Run full backup. Verify restore works.
- [ ] **Data Seed:** Species database 800+. Query: `SELECT COUNT(*) FROM species;`
- [ ] **Feature Flags:** All v1.0 flags enabled. P1 features disabled.
- [ ] **Environment Variables:** All vars validated in staging.
- [ ] **Service Worker:** PWA caches assets. Offline mode tested.
- [ ] **Email Templates:** All transactional emails tested (welcome, password reset, trial expiration, subscription confirmation).

### Security Checklist

- [ ] **SSL/TLS:** Certificate valid. Not expiring within 60 days.
- [ ] **HTTPS:** All endpoints force HTTPS. No mixed content.
- [ ] **CORS:** CORS headers restrict to production domain only. No wildcard (*).
- [ ] **Authentication:** Session timeout 30 days. Remember-me cookies secure + httponly.
- [ ] **Secrets:** All secrets in environment variables. Never in code.
- [ ] **Rate Limiting:** API rate limits enforced (100 req/min for signup, 10 AI msgs/mo free).
- [ ] **SQL Injection:** All queries parameterized. No string concatenation.
- [ ] **CSRF Protection:** CSRF tokens on all forms. Cookies SameSite=Strict.
- [ ] **Audit Logging:** All admin actions logged (user ID, timestamp, action, old/new values).
- [ ] **Compliance:** Privacy policy & ToS finalized and linked.

### Backup & Disaster Recovery

- [ ] **Database Backups:** Automated daily. Restore test completed.
- [ ] **File Storage:** Tank photos backed up. Restore test completed.
- [ ] **DNS Backup:** DNS failover records configured.
- [ ] **Rollback Plan:** Documented and tested (revert to previous Vercel deployment).
- [ ] **Incident Response:** On-call schedule for week 1. Escalation path documented.

---

## T-3 (Three Days Before Launch)

### Production Environment Freeze

- [ ] **Code Freeze:** No new commits to main. Hotfixes only.
- [ ] **Dependency Lock:** Freeze npm. No package updates.
- [ ] **Database Schema:** Locked. Version = v1.0.0.
- [ ] **Feature Flag Config:** Finalized. No changes until after launch.
- [ ] **Stripe Live Mode:** Live API keys ready. Test charges completed ($0.50, refunded).

### Final Data Seed

- [ ] **Species Database:** 800+ species inserted. Spot-check 20 species accuracy.
- [ ] **Safe Zones:** Parameter zones configured. Spot-check 10 species.
- [ ] **Default Tasks:** Default task templates seeded (e.g., "Weekly 25% water change").

### DNS & SSL Verification

- [ ] **Domain DNS:** A records point to Vercel IP. TTL 3600s.
- [ ] **SSL Certificate:** Valid. Auto-renewal enabled.
- [ ] **Email Deliverability:** SPF, DKIM, DMARC records configured.
- [ ] **Email Testing:** Send test emails from all flows. Check spam filtering.

### Production Monitoring Setup

- [ ] **Error Tracking:** Sentry configured. Alert if error rate > 1%.
- [ ] **Performance Monitoring:** Vercel Analytics active. Alert if p95 > 2s.
- [ ] **Log Aggregation:** Supabase logs accessible. Error queries documented.
- [ ] **Uptime Monitoring:** Ping monitor for aquabotai.io. Alert if down.
- [ ] **Billing Monitoring:** Anthropic & Stripe usage visible. Daily cost baseline noted.

---

## T-1 (One Day Before Launch)

### Final Smoke Tests

- [ ] **Signup Flow:** Complete signup with email. Verify activation email arrives.
- [ ] **Google OAuth:** Test Google login. Verify account created.
- [ ] **Magic Link:** Request magic link. Verify works and logs in.
- [ ] **Onboarding:** Create tank, log parameter. Verify in DB.
- [ ] **Tank CRUD:** Create, edit, upload photo, delete. Verify all in DB.
- [ ] **AI Chat:** Send 3 messages. Verify responses <2s, relevant.
- [ ] **Parameters:** Log 10 parameters. Verify dashboard renders.
- [ ] **Offline Queue:** Log offline, log another, come online. Verify both sync.
- [ ] **Push Notifications:** Create task reminder. Verify notification fires.
- [ ] **Trial:** Start trial. Verify trial date in DB. Request magic link works.
- [ ] **Upgrade:** Upgrade from free to Starter. Verify Stripe subscription created.
- [ ] **Species Search:** Search "betta". Verify results <500ms. Random search works.
- [ ] **Recurring Tasks:** Create weekly task. Verify next occurrence calculated.
- [ ] **Admin Portal:** Log into Supabase. Run lookup query. Verify audit log.

### Stripe Live Mode Verification

- [ ] **Stripe Account:** Live mode enabled. API keys retrieved.
- [ ] **Test Charge:** $0.50 test charge. Verify in Stripe. Refund it.
- [ ] **Webhook Verification:** Webhooks configured. Test event sent. Verify received.
- [ ] **Subscription Test:** Full Stripe Checkout flow. Verify subscription created & synced.

### Monitoring Alerts Activated

- [ ] **Error Rate Alert:** Slack if error rate > 1% for 5min.
- [ ] **Response Time Alert:** Slack if p95 latency > 2s.
- [ ] **Database Alert:** Slack if connection pool exhausted.
- [ ] **Anthropic API Alert:** Slack if API errors > 5%.
- [ ] **Stripe Alert:** Slack if webhook failures > 5%.
- [ ] **Disk Space Alert:** Slack if storage > 80%.

---

## T-0 (Launch Day)

### Pre-Launch (8 AM)

- [ ] **All T-1 Tests Re-Run:** Final verification.
- [ ] **Monitoring Dashboard Open:** Vercel, Supabase, Stripe, Sentry visible.
- [ ] **Slack Channel:** #launch created for updates.
- [ ] **Incident Response:** On-call and available all day.

### Deploy to Production (9 AM)

- [ ] **Vercel Deployment:** Merge to main. Trigger production deploy.
- [ ] **Deployment Status:** Monitor build logs. Success in <5min.
- [ ] **Health Check:** aquabotai.io loads. No 500 errors.
- [ ] **Admin Check:** Supabase admin login works. Audit log shows deployment.

### Post-Deploy Smoke Tests (9:15 AM)

- [ ] **Signup:** New user signup. Verify in DB & email.
- [ ] **Login:** Log in with credentials. Session created.
- [ ] **Tank Creation:** Create tank. Verify in DB.
- [ ] **AI Chat:** Send message. Response <3s.
- [ ] **Parameters:** Log parameter. Verify on dashboard.
- [ ] **Trial:** Verify trial auto-starts.
- [ ] **Payment:** Test Stripe Checkout (4242 4242 4242 4242). Verify subscription.

### Public Announcement (9:30 AM)

- [ ] **Website/Twitter:** Post announcement with signup link.
- [ ] **Email:** Send to waitlist (if applicable).
- [ ] **Product Hunt:** If launching there, verify listing live.
- [ ] **Hacker News:** If submitting, verify post visible.

### Live Monitoring (9:30 AM - 6 PM)

- [ ] **Every 30min:** Check Vercel analytics. Error rate OK?
- [ ] **Every 30min:** Check Supabase logs. DB errors?
- [ ] **Every 30min:** Check Stripe dashboard. Failed charges?
- [ ] **Every 30min:** Check Sentry. New exceptions? Triage P1 bugs.
- [ ] **Respond to errors:** If spike, check logs, deploy hotfix or rollback.

### User Onboarding Observation (9:30 AM - 6 PM)

- [ ] **Monitor signups:** Spot-check 5-10 new accounts. Trial dates correct?
- [ ] **Monitor AI usage:** Spot-check message logs. Good responses?
- [ ] **Monitor billing:** Verify Stripe subscriptions match signups.
- [ ] **Monitor support email:** Check support@aquabotai.io. Respond ASAP.

---

## T+1 (Day After Launch)

### First 24-Hour Metrics Review

- [ ] **Total Signups:** How many users? (Target: >50 if announced widely)
- [ ] **Trial Conversion:** % converted to paid? (Target: >10%)
- [ ] **Error Rate:** 24h error rate? (Target: <0.5%)
- [ ] **API Latency:** p95 response time? (Target: <1.5s)
- [ ] **Anthropic Costs:** Total token usage? Cost estimate?
- [ ] **Stripe Revenue:** Total subscriptions created? Revenue?
- [ ] **Database Size:** Row counts in users, parameters, messages. Data integrity OK?

### Early Error Review & Hotfixes

- [ ] **Sentry Dashboard:** Review all errors. Prioritize by frequency.
- [ ] **P0 Bugs:** Hard errors (500s, auth fails, payment fails)? Create issues. Plan hotfix.
- [ ] **P1 Bugs:** Minor UX issues? Log for post-launch sprint.
- [ ] **Deploy Hotfixes:** If P0 bugs, hotfix immediately. Re-test.

### User Support Triage

- [ ] **Support Email:** Read all inquiries. Categorize: feature requests, bugs, account issues.
- [ ] **Response SLA:** Respond within 4 hours.

### Cost Monitoring

- [ ] **Anthropic API Cost:** Daily estimate. Within budget?
- [ ] **Stripe Processing:** Failed payments? Chargebacks?
- [ ] **Database Cost:** Size growing as expected?
- [ ] **Vercel Cost:** Bandwidth spikes?

---

## T+3 (Day 3 Post-Launch)

### First User Feedback Review

- [ ] **Support Email:** Read inquiries. What themes emerge?
- [ ] **Early User Data:** Spot-check 10-20 accounts. Active usage?
- [ ] **Feedback Summary:** Top 3-5 requests/issues. Share with roadmap.

### Critical Hotfix Deployment

- [ ] **P0 Bugs:** Any critical bugs? Deploy immediately.
- [ ] **Regression Testing:** Test in staging first.
- [ ] **Rollback Ready:** Previous deployment available for quick rollback.

### Feature Monitoring

- [ ] **AI Chat:** Good responses? Sample 20 messages. Any bad advice?
- [ ] **Parameter Tracking:** Users logging regularly? Spot-check DB.
- [ ] **Task Reminders:** Push notifications firing? Alerts missed?
- [ ] **Subscriptions:** Users upgrading? Checkout friction?

---

## T+7 (First Week Retrospective)

### Week 1 Data Review

- [ ] **Total Signups:** Week 1 total?
- [ ] **Trial-to-Paid Conversion:** %?
- [ ] **Retention:** % day-1 users active day-7?
- [ ] **DAU:** Average daily active users?
- [ ] **Feature Usage:** Most used features?
- [ ] **Error Rate:** Any sustained errors? Issues resolved?
- [ ] **Uptime:** Any downtime? Root causes?

### Metrics Summary

```
# Week 1 Launch Retrospective

## Key Metrics
- Total Signups: ___
- Trial Conversions: ___ (___)
- Day-1 to Day-7 Retention: ___%
- DAU (avg): ___
- Peak Concurrent Users: ___

## Usage by Feature
- Tank Created: ___ users
- Parameters Logged: ___ total
- AI Messages Sent: ___ total
- Tasks Created: ___ total
- Maintenance Reminders Clicked: ___%

## Issues Resolved
- [ ] Issue 1: ___ (fixed day X)
- [ ] Issue 2: ___ (fixed day X)

## Top User Requests
1. ___
2. ___
3. ___

## Cost Analysis
- Anthropic API: $___
- Stripe Processing: $___
- Vercel: $___
- Supabase: $___
- **Total:** $___

## Roadmap Updates
- Reprioritize P1 features
- Plan hotfix sprint for T+14
```

### Hotfix Prioritization

- [ ] **Review GitHub Issues:** Top 10 reported issues?
- [ ] **Prioritize P1 Fixes:** Which impact core functionality?
- [ ] **Schedule Fix Sprint:** 1-week hotfix sprint (May 26-June 2).
- [ ] **Update Roadmap:** Based on user feedback, adjust Phase 1 priorities.

### Production Health Check

- [ ] **Database:** Run VACUUM ANALYZE. Disk space OK?
- [ ] **Backups:** Verify 7 days of automated backups. Test restore.
- [ ] **Monitoring:** Any new alert patterns?
- [ ] **Security Audit:** Suspicious logins? Abuse? Review audit logs.

---

# SUPPORT HANDOFF & OPERATIONS

## FAQ for Users

### Account & Authentication

**Q: I forgot my password. How do I reset it?**
A: Click "Forgot password?" on login. Enter email. Click reset link in email. Set new password.

**Q: Can I use same email for multiple accounts?**
A: One account per email. Need second account? Use different email. No duplicates.

**Q: I signed up with Google but can't log in with email + password. How do I fix this?**
A: Google OAuth accounts can't use email/password directly. Click "Forgot password?" to set one, then log in either way.

**Q: How do I delete my account?**
A: Email support@aquabotai.io with "Account Deletion Request" + account email. Deleted within 7 days.

---

### Subscription & Billing

**Q: I started a trial but don't want it. Can I cancel?**
A: Go to Settings → Subscription. Click "Cancel Subscription." Access continues until trial ends.

**Q: I was charged but thought trial was free. Can I get refund?**
A: Trials are free 14 days. If charged, you likely upgraded during trial. Email support@aquabotai.io with receipt for review.

**Q: Can I pause instead of cancel?**
A: Not yet. Cancel anytime, re-subscribe later (no waiting period).

**Q: Do you offer annual billing or discounts?**
A: Not at launch. Monthly only. Annual billing planned Phase 2.

**Q: I upgraded to wrong tier. Can you downgrade?**
A: Yes! Email support@aquabotai.io with account email & desired tier. Manual adjustment + pro-rate credits applied.

**Q: Do you accept international payments?**
A: Yes, via Stripe. We charge USD. Your bank handles conversion.

---

### Features & Usage

**Q: How many AI messages per month?**
A: Free tier: 10/month. Starter+: Unlimited.

**Q: When does AI message count reset?**
A: On your subscription anniversary (day you subscribed).

**Q: Can I get more AI messages?**
A: Upgrade to Starter, Plus, or Pro for unlimited.

**Q: AI gave me bad advice. What do I do?**
A: AI is assistant, not vet. For health concerns, consult expert. Email support@aquabotai.io to report bad response.

**Q: Can I use AquaBotAI commercially?**
A: Not at launch. For personal use only. Email support@aquabotai.io for commercial licensing.

**Q: Does AquaBotAI work offline?**
A: Partially. Log parameters & create tasks offline. Sync when online. Historical data requires internet.

**Q: Why no iOS push notifications?**
A: Safari limitation (no Web Push API support). Email reminders instead. Enable in Settings.

---

### Technical Support

**Q: App slow or crashing. How do I fix?**
A: 1) Refresh page (Cmd+R or Ctrl+R). 2) Clear cache. 3) Try different browser. 4) Restart device. Email support@aquabotai.io if persists (include browser + device type + what you were doing).

**Q: Tank photo won't upload.**
A: Photos must be JPG/PNG/GIF under 5MB. Try compress or different format.

**Q: Dashboard not showing latest parameter.**
A: Updates instantly. Try refresh after 5s. Might not have synced—log again.

**Q: How do I install PWA?**
A: Desktop (Chrome/Edge): Click install icon in URL bar. Mobile (Android): "Install" prompt at bottom. Mobile (iOS): Safari → Share → Add to Home Screen.

---

## Internal: How to Support Users

### SQL: User Lookup

**Find by email:**
```sql
SELECT id, email, display_name, subscription_tier, trial_started_at, trial_ends_at, created_at
FROM users
WHERE email = 'user@example.com';
```

**Find by ID:**
```sql
SELECT id, email, display_name, subscription_tier, trial_started_at, trial_ends_at, created_at
FROM users
WHERE id = 'user-uuid-here';
```

**Week 1 signups:**
```sql
SELECT email, subscription_tier, trial_started_at, created_at
FROM users
WHERE created_at >= NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;
```

---

### SQL: Reset AI Usage Counter

**Check usage:**
```sql
SELECT user_id, COUNT(*) as message_count, MAX(created_at) as last_message
FROM ai_messages
WHERE user_id = 'user-uuid-here'
  AND created_at >= DATE_TRUNC('month', NOW())
GROUP BY user_id;
```

**Reset (use with caution):**
```sql
DELETE FROM ai_messages
WHERE user_id = 'user-uuid-here'
  AND created_at >= DATE_TRUNC('month', NOW());

INSERT INTO audit_logs (admin_id, action, details, created_at)
VALUES ('admin-uuid', 'reset_ai_usage', 'User: user-uuid-here', NOW());
```

---

### SQL: Subscription Management

**View subscription:**
```sql
SELECT id, user_id, stripe_subscription_id, tier, trial_started_at, trial_ends_at,
       current_period_start, current_period_end, status, created_at
FROM subscriptions
WHERE user_id = 'user-uuid-here';
```

**Extend trial 7 days:**
```sql
UPDATE subscriptions
SET trial_ends_at = trial_ends_at + INTERVAL '7 days'
WHERE user_id = 'user-uuid-here';

INSERT INTO audit_logs (admin_id, action, details, created_at)
VALUES ('admin-uuid', 'extend_trial', 'User: user-uuid-here, +7 days', NOW());
```

**Upgrade tier (Starter → Plus):**
```sql
UPDATE subscriptions
SET tier = 'Plus', updated_at = NOW()
WHERE user_id = 'user-uuid-here';

INSERT INTO audit_logs (admin_id, action, details, created_at)
VALUES ('admin-uuid', 'upgrade_tier', 'User: user-uuid-here, Starter → Plus', NOW());
```

NOTE: Also update Stripe manually via Stripe dashboard.

---

### SQL: Tank Management

**View user's tanks:**
```sql
SELECT id, name, created_at, photo_url
FROM tanks
WHERE user_id = 'user-uuid-here'
  AND deleted_at IS NULL;
```

**Soft-delete tank:**
```sql
UPDATE tanks
SET deleted_at = NOW()
WHERE id = 'tank-uuid-here';

INSERT INTO audit_logs (admin_id, action, details, created_at)
VALUES ('admin-uuid', 'delete_tank', 'Tank: tank-uuid-here', NOW());
```

---

### Audit Logs

**Recent actions:**
```sql
SELECT admin_id, action, details, created_at
FROM audit_logs
ORDER BY created_at DESC
LIMIT 50;
```

**Actions for user (investigation):**
```sql
SELECT admin_id, action, details, created_at
FROM audit_logs
WHERE details LIKE '%user-uuid-here%'
ORDER BY created_at DESC;
```

---

### Troubleshooting Common Issues

#### User can't log in

**Check 1:** User exists?
```sql
SELECT id, email FROM users WHERE email = 'user@example.com';
```

**Check 2:** Password reset works?
- Click "Forgot Password"
- Check email
- Click reset link
- Try login

**Check 3:** Google OAuth issue?
- If Google signup, can't use email password directly
- Must use "Log in with Google" or reset password first

**Check 4:** Account locked?
- Look in audit_logs for suspension
- If locked, contact Supabase or re-enable in Auth panel

**Fix:** Force reset via Supabase Auth panel → Users → Find user → "Reset password"

---

#### AI responses not generating

**Check 1:** Anthropic API key valid?
```sql
SELECT user_id, error, created_at
FROM ai_messages
WHERE error IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;
```

**Check 2:** Hit message limit?
```sql
SELECT COUNT(*) as message_count
FROM ai_messages
WHERE user_id = 'user-uuid-here'
  AND created_at >= DATE_TRUNC('month', NOW());
```

**Check 3:** Anthropic rate limit?
- Check Vercel logs for 429 errors
- Contact Anthropic if rate limited

**Fix:** Check Vercel Functions logs → ai-chat for errors

---

#### Push notifications not firing

**Check 1:** Browser notifications enabled?
- Settings → Notifications → Allow AquaBotAI

**Check 2:** Service worker installed?
- DevTools → Application → Service Workers → activated?

**Check 3:** Task scheduled?
```sql
SELECT id, title, reminder_at, created_at
FROM tasks
WHERE user_id = 'user-uuid-here'
ORDER BY created_at DESC
LIMIT 5;
```

**Check 4:** iOS user?
- Safari doesn't support Web Push
- Email reminders sent instead

**Fix:** Create new task, reminder 1min from now, wait for notification

---

#### Stripe subscription not syncing

**Check 1:** Webhook received?
- Vercel Functions → stripe-webhooks → check logs for checkout.session.completed

**Check 2:** Subscription in DB?
```sql
SELECT id, stripe_subscription_id, tier, status
FROM subscriptions
WHERE user_id = 'user-uuid-here';
```

**Check 3:** Stripe charge succeeded?
- Stripe Dashboard → Payments → Charges → search email
- Verify charge succeeded (not failed/pending)

**Fix:** Manually sync:
```sql
INSERT INTO subscriptions (user_id, stripe_subscription_id, tier, status, created_at)
VALUES ('user-uuid-here', 'sub_xxxxx', 'Starter', 'active', NOW());
```

---

## Escalation Paths

**Anthropic Support:** API errors, rate limiting, quality issues
- support@anthropic.com

**Stripe Support:** Payment failures, webhook issues, refund disputes
- support.stripe.com

**Supabase Support:** Database, auth, storage, Edge Functions
- Dashboard → Support chat or support@supabase.io

**Vercel Support:** Deployment failures, performance, DNS/SSL
- Dashboard → Help or support@vercel.com

---

# ANALYTICS VALIDATION CHECKLIST

## Event Tracking

**Primary Tool:** Supabase (custom events table) + Vercel Analytics

```sql
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  event_name VARCHAR(255) NOT NULL,
  event_data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX idx_analytics_events_event_name ON analytics_events(event_name);
CREATE INDEX idx_analytics_events_created_at ON analytics_events(created_at);
```

---

## User Journey Events

### Signup & Onboarding

- [ ] **signup_started:** User clicks signup
  - `SELECT COUNT(*) FROM analytics_events WHERE event_name = 'signup_started' AND created_at >= NOW() - INTERVAL '1 day';`
  - Should correlate with daily signups

- [ ] **signup_completed:** User confirms email
  - Should be ~90% of signup_started

- [ ] **onboarding_started:** User begins onboarding
  - Should be ~95% of signup_completed

- [ ] **tank_created:** User creates first tank
  - Should be ~85% of signup_completed

- [ ] **parameter_logged:** User logs first parameter
  - Should be ~70% of signup_completed (core metric)

- [ ] **onboarding_completed:** User finishes onboarding
  - Should be ~80% of signup_completed

**Funnel Query:**
```sql
WITH daily_events AS (
  SELECT
    DATE(created_at) as date,
    SUM(CASE WHEN event_name = 'signup_started' THEN 1 ELSE 0 END) as signups,
    SUM(CASE WHEN event_name = 'signup_completed' THEN 1 ELSE 0 END) as email_confirmed,
    SUM(CASE WHEN event_name = 'onboarding_completed' THEN 1 ELSE 0 END) as onboarding_done,
    SUM(CASE WHEN event_name = 'tank_created' THEN 1 ELSE 0 END) as first_tank,
    SUM(CASE WHEN event_name = 'parameter_logged' THEN 1 ELSE 0 END) as first_param
  FROM analytics_events
  WHERE created_at >= NOW() - INTERVAL '7 days'
  GROUP BY DATE(created_at)
)
SELECT * FROM daily_events ORDER BY date DESC;
```

---

### Login Events

- [ ] **login_email_password:** Email + password login
- [ ] **login_google:** Google OAuth login
- [ ] **login_magic_link:** Magic link login

Expected: Majority email/password, 10-20% OAuth, rare magic link.

---

## Feature Usage Events

### Tanks
- [ ] **tank_created**
- [ ] **tank_updated**
- [ ] **tank_deleted**
- [ ] **tank_photo_uploaded**

### Parameters
- [ ] **parameter_logged**
- [ ] **parameter_deleted**
- [ ] **dashboard_viewed**
- [ ] **parameter_graph_viewed**

### AI Chat
- [ ] **message_sent:** User sends message (correlated with trial-to-paid)
- [ ] **message_response_received:** AI responds (should be ~100% of message_sent)
- [ ] **action_executed:** User accepts AI action (should be ~10-20% of responses)
- [ ] **tier_limit_hit:** User hit message limit (drives upgrade intent)

### Species
- [ ] **species_searched**
- [ ] **species_added_to_tank**

### Tasks
- [ ] **task_created**
- [ ] **task_completed** (completion rate: 30-50%)
- [ ] **notification_received**
- [ ] **notification_clicked** (CTR: 20-40%)

---

## Billing Events

### Trial
- [ ] **trial_started** (should match signups ~1:1)
- [ ] **trial_expiration_warning** (3 days before)
- [ ] **trial_expired**

### Subscriptions
- [ ] **checkout_started**
- [ ] **checkout_completed** (should be ~70-80% of checkout_started)
- [ ] **subscription_activated** (should match checkout_completed)
- [ ] **subscription_changed**
- [ ] **subscription_canceled** (track churn, target <5% monthly)
- [ ] **payment_failed** (target <2% of active subs)
- [ ] **payment_retry_succeeded**

---

## Engagement Events

- [ ] **app_opened** → Vercel Analytics (DAU metric)
- [ ] **session_duration** → Vercel Analytics (5-15 min typical)
- [ ] **pages_per_session** → Vercel Analytics (3-5 typical)

**Queries:**
```sql
SELECT COUNT(DISTINCT user_id) as dau FROM analytics_events WHERE created_at >= DATE_TRUNC('day', NOW());
SELECT COUNT(DISTINCT user_id) as wau FROM analytics_events WHERE created_at >= DATE_TRUNC('week', NOW());
SELECT COUNT(DISTINCT user_id) as mau FROM analytics_events WHERE created_at >= DATE_TRUNC('month', NOW());
```

---

## Validation Checklist

### Before Launch

- [ ] All features have event logging
- [ ] Sample events generated → appear in DB within 30s
- [ ] Event schema: event_name, user_id, created_at, event_data (JSON)
- [ ] Timestamps are server time (not device)
- [ ] No duplicate events
- [ ] No sensitive data in events (passwords, API keys, payment info)
- [ ] SQL queries tested
- [ ] Vercel Analytics & Supabase reporting configured

### Launch Day

- [ ] Real user events flowing within 1 hour
- [ ] Conversion funnel visible (signup → parameter_logged)
- [ ] AI usage tracking accurate
- [ ] Billing events match Stripe webhooks
- [ ] No error spikes in /api/v1/analytics/event

---

# GO/NO-GO DECISION FRAMEWORK

## Hard Blockers (Must Fix Before Launch)

If ANY unresolved, **DO NOT LAUNCH**.

### Security & Compliance

- [ ] SSL/TLS active on aquabotai.io (HTTPS)
- [ ] Authentication works (signup, login, logout, sessions)
- [ ] Database credentials in environment variables (never exposed)
- [ ] CORS restricted to aquabotai.io (no wildcard *)
- [ ] Payment processing secure (live Stripe key, not logged)

### Critical Functionality

- [ ] AI Chat works (send message → receive response from Claude Sonnet)
- [ ] Parameter logging works (users can log, see on dashboard)
- [ ] Subscriptions work (trial starts, upgrade works, Stripe charges)
- [ ] Database stable (no connection pool exhaustion, no timeouts)

### Data Integrity

- [ ] Database schema migrated (v1.0.0)
- [ ] Species database seeded (800+). Spot-check 10 entries.
- [ ] Backups working (automated daily, restore test passed)
- [ ] No data loss on rollback

### Infrastructure & Monitoring

- [ ] Production monitoring active (Sentry, Vercel Analytics, uptime)
- [ ] Alerts configured (error rate >1%, latency >2s, database issues)
- [ ] Load testing passed (100+ concurrent users)
- [ ] Vercel deployment succeeds (build <5 min)

---

## Soft Blockers (Launch, but Acknowledge)

Known acceptable issues. Communicate to users.

### Features Deferred Phase 2

- [ ] Photo Diagnosis
- [ ] Equipment Tracking
- [ ] Email Reports
- [ ] Streaming AI

### Platform Limitations

- [ ] iOS push notifications (email fallback documented)
- [ ] Admin portal SQL-based (custom UI Phase 2)

### Minor Known Issues

- [ ] CSS quirks on small phones (acceptable)
- [ ] Species database not exhaustive (AI fallback exists)
- [ ] Monthly only (annual Phase 2)

---

## Go/No-Go Decision Criteria

### 48 Hours Before Launch

- [ ] All P0 features tested end-to-end
- [ ] No P0 bugs in Sentry
- [ ] Smoke tests pass
- [ ] Backups verified
- [ ] Monitoring active
- [ ] Support runbooks documented
- [ ] **Question:** "Would I feel safe using this as a customer?" (YES = proceed)

### 24 Hours Before Launch

- [ ] Full system test on staging
- [ ] Database backup & restore test passes
- [ ] Monitoring alerts confirmed active
- [ ] **Decision:** Green light or push back 1 week?

### If Critical Bug Found

- [ ] **P0 Bug:** Fix it. Delay if necessary.
- [ ] **P1 Bug:** Log it. Launch as planned. Hotfix T+1.
- [ ] **P2 Bug:** Log it. Launch as planned. Address Phase 2.

---

## Final Decision Log

```markdown
# Launch Decision - [DATE]

## Summary
Launching AquaBotAI v1.0.0 on [DATE] at [TIME].

## Final Metrics
- P0 Bugs: 0
- P1 Bugs: [#]
- Smoke Test Pass Rate: 100%
- Error Rate (Sentry): [%]

## Confidence Level
[ ] High (100%, launch now)
[ ] Medium (90%+, launch with monitoring)
[ ] Low (concerns, push back)

## Known Issues at Launch
- [List soft blockers/deferred features]

## Decision
[✓ LAUNCH] / [ ] PAUSE

## Signature
Developer: _____________  Date: _______  Time: _______
```

---

# Appendices

## Appendix A: Vercel Deployment

```bash
git checkout main
git pull origin main
npm ci
npm run build
npm run test:smoke

vercel env ls
vercel --prod

curl https://aquabotai.io/api/health
# Should return 200 OK
```

---

## Appendix B: Stripe Test Cards

| Card | Number | Exp | CVC |
|------|--------|-----|-----|
| Visa (Success) | 4242 4242 4242 4242 | 12/26 | 123 |
| Visa (Decline) | 4000 0000 0000 0002 | 12/26 | 123 |
| Mastercard | 5555 5555 5555 4444 | 12/26 | 123 |

---

## Appendix C: Monitoring Commands

**Vercel Analytics:** open https://vercel.com/dashboard/analytics

**Supabase Logs:**
```sql
SELECT error, count(*) FROM ai_messages WHERE error IS NOT NULL AND created_at > NOW() - INTERVAL '1 hour' GROUP BY error ORDER BY count DESC;
```

**Service Worker Cache:**
```javascript
caches.keys().then(names => console.log('Cache names:', names));
```

---

## Appendix D: Rollback

```bash
vercel list
vercel promote <previous-deployment-id>
curl https://aquabotai.io/api/health
```

Time: <2 minutes

---

## Appendix E: Support SQL Queries

**DAU:**
```sql
SELECT COUNT(DISTINCT user_id) FROM analytics_events WHERE DATE(created_at) = TODAY();
```

**Revenue (past 7 days):**
```sql
SELECT SUM(CASE WHEN tier = 'Starter' THEN 3.99 WHEN tier = 'Plus' THEN 7.99 WHEN tier = 'Pro' THEN 14.99 ELSE 0 END)
FROM subscriptions WHERE status = 'active' AND updated_at >= NOW() - INTERVAL '7 days';
```

**Top errors:**
```sql
SELECT error, COUNT(*) FROM ai_messages WHERE error IS NOT NULL GROUP BY error ORDER BY count DESC LIMIT 10;
```

**Users at tier limit:**
```sql
SELECT user_id, COUNT(*) FROM ai_messages WHERE created_at >= DATE_TRUNC('month', NOW()) GROUP BY user_id HAVING COUNT(*) >= 10;
```

---

# Document Version History

| Version | Date | Author | Notes |
|---------|------|--------|-------|
| 1.0 | May 2026 | Solo Dev | Initial MVP release notes & launch checklist |

---

**Last Updated:** May 2026
**Next Review:** T+7 post-launch (June 2, 2026)
**Status:** Ready for launch approval
