# AQUATIC AI
## Product Requirements Document (PRD) v1.0

**Version:** 1.0
**Date:** February 2026
**Author:** Sam (AI Operations)
**Status:** DRAFT

---

## Table of Contents

1. [Problem Statement](#1-problem-statement)
2. [Product Overview](#2-product-overview)
3. [Goals](#3-goals)
4. [Non-Goals (v1)](#4-non-goals-v1)
5. [Target Users](#5-target-users)
6. [User Stories](#6-user-stories)
7. [Requirements](#7-requirements)
8. [Technical Architecture](#8-technical-architecture-high-level)
9. [Data Model](#9-data-model-key-entities)
10. [Subscription Tiers](#10-subscription-tiers-detailed)
11. [Success Metrics](#11-success-metrics)
12. [Open Questions](#12-open-questions)
13. [Phasing Plan](#13-phasing-plan)
14. [Risks & Mitigations](#14-risks--mitigations)

---

## 1. PROBLEM STATEMENT

Aquarium keeping is a $4-6.6 billion global market with millions of hobbyists, yet the software tools available to them are fragmented, outdated, and unintelligent. Current aquarium management apps function as glorified spreadsheets — they let users manually log water parameters and track livestock, but offer no proactive guidance, no predictive insights, and no unified intelligence.

The consequences are real: beginner hobbyists experience fish mortality rates as high as 60% in their first year due to preventable water chemistry issues. Intermediate keepers waste hours manually researching species compatibility, dosing calculations, and troubleshooting problems across forums. Advanced hobbyists managing multiple tanks lack a single dashboard that gives them an at-a-glance understanding of their entire operation.

Meanwhile, AI technology has matured to the point where a truly intelligent aquarium assistant is now feasible — one that knows your specific tanks, understands the relationships between your parameters, livestock, and equipment, and can proactively alert you to issues before they become crises. No existing app delivers this. Aquatic AI will be the first AI-native aquarium management platform where intelligence isn't bolted on — it's the foundation.

---

## 2. PRODUCT OVERVIEW

**Product Name:** Aquatic AI (working title; also referenced as AquaBot AI)

**Platform:** Web application (Progressive Web App) deployed on Vercel

**Backend:** Supabase (PostgreSQL + Edge Functions + Auth + Realtime)

**AI Provider:** Anthropic API (Claude Sonnet 4.5 for chat and photo diagnosis)

**Auth:** Magic link (passwordless email authentication via Supabase Auth)

**Tank Types:** Freshwater and Saltwater/Reef from day one

### Core Philosophy

The AI chat assistant is the backbone of the entire application. Every feature — parameter tracking, species management, maintenance scheduling, equipment recommendations — can be accessed and actioned through the AI chat interface. The chat isn't a bolt-on feature; it's the primary way users interact with the app. The AI has persistent memory per tank per user, building a complete picture of each aquarium ecosystem over time.

---

## 3. GOALS

### User Goals

- **G1:** Reduce fish mortality among new hobbyists by 50%+ through proactive AI-driven alerts and guidance
- **G2:** Save hobbyists 3+ hours per week by centralizing tank management, research, and troubleshooting into a single AI-powered interface
- **G3:** Enable users to make better stocking, equipment, and maintenance decisions through AI recommendations grounded in their specific tank data
- **G4:** Provide an "always-on expert" that knows each user's tanks as well as they do — parameters, livestock, history, equipment — and can answer any aquarium question with that context

### Business Goals

- **G5:** Achieve 1,000 registered users within 90 days of launch
- **G6:** Reach 15% free-to-paid conversion rate within the first 6 months
- **G7:** Achieve $5,000+ MRR within 6 months of launch
- **G8:** Maintain AI cost per user under $2/month at the Pro tier to ensure margin
- **G9:** Establish Aquatic AI as the category-defining "AI aquarium assistant" — the app people think of when they want AI help with their tank

---

## 4. NON-GOALS (v1)

- **NG1:** Native mobile apps (iOS/Android) — We will launch as a PWA only. Native apps are a Phase 2 consideration once product-market fit is validated. The PWA provides installability, offline support, and push notifications without App Store friction.

- **NG2:** IoT hardware integration — No direct integration with smart sensors, controllers, or automated dosing systems in v1. Users will manually log parameters. IoT integrations are a Phase 3 opportunity via partnerships.

- **NG3:** Social/community features — No forums, user profiles, tank sharing, or community feeds. Community is a separate product initiative.

- **NG4:** ROI/cost tracking — Financial tracking for tank expenses and equipment costs is deferred to Phase 2. Not core to the AI-first value proposition.

- **NG5:** Multi-language support — English only at launch. Localization (Spanish, German, French, Japanese) is a Phase 2 priority based on user geography data.

- **NG6:** Marketplace/e-commerce — No selling of products, equipment, or livestock through the app.

- **NG7:** Fish behavior monitoring via camera — Real-time camera-based fish activity monitoring is technically complex and deferred to future phases.

---

## 5. TARGET USERS

### Persona 1: "The Beginner" — New Hobbyist (Primary)

**Who:** First-time aquarium owner, ages 18-35, just set up their first tank or considering getting one

**Pain:** Overwhelmed by conflicting advice on forums, doesn't understand water chemistry, has already lost fish or is afraid they will

**Needs:** A patient, knowledgeable expert they can ask anything — "is my pH okay?", "can I add this fish?", "why is my water cloudy?"

**Willingness to pay:** Moderate — will pay if the AI demonstrably prevents fish deaths and reduces anxiety

**AI value:** Extremely high — the AI replaces the need for a mentor, fish store expert, or hours of forum research

### Persona 2: "The Optimizer" — Intermediate Hobbyist (Primary)

**Who:** Has 1-3 tanks, 1-3 years of experience, ages 25-45, understands basics but wants to level up

**Pain:** Spends too much time manually tracking parameters, researching compatibility, and troubleshooting issues. Knows enough to be dangerous but not enough to be confident.

**Needs:** A smart assistant that tracks everything, spots trends, and proactively tells them when something needs attention. Wants beautiful dashboards and data visualization.

**Willingness to pay:** High — actively looking for better tools, already spending money on the hobby

**AI value:** High — predictive alerts, trend analysis, and equipment recommendations save time and prevent costly mistakes

### Persona 3: "The Expert" — Advanced Keeper (Secondary)

**Who:** 3+ tanks including reef/planted setups, 5+ years experience, ages 30-55, deep knowledge

**Pain:** Managing multiple complex ecosystems is time-consuming. Wants automation, not hand-holding. Needs a single dashboard across all tanks.

**Needs:** Advanced analytics, multi-tank dashboard, AI that can discuss nuanced topics (e.g., trace element dosing, coral coloration, breeding programs). Daily AI-generated reports.

**Willingness to pay:** Very high — used to spending $100+/month on the hobby, $14.99/month is trivial

**AI value:** Moderate for basic advice (they already know a lot), very high for data analysis, trend prediction, and time savings

---

## 6. USER STORIES

### AI Chat Assistant (Core)

- **US-1:** As a hobbyist, I want to ask the AI any question about my aquarium and get an answer that considers my specific tank's parameters, livestock, and history, so that I get personalized advice rather than generic information.

- **US-2:** As a hobbyist, I want the AI to proactively alert me when it detects concerning trends in my tank data (e.g., rising nitrates, pH drift), so that I can address issues before they become emergencies.

- **US-3:** As a hobbyist, I want to tell the AI to "schedule a water change for Saturday" or "add a clownfish to my tank" and have it take that action, so that I can manage my tank through conversation instead of navigating menus.

- **US-4:** As a hobbyist, I want the AI to remember our previous conversations and my tank's complete history, so that it builds up knowledge about my specific setup over time and its advice gets more tailored.

- **US-5:** As a beginner, I want the AI to explain things in simple terms and walk me through processes step-by-step, so that I can learn without feeling overwhelmed.

- **US-6:** As an advanced keeper, I want the AI to discuss complex topics like trace element ratios, coral fragging techniques, and breeding triggers with depth and nuance, so that it's useful beyond basic care advice.

### Photo Diagnosis

- **US-7:** As a hobbyist, I want to upload a photo of my fish and have the AI identify the species, so that I can learn about its care requirements and check compatibility with my existing livestock.

- **US-8:** As a hobbyist, I want to upload a photo of a sick fish and have the AI diagnose the likely disease or condition, so that I can start treatment quickly.

- **US-9:** As a hobbyist, I want the AI's photo diagnosis to include recommended treatments, medication dosing (adjusted for my tank size), and next steps, so that I have an actionable plan.

### Water Parameter Tracking

- **US-10:** As a hobbyist, I want to quickly log my water test results (pH, ammonia, nitrite, nitrate, etc.) so that I have a complete history of my tank's chemistry.

- **US-11:** As a hobbyist, I want to see interactive charts of my parameters over time so that I can visualize trends and spot problems early.

- **US-12:** As a hobbyist, I want the AI to analyze my parameter data and tell me if there are concerning trends, so that I know what to fix.

- **US-13:** As an intermediate keeper, I want to track species-specific parameters (salinity, calcium, alkalinity for reef tanks) so that I can optimize my setup.

- **US-14:** As a hobbyist, I want the app to show me "safe zones" for each parameter based on my tank type and livestock, so that I know at a glance if something is off.

### Species Database & Management

- **US-15:** As a hobbyist, I want to search the species database and see detailed care requirements for any fish, so that I can research before buying.

- **US-16:** As a hobbyist considering a new fish, I want the AI to tell me if it's compatible with my existing livestock, so that I avoid adding aggressive or incompatible species.

- **US-17:** As a hobbyist, I want to add species from the database to my tank's livestock list, so that the AI knows what's in my tank and can factor it into recommendations.

- **US-18:** As a hobbyist, I want to track when I added each fish, how many I have, and their nicknames, so that I have a complete record of my livestock.

### Maintenance Scheduling & Notifications

- **US-19:** As a hobbyist, I want to set up recurring maintenance tasks (water change, filter cleaning, etc.) so that I don't forget important chores.

- **US-20:** As a hobbyist, I want the AI to suggest a maintenance schedule based on my tank's specific needs (size, bioload, filtration), so that I'm doing the right things at the right frequency.

- **US-21:** As a hobbyist, I want push notifications reminding me when maintenance is due, so that I don't miss tasks.

- **US-22:** As a hobbyist, I want to log when I complete maintenance so that I have a history and the AI can track patterns.

### Equipment Tracking & Recommendations

- **US-23:** As a hobbyist, I want to record what equipment I have (filter, heater, pump, light) and when I bought it, so that I know when replacements might be needed.

- **US-24:** As a Pro user, I want the AI to recommend equipment upgrades or replacements based on my tank size and goals, so that I'm not guessing.

- **US-25:** As a Pro user, I want the AI to search the web for equipment recommendations, so that I can find the best products without leaving the app.

### Interactive Dashboards & Reports

- **US-26:** As a hobbyist, I want to see a dashboard with my tank's current status at a glance (latest parameters, upcoming maintenance, livestock list), so that I know what's going on.

- **US-27:** As an advanced keeper with multiple tanks, I want to compare my tanks side-by-side, so that I can see which one needs attention.

- **US-28:** As a Pro user, I want to receive daily or weekly email reports summarizing my tank's health and any alerts, so that I stay informed.

- **US-29:** As a hobbyist, I want to download a report of my tank data over a time period, so that I can track my progress or share it with others.

### Account & Subscription

- **US-30:** As a new user, I want to sign up with just my email and receive a magic link to log in, so that I can get started without creating a password.

- **US-31:** As a user, I want to choose a subscription tier that matches my needs and budget, so that I'm not paying for features I don't use.

- **US-32:** As a user, I want to upgrade or downgrade my subscription anytime, so that I can adjust as my needs change.

- **US-33:** As a user, I want to see my AI usage (messages, photo diagnoses) compared to my plan limits, so that I know when I might hit a limit.

### Onboarding

- **US-34:** As a new user, I want a guided setup flow that helps me create my first tank profile and log initial parameters, so that I'm up and running quickly.

- **US-35:** As a new user, I want the AI to greet me and walk me through what it can do, so that I understand the value of the product right away.

---

## 7. REQUIREMENTS

### P0 — Must-Have (Ship Blockers)

#### R-001: AI Chat Engine

- Conversational AI interface powered by Anthropic Claude Sonnet 4.5
- Persistent conversation history per tank per user
- AI has access to the user's complete tank context: parameters, livestock, equipment, maintenance history
- Supports text input; responses rendered as rich markdown with formatting
- AI can answer aquarium questions with tank-specific context
- AI can execute actions via chat: add livestock, schedule maintenance, log parameters

**Acceptance criteria:** Given a user with a configured tank, when they ask "what's the best temperature for my clownfish?", then the AI responds with advice specific to their tank's current conditions. Given a user says "schedule a water change for Saturday", then a maintenance task is created for Saturday. Given a returning user, when they reference a previous conversation topic, the AI recalls the context.

#### R-002: Tank Profile Management

- Create, edit, and delete tank profiles
- Tank attributes: name, type (freshwater/saltwater/reef/brackish), volume (gallons/liters), dimensions, substrate, setup date, photo
- Multi-tank support (number of tanks gated by subscription tier)

**Acceptance criteria:** Given a new user, they can create their first tank profile in under 2 minutes. Given a user with multiple tanks, they can switch between tanks with one click/tap.

#### R-003: Water Parameter Logging

- Manual entry of water test results
- Parameters supported at minimum: pH, ammonia, nitrite, nitrate, temperature, GH, KH
- Saltwater additional: salinity, calcium, alkalinity, magnesium, phosphate
- Historical data storage with timestamps

**Acceptance criteria:** Given a user logging parameters, they can enter all values and save in under 60 seconds. Given historical data, it is queryable by date range.

#### R-004: Parameter Visualization (Interactive Dashboards)

- Line charts showing parameter trends over time (daily, weekly, monthly, all-time)
- Multi-parameter overlay on a single chart
- Color-coded zones (safe, warning, danger) based on tank type and livestock
- Interactive: hover for values, zoom, pan, date range selection

**Acceptance criteria:** Given a user with 30+ days of parameter data, charts render in under 2 seconds. Given a user hovers over a data point, they see the exact value and timestamp.

#### R-005: AI-Powered Parameter Analysis

- AI analyzes parameter trends and generates insights
- Proactive alerts when parameters trend toward danger zones (predictive, not just threshold)
- Correlation detection: AI identifies relationships between parameter changes and events
- Daily/weekly AI-generated tank health summary

**Acceptance criteria:** Given a gradual pH decline over 7 days, the AI proactively alerts the user before pH reaches danger zone. Given a user adds new livestock and nitrates spike 3 days later, the AI identifies the correlation.

#### R-006: Species Database

- Comprehensive database of 500+ freshwater and saltwater species
- Species cards with: common name, scientific name, photo, care level, min tank size, temperature range, pH range, diet, temperament, compatibility notes
- Search and filter by type, care level, tank size, compatibility
- AI-enhanced species insights

**Acceptance criteria:** Given a user searches "clownfish", they see relevant species cards with complete care info. Given a species card, all critical care parameters are displayed.

#### R-007: Livestock Management

- Add/remove species to a tank's livestock list (from database or custom entry)
- Track quantity, date added, nicknames, notes
- AI compatibility checking: warns when adding incompatible species

**Acceptance criteria:** Given a user adds a species that is aggressive toward an existing tank inhabitant, the AI warns them with specific compatibility details. Given a user's livestock list, the AI factors all species into its recommendations.

#### R-008: Maintenance Scheduling & Reminders

- Create recurring and one-time maintenance tasks
- Task types: water change, filter cleaning, feeding schedule, dosing, equipment maintenance, custom
- Push notifications via PWA (browser notifications)
- Task completion logging
- AI-suggested maintenance schedules based on tank needs

**Acceptance criteria:** Given a user creates a recurring weekly water change, they receive a notification on the scheduled day. Given a user marks a task complete, it is logged in the tank's maintenance history.

#### R-009: Authentication (Magic Link)

- Passwordless authentication via Supabase Auth magic link
- User enters email, receives login link, clicks to authenticate
- Session management with appropriate token refresh

**Acceptance criteria:** Given a new user enters their email, they receive a magic link within 30 seconds. Given a user clicks a valid magic link, they are authenticated and redirected to the app.

#### R-010: Subscription & Billing

Three-tier subscription model:

- **Starter ($3.99/month):** 1 tank, basic AI chat (limited messages/day), parameter tracking, species database access
- **Plus ($7.99/month):** Up to 5 tanks, full AI chat, photo diagnosis, maintenance scheduling, interactive dashboards, daily reports
- **Pro ($14.99/month):** Unlimited tanks, priority AI (faster responses, higher limits), web search agent for equipment, advanced analytics, multi-tank comparison, email reports
- **14-day free trial with full Pro access**
- Stripe integration for payment processing
- Subscription management (upgrade, downgrade, cancel)
- AI usage tracking per user (token consumption, message counts)

**Acceptance criteria:** Given a new user, they get 14 days of full Pro access before being asked to subscribe. Given a Starter user tries to create a second tank, they see an upgrade prompt. Given a user cancels, they retain access until the end of their billing period.

#### R-011: Responsive PWA

- Responsive design that works on desktop, tablet, and mobile browsers
- PWA manifest for installability (Add to Home Screen)
- Service worker for offline support (cached data viewable offline, sync when online)
- Browser push notifications for maintenance reminders and alerts
- Works on both iOS Safari and Android browsers

#### R-012: Onboarding Flow

- Guided setup for new users: email signup → magic link → tank creation → first parameter entry → intro to AI chat
- Tooltips and contextual help throughout the app
- AI-driven onboarding conversation (e.g., "Tell me about your tank" → AI suggests care tips)
- Skip option for experienced users

---

### P1 — Nice-to-Have (Fast Follows)

#### R-101: Photo Diagnosis

- Users upload a photo of a fish
- AI uses Claude Sonnet 4.5 (vision) to identify the species and diagnose health issues
- Returns: species ID, confidence level, disease/condition diagnosis, treatment recommendations, medication dosing (adjusted for tank size)
- Available in Plus and Pro tiers (limited/unlimited per month)

**Acceptance criteria:** Given a user uploads a clear photo of a diseased fish, the AI correctly identifies the disease and recommends a treatment within 5 seconds.

#### R-102: Equipment Tracking

- Users record equipment in their tank (filter, heater, light, pump, etc.)
- Track: type, brand, model, purchase date, settings
- Equipment replacement alerts based on typical lifespan

**Acceptance criteria:** Given a user adds a filter with a purchase date, the app alerts them when the filter is approaching end-of-life (e.g., 12 months for cartridges).

#### R-103: AI Equipment Recommendations via Web Search

- Pro users can ask the AI "what's the best filter for a 50-gallon reef tank?"
- AI performs web search and recommends specific products with links
- Availability: Pro tier only

**Acceptance criteria:** Given a Pro user asks for equipment recommendations, the AI returns top 3 products with specifications and links within 10 seconds.

#### R-104: Email Reports

- Pro users receive daily or weekly email reports
- Content: tank health summary, parameter trends, upcoming maintenance, recent alerts, any recommendations
- Customizable frequency and content

**Acceptance criteria:** Given a Pro user has email reports enabled, they receive a well-formatted email at the scheduled time with current tank data.

#### R-105: Multi-Tank Comparison Dashboard

- Users with multiple tanks can compare side-by-side
- Shows: current parameters, recent trends, livestock counts, upcoming maintenance
- Pro users can compare all tanks; Plus users can compare up to 5 tanks

**Acceptance criteria:** Given a user with 3 tanks, they can see all three tanks' latest parameters and trends on a single screen.

---

## 8. TECHNICAL ARCHITECTURE (High Level)

### Frontend

- Next.js 14+ (App Router) with TypeScript
- Tailwind CSS + shadcn/ui for components
- Recharts or Chart.js for interactive parameter dashboards
- PWA: next-pwa for service worker generation
- State management: Zustand or React Context (keep it simple)
- Deployed on Vercel

### Backend

- Supabase (hosted PostgreSQL)
- Supabase Auth (magic link authentication)
- Supabase Edge Functions (Deno) for serverless API logic
- Supabase Realtime for live updates (parameter alerts, notification sync)
- Supabase Storage for user-uploaded photos

### AI Layer

- Anthropic Claude Sonnet 4.5 for conversational AI
- Anthropic Claude Sonnet 4.5 (vision) for photo diagnosis
- Custom system prompts with tank context injection
- AI memory: conversation summaries stored per tank, injected as context
- Token tracking per user for billing/usage management

### Payments

- Stripe for subscription billing
- Stripe Checkout for payment flow
- Stripe Customer Portal for self-service subscription management
- Webhook handlers for subscription lifecycle events

### Infrastructure

- Vercel for frontend hosting and edge functions
- Supabase Cloud for database, auth, storage, and serverless functions
- Supabase CLI for local development and migrations
- Vercel CLI for deployments

### Email

- Resend for transactional emails (reports, trial reminders, payment notifications)
- React Email for maintainable email templates
- Supabase Auth handles magic link emails natively

### Monitoring & Observability

- Sentry for error tracking and performance monitoring
- Frontend: `@sentry/nextjs` captures React errors, Web Vitals, user sessions
- Backend: `@sentry/deno` captures Edge Function errors, API failures
- Alerts configured for error spikes, AI unavailability, and payment failures

---

## 9. DATA MODEL (Key Entities)

- **users** — id, email, display_name, avatar_url, subscription_tier, trial_end_date, stripe_customer_id, created_at

- **tanks** — id, user_id, name, type (freshwater/saltwater/reef/brackish), volume_gallons, dimensions, substrate, setup_date, photo_url, created_at

- **water_parameters** — id, tank_id, test_date, pH, ammonia, nitrite, nitrate, temperature, salinity, calcium, alkalinity, magnesium, phosphate, GH, KH, notes

- **species** — id, common_name, scientific_name, type, care_level, min_tank_size, temp_range, pH_range, diet, temperament, description, photo_url, compatibility_notes

- **livestock** — id, tank_id, species_id, quantity, nickname, date_added, date_removed, notes

- **maintenance_tasks** — id, tank_id, title, type, description, frequency, next_due_date, last_completed, is_recurring, created_at

- **maintenance_logs** — id, task_id, tank_id, completed_date, notes

- **equipment** — id, tank_id, type, brand, model, purchase_date, settings, notes

- **ai_conversations** — id, tank_id, user_id, messages (JSONB array), summary, created_at, updated_at

- **ai_usage** — id, user_id, date, message_count, tokens_used, feature (chat/diagnosis/report)

- **subscriptions** — id, user_id, stripe_subscription_id, tier, status, current_period_start, current_period_end

---

## 10. SUBSCRIPTION TIERS (Detailed)

**Canonical 4-Tier Structure:**

| Tier | Price | Description |
|------|-------|-------------|
| **Free** | $0 | Limited access, no credit card required |
| **Starter** | $3.99/mo | Entry paid tier, unlocks basic features |
| **Plus** | $7.99/mo | Mid-tier, unlocks photo diagnosis + equipment |
| **Pro** | $14.99/mo | Full access, unlimited everything |

- **14-day trial gives Pro access**, then drops to Free unless user subscribes

**Feature Access Matrix:**

| Feature | Free | Starter ($3.99) | Plus ($7.99) | Pro ($14.99) |
|---------|:---:|:---:|:---:|:---:|
| **Tanks** | 1 | 1 | 5 | Unlimited |
| **AI Messages/day** | 10 | 100 | 200 | Unlimited |
| **Maintenance Tasks** | 3 total | 10/tank | 10/tank | Unlimited |
| **Photo Diagnosis** | — | — | 10/day | 30/day |
| **Equipment Tracking** | — | — | ✓ | ✓ |
| **AI Equipment Recs** | — | — | — | 10/day |
| **Email Reports** | — | — | — | ✓ |
| **Multi-Tank Comparison** | — | — | — | ✓ |
| **Parameter Tracking** | ✓ | ✓ | ✓ | ✓ |
| **Species Database** | ✓ | ✓ | ✓ | ✓ |
| **Livestock Management** | ✓ | ✓ | ✓ | ✓ |
| **Interactive Dashboards** | Basic | Basic | Full | Advanced |
| **Annual Discount** | N/A | N/A | N/A | $149.99/yr (save 16%) |

---

## 11. SUCCESS METRICS

### Leading Indicators (within first 30 days)

- **Signup rate:** 50+ signups/day within first month (target: 1,500 signups in month 1)
- **Onboarding completion rate:** >70% of signups complete onboarding (create tank + log first parameters)
- **AI chat engagement:** Average 5+ AI messages per active user per day
- **Parameter logging frequency:** Active users log parameters 2+ times per week
- **Time to first value:** Users receive their first personalized AI recommendation within 10 minutes of signup
- **Trial activation:** >80% of free trial users engage with AI chat in first 3 days

### Lagging Indicators (at 30, 60, 90 days)

- **Trial-to-paid conversion:** 15% of trial users convert to paid within 30 days
- **7-day retention:** >60% of signups return after 7 days
- **30-day retention:** >40% of signups return after 30 days
- **Monthly Recurring Revenue (MRR):** $5,000+ within 6 months
- **Net Promoter Score (NPS):** >50 at 90 days post-launch
- **AI satisfaction:** >4.0/5.0 average rating on AI response helpfulness (in-app feedback)
- **Churn rate:** <8% monthly churn for paid subscribers
- **Tier distribution:** 40% Starter, 40% Plus, 20% Pro among paid users

### AI-Specific Metrics

- **AI response latency:** <3 seconds average for chat responses
- **AI accuracy (species ID):** >85% correct identification from photos
- **AI accuracy (disease diagnosis):** >75% correct diagnosis from photos (validated against expert review)
- **AI cost per user:** <$2/month average across all tiers
- **Token efficiency:** Average conversation uses <4,000 tokens per exchange
- **Action execution success rate:** >95% of AI-initiated actions (schedule task, add livestock) complete successfully

---

## 12. OPEN QUESTIONS

### Blocking (Must resolve before development)

- **[Engineering] AI context window management:** How do we handle users with months of conversation history? Summarization strategy? Rolling context window with key facts persisted? Max conversation length before auto-summarize?

- **[Engineering] Offline AI:** When the user is offline, what happens when they try to chat with the AI? Queue messages? Show cached responses? Clearly indicate offline state?

- **[Design] Chat-first vs. dashboard-first:** Is the default landing page the AI chat or a tank dashboard? The chat IS the core, but users may want a quick visual health check first. Consider a dashboard with an always-accessible chat panel.

- **[Business] Stripe payment region:** Which Stripe payment methods should we support beyond cards? (Apple Pay, Google Pay, etc.)

### Non-Blocking (Resolve during implementation)

- **[Engineering] Species database source:** Build our own from scratch, import from FishBase API, or use a combination? The original app had 500+ species — should we start smaller and grow?

- **[Design] Parameter entry UX:** Quick-entry form vs. conversational entry via AI chat vs. both? What's the fastest path to logging results?

- **[Data] AI usage limits enforcement:** Hard cutoff at message limit or soft degradation (slower responses, simpler answers)?

- **[Engineering] Notification delivery:** PWA push notifications have limitations on iOS Safari. How do we handle the iOS gap? Email fallback?

- **[Legal] Health claims:** Can we say "reduces fish mortality"? Do we need disclaimers about AI advice not replacing professional veterinary care?

- **[Engineering] Image storage and processing:** Compress uploaded photos? Max file size? Storage costs at scale?

---

## 13. PHASING PLAN

### Phase 1: Foundation (MVP Launch)

All P0 requirements. Core AI chat, parameter tracking with dashboards, species database, livestock management, maintenance scheduling, magic link auth, subscription billing, PWA.

### Phase 2: Intelligence Layer

P1 requirements. Photo diagnosis, equipment tracking with AI web search, email reports, multi-tank comparison dashboard. Also: ROI/cost tracking, native mobile exploration, additional languages.

### Phase 3: Ecosystem

P2 requirements. IoT integrations, community features, marketplace partnerships, advanced AI (behavior monitoring, automated parameter reading from photos), API for third-party integrations.

---

## 14. RISKS & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|:----------:|:------:|-----------|
| AI costs exceed budget at scale | Medium | High | Token tracking, aggressive summarization, tier-based limits, model optimization (use Claude Haiku 4.5 for simpler queries) |
| PWA push notifications unreliable on iOS | High | Medium | Email notification fallback, in-app notification center, clear communication about browser support |
| Species database incomplete or inaccurate | Medium | Medium | Start with curated core species (200+), allow AI to answer about unlisted species, community contribution pipeline later |
| Low trial-to-paid conversion | Medium | High | Optimize onboarding for fast time-to-value, A/B test trial length and feature gates, follow-up email sequences |
| Anthropic API changes or pricing increases | Low | High | Abstract AI layer behind an interface, making it swappable. Monitor OpenAI GPT API as alternative. |
| Competitor launches similar AI-first app | Medium | Medium | Move fast, build AI memory moat (the more you use Aquatic AI, the more valuable it becomes), community and brand building |

---

**Document Version:** 1.0
**Last Updated:** February 7, 2026
**Status:** Draft for Development Kickoff
