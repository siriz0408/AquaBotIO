# AquaBotAI Product Roadmap

**AI-Powered Aquarium Management Platform**
Solo Vibe-Coding Development | Feb 2026 — Aug 2026 (6 Months)

**Last Updated:** February 9, 2026 | **Sprint 11 Complete** | **Overall MVP: 98%**

---

## Current Implementation Status (Sprint 9)

| Feature | Spec | Status | Notes |
|---------|------|--------|-------|
| Scaffolding & Infrastructure | 00, 08, 12 | ✅ DONE | Next.js 14, Supabase, PWA, Tailwind |
| Auth & Onboarding | 06 | ✅ DONE | Email/password, magic link, Google shell, 5-step wizard |
| Tank Profiles | 02 | ✅ DONE | CRUD, photo placeholder, tier enforcement |
| AI Chat Engine | 01 | ✅ DONE | Streaming, rich formatting, species cards, parameter alerts, action execution |
| Subscription & Billing | 07 | ✅ DONE | 14-day trial, 4 tiers, Stripe webhooks |
| Water Parameters | 03 | ✅ DONE | Log form, charts, trend API, thresholds |
| Species & Livestock | 04 | ✅ DONE | 180 species seeded, search, filters, compatibility |
| Maintenance Scheduling | 05 | ⚠️ 95% | CRUD, recurring, completion. Missing: push notifications |
| PWA Shell | 08 | ✅ DONE | Manifest, icons, SW registered (Sprint 8), security headers |
| **Photo Diagnosis** | **09** | **Not started** | **P1 — Phase 3** |
| **Equipment Tracking** | **10** | **Not started** | **P2 — Phase 3** |
| **Dashboards & Reports** | **11** | **Not started** | **P1 — Phase 3** |
| **Admin Portal** | **13** | **Not started** | **P2 — Phase 3** |

> **Full implementation audit:** See `AquaBotAI_Specs/14_Implementation_Status.md`
> **UI/UX canonical guide:** See `AquaBotAI_Specs/15_UI_UX_Design_System.md`

---

## At a Glance

| Metric | Target |
|---|---|
| MVP Features (P0) | 8 features |
| Fast Follow (P1) | 5 features |
| MVP Launch | ~Week 14 (Late May 2026) |
| Full v1 Complete | ~Week 24 (Late Jul 2026) |
| MRR Goal | $5,000 within 6 months |
| User Target | 1,000 within 90 days of launch |
| AI Cost/User | < $2/month |
| AI Latency P95 | < 3 seconds |

---

## Quarterly Themes

**Q1 2026 (Feb–Mar) — Build the Machine**
Infrastructure, auth, core AI engine, billing — everything needed before users can arrive.

**Q2 2026 (Apr–Jun) — Ship & Learn**
Complete MVP features, launch, get first 1,000 users, start learning from real usage data.

**Q3 2026 (Jul–Aug) — Differentiate & Grow**
Photo diagnosis, equipment recs, dashboards — features that drive upgrades and retention.

---

## Now / Next / Later Roadmap

### NOW — Phase 1: Foundation & Core MVP (Weeks 1–10, Feb–Apr 2026)

#### 1. Project Scaffolding & Infrastructure — 1.5 weeks
- Next.js 14 + TypeScript + Tailwind + shadcn/ui
- Supabase project with 12 MVP tables (Spec 00)
- RLS policies for user data isolation
- Vercel CI/CD with preview deployments
- PWA manifest + service worker shell (Spec 08)
- Environment variables and API key management
- *Specs: 00_Data_Model_Schema, 08_PWA_Shell, 12_API_Integration*

#### 2. Authentication & Onboarding — 2 weeks ⚠️ BLOCKER
- Email/password + Google OAuth + magic link (Supabase Auth)
- Guided onboarding: sign up → create first tank → log first parameter
- JWT session management (1hr access / 7-day refresh tokens)
- Rate limiting: 5 failed attempts → 15-min lockout
- Auth context provider + protected route wrapper
- **Blocks:** Every other feature depends on auth
- *Spec: 06_Authentication_Onboarding*
- *Success: Onboarding completion > 70%, time to first value < 10 min*

