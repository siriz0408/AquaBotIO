# Ship Readiness Document: Post-Launch Measurement Plan
## AquaBotAI — AI-Powered Aquarium Management PWA

**Version:** 1.0
**Document Date:** February 2026
**Launch Target:** Late May 2026
**Project Type:** Solo-Developer MVP

---

## Executive Summary

This document defines the complete measurement and monitoring framework for AquaBotAI post-launch. It serves as your operational guide to understand product performance, make data-driven decisions, and iterate rapidly as a solo developer.

**Key Principles:**
- Simplicity over perfection (focus on actionable metrics)
- Automation where possible (dashboards, alerts)
- Weekly review cadence for tight feedback loops
- Clear decision thresholds (act when metrics cross lines)
- Monthly deep-dives for strategic insights

---

## 1. KPI Framework

### 1.1 North Star Metric

**Weekly Active Tanks (WAT) with Parameter Logging**

The single metric that best represents product value delivery:
- **Definition:** Unique tanks where at least one parameter was logged in the past 7 days
- **Why:** Combines user retention, engagement, and core feature adoption
- **Target:** 3,000 WAT by end of Month 6 (implies ~5K-6K MAU at 50-60% weekly engagement)
- **Measurement:** Query Supabase analytics weekly
- **Owner:** Product metrics

---

### 1.2 Primary KPIs (Top-Level Business Metrics)

| Metric | Definition | Target | Frequency | Data Source | Alert Threshold |
|--------|-----------|--------|-----------|-------------|-----------------|
| **MRR** | Monthly Recurring Revenue (all subscription tiers) | $5,000 by Month 6 | Daily | Stripe API | < $3,000 (month-over-month decline) |
| **Signups** | Total registered users | 1,000 by Day 90 | Daily | Auth table | < 10 signups/day (moving average) |
| **Free-to-Paid Conversion** | (Paid users) / (signups - churned free users) | 15% by Month 6 | Weekly | Stripe + Auth | < 8% quarterly trend |
| **Churn Rate** | (Canceled subs month N) / (Active subs month N-1) | < 10% monthly (2.5% weekly) | Weekly | Stripe webhooks | > 15% monthly trend |
| **DAU/MAU Ratio** | Daily active users / Monthly active users | > 35% | Weekly | User sessions | < 25% (engagement drop) |
| **AI Cost per Active User** | Monthly AI costs / Monthly active users | < $2.00 | Daily | Anthropic + User sessions | > $2.50 (unsustainable) |
| **Average Revenue Per User (ARPU)** | MRR / Active subscribers | $8.50 by Month 6 | Weekly | Stripe + Users | < $5.00 (indicates tier shift) |

---

### 1.3 Secondary KPIs (Feature-Specific & Engagement)

| Metric | Definition | Target | Frequency | Data Source | Notes |
|--------|-----------|--------|-----------|-------------|-------|
| **Onboarding Completion Rate** | Users reaching "first tank created" / signups | > 70% | Daily | Event tracking | Critical activation gate |
| **Parameter Logs per Active User** | Total logs / active users | > 2 per week | Weekly | Parameters table | Core engagement driver |
| **Task Completion Rate** | Completed tasks / created tasks | > 50% | Weekly | Tasks table | Measures feature stickiness |
| **Dashboard Engagement** | Users viewing dashboard at least once / WAU | > 60% | Weekly | Session events | Key retention signal |
| **Push Notification Opt-in Rate** | Users who enabled notifications / signups | > 50% | Weekly | User preferences | Re-engagement channel |
| **AI Message Volume** | Total AI messages / day | Ramp to 5K msgs/day | Daily | Messages table | Capacity planning, revenue tied |
| **Trial-to-Paid Conversion** | Users who upgrade from trial | > 80% trial → paid | Weekly | Stripe subscription history | Most important funnel |
| **Species Search Rate** | AI species searches / active users | > 1 per active user/month | Weekly | Events table | AI feature adoption |
| **AI Suggestion Acceptance** | Accepted suggestions / total suggestions shown | > 40% | Weekly | Events table | AI quality proxy |

---

### 1.4 Health Metrics (Infrastructure & Operations)

| Metric | Definition | Target | Frequency | Data Source | Alert Threshold |
|--------|-----------|--------|-----------|-------------|-----------------|
| **API Error Rate** | (5xx + timeout errors) / total requests | < 1% | Real-time | Vercel logs | > 2% |
| **AI Response Latency P50** | 50th percentile response time for Claude calls | < 1.5s | Daily | Function logs | > 2s (investigate) |
| **AI Response Latency P95** | 95th percentile response time for Claude calls | < 3.0s | Daily | Function logs | > 4s (tier limits?) |
| **Database Query Latency P95** | 95th percentile Supabase query time | < 500ms | Daily | PgHero | > 1s (optimize) |
| **Uptime** | Deployment availability (excluding scheduled maintenance) | > 99.5% | Daily | Vercel status | < 99% (rollback?) |
| **Stripe Payment Processing Success Rate** | Successful payments / attempted payments | > 98% | Daily | Stripe webhooks | < 97% (debug payment issues) |
| **Support Ticket Volume** | Total support requests | < 5/day average | Daily | Support inbox | Correlate with changes |
| **Token Burn Rate** | Total API tokens used / budget | Within 80% monthly | Weekly | Anthropic usage logs | > 90% = immediate review |

---

### 1.5 Measurement Frequency & Review Cadence

**Daily Monitoring (5-minute morning check):**
- [ ] MRR change from yesterday
- [ ] Signup count (24h)
- [ ] AI response latency P95
- [ ] API error rate
- [ ] Stripe payment failures

