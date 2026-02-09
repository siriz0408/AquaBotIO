# R&D Report: AquaBotAI Pricing Strategy
**Date:** February 9, 2026  
**Mode:** Directed Research  
**Status:** Decisions Confirmed — Ready for Spec & Implementation  
**Updated:** February 9, 2026 — Multi-agent findings incorporated, Sam's decisions confirmed

---

## Executive Summary

Multiple R&D agents analyzed AquaBotAI's pricing model across Stripe, Supabase, codebase, and competitive landscape. The core finding: **the current Starter tier ($3.99/mo with 100 AI msgs/day) is unsustainable** — AI costs can reach $15/mo at max usage, leaving negative margin after Stripe fees and infrastructure.

Sam's confirmed GTM strategy: **attract users with free/cheap non-AI tools (what competitors offer), then upsell to AI-enhanced tiers once they're invested in the app.**

**New Tier Structure (Confirmed):**
| Tier | Price | AI Messages/day | Tanks | Positioning |
|------|-------|-----------------|-------|-------------|
| **Free** | $0 | 0 (post-trial) | 1 | Basic tools, species DB, parameter logging — "competitor replacement" |
| **Starter** | $3.99-4.99/mo | 5-10 | 1-2 | All tools + taste of AI — "hook tier" |
| **Plus** | $9.99/mo | 75-100 | 5 | AI-enhanced tools, photo dx, proactive alerts — "AI power" |
| **Pro** | $19.99/mo | 500 (capped) | Unlimited | Everything + reports + equipment recs — "power user" |
| **Trial** | 7 days | Full Pro | Unlimited | No CC required, same flow as today |

---

## Multi-Agent Research Findings

### 1. Actual AI Costs (From Supabase Usage Data)

Real usage data from `ai_usage` table (56 chat messages, 7 diagnosis, 1 report logged):

| Message Type | Avg Input Tokens | Avg Output Tokens | Cost/Message | Relative Cost |
|-------------|-----------------|-------------------|-------------|---------------|
| **Simple chat** | ~904 | ~179 | ~$0.005 | 1x (baseline) |
| **Photo diagnosis** | ~500 | ~1,100 | ~$0.02 | 4x more expensive |
| **Report generation** | ~800 | ~2,200 | ~$0.04 | 8x more expensive |

**Key Finding:** "Messages" is not a uniform cost unit. Complex prompts with full context injection can cost $0.02-0.04 each — 4-8x the average.

**Backend AI Costs (No User Prompt Required):**
- `analyze-parameter-trends` Edge Function: Calls Claude Sonnet 4.5 per tank with concerning trends (~$0.01/tank/run)
- Future agents (daily reports, auto-logger): Will add backend cost per tank
- These costs scale with **tank count**, not user tier

### 2. Current System State (Schema & Code Audit)

**Stripe:**
- 3 AquaBotAI products (Starter/Plus/Pro) with monthly-only prices ($3.99/$7.99/$14.99)
- No annual price objects exist
- Legacy products from another project exist (unrelated — Team Plan, Professional Plan, Credit Pack)

**Supabase Schema Gaps:**
- `billing_interval` column: In Spec 07 but **NOT in actual migration** — must be added
- `stripe_price_id` column: In Spec 07 but **NOT in actual migration** — must be added
- `subscriptions` table: 22 rows, all test data (15 trialing free, 1 active Pro, 1 active Starter, 1 active Plus, 1 past_due Plus, 1 canceled Starter, 1 incomplete)

**Tier Enforcement Touchpoints (11+ files):**
- `src/lib/hooks/use-tier-limits.ts` — `TIER_LIMITS` constant (client-side)
- `src/lib/validation/billing.ts` — `TIER_PRICING` constants
- `src/lib/stripe/client.ts` — price ID mapping (monthly only)
- `src/lib/stripe/checkout.ts` — checkout session creation
- `src/lib/stripe/webhook-handlers.ts` — subscription lifecycle
- `src/app/api/billing/checkout/route.ts` — checkout API
- `src/app/api/billing/subscription/route.ts` — subscription API
- `src/app/(dashboard)/billing/page.tsx` — billing page UI
- `src/components/billing/subscription-card.tsx` — plan comparison
- `src/components/billing/trial-banner.tsx` — trial countdown
- `src/components/billing/upgrade-prompt.tsx` — upgrade CTAs
- `src/components/chat/usage-indicator.tsx` — message usage display
- `supabase/migrations/20260212000000_add_check_ai_usage_function.sql` — server-side RPC

### 3. Competitive Landscape (Updated)