#### 3. Tank Profile Management — 1.5 weeks
- Tank CRUD: type, volume, dimensions, substrate, photo
- Photo upload (JPEG/PNG, 5MB max) to Supabase Storage
- Tier enforcement: Starter 1 tank, Plus 5, Pro unlimited
- Tank switching UI with one-click access
- Soft-delete with 30-second undo
- Imperial/metric unit preference
- **Depends on:** Auth
- **Blocks:** AI Chat, Parameters, Species, Maintenance, Equipment
- *Spec: 02_Tank_Profile_Management*

#### 4. AI Chat Engine (Core) — 3 weeks
- Claude Sonnet 4.5 integration via Supabase Edge Functions
- Persistent conversation history per tank
- Dynamic system prompts with full tank context injection (profile, params, livestock, equipment)
- Action execution: add livestock, schedule tasks, log params via natural language
- Skill-level adaptation (beginner vs advanced)
- Usage tracking: message counts + token costs per tier
- Rolling context summarization at 8K tokens
- Non-streaming for v1 (streaming is P1)
- Tier limits: Free 10/day, Starter 100/day, Plus 200/day, Pro unlimited
- **Depends on:** Auth, Tank Profiles
- **Blocks:** Photo Diagnosis, Equipment Recs, Dashboards
- *Spec: 01_AI_Chat_Engine*
- *Performance: < 3 sec P95 latency*

#### 5. Subscription & Billing — 2 weeks ⚠️ BLOCKER
- Stripe Checkout + Customer Portal integration
- 14-day free trial with full Pro access (no credit card required)
- 3-tier pricing: Starter $3.99/mo, Plus $7.99/mo, Pro $14.99/mo
- Webhook handlers: subscription.created, invoice.paid, subscription.canceled
- Tier enforcement middleware touching all features
- 7-day grace period + Stripe Smart Retries for failed payments
- USD only for v1
- **Depends on:** Auth
- **Can build in parallel with AI Chat** (shared dependency on Auth, no dependency on each other)
- *Spec: 07_Subscription_Billing*
- *Revenue targets: 15% trial-to-paid in 30 days, $5K+ MRR in 6 months, ARPU $8.50/mo*

---

### NEXT — Phase 2: Feature Completeness & MVP Launch (Weeks 10–14, Apr–May 2026)

#### 6. Water Parameters & Analysis — 2 weeks
- Manual parameter entry form: pH, ammonia, nitrite, nitrate, temperature, GH, KH (freshwater) + salinity, calcium, alkalinity, magnesium, phosphate (saltwater)
- Interactive Recharts dashboards with 7/30/90-day time ranges
- Color-coded safe/warning/danger zones based on species requirements
- AI-powered trend detection and proactive alerts
- Custom alert thresholds per parameter
- **Depends on:** Tank Profiles, AI Chat
- **Blocks:** Dashboards & Email Reports
- *Spec: 03_Water_Parameters_Analysis*
- *Performance: chart render < 2 sec for 90 days of data*

#### 7. Species Database & Livestock Management — 2.5 weeks
- 500+ freshwater, 200+ saltwater, 100+ invertebrate species at launch
- Species detail cards: names, photos, care levels, temp/pH ranges, temperament
- Full-text search with GIN indexes
- Livestock tracking per tank: add/remove with quantity, date, nicknames
- AI compatibility checking on every livestock addition
- AI stocking recommendations based on tank profile
- Soft-delete for removed livestock (retained for AI context)
- **Depends on:** Tank Profiles, AI Chat
- **Blocks:** Photo Diagnosis
- *Spec: 04_Species_Database_Livestock*
- *Note: Species seed data (800+ entries) is a major effort — start with top 200 for MVP*