**Weekly Deep Review (Monday 9 AM, 30 minutes):**
- [ ] All Primary KPIs
- [ ] Churn analysis (who's leaving, why?)
- [ ] Feature adoption rates
- [ ] New issues from support
- [ ] Email digests from Stripe, Anthropic, Vercel

**Monthly Strategic Review (First Monday, 2 hours):**
- [ ] Cohort analysis (retention by signup week)
- [ ] Tier migration patterns
- [ ] Competitive landscape check
- [ ] Roadmap adjustment
- [ ] Unit economics recalculation

---

## 2. Event Tracking Taxonomy

Complete list of events to track. Implement via Supabase `events` table with JSON payload structure.

### 2.1 Acquisition Events

| Event | Trigger | Properties | Data Source | Why Track |
|-------|---------|-----------|-------------|-----------|
| `signup_started` | User begins signup form | `source` (organic/referral/ad), `device_type` | Auth page | Conversion funnel start |
| `signup_completed` | User confirms email + creates account | `email_domain`, `timezone`, `referral_code` | Auth webhook | Acquisition count |
| `onboarding_started` | User views onboarding flow | `step`, `device` | Client event | Activation tracking |
| `onboarding_completed` | User creates first tank (last onboarding gate) | `tank_type`, `species_count`, `time_to_complete_seconds` | Form submit | North Star component |
| `referral_clicked` | User clicks shared referral link | `referrer_id`, `campaign_source` | Deep link tracking | Growth channel attribution |
| `signup_email_verified` | Email verification link clicked | `time_to_verify_seconds` | Auth webhook | Signup quality |

**Database Table Schema:**
```sql
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  event_name TEXT NOT NULL,
  properties JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT now(),
  session_id TEXT
);
CREATE INDEX idx_events_user_id_created_at ON events(user_id, created_at);
CREATE INDEX idx_events_event_name_created_at ON events(event_name, created_at);
```

---

### 2.2 Activation Events

| Event | Trigger | Properties | Data Source | Why Track |
|-------|---------|-----------|-------------|-----------|
| `first_tank_created` | User submits tank setup form | `tank_type` (freshwater/saltwater/brackish), `volume_liters`, `species_count`, `has_heater`, `has_filter` | Tank creation API | Onboarding completion, user investment |
| `first_parameter_logged` | User logs their first aquarium parameter | `parameter_type` (pH/temp/ammonia/etc), `value`, `tank_id` | Parameter insert | Core engagement activation |
| `first_ai_message` | User sends first AI message to Claude | `message_type` (question/suggestion_request/diagnosis), `tank_id`, `token_count` | Claude API call | AI feature adoption |
| `first_task_created` | User creates first maintenance task | `task_type` (water_change/feeding/cleaning/filter_change), `tank_id`, `recurrence` | Task creation API | Feature engagement |
| `first_species_added` | User adds first species to tank | `species_name`, `quantity`, `tank_id`, `ai_search_used` | Species table insert | Tank setup depth |
| `payment_method_added` | User adds card to Stripe customer | `card_brand`, `country` | Stripe webhook | Checkout progress |
| `trial_started` | User starts free trial (if applicable) | `tier_attempted`, `auto_renew_enabled` | Subscription creation | Trial funnel entry |

---

### 2.3 Engagement Events

| Event | Trigger | Properties | Data Source | Why Track |
|-------|---------|-----------|-------------|-----------|
| `ai_message_sent` | User sends AI message to Claude | `message_length`, `tank_id`, `message_type`, `token_count_in`, `token_count_out`, `latency_ms` | Claude API | AI usage, cost tracking, latency SLA |
| `parameter_logged` | User logs aquarium parameter | `parameter_type`, `tank_id`, `value`, `manual_vs_sensor`, `time_since_last_log` | Parameter insert | Engagement frequency, retention signal |
| `task_completed` | User marks maintenance task as done | `task_type`, `tank_id`, `days_overdue`, `time_to_complete_days` | Task status update | Engagement depth, habit formation |
| `task_created` | User creates new maintenance task | `task_type`, `tank_id`, `recurrence_days`, `ai_suggested` | Task creation | Task adoption, AI suggestion uptake |
| `dashboard_viewed` | User navigates to main dashboard | `session_duration_seconds`, `charts_viewed` | Client route event | Engagement frequency, retention signal |
| `tank_switched` | User clicks to view different tank | `from_tank_id`, `to_tank_id`, `viewer_count_from`, `viewer_count_to` | Client route event | Multi-tank adoption |
| `species_searched` | User searches for aquarium species info | `query`, `ai_used`, `results_clicked`, `time_spent_seconds` | Search component event | Feature discovery, content quality |
| `ai_suggestion_shown` | AquaBotAI generates proactive suggestion | `suggestion_type` (water_change/test_params/overstocking/incompatibility), `tank_id`, `acceptance_likelihood` | Claude generation | AI feature reach |
| `ai_suggestion_accepted` | User acts on AI suggestion | `suggestion_type`, `tank_id`, `action_taken` | Button click / task creation | AI quality, trust metric |
| `ai_suggestion_dismissed` | User ignores or dismisses AI suggestion | `suggestion_type`, `tank_id`, `dismiss_reason` (if collected) | Button click | AI relevance feedback |
| `notification_clicked` | User taps push/in-app notification | `notification_type`, `tank_id`, `action_taken` | Event tracking | Notification effectiveness |
| `notification_received` | Push notification delivered to device | `notification_type`, `tank_id`, `delivery_status` | Firebase logs | Notification reach |
| `settings_changed` | User modifies account/tank/notification settings | `setting_category`, `old_value`, `new_value` | Settings API | Preference data, re-engagement signals |

---

### 2.4 Revenue Events

| Event | Trigger | Properties | Data Source | Why Track |
|-------|---------|-----------|-------------|-----------|
| `trial_started` | Trial period begins | `tier`, `trial_duration_days`, `auto_renew` | Stripe webhook | Trial funnel |
| `trial_reminder_sent` | 3-day trial expiration email | `days_remaining`, `upgrade_link` | Automation log | Conversion influence |
| `trial_expired` | Trial period ended without upgrade | `tier_attempted`, `days_active`, `last_activity_date` | Stripe webhook | Trial loss analysis |
| `checkout_initiated` | User clicks "upgrade" button | `tier_target`, `current_tier`, `source_page` | Client click event | Upgrade intent |
| `checkout_completed` | User successfully completes payment form | `tier`, `amount_cents`, `payment_method`, `currency` | Stripe webhook | Revenue capture |
| `subscription_upgraded` | User moves to higher tier | `from_tier`, `to_tier`, `months_since_signup`, `proration_credits` | Stripe webhook | Expansion revenue |
| `subscription_downgraded` | User moves to lower tier | `from_tier`, `to_tier`, `reason_if_provided`, `months_in_tier` | Stripe webhook | Churn indicator |
| `subscription_canceled` | User cancels subscription | `tier`, `churn_reason_survey`, `months_subscribed`, `ltv_actual`, `ai_cost_per_month` | Stripe webhook + Survey | Churn analysis, exit feedback |
| `payment_failed` | Payment attempt declined or failed | `error_code`, `error_message`, `payment_method`, `retry_number` | Stripe webhook | Revenue risk, cash flow impact |
| `payment_recovered` | Failed payment later succeeded | `original_failure_date`, `recovery_date`, `retry_number` | Stripe webhook | Payment reliability |
| `refund_issued` | Refund processed | `original_transaction_id`, `reason`, `amount` | Stripe webhook | Refund rate tracking |
| `billing_email_sent` | Invoice or receipt emailed to user | `email_type` (invoice/receipt/failed_payment), `invoice_amount` | Stripe webhook | Email delivery verification |

---

### 2.5 Retention & Session Events

| Event | Trigger | Properties | Data Source | Why Track |
|-------|---------|-----------|-------------|-----------|
| `session_started` | User loads app (web or PWA) | `device_type`, `os`, `browser`, `referrer`, `session_id` | Client init | Session count, return visits |
| `session_ended` | User closes app or goes inactive for 30min | `session_duration_seconds`, `events_in_session`, `tanks_viewed`, `last_event` | Client tracking | Engagement depth |
| `daily_active` | User has at least one session in calendar day | `session_count`, `events_count`, `tanks_accessed` | Daily aggregation | DAU calculation |
| `weekly_active` | User has session in calendar week | `session_count`, `days_active` | Weekly aggregation | WAU/retention |
| `monthly_active` | User has session in calendar month | `session_count`, `days_active` | Monthly aggregation | MAU/churn |
| `app_opened_after_downtime` | User opens app after not accessing for 7+ days | `days_since_last_session`, `return_reason_inferred` | Session tracking | Reactivation signal |
| `long_session` | User has session > 30 minutes | `session_duration_seconds`, `features_used` | Session tracking | Engagement depth indicator |
| `zero_activity_day` | Calendar day with no user activity (tracked daily) | `days_since_last_activity`, `notification_sent` | Absence detection | Churn risk flag |

---

### 2.6 AI-Specific Events

| Event | Trigger | Properties | Data Source | Why Track |
|-------|---------|-----------|-------------|-----------|
| `ai_action_executed` | User performs action based on Claude response | `action_type` (create_task/add_species/schedule_water_change), `ai_suggestion_id`, `tank_id` | Button/form submit | AI value delivery |
| `ai_compatibility_check_requested` | User asks "can I keep these species together?" | `species_list`, `tank_volume`, `tank_type`, `latency_ms` | API call | Feature discovery, importance |
| `ai_compatibility_check_completed` | Claude returns compatibility analysis | `compatible`, `explanation_length_chars`, `token_count`, `cost_cents` | Claude response | AI quality, cost tracking |
| `ai_trend_alert_generated` | Claude detects concerning trend in parameters | `alert_type` (rising_ammonia/declining_pH/etc), `severity`, `tank_id` | Scheduled function | Proactive value |
| `ai_trend_alert_acknowledged` | User acknowledges trend alert | `alert_type`, `action_taken` | User click | Engagement with alerts |
| `ai_species_recommendation_shown` | Claude recommends compatible species for tank | `recommended_count`, `tank_id` | API call | AI feature engagement |
| `ai_species_recommendation_accepted` | User adds recommended species to tank | `species_added_count`, `source_recommendation_id` | Task creation | AI suggestion quality |
| `ai_water_change_calculation` | Claude calculates water change schedule | `tank_volume`, `stocking_density`, `bioload_estimate` | API call | Feature importance |
| `ai_diagnostic_run` | User runs "diagnose my tank" flow | `symptoms_provided`, `tank_history_used`, `diagnosis_confidence` | API call | Feature adoption |
| `tier_limit_hit` | User hits tier message limit (100/200/unlimited) | `tier`, `daily_message_count`, `time_to_limit_hours` | Rate limit check | Revenue friction, upgrade opportunity |
| `tier_limit_warning_sent` | User warned they're approaching message limit | `tier`, `messages_remaining`, `upgrade_link_clicked` | Notification event | Conversion opportunity |

---

### 2.7 Error & Support Events

| Event | Trigger | Properties | Data Source | Why Track |
|-------|---------|-----------|-------------|-----------|
| `error_occurred` | Uncaught error in app | `error_type`, `error_message`, `stack_trace_hash`, `user_id`, `timestamp` | Client error tracking (e.g., Sentry) | Debug, product quality |
| `api_error_occurred` | 5xx or timeout on API call | `endpoint`, `method`, `status_code`, `error_message`, `latency_ms` | Server logs | Infrastructure health |
| `support_ticket_created` | User submits support request | `category` (bug/feature_request/billing/other), `description_length`, `priority_inferred` | Support form | Support volume, issue trends |
| `support_ticket_resolved` | Support issue marked resolved | `category`, `resolution_time_hours`, `user_satisfied` | Support system | Support quality |

---

## 3. Dashboard Specifications

### 3.1 Executive Dashboard
**Audience:** Product stakeholder check-in (your Monday morning view)
**Refresh:** Every 6 hours
**Timezone:** UTC (log all server-side)

**Page Layout:**

```
┌─────────────────────────────────────────────────────────────────────┐
│                      AQUABOTAI EXECUTIVE DASHBOARD                  │
│                     Week of Feb 3-9, 2026                           │
├─────────────────────────────────────────────────────────────────────┤
│  [MRR: $2,340 ↑5%]  [Signups: 42 ↑2%]  [Conversion: 12% ↓1%]       │
│  [Churn: 8% ↓]       [ARPU: $7.20 ↑]   [DAU: 280 ↑8%]              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  MRR Trend (30-day)                  Signups by Day (30-day)        │
│  │                                    │ 45                          │
│  │      ╱╲                            │    ╱╲   ╱╲                  │
│  │     ╱  ╲___                        │   ╱  ╲_╱  ╲_                │
│  │    ╱        ╲___                   │  ╱              ╲           │
│  └──────────────────                  └────────────────────          │
│                                                                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  Tier Breakdown (Active Subs)         Trial to Paid (This Month)    │
│  ├─ Free:    280 users (60%)          ├─ Started:    25             │
│  ├─ Starter: 45 users (23%)           ├─ Upgraded:   21 (84%) ✓     │
│  ├─ Plus:    35 users (12%)           └─ Expired:    4              │
│  └─ Pro:     18 users (5%)                                          │
│                                                                       │
│  AI Cost This Month                   Week-over-Week Growth         │
│  ├─ Total: $420                       ├─ MRR:        +5.2%          │
│  ├─ Per Active: $1.32/mo              ├─ Users:      +3.1%          │
│  └─ Per Message: $0.042 (token cost)  └─ Engagement: +8.7%          │
│                                                                       │
├─────────────────────────────────────────────────────────────────────┤
│  At current growth rate:                                             │
│  • MRR $5K target: ETA June 15 ✓ (on track)                        │
│  • 1K users: Already achieved (Day 65) ✓                           │
│  • 15% conversion: Current 12%, need +3pp by Month 6                │
└─────────────────────────────────────────────────────────────────────┘
```

**Key Metrics Displayed:**
1. **Big Numbers (Top Row):** MRR, Signups (24h), Free→Paid Conversion, Churn Rate, ARPU, DAU
2. **MRR Trend Chart:** 30-day line chart with rolling 7-day average
3. **Signups by Day:** 30-day bar chart
4. **Tier Breakdown:** Donut chart (Free vs Starter vs Plus vs Pro)
5. **Trial Funnel:** Started → Upgraded → Expired (with %)
6. **AI Cost Summary:** Total + per-user + per-message
7. **WoW Growth:** MRR, signups, engagement (% change)
8. **Projection Box:** Days to hit $5K MRR, 1K users, 15% conversion targets

**Underlying SQL Queries:**

```sql
-- MRR (current month)
SELECT
  SUM(CASE WHEN status = 'active' THEN plan_amount ELSE 0 END) as current_mrr,
  SUM(CASE WHEN status = 'active' AND EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM now()) THEN 1 ELSE 0 END) as new_subs_this_month
FROM stripe_subscriptions
WHERE created_at < now() - INTERVAL '1 day'
GROUP BY EXTRACT(MONTH FROM current_date);

-- Signups (24h)
SELECT COUNT(*) as signups_24h
FROM auth.users
WHERE created_at > now() - INTERVAL '24 hours';

-- Free-to-Paid Conversion (30-day)
SELECT
  ROUND(100.0 * COUNT(DISTINCT CASE WHEN sub_status = 'active' THEN user_id END) /
    NULLIF(COUNT(DISTINCT CASE WHEN (auth_created < now() - INTERVAL '30 days') THEN user_id END), 0), 1) as conversion_pct
FROM (
  SELECT u.id as user_id, u.created_at as auth_created, s.status as sub_status
  FROM auth.users u
  LEFT JOIN stripe_subscriptions s ON u.id = s.user_id AND s.status = 'active'
  WHERE u.created_at > now() - INTERVAL '30 days'
);

-- ARPU (active subs only)
SELECT
  ROUND(SUM(plan_amount)::numeric / NULLIF(COUNT(DISTINCT user_id), 0), 2) as arpu
FROM stripe_subscriptions
WHERE status = 'active';

-- Churn Rate (monthly)
SELECT
  ROUND(100.0 * COUNT(DISTINCT CASE WHEN canceled_at > now() - INTERVAL '30 days' THEN user_id END) /
    NULLIF(COUNT(DISTINCT user_id), 0), 2) as monthly_churn_pct
FROM stripe_subscriptions
WHERE status IN ('canceled', 'active');

-- AI Cost (current month)
SELECT
  SUM(cost_cents) / 100.0 as total_cost,
  ROUND(SUM(cost_cents) / NULLIF(COUNT(DISTINCT user_id), 0) / 100.0, 2) as cost_per_user
FROM anthropic_usage
WHERE DATE(created_at) >= DATE_TRUNC('month', now());
```

---

### 3.2 Product Health Dashboard
**Audience:** Daily ops check (is the product running smoothly?)
**Refresh:** Every 15 minutes
**Timezone:** UTC

**Page Layout:**

```
┌──────────────────────────────────────────────────────────────────┐
│              AQUABOTAI PRODUCT HEALTH DASHBOARD                  │
│                      Today | This Week | This Month              │
├──────────────────────────────────────────────────────────────────┤
│  [DAU: 280 ↑3%]  [WAU: 420 ↑5%]  [MAU: 780 ↑2%]                │
│  [Error Rate: 0.4% ✓]  [Latency P95: 1.8s ✓]  [Uptime: 99.8%]   │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Feature Adoption (Active Users)       Session Distribution       │
│  ├─ Tank Created: 420/780 (54%)        ├─ 1 session:      180     │
│  ├─ Param Logged: 380/780 (49%)        ├─ 2-5 sessions:   280     │
│  ├─ AI Message: 210/780 (27%)          ├─ 6-10 sessions:  150     │
│  ├─ Task Created: 195/780 (25%)        ├─ 11+ sessions:   170     │
│  └─ Species Added: 240/780 (31%)       └─ Avg: 6.2 sessions      │
│                                                                   │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  API Error Rate (24h)                  Latency Percentiles (24h) │
│  │ 0.8%                                │ P50:   0.8s              │
│  │   ╲                                  │ P75:   1.2s              │
│  │    ╲                                 │ P90:   2.1s              │
│  │     ╲                                │ P95:   1.8s ✓           │
│  └──────── < 1% target                 │ P99:   3.5s             │
│                                         │                         │
│                                                                   │
│  Database Performance (24h)             Top Issues (24h)         │
│  ├─ Avg Query: 45ms                    ├─ 401 Unauthorized: 12   │
│  ├─ P95 Query: 320ms ✓                 ├─ 400 Bad Request: 8     │
│  ├─ Slowest Query: auth.claims_fetch   ├─ 500 Server Error: 3    │
│  └─                                    ├─ Timeout: 2             │
│                                         └─ Others: 1              │
│                                                                   │
├──────────────────────────────────────────────────────────────────┤
│  Alerts:                                                          │
│  ⚠️  None currently                                              │
└──────────────────────────────────────────────────────────────────┘
```

**Key Metrics Displayed:**
1. **DAU/WAU/MAU (Top Row):** Daily, weekly, monthly active users + trend arrows
2. **Feature Adoption (Pie/Bar):** % of MAU who've used each feature
3. **Session Distribution:** Histogram of session counts per user
4. **Error Rate Sparkline:** 24-hour trend, shows spike/recovery
5. **Latency Percentiles:** P50, P75, P90, P95, P99 with targets
6. **Database Performance:** Query latency percentiles, slowest queries
7. **Top Errors:** 401, 400, 500, timeouts (with counts)
8. **Alert Zone:** Show any SLA violations

**Underlying SQL Queries:**

```sql
-- DAU (distinct users with session today)
SELECT COUNT(DISTINCT user_id) as dau
FROM events
WHERE DATE(created_at) = CURRENT_DATE
  AND event_name = 'session_started';

-- WAU, MAU (same pattern, different date range)
SELECT
  COUNT(DISTINCT CASE WHEN created_at > now() - INTERVAL '7 days' THEN user_id END) as wau,
  COUNT(DISTINCT CASE WHEN created_at > now() - INTERVAL '30 days' THEN user_id END) as mau
FROM events
WHERE event_name = 'session_started';

-- Feature Adoption (% of MAU)
WITH mau_users AS (
  SELECT DISTINCT user_id FROM events WHERE created_at > now() - INTERVAL '30 days'
)
SELECT
  'Tank Created' as feature,
  ROUND(100.0 * COUNT(DISTINCT CASE WHEN mau_users.user_id IN (SELECT user_id FROM events WHERE event_name = 'first_tank_created' AND created_at > now() - INTERVAL '30 days') THEN mau_users.user_id END) / NULLIF(COUNT(DISTINCT mau_users.user_id), 0), 1) as adoption_pct
FROM mau_users;

-- API Error Rate (24h)
SELECT
  ROUND(100.0 * COUNT(CASE WHEN status_code >= 400 THEN 1 END) / NULLIF(COUNT(*), 0), 2) as error_rate_pct
FROM api_logs
WHERE created_at > now() - INTERVAL '24 hours';

-- Latency Percentiles (24h)
SELECT
  PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY latency_ms) as p50_ms,
  PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY latency_ms) as p75_ms,
  PERCENTILE_CONT(0.90) WITHIN GROUP (ORDER BY latency_ms) as p90_ms,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY latency_ms) as p95_ms,
  PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY latency_ms) as p99_ms
FROM api_logs
WHERE created_at > now() - INTERVAL '24 hours'
  AND endpoint LIKE '/api/claude%';
```

---

### 3.3 Revenue Dashboard
**Audience:** Subscription and churn deep-dive
**Refresh:** Daily
**Timezone:** UTC

**Page Layout:**

```
┌────────────────────────────────────────────────────────────────┐
│               AQUABOTAI REVENUE DASHBOARD                      │
│              Week of Feb 3-9, 2026 | Month View               │
├────────────────────────────────────────────────────────────────┤
│  [MRR: $2,340]  [Arr: $28,080]  [Paid Users: 98]  [LTV: $42]  │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Trial Funnel (30-day)                Subscription Status       │
│  ├─ Entered Trial: 28                 ├─ Active:     98 (↓2)   │
│  │  └─ % of Signups: 35%              ├─ Canceled:   4 (↑1)    │
│  │                                    ├─ Overdue:    1         │
│  ├─ Upgraded: 21 (75%) ✓              └─ Past Due:   0         │
│  │  └─ Avg time to upgrade: 5.2 days                          │
│  │                                                             │
│  └─ Expired: 7 (25%)                                          │
│     └─ Avg days until expiry: 14                              │
│                                                                 │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  MRR by Tier (Current)                Upgrade/Downgrade Path  │
│  ├─ Starter: $179.55 (8%)             ├─ Free→Starter: 42     │
│  ├─ Plus: $279.65 (12%)               ├─ Free→Plus: 3         │
│  ├─ Pro: $269.55 (12%)                ├─ Free→Pro: 2          │
│  └─ Other: $1,611.25 (68%)            ├─ Starter→Plus: 8      │
│                                        ├─ Starter→Pro: 2       │
│                                        ├─ Plus→Starter: 1      │
│                                        └─ Pro→Starter: 0       │
│                                                                 │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Payment Health (24h)                 Churn Details (30-day)  │
│  ├─ Successful: 4 / 4 (100%) ✓        ├─ Total Canceled: 4    │
│  ├─ Failed: 0                         ├─ Reason breakdown:     │
│  ├─ Pending Retry: 0                  │  ├─ Too Expensive: 1   │
│  └─ Refunds: 0                        │  ├─ Not Using: 2       │
│                                        │  └─ Other/Unknown: 1   │
│                                        ├─ Avg LTV: $38         │
│                                        └─ Avg MOS: 3.2 months  │
│                                                                 │
├────────────────────────────────────────────────────────────────┤
│  Revenue Projections:                                          │
│  • $5K MRR: ETA June 15 (based on +$180/week trend)           │
│  • $10K MRR: ETA September (if conversion holds 12%)          │
└────────────────────────────────────────────────────────────────┘
```

**Key Metrics Displayed:**
1. **Top Numbers:** MRR, ARR, Paid Users, LTV, Churn %
2. **Trial Funnel:** Entered → Upgraded → Expired (with %)
3. **Subscription Status:** Active / Canceled / Overdue breakdown
4. **MRR by Tier:** Stacked bar or donut showing mix
5. **Upgrade/Downgrade Flows:** Sankey diagram or migration matrix
6. **Payment Health:** Success rate, failures, retries, refunds
7. **Churn Breakdown:** Reasons, LTV of churned cohort
8. **Revenue Projection:** Days to $5K, $10K based on trend

**Underlying SQL Queries:**

```sql
-- Trial Funnel (30-day)
SELECT
  COUNT(DISTINCT CASE WHEN trial_start > now() - INTERVAL '30 days' THEN user_id END) as entered_trial,
  COUNT(DISTINCT CASE WHEN trial_start > now() - INTERVAL '30 days' AND upgraded_at IS NOT NULL THEN user_id END) as upgraded,
  ROUND(100.0 * COUNT(DISTINCT CASE WHEN upgraded_at IS NOT NULL THEN user_id END) /
    NULLIF(COUNT(DISTINCT user_id), 0), 1) as upgrade_pct
FROM stripe_subscriptions
WHERE trial_start > now() - INTERVAL '30 days';

-- MRR by Tier (current)
SELECT
  tier,
  COUNT(DISTINCT user_id) as subscriber_count,
  ROUND(SUM(plan_amount) / 100.0, 2) as tier_mrr,
  ROUND(100.0 * SUM(plan_amount) / (SELECT SUM(plan_amount) FROM stripe_subscriptions WHERE status = 'active'), 1) as pct_of_total_mrr
FROM stripe_subscriptions
WHERE status = 'active'
GROUP BY tier
ORDER BY tier_mrr DESC;

-- Churn Analysis (30-day)
SELECT
  COUNT(DISTINCT user_id) as churned_users,
  ROUND(AVG(EXTRACT(DAY FROM (canceled_at - created_at))), 1) as avg_months_subscribed,
  ROUND(AVG(ltv_cents) / 100.0, 2) as avg_ltv
FROM stripe_subscriptions
WHERE canceled_at > now() - INTERVAL '30 days';

-- Payment Success Rate (24h)
SELECT
  ROUND(100.0 * COUNT(CASE WHEN status = 'succeeded' THEN 1 END) / NULLIF(COUNT(*), 0), 1) as success_pct,
  COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_count,
  COUNT(CASE WHEN status = 'pending_retry' THEN 1 END) as pending_retry_count
FROM stripe_payment_intents
WHERE created_at > now() - INTERVAL '24 hours';

-- Revenue Projection (linear extrapolation)
WITH recent_mrr AS (
  SELECT
    DATE_TRUNC('week', created_at)::date as week,
    SUM(plan_amount) / 100.0 as weekly_mrr
  FROM stripe_subscriptions
  WHERE status = 'active'
    AND DATE_TRUNC('week', created_at) >= now() - INTERVAL '12 weeks'
  GROUP BY week
)
SELECT
  ROUND(AVG(weekly_mrr), 2) as avg_weekly_mrr,
  ROUND((5000 - (SELECT MAX(weekly_mrr) FROM recent_mrr)) / AVG(weekly_mrr), 0) as weeks_to_5k_mrr
FROM recent_mrr;
```

---

### 3.4 AI Performance Dashboard
**Audience:** AI cost and quality monitoring
**Refresh:** Every 30 minutes
**Timezone:** UTC

**Page Layout:**

```
┌───────────────────────────────────────────────────────────┐
│            AQUABOTAI AI PERFORMANCE DASHBOARD             │
│                 Today | This Week | This Month            │
├───────────────────────────────────────────────────────────┤
│  [Msgs Today: 180]  [Cost Today: $7.20]  [Cost/User: $1.32] │
│  [Latency P95: 1.8s ✓]  [Success Rate: 99.7% ✓]           │
├───────────────────────────────────────────────────────────┤
│                                                             │
│  AI Messages Trend (30-day)            Daily Message Mix   │
│  │ 200                                  ├─ Q&A: 45%        │
│  │    ╱╲                                ├─ Species ID: 25% │
│  │   ╱  ╲___                            ├─ Diagnostics: 20%│
│  │  ╱        ╲___                       └─ Other: 10%      │
│  └──────────────────                                      │
│                                                             │
├───────────────────────────────────────────────────────────┤
│                                                             │
│  API Cost Breakdown (Month)           Token Efficiency     │
│  ├─ Input Tokens: $245 (58%)          ├─ Avg In: 420 tokens│
│  ├─ Output Tokens: $175 (42%)         ├─ Avg Out: 280 tokens│
│  └─ Total: $420                       ├─ Avg Cost/Msg: $2.33│
│                                        └─ Budget Remaining: │
│                                            $80 (16%)       │
│                                                             │
│  Top Message Types (Cost)              Error Rate (24h)    │
│  ├─ Species Compatibility: $156 (37%)  ├─ Parse Errors: 0  │
│  ├─ Diagnostics: $128 (30%)            ├─ Timeouts: 1 (0.6%)│
│  ├─ Trend Analysis: $84 (20%)          ├─ Rate Limited: 0   │
│  └─ QA: $52 (12%)                      └─ Other: 0          │
│                                                             │
├───────────────────────────────────────────────────────────┤
│                                                             │
│  Latency Percentiles                  Message Cost by User │
│  ├─ P50: 0.8s ✓                       ├─ Heavy (>5): $2.10 │
│  ├─ P75: 1.2s ✓                       ├─ Medium (2-5): $1.50│
│  ├─ P90: 2.0s ✓                       ├─ Light (1): $0.80  │
│  ├─ P95: 1.8s ✓                       └─ None: $0          │
│  └─ P99: 3.5s (1 outlier)                                  │
│                                                             │
├───────────────────────────────────────────────────────────┤
│  Status:  ✓ All systems nominal                           │
│  Warning: ⚠️  None currently                              │
│  Action:  None needed (cost on track)                    │
└───────────────────────────────────────────────────────────┘
```

**Key Metrics Displayed:**
1. **Big Numbers:** Messages today, cost today, cost per active user, P95 latency, success rate
2. **Message Trend:** 30-day line chart of daily message count
3. **Message Mix:** Pie chart (Q&A vs Species ID vs Diagnostics vs Other)
4. **Cost Breakdown:** Input vs output tokens (pie)
5. **Top Message Types:** Cost ranking (bar chart)
6. **Latency Percentiles:** P50 through P99 with SLA indicators
7. **Error Rate:** Parse, timeout, rate limit, other
8. **Cost by User Segment:** Heavy/Medium/Light/None users

**Underlying SQL Queries:**

```sql
-- Message Volume Today
SELECT COUNT(*) as messages_today
FROM events
WHERE event_name = 'ai_message_sent'
  AND DATE(created_at) = CURRENT_DATE;

-- Cost Breakdown (today)
SELECT
  ROUND(SUM(input_tokens * 0.003 + output_tokens * 0.006) / 100.0, 2) as cost_today,
  SUM(input_tokens) as total_input_tokens,
  SUM(output_tokens) as total_output_tokens,
  COUNT(*) as message_count
FROM anthropic_usage
WHERE DATE(created_at) = CURRENT_DATE;

-- Cost per Active User (month)
SELECT
  ROUND(SUM(cost_cents) / 100.0 / NULLIF(COUNT(DISTINCT user_id), 0), 2) as cost_per_active_user
FROM anthropic_usage
WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', now());

-- Latency Percentiles (24h, AI messages)
SELECT
  PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY latency_ms) as p50_ms,
  PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY latency_ms) as p75_ms,
  PERCENTILE_CONT(0.90) WITHIN GROUP (ORDER BY latency_ms) as p90_ms,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY latency_ms) as p95_ms,
  PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY latency_ms) as p99_ms
FROM events
WHERE event_name = 'ai_message_sent'
  AND created_at > now() - INTERVAL '24 hours';

-- Message Type Distribution (today)
SELECT
  properties->>'message_type' as message_type,
  COUNT(*) as count,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 1) as pct
FROM events
WHERE event_name = 'ai_message_sent'
  AND DATE(created_at) = CURRENT_DATE
GROUP BY properties->>'message_type'
ORDER BY count DESC;

-- Cost by Message Type (month)
SELECT
  properties->>'message_type' as message_type,
  COUNT(*) as message_count,
  ROUND(SUM(cost_cents) / 100.0, 2) as total_cost,
  ROUND(100.0 * SUM(cost_cents) / (SELECT SUM(cost_cents) FROM anthropic_usage WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', now())), 1) as pct_of_total
FROM anthropic_usage
WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', now())
GROUP BY message_type
ORDER BY total_cost DESC;

-- Message Cost by User Segment (heavy/medium/light)
WITH user_msg_counts AS (
  SELECT
    user_id,
    COUNT(*) as message_count,
    ROUND(SUM(cost_cents) / 100.0, 2) as user_cost
  FROM anthropic_usage
  WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', now())
  GROUP BY user_id
)
SELECT
  CASE
    WHEN message_count >= 5 THEN 'Heavy (5+)'
    WHEN message_count >= 2 THEN 'Medium (2-4)'
    WHEN message_count >= 1 THEN 'Light (1)'
    ELSE 'None'
  END as segment,
  COUNT(*) as user_count,
  ROUND(AVG(user_cost), 2) as avg_cost_per_user,
  ROUND(SUM(user_cost), 2) as segment_total_cost
FROM user_msg_counts
GROUP BY segment
ORDER BY segment_total_cost DESC;
```

---

## 4. Feedback Loop Design

### 4.1 In-App Feedback Mechanism

**When to Prompt:**
- After first successful feature use (e.g., after first parameter logged) — "How was that?"
- After session of 10+ minutes — "Quick feedback?"
- After AI suggestion accepted — "Helpful?" (thumbs up/down)
- Monthly: Random 10% of users — "Rate your experience" (1-5 stars)

**Where to Collect:**
- Floating card in bottom-right corner (non-intrusive)
- In-feature modals (context-specific)
- Post-action inline (next to completed action)

**What to Ask:**

```
TIER 1 (Minimal friction):
└─ "Was this helpful?" [👍 👎]

TIER 2 (If positive):
└─ "What made it helpful?" [open text, 50 chars max]

TIER 3 (If negative or indifferent):
└─ "What could we improve?" [quick_select: confusing / didn't_work / slow / other]

TIER 4 (Optional, for power users):
└─ "Feature request?" [open text, optional]
```

**Data Collection:**

```sql
CREATE TABLE feedback (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  feature_context TEXT, -- e.g., 'parameter_log', 'ai_message', 'task_create'
  sentiment INT, -- -1 (negative), 0 (neutral), 1 (positive)
  rating INT, -- 1-5 stars (optional)
  comment TEXT,
  tags TEXT[], -- e.g., ['slow', 'confusing', 'helpful']
  created_at TIMESTAMP DEFAULT now()
);
```

**Review Cadence:**
- Weekly: Read 10-15 feedback entries (Friday afternoon), extract themes
- Monthly: Aggregate tag frequency, identify top 3 improvement areas

---

### 4.2 NPS Survey Cadence

**When to Send:**
- 2 weeks post-signup (user activated)
- 1 month post-upgrade (trial→paid)
- Monthly to all users (optional, random 20%)

**How to Send:**
- In-app modal (non-blocking) with option to email
- Email to churned users (cancel flow) — "One question before you go"

**Survey Questions:**

```
PRIMARY:
Q1: "How likely are you to recommend AquaBotAI to a fellow aquarist?" (0-10)

FOLLOW-UP (based on response):
├─ If 9-10 (Promoter):
│  └─ "What do you like most?" [open]
│
├─ If 7-8 (Passive):
│  └─ "What could we do better?" [open]
│
└─ If 0-6 (Detractor):
   ├─ "What's the main issue?" [multi_select: too expensive / confusing / doesn't work / missing feature / other]
   └─ "Any parting advice?" [open]

OPTIONAL (monthly only):
Q2: "Which feature do you use most?" [tank_logs / ai_chat / species_search / tasks / none]
Q3: "What's one feature you'd love to see?" [open]
```

**Data Collection:**

```sql
CREATE TABLE nps_surveys (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  score INT CHECK (score >= 0 AND score <= 10),
  category TEXT, -- 'promoter' / 'passive' / 'detractor'
  reason TEXT,
  follow_up_response TEXT,
  survey_type TEXT, -- 'post_signup' / 'post_upgrade' / 'monthly' / 'churn'
  created_at TIMESTAMP DEFAULT now()
);

-- Calculate NPS score
SELECT
  ROUND(100.0 * (
    (COUNT(CASE WHEN score >= 9 THEN 1 END) - COUNT(CASE WHEN score <= 6 THEN 1 END)) /
    NULLIF(COUNT(*), 0)
  ), 1) as nps_score
FROM nps_surveys
WHERE created_at > now() - INTERVAL '30 days';
```

**Review Cadence:**
- Weekly: Check NPS score, read 5 open responses
- Monthly: Full analysis (NPS by cohort, reason trending)
- Target: NPS > 40 by Month 6

---

### 4.3 Feature Request Tracking

**Where to Store:**
GitHub Discussions (public, transparent) + Spreadsheet backup

**How to Collect:**
1. **In-App:** "Request a feature?" link in settings
2. **Email:** support@aquabotai.com with subject "FEATURE REQUEST:"
3. **Form:** Simple Google Form (link in help modal)

**Submission Template:**

```markdown
**Feature:** [One-line description]

**Why:** [Problem it solves / use case]

**Context:** [User tier, feature they use most]

**Sketches/Details:** [Optional]
```

**Tracking System:**

```sql
CREATE TABLE feature_requests (
  id UUID PRIMARY KEY,
  user_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  tier TEXT, -- 'free' / 'starter' / 'plus' / 'pro'
  primary_feature TEXT, -- 'ai', 'logging', 'tasks', 'species', 'other'
  upvotes INT DEFAULT 0,
  status TEXT DEFAULT 'submitted', -- 'submitted' / 'reviewing' / 'planned' / 'building' / 'shipped' / 'declined'
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Weekly report
SELECT
  title,
  COUNT(DISTINCT id) as request_count,
  status,
  tier as primary_requestor_tier
FROM feature_requests
WHERE created_at > now() - INTERVAL '7 days'
GROUP BY title, status, tier
ORDER BY request_count DESC
LIMIT 10;
```

**Review Cadence:**
- Weekly: List top 5 requests + upvote counts
- Monthly: Decide on 2-3 to plan into next sprint
- Public update: Post shipping updates to GitHub Discussions

---

### 4.4 AI Quality Feedback (Thumbs Up/Down)

**When Collected:**
- Immediately after AI suggestion shown OR message received
- Inline buttons: 👍 (helpful/accurate) and 👎 (unhelpful/wrong)
- Optional: "Why?" open-text (max 100 chars)

**Data Structure:**

```sql
CREATE TABLE ai_feedback (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  ai_message_id UUID NOT NULL, -- links to original message
  suggestion_type TEXT, -- 'species_compat' / 'param_issue' / 'water_change' / 'qa_response'
  feedback_sentiment INT, -- 1 (positive) / -1 (negative)
  reason TEXT, -- optional open comment
  created_at TIMESTAMP DEFAULT now()
);

-- Quality metric
SELECT
  suggestion_type,
  ROUND(100.0 * COUNT(CASE WHEN feedback_sentiment = 1 THEN 1 END) / NULLIF(COUNT(*), 0), 1) as positive_pct,
  COUNT(*) as total_feedback
FROM ai_feedback
WHERE created_at > now() - INTERVAL '30 days'
GROUP BY suggestion_type
ORDER BY positive_pct DESC;
```

**Review Cadence:**
- Daily: Check if any suggestion type drops below 85% positive
- Weekly: Review top negative reasons (what's confusing users?)
- Monthly: Adjust Claude prompts based on feedback patterns

---

### 4.5 Churned User Survey

**When Triggered:**
- User clicks "Cancel subscription" in settings
- Appears as final modal before confirmation

**Questions (Required → Optional):**

```
"Sorry to see you go! One quick question:"

PRIMARY (Required):
"Why are you canceling?" [select one]
├─ Too expensive
├─ Not using it
├─ Missing features
├─ AI quality issues
├─ Technical problems
├─ Switching to competitor
└─ Other [open]

SECONDARY (If selected):
"Any specific feedback?" [open text, optional]
```

**Data Collection:**

```sql
CREATE TABLE churn_surveys (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  subscription_id TEXT, -- Stripe subscription ID
  tier TEXT,
  months_active INT,
  ltv_cents INT,
  reason TEXT,
  feedback TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- Churn analysis
SELECT
  reason,
  COUNT(*) as count,
  ROUND(AVG(months_active), 1) as avg_months,
  ROUND(AVG(ltv_cents) / 100.0, 2) as avg_ltv,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 1) as pct
FROM churn_surveys
WHERE created_at > now() - INTERVAL '30 days'
GROUP BY reason
ORDER BY count DESC;
```

**Review Cadence:**
- Weekly: Read all churn survey responses
- Monthly: Calculate top churn reasons + patterns
- Action: If "Too expensive" > 40%, revisit pricing. If "Missing features" > 30%, prioritize that feature.

---

### 4.6 Support Ticket Analysis & Trending

**Categorization:**

```sql
CREATE TABLE support_tickets (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  category TEXT NOT NULL, -- bug / feature_request / billing / ai_quality / onboarding / other
  subcategory TEXT, -- e.g., 'parameter_not_saved' / 'ai_response_wrong'
  description TEXT,
  priority INT DEFAULT 2, -- 1 (critical) / 2 (normal) / 3 (low)
  status TEXT DEFAULT 'open', -- 'open' / 'in_progress' / 'resolved' / 'closed'
  resolved_at TIMESTAMP,
  resolution_time_hours NUMERIC,
  tags TEXT[], -- e.g., ['crashes', 'iphone', 'ios17']
  created_at TIMESTAMP DEFAULT now()
);

-- Weekly trending report
SELECT
  category,
  COUNT(*) as ticket_count,
  ROUND(AVG(resolution_time_hours), 1) as avg_resolution_hours,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 1) as pct_of_total
FROM support_tickets
WHERE created_at > now() - INTERVAL '7 days'
GROUP BY category
ORDER BY ticket_count DESC;
```

**Review Cadence:**
- Daily: Check for P1 (critical) tickets
- Weekly: Category breakdown, identify top recurring issues
- Monthly: Trend analysis (are bugs decreasing? feature requests increasing?)

---

## 5. Iteration Cadence

### 5.1 Daily (5-10 minutes)

**Checklist — Every morning, 9 AM UTC:**

```
□ Check Vercel deployment status
  └─ Link: https://vercel.com/aquabotai/dashboard

□ Review error rate (Sentry or Vercel logs)
  └─ Alert threshold: > 2% (investigate)

□ Check AI latency P95
  └─ Alert threshold: > 4 seconds (may indicate rate limiting)

□ Review Stripe payment failures
  └─ Run query: SELECT COUNT(*) FROM stripe_payment_intents WHERE status = 'failed' AND created_at > now() - INTERVAL '24 hours'
  └─ Alert threshold: > 5% of attempts

□ Check Anthropic token burn
  └─ Link: Anthropic console
  └─ Alert threshold: On pace for > 90% monthly budget

□ Scan support inbox for critical issues
  └─ Reply to P1 tickets within 2 hours

□ Note any unusual metrics for weekly review
```

---

### 5.2 Weekly (Monday morning, 30 minutes)

**Checklist — Every Monday, 9 AM UTC:**

```
□ Export all Primary KPI metrics to spreadsheet
  └─ Template: Google Sheets "AquaBotAI Metrics" (shared)
  └─ Columns: Date, MRR, Signups, Conversion%, Churn%, ARPU, DAU, AI Cost/User

□ Review Executive Dashboard
  └─ Link: your-dashboard-url.com/executive
  └─ Note: Any KPIs trending outside target range? Flag for action.

□ Review Product Health Dashboard
  └─ Link: your-dashboard-url.com/health
  └─ Note: Feature adoption rates, error trends

□ Analyze new support tickets from past 7 days
  └─ Categorize by type (bug / feature / billing / other)
  └─ Top 3 issues: document and plan mitigations

□ Read user feedback (in-app + NPS)
  └─ Sample: 10-15 recent feedback entries
  └─ Extract top 3 themes

□ Review AI quality (thumbs up/down feedback)
  └─ Any suggestion type < 85% positive? Flag for prompt improvement.

□ Check feature request votes (GitHub Discussions)
  └─ Top 5 by votes + comments

□ Update "Roadmap" section of next sprint based on findings
  □─ 1-2 most impactful features to build
  │─ 1 tech debt / quality improvement
  │─ 1 experiment to run
  └─ Estimated effort + risks

□ Write brief "Weekly Standup" note (5 bullet points)
  └─ Accomplishments this week
  └─ Metric highlights / lowlights
  └─ Next week priorities
  └─ Any blockers
  └─ Save to Google Doc "AquaBotAI Weekly Updates"
```

**Template — Weekly Standup Note:**

```markdown
# Week of [DATE] Standup

## Metrics Snapshot
- MRR: $X (↑/-X from last week)
- Signups: X (↑/-X)
- Conversion: X% (↑/-X)
- Churn: X% (↑/-X)
- DAU/WAU: X/X (↑/-X)

## Accomplishments
1. [Shipped feature/fix]
2. [Bug fixed]
3. [Analysis completed]

## Key Issues
1. [Issue 1 + impact]
2. [Issue 2 + impact]

## Next Week Plan
1. [Priority 1]
2. [Priority 2]
3. [Priority 3]

## Blockers / Risks
- [If any]
```

---

### 5.3 Bi-Weekly (Every other Wednesday)

**Checklist — Ship updates & changelog:**

```
□ Merge all pull requests to main
  └─ Run full test suite
  └─ Verify deployments on staging

□ Deploy to production
  └─ Link: Vercel deployment button

□ Write changelog entry
  └─ Template file: CHANGELOG.md
  └─ Format: Date, version #, what shipped (features + fixes)

□ Update roadmap in docs/PUBLIC_ROADMAP.md
  └─ What shipped (remove from upcoming)
  └─ What's next 2 weeks (public)

□ Send customer update email (if shipped feature)
  └─ To: All users or segment (free vs paid)
  └─ Subject: "AquaBotAI Update: [Feature Name]"
  └─ Body: What changed + why + how to use

□ Post update to social if applicable
  └─ Twitter / Product Hunt / Reddit
```

---

### 5.4 Monthly (First Monday of month, 2 hours)

**Checklist — Deep analysis + strategy update:**

```
□ Run full cohort analysis
  └─ Retention curve by signup week (N=weeks to 0 retention)
  └─ Retention curve by tier (Free vs Starter vs Plus vs Pro)
  └─ Retention curve by activation (onboarding completed vs not)

□ Analyze churn patterns
  └─ Who's leaving? (which cohort/tier?)
  └─ Why? (use churn survey data)
  └─ How to reduce?

□ Review unit economics
  └─ CAC: If doing paid ads, CAC = ad spend / conversions (else N/A for now)
  └─ LTV: Avg subscription revenue * avg subscription duration
  └─ LTV:CAC ratio (should be > 3:1)

□ AI cost analysis
  └─ Cost per user trend
  └─ Cost per message trend
  └─ Identify high-cost message types (optimize prompts?)

□ Update financial projections
  └─ Based on current growth rate, when do we hit $5K MRR? $10K?
  └─ Update spreadsheet: scenarios/financial_projections.xlsx

□ Competitive analysis (spot check)
  └─ Any new competitors? Feature parity check.
  └─ Update: docs/COMPETITIVE_ANALYSIS.md

□ Pricing review
  └─ Are tiers optimized? Conversion data supports current pricing?
  └─ Consider: A/B test new pricing tier or messaging next month?

□ Roadmap planning for next month
  └─ Prioritize based on: usage data + user requests + business goals
  └─ Pick 4-5 features/improvements to work on

□ Update "Key Metrics Dashboard" (Google Sheets)
  └─ Add this month's final metrics
  └─ Color-code: Green (hitting target), Yellow (slightly off), Red (missing)
```

**Template — Monthly Deep Dive Report:**

```markdown
# Monthly Business Review — [MONTH]

## Key Metrics
| Metric | Target | Actual | Status | Change |
|--------|--------|--------|--------|--------|
| MRR | $X | $X | 🟢 | +X% |
| Signups | X | X | 🟢 | +X% |
| Conversion | 15% | X% | 🟡 | -X% |
| Churn | <10% | X% | 🟢 | -X% |
| DAU | >280 | X | 🟢 | +X% |
| AI Cost/User | <$2 | $X | 🟢 | -X% |

## Cohort Analysis
- **Signup Cohort (Week 1 vs Week 4):** X% retention drop
- **Tier Cohort:** Pro users retain 2x better than Starter
- **Activation Cohort:** Users who complete onboarding have 80% better 30-day retention

## Churn Root Cause Analysis
- **Top Reasons (from surveys):** [reason 1, reason 2, reason 3]
- **Action Items:** [How to address]

## Feature Adoption Highlights
- [Feature 1]: X% adoption (🟢 exceeds expectations)
- [Feature 2]: X% adoption (🟡 underperforming, needs investigation)

## Financial Health
- **CAC:** $X (if applicable)
- **LTV:** $X (avg)
- **LTV:CAC:** X:1
- **Runway:** X months (if tracking burn)

## Roadmap for Next Month
1. [Top priority + why]
2. [Priority 2 + why]
3. [Priority 3 + why]

## Risks & Mitigations
- [Risk]: [Mitigation]

## Notes for Self
- [Observations / learnings]
```

---

### 5.5 Quarterly (End of March, June, Sept, Dec)

**Checklist — Strategy & competitive review:**

```
□ Full product strategy review
  └─ Are we solving the right problem?
  └─ Is the market responding?
  └─ What should we double down on?

□ Competitive deep dive
  └─ Who are actual competitors now?
  └─ Feature comparison matrix (us vs top 3 competitors)
  └─ Any moves we should respond to?

□ Pricing strategy evaluation
  └─ Market research: what would users pay for Pro tier?
  └─ A/B test results (if any)
  └─ Recommendation: keep as-is / adjust / add tier?

□ Infrastructure cost review
  └─ Vercel, Supabase, Anthropic costs trending?
  └─ Any optimization opportunities?

□ Hiring / partnership assessment
  └─ Is this still a 1-person project? Bottlenecks emerging?
  └─ Should we hire? Partner?

□ Quarterly OKRs for next quarter
  └─ Update: docs/QUARTERLY_OKRS.md
  └─ Format: 1 strategic goal, 3-5 key results
  └─ Example: Goal = "Improve AI quality", KR = "Reach 90% positive feedback"
```

---

## 6. Cohort Analysis Plan

Cohort analysis reveals retention and engagement patterns by user segment. Key cohorts to track:

### 6.1 Signup Week Cohort (Retention Curves)

**Definition:** Group users by signup week, track retention % over time

**Why:** Identify if product retention is improving over time (product-market fit signals)

**Visualization:** Retention table with cohorts as rows, weeks as columns

```
Signup Week | Week 1 | Week 2 | Week 3 | Week 4 | Week 8 | Week 12 |
─────────────────────────────────────────────────────────────────────
Week 1      | 100%   | 65%    | 45%    | 32%    | 15%    | 8%      |
Week 2      | 100%   | 68%    | 48%    | 35%    | 18%    | 10%     |
Week 3      | 100%   | 70%    | 50%    | 37%    | 20%    | 12%     |
Week 4      | 100%   | 72%    | 52%    | 39%    | 22%    | N/A     |
(Improving retention trend suggests product improvements working)
```

**SQL Query:**

```sql
-- Signup cohort retention
WITH first_session AS (
  SELECT
    user_id,
    DATE_TRUNC('week', created_at)::date as signup_week,
    created_at
  FROM auth.users
),
user_weeks AS (
  SELECT
    fs.user_id,
    fs.signup_week,
    DATE_TRUNC('week', e.created_at)::date as activity_week,
    (DATE_TRUNC('week', e.created_at)::date - fs.signup_week) / 7 as weeks_since_signup
  FROM first_session fs
  LEFT JOIN events e ON fs.user_id = e.user_id
  WHERE e.event_name IN ('session_started', 'parameter_logged', 'ai_message_sent')
)
SELECT
  signup_week,
  COUNT(DISTINCT user_id) as cohort_size,
  ROUND(100.0 * COUNT(DISTINCT CASE WHEN weeks_since_signup <= 1 THEN user_id END) / NULLIF(COUNT(DISTINCT user_id), 0), 1) as week_1_pct,
  ROUND(100.0 * COUNT(DISTINCT CASE WHEN weeks_since_signup <= 2 THEN user_id END) / NULLIF(COUNT(DISTINCT user_id), 0), 1) as week_2_pct,
  ROUND(100.0 * COUNT(DISTINCT CASE WHEN weeks_since_signup <= 4 THEN user_id END) / NULLIF(COUNT(DISTINCT user_id), 0), 1) as week_4_pct,
  ROUND(100.0 * COUNT(DISTINCT CASE WHEN weeks_since_signup <= 12 THEN user_id END) / NULLIF(COUNT(DISTINCT user_id), 0), 1) as week_12_pct
FROM user_weeks
GROUP BY signup_week
ORDER BY signup_week DESC;
```

---

### 6.2 Tier Cohort (Free vs Starter vs Plus vs Pro)

**Definition:** Track engagement and retention by subscription tier

**Why:** Understand if paid tiers have better retention, validate pricing strategy

**Metrics to Track:**

```sql
-- Engagement by tier (30-day)
SELECT
  COALESCE(s.tier, 'Free') as tier,
  COUNT(DISTINCT u.id) as user_count,
  ROUND(100.0 * COUNT(DISTINCT CASE WHEN e.event_name = 'parameter_logged' THEN u.id END) / NULLIF(COUNT(DISTINCT u.id), 0), 1) as logging_adoption_pct,
  ROUND(100.0 * COUNT(DISTINCT CASE WHEN e.event_name = 'ai_message_sent' THEN u.id END) / NULLIF(COUNT(DISTINCT u.id), 0), 1) as ai_adoption_pct,
  ROUND(AVG(CASE WHEN s.status = 'active' THEN s.months_active ELSE NULL END), 1) as avg_subscription_months
FROM auth.users u
LEFT JOIN stripe_subscriptions s ON u.id = s.user_id AND s.status = 'active'
LEFT JOIN events e ON u.id = e.user_id AND e.created_at > now() - INTERVAL '30 days'
WHERE u.created_at > now() - INTERVAL '30 days'
GROUP BY tier
ORDER BY CASE WHEN tier = 'Free' THEN 0 ELSE 1 END, tier;
```

---

### 6.3 Tank Type Cohort (Freshwater vs Saltwater)

**Definition:** Group users by primary tank type, compare engagement

**Why:** Identify if AI recommendations work better for certain aquarium types

**Metrics:**

```sql
-- Engagement by tank type
SELECT
  t.tank_type,
  COUNT(DISTINCT t.user_id) as user_count,
  COUNT(DISTINCT t.id) as tank_count,
  ROUND(AVG(t.species_count), 1) as avg_species_per_tank,
  COUNT(DISTINCT CASE WHEN p.id IS NOT NULL THEN t.user_id END) as users_with_logs,
  ROUND(AVG(p.log_count), 1) as avg_logs_per_user
FROM tanks t
LEFT JOIN (
  SELECT tank_id, user_id, COUNT(*) as log_count FROM parameters GROUP BY tank_id, user_id
) p ON t.id = p.tank_id
WHERE t.created_at > now() - INTERVAL '30 days'
GROUP BY t.tank_type
ORDER BY user_count DESC;
```

---

### 6.4 AI Usage Cohort (Heavy vs Light)

**Definition:** Users segmented by monthly AI message volume

**Why:** Understand which engagement level is most profitable, who needs more onboarding

**Segments:**
- **Heavy:** 10+ AI messages/month
- **Medium:** 3-9 AI messages/month
- **Light:** 1-2 AI messages/month
- **None:** 0 messages/month

**Metrics:**

```sql
-- Segment users by AI usage
WITH user_msg_counts AS (
  SELECT
    user_id,
    COUNT(*) as monthly_msgs,
    CASE
      WHEN COUNT(*) >= 10 THEN 'Heavy'
      WHEN COUNT(*) >= 3 THEN 'Medium'
      WHEN COUNT(*) >= 1 THEN 'Light'
      ELSE 'None'
    END as ai_segment
  FROM events
  WHERE event_name = 'ai_message_sent'
    AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', now())
  GROUP BY user_id
)
SELECT
  umc.ai_segment,
  COUNT(DISTINCT umc.user_id) as user_count,
  ROUND(100.0 * COUNT(DISTINCT CASE WHEN s.status = 'active' THEN s.user_id END) / NULLIF(COUNT(DISTINCT umc.user_id), 0), 1) as paid_conversion_pct,
  ROUND(SUM(s.plan_amount) / 100.0 / NULLIF(COUNT(DISTINCT umc.user_id), 0), 2) as avg_mrr_per_user,
  ROUND(AVG(CASE WHEN e.event_name = 'session_started' THEN 1 ELSE 0 END), 1) as avg_sessions_per_user
FROM user_msg_counts umc
LEFT JOIN stripe_subscriptions s ON umc.user_id = s.user_id
LEFT JOIN events e ON umc.user_id = e.user_id AND e.created_at > now() - INTERVAL '30 days'
GROUP BY umc.ai_segment
ORDER BY CASE WHEN ai_segment = 'None' THEN 3 WHEN ai_segment = 'Light' THEN 2 WHEN ai_segment = 'Medium' THEN 1 ELSE 0 END;
```

---

### 6.5 Activation Cohort (Onboarding Completed vs Dropped)

**Definition:** Users who completed vs abandoned onboarding

**Why:** Identify onboarding drop-off points, measure impact of improvements

**Metrics:**

```sql
-- Activation impact on retention
SELECT
  activation_status,
  COUNT(DISTINCT user_id) as user_count,
  ROUND(100.0 * COUNT(DISTINCT CASE WHEN recurring_sessions > 0 THEN user_id END) / NULLIF(COUNT(DISTINCT user_id), 0), 1) as return_pct,
  ROUND(100.0 * COUNT(DISTINCT CASE WHEN subscription = 'active' THEN user_id END) / NULLIF(COUNT(DISTINCT user_id), 0), 1) as paid_pct,
  ROUND(AVG(days_to_churn), 0) as avg_days_to_churn
FROM (
  SELECT
    u.id as user_id,
    CASE WHEN e_completed.user_id IS NOT NULL THEN 'Completed' ELSE 'Dropped' END as activation_status,
    (SELECT COUNT(DISTINCT DATE(created_at)) FROM events e2 WHERE e2.user_id = u.id AND e2.created_at > e_start.created_at) as recurring_sessions,
    CASE WHEN s.status = 'active' THEN 'active' ELSE NULL END as subscription,
    DATEDIFF(day, u.created_at, COALESCE(s.canceled_at, now())) as days_to_churn
  FROM auth.users u
  LEFT JOIN events e_start ON u.id = e_start.user_id AND e_start.event_name = 'onboarding_started'
  LEFT JOIN events e_completed ON u.id = e_completed.user_id AND e_completed.event_name = 'onboarding_completed'
  LEFT JOIN stripe_subscriptions s ON u.id = s.user_id
  WHERE u.created_at > now() - INTERVAL '90 days'
)
GROUP BY activation_status
ORDER BY activation_status;
```

---

## 7. Experiment Framework

Lightweight A/B testing for rapid iteration.

### 7.1 Feature Flag Infrastructure

**Tool:** Supabase or Vercel Edge Config (simple, no external dependency)

**Setup:**

```sql
CREATE TABLE feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_name TEXT UNIQUE NOT NULL,
  description TEXT,
  enabled_for_pct INT CHECK (enabled_for_pct >= 0 AND enabled_for_pct <= 100),
  enabled_user_ids UUID[] DEFAULT '{}',
  enabled_tier TEXT, -- 'free' / 'starter' / 'plus' / 'pro' / null (all)
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Example data
INSERT INTO feature_flags (flag_name, description, enabled_for_pct, enabled_tier)
VALUES
  ('new_onboarding_flow', 'Simplified 3-step onboarding', 50, null),
  ('ai_trend_alerts', 'Proactive AI alerts for parameter trends', 25, 'plus,pro'),
  ('stripe_price_30pct_higher', 'Test higher Pro pricing', 20, 'pro');
```

**Client-side usage:**

```typescript
async function isFeatureEnabled(featureName: string, userId: string): Promise<boolean> {
  const { data: flag } = await supabase
    .from('feature_flags')
    .select('enabled_for_pct, enabled_user_ids, enabled_tier')
    .eq('flag_name', featureName)
    .single();

  if (!flag) return false;

  // Check if user is in enabled list
  if (flag.enabled_user_ids && flag.enabled_user_ids.includes(userId)) return true;

  // Check tier eligibility
  const userTier = await getUserTier(userId);
  if (flag.enabled_tier && !flag.enabled_tier.split(',').includes(userTier)) return false;

  // Hash-based percentage rollout (deterministic per user)
  const hash = Math.abs(hashCode(`${featureName}-${userId}`)) % 100;
  return hash < flag.enabled_for_pct;
}
```

---

### 7.2 What to Test First (Priority Order)

| Experiment | Hypothesis | Duration | Success Metric | Difficulty |
|------------|-----------|----------|-----------------|------------|
| **Onboarding Flow** | 3-step onboarding converts better than 5-step | 2 weeks | 70% completion vs 65% baseline | Low |
| **Pricing: Pro Tier** | $19.99/mo converts better than $14.99/mo | 2 weeks | 15% conversion vs baseline | Low |
| **AI Suggestion Timing** | Show suggestions after 2 sessions, not 1 | 2 weeks | Accept rate > 40% | Low |
| **Push Notification Timing** | Send parameter reminders at 8 AM vs 6 PM | 2 weeks | Click-through rate | Medium |
| **AI Prompt V2** | Refined Claude prompt improves quality | 1 week | Thumbs-up feedback > 85% | Low |
| **Free Trial Duration** | 7-day trial vs 14-day trial | 4 weeks | Trial→paid conversion | Medium |
| **Task Recurrence Default** | Pre-populate "weekly" vs "as needed" | 1 week | Task completion rate | Low |
| **Species Recommendation UX** | Show top 3 vs all 20 compatible species | 1 week | Click-through on species | Low |

---

### 7.3 A/B Test Process

**Step 1: Setup**
```sql
INSERT INTO feature_flags (flag_name, description, enabled_for_pct)
VALUES ('experiment_new_onboarding', 'A/B test: 3-step vs 5-step', 50);
```

**Step 2: Instrument tracking**
```typescript
if (await isFeatureEnabled('experiment_new_onboarding', userId)) {
  // Show new 3-step flow
  trackEvent('onboarding_variant', { variant: 'new', ... });
} else {
  // Show control 5-step flow
  trackEvent('onboarding_variant', { variant: 'control', ... });
}
```

**Step 3: Analyze (after 2 weeks)**
```sql
SELECT
  properties->>'variant' as variant,
  COUNT(DISTINCT CASE WHEN event_name = 'onboarding_completed' THEN user_id END) as completed,
  COUNT(DISTINCT CASE WHEN event_name = 'onboarding_started' THEN user_id END) as started,
  ROUND(100.0 * COUNT(DISTINCT CASE WHEN event_name = 'onboarding_completed' THEN user_id END) /
    NULLIF(COUNT(DISTINCT CASE WHEN event_name = 'onboarding_started' THEN user_id END), 0), 1) as completion_pct
FROM events
WHERE event_name IN ('onboarding_started', 'onboarding_completed')
  AND created_at > now() - INTERVAL '14 days'
  AND properties->>'variant' IS NOT NULL
GROUP BY variant;

-- Result: new=72%, control=63% → ship it!
```

**Step 4: Decision Criteria**

| Threshold | Action |
|-----------|--------|
| Winner > Control + 10pp | Ship (remove flag, apply to 100%) |
| Winner > Control + 5pp | Consider (get more data, 1 more week) |
| Winner ≈ Control ±5pp | No winner (kill test, revert) |
| Winner < Control - 5pp | Reverted (winner is worse, kill immediately) |

---

### 7.4 Interpretation Tips

**Beware of:**
- **Short duration:** < 2 weeks is noise, especially for low-frequency events
- **Sample size:** If test has < 100 conversions per variant, inconclusive
- **Multiple testing:** If testing 5 things, 1 will be statistically significant by chance
- **Cohort bias:** Ensure traffic is randomly assigned, not biased by time-of-day

**Practical rule:** Only ship if winner > Control + 5pp AND at least 100 events per variant

---

## 8. Cost Monitoring & Unit Economics

Track the financial health of the business.

### 8.1 AI Cost per User (Monthly)

**Definition:** Sum of Anthropic costs / Active users (MAU)

**Target:** < $2.00/month

**Tracking:**

```sql
-- AI cost per active user (monthly)
SELECT
  DATE_TRUNC('month', created_at)::date as month,
  (SELECT COUNT(DISTINCT user_id) FROM events WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', anthropic_usage.created_at) AND event_name = 'session_started') as mau,
  ROUND(SUM(cost_cents) / 100.0, 2) as total_ai_cost,
  ROUND(SUM(cost_cents) / 100.0 / NULLIF((SELECT COUNT(DISTINCT user_id) FROM events WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', anthropic_usage.created_at) AND event_name = 'session_started'), 0), 2) as cost_per_mau
FROM anthropic_usage
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC
LIMIT 3;
```

**If cost > $2.50/user:**
- [ ] Review Claude prompt efficiency (can we be more concise?)
- [ ] Check for runaway processes (failed retries? infinite loops?)
- [ ] Adjust message limits per tier (force fewer AI calls?)
- [ ] Consider switching to Claude Haiku for certain tasks

---

### 8.2 Infrastructure Cost per User

**Definition:** (Vercel + Supabase) / MAU

**Target:** < $0.50/user/month (keep total < 30% of ARPU)

**Tracking:**

```sql
-- Monthly infrastructure cost estimate
SELECT
  DATE_TRUNC('month', now())::date as month,
  (SELECT COUNT(DISTINCT user_id) FROM events WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', now()) AND event_name = 'session_started') as mau,
  -- Vercel: $20/mo fixed + $0.50 per function invocation (estimate 10k/month)
  20 + (10000 * 0.50 / 100) as vercel_cost_estimate,
  -- Supabase: $25/mo fixed + storage overages
  25 as supabase_cost_estimate,
  ROUND((20 + (10000 * 0.50 / 100) + 25) / NULLIF((SELECT COUNT(DISTINCT user_id) FROM events WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', now())), 0), 2) as cost_per_mau
FROM events
LIMIT 1;
```

**Scaling considerations:**
- At 10K MAU: Likely need Supabase Pro ($250/mo) + Vercel Pro ($20/mo)
- At 100K MAU: Consider Postgres dedicated instance

---

### 8.3 Customer Acquisition Cost (CAC) — Optional

**Definition:** If doing paid marketing, total ad spend / conversions

**For MVP phase:** Focus on organic only (CAC = $0)

**If testing paid ads later:**
```sql
SELECT
  DATE_TRUNC('month', created_at)::date as month,
  COUNT(DISTINCT user_id) as new_signups,
  (SELECT SUM(amount) FROM marketing_spend WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', auth.users.created_at)) as ad_spend,
  ROUND((SELECT SUM(amount) FROM marketing_spend WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', auth.users.created_at)) / NULLIF(COUNT(DISTINCT user_id), 0), 2) as cac
FROM auth.users
WHERE created_at > now() - INTERVAL '3 months'
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;
```

---

### 8.4 Lifetime Value (LTV) Estimation

**Definition:** Average subscription revenue * average subscription duration

**Calculation:**

```sql
-- LTV by tier
SELECT
  tier,
  ROUND(AVG(plan_amount) / 100.0, 2) as avg_monthly_revenue,
  ROUND(AVG(EXTRACT(DAY FROM (COALESCE(canceled_at, now()) - created_at)) / 30.0), 1) as avg_subscription_months,
  ROUND(AVG(plan_amount) / 100.0 * AVG(EXTRACT(DAY FROM (COALESCE(canceled_at, now()) - created_at)) / 30.0), 2) as ltv
FROM stripe_subscriptions
WHERE created_at > now() - INTERVAL '6 months'
GROUP BY tier
ORDER BY ltv DESC;

-- Example output:
-- Pro:       $14.99/mo * 4.5 months = $67.46 LTV
-- Plus:      $7.99/mo * 3.8 months = $30.36 LTV
-- Starter:   $3.99/mo * 2.2 months = $8.78 LTV
```

---

### 8.5 Break-Even Analysis per Tier

**Definition:** At what user count does each tier cover its AI + infra costs?

**Calculation:**

```
Starter Tier Breakeven:
├─ Monthly revenue: $3.99
├─ AI cost: ~$0.30/user/month (lower usage)
├─ Infra cost: ~$0.20/user/month
├─ Total cost: $0.50
├─ Margin: $3.49
└─ Break-even: Year 1 (positive unit economics immediately!)

Pro Tier Breakeven:
├─ Monthly revenue: $14.99
├─ AI cost: ~$1.80/user/month (power users)
├─ Infra cost: ~$0.30/user/month
├─ Total cost: $2.10
├─ Margin: $12.89
└─ Break-even: Month 1 (very healthy)
```

---

### 8.6 Cost Monitoring & Alerts

**Daily Checks:**

```
□ Anthropic token burn
  └─ Alert if: 25% above daily average (runaway process?)

□ Vercel function invocations
  └─ Alert if: > 20,000/day (unusual spike)

□ Stripe transaction fees
  └─ Alert if: > 5% of MRR going to payment processing
```

**Monthly Budget Review:**

```
Current Monthly Budget (estimated):
├─ Anthropic: $400 (tokens)
├─ Vercel: $20 (starter plan)
├─ Supabase: $25 (starter)
├─ Stripe processing: ~4% of MRR (~$95 at $2.4K MRR)
└─ Total: ~$540/month

Income (Month X):
├─ MRR: $2,400
├─ Margin: $2,400 - $540 = $1,860 (77% margin!)
└─ Reinvestment rate: [decision point for next month's spend]
```

**When to worry:**
| Signal | Threshold | Action |
|--------|-----------|--------|
| AI cost rising | > $2.50/active user | Optimize prompts, reduce usage limits |
| Stripe fees rising | > 5% of MRR | Monitor payment failures, improve retry logic |
| MAU declining | > 5% MoM drop | Churn analysis, re-engagement campaign |
| Churn accelerating | > 12% monthly | Exit interviews, feature prioritization |
| Infrastructure cost | > $0.80/user | Scale infrastructure, optimize queries |

---

## 9. Dashboard Implementation Checklist

For each dashboard, implement:

```
Executive Dashboard:
□ Big number cards (MRR, Signups, Conversion, Churn, ARPU, DAU)
□ MRR trend chart (30-day line with 7-day rolling avg)
□ Signups by day chart
□ Tier breakdown pie
□ Trial funnel (Started → Upgraded → Expired)
□ AI cost summary box
□ WoW growth metrics
□ Projection box (days to $5K, 1K users, 15% conversion)

Product Health Dashboard:
□ DAU/WAU/MAU cards with trend
□ Feature adoption bars (% of MAU)
□ Session distribution histogram
□ API error rate sparkline
□ Latency percentiles card (P50-P99)
□ Database query latency card
□ Top errors table
□ Alert zone (show SLA violations)

Revenue Dashboard:
□ Top metric cards (MRR, ARR, Paid Users, LTV, Churn%)
□ Trial funnel chart (with %)
□ Subscription status breakdown
□ MRR by tier (stacked bar or donut)
□ Upgrade/downgrade flow (Sankey or migration matrix)
□ Payment health summary
□ Churn reason breakdown
□ Revenue projection curve

AI Performance Dashboard:
□ Big number cards (Messages today, Cost today, Cost/user, P95 latency, Success rate)
□ Message volume trend (30-day)
□ Message type mix (pie)
□ Cost breakdown (input vs output tokens)
□ Top message types by cost (bar)
□ Latency percentiles (P50-P99)
□ Error rate breakdown
□ Cost by user segment (heavy/medium/light/none)
```

---

## 10. Quick Reference Checklists

### Monday Morning Checklist (5 min)

- [ ] Check error rate (Vercel logs)
- [ ] Review AI latency P95
- [ ] Scan Stripe for payment failures
- [ ] Check Anthropic token burn
- [ ] Scan support inbox
- [ ] Quick visual: are dashboards showing green?

### Monday Deep Review (30 min)

- [ ] Export metrics to spreadsheet
- [ ] Review Executive Dashboard
- [ ] Review Product Health Dashboard
- [ ] Categorize support tickets
- [ ] Read 10-15 user feedback entries
- [ ] Check AI quality feedback (thumbs ratio)
- [ ] Review feature request votes
- [ ] Write weekly standup note

### Monthly Review (2 hours)

- [ ] Run cohort retention analysis
- [ ] Analyze churn patterns
- [ ] Review unit economics
- [ ] AI cost analysis
- [ ] Update financial projections
- [ ] Competitive spot check
- [ ] Pricing review
- [ ] Plan next month's roadmap
- [ ] Write monthly deep-dive report

### Quarterly Review (half day)

- [ ] Product strategy review
- [ ] Competitive deep-dive
- [ ] Pricing strategy evaluation
- [ ] Infrastructure cost review
- [ ] Hiring / partnership assessment
- [ ] Write quarterly OKRs

---

## 11. Success Criteria & When to Iterate

| Timeline | Metric | Target | Action if Miss |
|----------|--------|--------|-----------------|
| **Week 4** | Signups | 150+ | Increase marketing channels |
| **Week 8** | Onboarding completion | > 65% | Simplify onboarding flow |
| **Week 12** | Trial-to-paid | > 75% | Test higher pricing / messaging |
| **Month 2** | Churn rate | < 12% | Implement retention feature |
| **Month 3** | DAU/MAU ratio | > 30% | Improve engagement loop |
| **Month 4** | AI cost/user | < $2.00 | Optimize prompts |
| **Month 6** | Signups | 1,000 | On target or increase acquisition |
| **Month 6** | Free-to-paid | 15% | On target or adjust pricing |
| **Month 6** | MRR | $5,000 | On target or expand feature set |

---

## Appendix A: Useful Links

**Dashboards & Analytics:**
- Vercel: https://vercel.com/aquabotai
- Supabase: https://app.supabase.com/
- Stripe: https://dashboard.stripe.com/
- Anthropic: https://console.anthropic.com/

**Monitoring:**
- Sentry (errors): https://sentry.io/
- PgHero (database): Supabase admin console
- Vercel Logs: Vercel dashboard

**Spreadsheets:**
- Metrics: Google Sheets "AquaBotAI Metrics"
- Roadmap: Google Docs "AquaBotAI Roadmap"
- Weekly Updates: Google Docs "AquaBotAI Weekly Standups"

**Code Repos:**
- Main: GitHub (private)
- Events tracking: `/src/lib/events.ts`
- Feature flags: `/src/lib/flags.ts`

---

## Appendix B: Glossary

| Term | Definition |
|------|-----------|
| **DAU** | Daily Active Users (logged in & took action today) |
| **WAU** | Weekly Active Users (at least 1 action in past 7 days) |
| **MAU** | Monthly Active Users (at least 1 action in past 30 days) |
| **MRR** | Monthly Recurring Revenue (sum of all active subscription revenue) |
| **ARR** | Annual Recurring Revenue (MRR * 12) |
| **ARPU** | Average Revenue Per User (MRR / active paid users) |
| **Churn Rate** | % of subscribers who cancel in given period |
| **LTV** | Lifetime Value (avg revenue per user * avg subscription duration) |
| **CAC** | Customer Acquisition Cost (marketing spend / new customers) |
| **Conversion** | % of signups who become paid subscribers |
| **Trial-to-Paid** | % of trial users who upgrade to paid |
| **Retention** | % of users still active after N days/weeks/months |
| **Engagement** | Frequency and depth of user actions |
| **Feature Adoption** | % of users who have used a specific feature |
| **P95** | 95th percentile (95% of responses are faster than this) |
| **SLA** | Service Level Agreement (uptime / latency target) |

---

## Document Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Feb 2026 | Initial document for MVP launch |

---

**Last Updated:** February 2026
**Next Review:** Monthly (first Monday of each month)
**Owner:** Solo Developer / Product Lead
**Audience:** Personal reference + future team onboarding