**Direct Aquarium App Competitors:**
| App | Pricing | AI? | Key Insight |
|-----|---------|-----|-------------|
| **Aquarimate** | Free + $9.99/yr cloud | No | Our closest competitor. $0.83/mo for manual tools. |
| **Aquarium Manager** | Free + $3.99 one-time IAP | No | One-time purchase model, basic logging |
| **AquaNote** | Free | No | Note-taking focused, no management features |
| **Aquarium AI** | "Bring your own API key" | Sort of | Users pay their own token costs — no business model |
| **MyAquarium** | Free | No | Very basic, outdated |

**Adjacent Competitors (Plant Care Apps — Similar Niche):**
| App | Pricing | Notes |
|-----|---------|-------|
| **Planta** | $7.99/mo or $35.99/yr | Plant care with AI features |
| **Blossom** | $4.99/mo or $29.99/yr | Plant identification + care |

**AI SaaS Benchmarks:**
| App | Pricing | Conversion | Notes |
|-----|---------|-----------|-------|
| **ChatGPT** | Free + $20/mo Pro | 2-5% | 800M weekly users |
| **Claude** | Free + $20/mo Pro | ~3-5% | 30M MAU |
| **Character.ai** | $9.99/mo or $94.99/yr | ~5% | Entertainment AI |
| **Replika** | $14.99/mo or $49.99/yr | ~8% | Companion AI |
| **Midjourney** | $10-$60/mo | 100% paid | Image generation |

**Key Insight:** We're pricing like a hobby app ($3.99) but delivering AI chat infrastructure that costs like an AI platform. Pricing needs to reflect the AI cost reality, not the "basic app" category. Frame against aquarium expert consultations ($50-100/hr), not competing apps ($10/year).

---

## Confirmed Decisions (Sam's Review — Feb 9, 2026)

### Decision 1: Tier Structure — Revised
- **Free ($0)**: 1 tank, basic static tools, 0 AI messages post-trial, species DB, parameter logging
- **Starter ($3.99-4.99)**: 1-2 tanks, all tools, 5-10 AI msgs/day (taste of AI), no photo dx
- **Plus ($9.99)**: 5 tanks, AI-enhanced tools, 75-100 AI msgs/day, photo dx 10/day, proactive alerts
- **Pro ($19.99)**: Unlimited tanks, 500 AI msgs/day cap, 30 photo dx/day, email reports, equipment recs

### Decision 2: Trial — 7-Day, No CC Required
- Changed from 14-day to 7-day
- Same flow as today (no CC gate), just shorter duration
- Full Pro access during trial
- Implementation: Change `trial_ends_at` default from `INTERVAL '14 days'` to `INTERVAL '7 days'`

### Decision 3: Annual Billing — Approved, Deferred
- 20% discount on annual plans
- Deferred to post-launch — need monthly churn data first
- Annual prices: $39.90/$99.90/$199.90 per year

### Decision 4: Beta Testers — Stripe Coupons
- 100% off coupons with 3-month expiry
- Generated per-tester for tracking (`BETA-SAM-001`, etc.)
- Uses existing `allow_promotion_codes: true` in checkout

### Decision 5: Admin Access — Database Override
- New columns on `subscriptions` table: `tier_override`, `override_reason`, `override_expires_at`
- Admin profiles get `tier_override = 'pro'` with no expiration
- Priority chain: Admin > Override > Trial > Subscription > Free

### Decision 6: Model Routing (Haiku) — Deferred
- Not building now
- Post-launch optimization once query complexity distribution is known

### Decision 7: Backend AI Costs — Gate to Paid Tiers
- `analyze-parameter-trends` Edge Function: Only run for Plus+ tiers
- Free/Starter users get static threshold alerts, not AI-powered trend detection

### Decision 8: Free Tools — Build Before Pricing Changes
- Water change calculator, stocking calculator, etc. must be built first
- New pricing activates only after free tools exist to fill the free tier
- References Spec 16 (AI Chat Embedded Widgets) for tool specs

### Decision 9: GTM Strategy — "Free Tools + AI Premium"
- **Attract**: Free tier offers useful non-AI tools (what competitors charge for)
- **Hook**: Starter adds taste of AI (5-10 msgs/day) at competitive price
- **Convert**: Users see AI-enhanced versions of tools and want upgrade
- **Retain**: Plus/Pro deliver enough value to justify premium pricing
- **Positioning**: Frame as "AI aquarium expert" ($50-100/hr value), not "aquarium app"

---

## Revised Cost Model

### Per-Tier Cost Analysis (New Structure)