#### 8. Maintenance Scheduling & Push Notifications — 2 weeks
- Task CRUD: water change, filter cleaning, feeding, dosing, equipment maintenance, water testing, custom
- Recurring + one-time tasks with frequency options (daily, weekly, biweekly, monthly, custom)
- Completion logging with optional notes
- Push notifications via Web Push API + Service Worker
- Configurable reminders: day before, morning of, 1 hour before
- AI-suggested schedules based on tank type, size, bioload
- Cron job (every 15 min) for notification scheduling
- Email fallback for iOS Safari push limitations
- **Depends on:** Tank Profiles, AI Chat, PWA Shell
- *Spec: 05_Maintenance_Scheduling*
- *Success: > 60% of users create a task in first week, > 50% enable push*

#### 9. Admin Portal v1 (SQL/Studio) — 1 week
- Basic admin via Supabase Studio + SQL scripts (no custom UI)
- Role-based access: Super Admin, Content Admin, Support Admin
- SQL scripts for user search, subscription management, account actions
- Audit log table (immutable) for all admin actions
- Feature flags table for runtime toggles
- Tier config table for subscription limits
- **Depends on:** Auth, Billing
- *Spec: 13_Admin_Portal (Phase 1 only)*

#### 10. AI Chat Embedded Widgets (Priority) — 2 weeks
- **Quarantine Checklist Widget** — Interactive checklist embedded in chat when user asks about adding new fish. AI personalizes steps, tracks progress, schedules reminders. Prevents 60% first-year mortality from skipped quarantine.
- **Water Change Calculator Widget** — Calculator showing exact gallons/liters based on tank volume + AI-recommended percentage. AI suggests % based on nitrate levels, tracks history, schedules maintenance.
- **Parameter Troubleshooting Widget** — Enhanced ParameterAlertCard with personalized troubleshooting. AI correlates parameter spikes with events, provides step-by-step fixes, links to actions.
- All widgets follow RichMessage parser pattern (species-card, parameter-alert, action-buttons)
- **Depends on:** AI Chat Engine, Tank Profiles, Water Parameters, Maintenance Scheduling
- *Research: `Docs/Tools/agents/memory/research/aquarium-tools-widgets-discovery.md`*
- *Score: 18-22/25 (high user impact, AI differentiation, quick build)*

#### 11. AI Proactive Intelligence & Action Execution — 3 weeks
- **Proactive Parameter Alerts** — AI analyzes parameter trends daily to detect concerning patterns BEFORE thresholds are breached. Alerts users with trend analysis, event correlation, and suggested actions. Creates daily engagement loop.
- **Trend Detection** — Analyzes last 7-14 days of parameters to identify gradual trends, accelerating patterns, and threshold proximity. Correlates with recent events (livestock additions, maintenance actions).
- **Action Execution** — Enables AI to execute actions directly from chat: log parameters, add livestock, schedule maintenance, complete tasks. Natural language parsing with confirmation flow.
- **Alert Delivery** — In-app alert badge, chat query interface ("any alerts?"), push notifications (P1). Alerts include trend description, projection, likely cause, and suggested action.
- **Depends on:** AI Chat Engine, Water Parameters, Maintenance Scheduling, Species & Livestock
- *Research: `Docs/Tools/agents/memory/research/ai-enhancement-opportunities-discovery.md`*
- *Score: 20-23/25 (highest ROI, strongest AI differentiation, prevents disasters)*
- *Spec: 17_AI_Proactive_Intelligence_Spec*

### 🚀 MVP PUBLIC LAUNCH — Week 14 (Late May 2026)

---

### LATER — Phase 3: Growth Features & Polish (Weeks 15–26, Jun–Aug 2026)

#### 12. Photo Diagnosis — 2 weeks
- Species identification from photos via Claude Sonnet 4.5 vision (> 85% accuracy target)
- Disease diagnosis with visible symptom detection (> 75% accuracy)
- Personalized treatment plans with dosing calculated for tank volume
- Confidence scoring (high/medium/low) on all diagnoses
- Client-side image compression to 2MP before upload
- Rate limits: Plus 10/day, Pro 30/day
- Veterinary disclaimer on every result (required)
- **Depends on:** AI Chat, Species DB, Billing (tier gating)
- *Spec: 09_Photo_Diagnosis*

#### 13. Equipment Tracking & AI Recommendations — 3 weeks
- Equipment catalog per tank: filters, heaters, lights, pumps, skimmers, etc.
- Lifespan tracking with status badges (good, due soon, overdue)
- Maintenance reminders via push notifications
- AI web search recommendations via SerpAPI (Pro-only)
- Personalized gear suggestions based on tank type, size, livestock
- 24-hour result caching to reduce API calls
- Rate limits: Pro 10 searches/day
- **Depends on:** Tank Profiles, Maintenance, Billing
- *Spec: 10_Equipment_Tracking_Recommendations*

#### 14. Interactive Dashboards & Email Reports — 2 weeks
- AI-generated daily health summaries (in-app, Plus+)
- Weekly email digest with parameter trends and maintenance compliance (Pro)
- Multi-tank comparison dashboard with color-coded health status (Pro)
- Health score: 40% parameter stability + 30% maintenance compliance + 20% no alerts + 10% livestock stability
- Resend email service with MJML responsive templates
- Timezone-aware delivery scheduling
- **Depends on:** Water Parameters, AI Chat, Billing
- *Spec: 11_Interactive_Dashboards_Reports*

#### 15. Admin Portal v2 (Custom Dashboard) — 3 weeks
- Custom React admin dashboard
- Real-time analytics: DAU, MRR, churn rate, AI usage/cost
- Content CRUD: species database, equipment defaults, AI system prompts
- Feature flags UI + tier limit configuration
- 2FA mandatory for all admin accounts
- User impersonation for support debugging
- Data export capabilities
- **Depends on:** Admin v1
- *Spec: 13_Admin_Portal (Phase 2)*

#### 16. AI Chat Embedded Widgets (Additional) — 2 weeks
- **Dosing Calculator Widget** — Calculator with 400+ product database. AI suggests products based on problem, calculates dose for tank volume. Unit conversions (mL, drops, teaspoons). Complex product DB required.
- **Stocking Density Calculator** — AI-powered calculator considering tank size, filtration, existing livestock, species waste output. Requires waste coefficient data per species (deferred from P2).
- **Tank Setup Checklist Widget** — Interactive onboarding checklist that persists post-onboarding. AI guides through setup conversationally, checks off steps.
- **Feeding Schedule Calculator** — Calculates optimal feeding schedule based on species, tank size, bioload. AI learns patterns, suggests schedules, alerts on overfeeding.
- **Emergency Response Checklist** — Step-by-step emergency checklist triggered by critical alerts (ammonia > 1ppm, mass die-off). AI detects emergency, provides immediate action plan.
- **Depends on:** AI Chat Engine, Tank Profiles, Water Parameters
- *Research: `Docs/Tools/agents/memory/research/aquarium-tools-widgets-discovery.md`*
- *Scores: 13-17/25 (lower priority than Phase 2 widgets)*

#### 17. Polish & P2 Explorations — Ongoing
- Streaming AI responses
- Voice input/output for AI chat
- Annual billing + promo codes
- CSV/PDF data export
- Calendar sync for maintenance tasks
- Community features exploration
- IoT device integration research
- Native mobile app evaluation (Capacitor)

---

## RICE Prioritization Scorecard

RICE = (Reach × Impact × Confidence) / Effort