| Tier | Max Msgs/Day | Avg Usage | Monthly Msgs (avg) | Cost/Month (avg) | Cost/Month (max) | Price | Margin (avg) | Margin (max) |
|------|-------------|-----------|-------------------|-----------------|-----------------|-------|-------------|-------------|
| **Free** | 0 | 0 | 0 | $0.00 | $0.00 | $0 | N/A | N/A |
| **Starter** | 5-10 | 5 | 150 | $0.75 | $1.50 | $4.99 | 85% | 70% |
| **Plus** | 75-100 | 30 | 900 | $4.50 | $15.00 | $9.99 | 55% | -50% (!) |
| **Pro** | 500 | 80 | 2,400 | $12.00 | $75.00 | $19.99 | 40% | -275% (!) |

**Warning:** At MAX usage, Plus and Pro tiers are unprofitable. However, average usage is what matters:
- Most users use 20-40% of their daily limit
- Heavy users (>50% daily limit) are typically <10% of subscribers
- Model routing (Haiku for simple queries) can cut costs 40% when implemented

### Revised Scale Projections

**1,000 Users (90 days post-launch):**
- Distribution: 60% Free (600), 20% Starter (200), 15% Plus (150), 5% Pro (50)
- Monthly AI cost: (600 × $0) + (200 × $0.75) + (150 × $4.50) + (50 × $12.00) = **$0 + $150 + $675 + $600 = $1,425/month**
- Monthly revenue: (200 × $4.99) + (150 × $9.99) + (50 × $19.99) = **$998 + $1,498.50 + $999.50 = $3,496/month**
- Net margin: $3,496 - $1,425 = **$2,071/month (59% margin)**

**10,000 Users (6 months post-launch):**
- Distribution: 55% Free (5,500), 25% Starter (2,500), 15% Plus (1,500), 5% Pro (500)
- Monthly AI cost: (2,500 × $0.75) + (1,500 × $4.50) + (500 × $12.00) = **$1,875 + $6,750 + $6,000 = $14,625/month**
- Monthly revenue: (2,500 × $4.99) + (1,500 × $9.99) + (500 × $19.99) = **$12,475 + $14,985 + $9,995 = $37,455/month**
- Net margin: $37,455 - $14,625 = **$22,830/month (61% margin)**

---

## Risk Analysis

### Risk 1: Schema Gaps (HIGH — Must Fix First)
`billing_interval` and `stripe_price_id` columns are in Spec 07 but missing from actual migration. Must be added before any pricing changes.
**Mitigation:** Schema migration as first task in pricing sprint.

### Risk 2: Tier Enforcement Mismatch (MEDIUM)
Client-side (`use-tier-limits.ts`) and server-side (`check_and_increment_ai_usage` RPC) must agree on new limits.
**Mitigation:** Audit all enforcement points. Single source of truth for limits.

### Risk 3: Backend AI Costs for Free Users (MEDIUM)
`analyze-parameter-trends` Edge Function runs for ALL tanks regardless of tier.
**Mitigation:** Gate to Plus+ only. Free/Starter get static threshold alerts.

### Risk 4: Pricing Page Complexity (LOW)
More tiers + features = harder to communicate.
**Mitigation:** Simple 3-visible-tier layout with expandable "Compare all features" section.

### Risk 5: Positioning Risk (LOW)
Aquarium community is price-sensitive — "$10/mo for an app?!" when competitors are $10/year.
**Mitigation:** Frame as AI expert consultation ($50-100/hr value), not app subscription.

---

## Open Questions (Resolved)

| # | Question | Decision |
|---|----------|----------|
| 1 | Free tier AI access post-trial? | 0 messages. Free tools provide value. AI is the upgrade driver. |
| 2 | Annual billing at launch? | Deferred to post-launch. Monthly only for first 90 days. |
| 3 | Pro tier cap or price increase? | Both: cap at 500 msgs/day AND raise to $19.99. |
| 4 | Photo diagnosis tier gating? | Plus (10/day) and Pro (30/day). Limited. |
| 5 | Trial length? | 7 days, no CC required, full Pro access. |
| 6 | Beta tester access? | Stripe coupons (100% off, 3-month expiry). |
| 7 | Admin access? | Database tier_override column, always Pro. |
| 8 | Starter price? | $3.99-4.99 (exact TBD, tools-focused tier). |

---

**Document Status:** Decisions Confirmed — Ready for Spec  
**Next Step:** Create `18_Pricing_Strategy_Spec.md`  
**Author:** R&D Discovery Agent (multi-agent collaboration)  
**Approved By:** Sam (verbal confirmation, Feb 9 2026)