| Feature | Reach | Impact | Confidence | Effort (wk) | RICE Score | Priority |
|---|---|---|---|---|---|---|
| Auth & Onboarding | 1,000 | 3 | 100% | 2 | **1,500** | P0 |
| Subscription & Billing | 1,000 | 3 | 100% | 2 | **1,500** | P0 |
| Tank Profile Mgmt | 1,000 | 2 | 100% | 1.5 | **1,333** | P0 |
| AI Chat Engine | 1,000 | 3 | 80% | 3 | **800** | P0 |
| PWA Shell | 1,000 | 1 | 100% | 1.5 | **667** | P0 |
| Water Parameters | 800 | 2 | 80% | 2 | **640** | P0 |
| Maintenance Scheduling | 600 | 2 | 80% | 2 | **480** | P0 |
| Species & Livestock | 700 | 2 | 80% | 2.5 | **448** | P0 |
| AI Chat Widgets (Priority) | 800 | 3 | 85% | 2 | **1,020** | P1 |
| AI Proactive Intelligence | 900 | 3 | 85% | 3 | **765** | P1 |
| Photo Diagnosis | 400 | 2 | 50% | 2 | **200** | P1 |
| Dashboards & Reports | 300 | 1 | 80% | 2 | **120** | P1 |
| Equipment Tracking | 350 | 1 | 80% | 3 | **93** | P1 |
| Admin Portal v1 | 5 | 3 | 100% | 1 | **15** | P0 |
| AI Chat Widgets (Additional) | 600 | 2 | 70% | 2 | **420** | P2 |
| Admin Portal v2 | 5 | 2 | 50% | 3 | **2** | P1 |

---

## MoSCoW Classification (MVP Scope)

**Must Have** — Auth & Onboarding, AI Chat Engine, Tank Profiles, Water Parameters, Species DB & Livestock, Maintenance Scheduling, Subscription & Billing, PWA Shell, Admin v1

**Should Have** — AI Chat Embedded Widgets (Priority: Quarantine Checklist, Water Change Calculator, Parameter Troubleshooting), AI Proactive Intelligence (Proactive Alerts, Action Execution), Photo Diagnosis, Equipment Tracking, Email Reports, Multi-Tank Comparison Dashboard

**Could Have** — AI Chat Embedded Widgets (Additional: Dosing Calculator, Stocking Calculator, Setup Checklist, Feeding Schedule, Emergency Response), Admin v2 Custom UI, Streaming AI, Voice Input, AI Web Search Recommendations

**Won't Have (v1)** — IoT Integration, Native Mobile Apps, Community Features, Annual Billing, Multi-Currency, Admin Phase 3

---

## Critical Build Path (Solo Developer)

```
Scaffolding → Auth → Tank Profiles → AI Chat Engine → Params + Species → Maintenance → 🚀 MVP
                 ↘ Billing (parallel track) ↗
```

Billing is the **one opportunity for overlap** — it shares the Auth dependency with AI Chat but they don't depend on each other. Everything else is sequential for a solo developer.

---

## Dependency Map

### Scaffolding (no dependencies)
- Next.js + Supabase + Vercel setup
- Database schema (Phase 1 tables)
- PWA manifest + service worker shell

### Auth & Onboarding ← Scaffolding
- Supabase Auth configuration
- JWT session management
- **Blocks:** Every other feature

### Tank Profiles ← Auth
- Tank CRUD with RLS policies
- **Blocks:** AI Chat, Params, Species, Maintenance, Equipment

### AI Chat Engine ← Auth, Tanks
- Anthropic API integration
- **Blocks:** Photo Dx, Equipment Recs, Dashboards

### Billing ← Auth
- Stripe Checkout + Customer Portal
- **Blocks:** All tier-gated features
- *Can build in parallel with AI Chat*

### Water Parameters ← Tanks, AI Chat
- **Blocks:** Dashboards, Email Reports

### Species & Livestock ← Tanks, AI Chat
- **Blocks:** Photo Diagnosis

### Maintenance ← Tanks, AI, PWA
- **Blocks:** Equipment Tracking

### Photo Diagnosis ← AI, Species, Billing
### Equipment Tracking ← Tanks, Maintenance, Billing
### Dashboards & Reports ← Params, AI, Billing
### Admin v2 ← Admin v1

---

## External Dependencies

| Vendor | Purpose | When Needed | Risk |
|---|---|---|---|
| Anthropic API | Claude Sonnet 4.5 for chat + vision | Week 4 (AI Chat) | Cost management at scale |
| Stripe | Checkout, Customer Portal, webhooks | Week 8 (Billing) | Webhook reliability |
| Supabase | Database, Auth, Storage, Edge Functions | Week 1 (Day 1) | Central dependency |
| SerpAPI | Equipment web search recommendations | Week 21 (Phase 3) | Pro-only, low risk |
| Resend | Email delivery for reports | Week 23 (Phase 3) | Pro-only, low risk |
| Species Data | 800+ species entries to curate | Week 13 (Species DB) | Major content effort |

---

## Key Milestones

### Milestone 1: Foundation Complete — Week 5 (Mid-March 2026) ✅ ACHIEVED (Sprint 3)
- ✅ User can sign up and create a tank
- ✅ AI chat responds with tank-aware answers
- ✅ PWA installable on mobile

### Milestone 2: Billing Live — Week 10 (Mid-April 2026) ✅ ACHIEVED (Sprint 3)
- ✅ 14-day free trial with full Pro access
- ✅ Stripe Checkout payment flow working (needs live keys)
- ✅ Tier limits enforced across features

### Milestone 3: 🚀 MVP Public Launch — Week 14 (Late May 2026) — IN PROGRESS (88%)
- ✅ Water parameter tracking + interactive charts
- ⚠️ 25 species searchable (target was 800+) with AI compatibility
- ⚠️ Maintenance tasks working (push notifications pending)
- ❌ Admin tools — deferred to post-launch

### Milestone 4: Full v1 Feature Complete — Week 24 (Late July 2026) — NOT STARTED
- ❌ Photo diagnosis live (Plus/Pro)
- ❌ Equipment tracking with AI recommendations
- ❌ Email reports for Pro users
- ❌ Custom admin dashboard

---

## Risk Register

### 🔴 High Risk

**AI Cost Overruns** — Claude API costs could exceed $2/user/month at scale, especially with vision features.
*Mitigation:* Implement Haiku routing for simple queries, enforce daily message limits per tier, monitor token usage from Day 1.

**Species Data Curation** — 800+ species entries is a massive data effort for a solo dev. Quality directly impacts AI recommendations.
*Mitigation:* Start with top 200 most popular species for MVP. Use AI to help generate initial data from FishBase. Add species incrementally post-launch.

### 🟡 Medium Risk

**Solo Dev Burnout** — 14-week MVP timeline is aggressive for one person. Feature scope creep is the biggest threat.
*Mitigation:* Strict P0-only for MVP. Defer all P1 features. Take 1-week buffer between phases. Use AI coding tools aggressively.

**PWA Push Notification Limitations** — iOS Safari has spotty push support. Maintenance reminders are a core value prop.
*Mitigation:* Email fallback for all notifications. Test on iOS early. Consider native app wrapper (Capacitor) as P2.

**Stripe Webhook Reliability** — Missed webhooks can cause billing state drift.
*Mitigation:* Implement idempotent webhook handlers. Add periodic reconciliation job. Log all webhook events.

### 🟢 Low Risk

**AI Response Quality** — Claude's aquarium knowledge may have gaps for rare species or niche setups.
*Mitigation:* Comprehensive system prompts with species data context injection. User feedback loop. Confidence scoring on all recommendations.

---

## Success Metrics (Post-Launch Targets)

| Metric | Target | Timeframe |
|---|---|---|
| Registered Users | 1,000 | 90 days post-launch |
| Trial-to-Paid Conversion | 15% | Within 30 days |
| Monthly Recurring Revenue | $5,000+ | Within 6 months |
| AI Cost Per User | < $2/month | Ongoing |
| AI Response Latency (P95) | < 3 seconds | Ongoing |
| Onboarding Completion Rate | > 70% | Ongoing |
| Parameter Logs/Week (active users) | > 2 | Ongoing |
| Push Notification Opt-In | > 50% | Ongoing |
| Free-to-Paid Conversion | 15% | Within 6 months |

---

*Generated Feb 7, 2026 — Based on 13 PRD specifications covering 89 resolved product decisions.*
*Updated Feb 7, 2026 — Sprint 9 complete; 96% MVP; 20 spec documents; Wireframe design system established.*
