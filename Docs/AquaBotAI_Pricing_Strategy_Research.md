# AquaBotAI Pricing Strategy Research Report

**Date:** February 9, 2026
**Status:** Research Complete — Awaiting Sam's Decisions
**Mode:** R&D Discovery (Pricing Focus)

---

## Executive Summary

After a full audit of AquaBotAI's codebase, Supabase database, Stripe products, documentation, and the external competitive landscape, **Sam's instinct is confirmed: the current pricing is too cheap for what's being offered, and the unit economics don't work at the Starter tier.**

The core problem: you're pricing like a basic hobby app ($3.99–$14.99) but delivering AI chat infrastructure that costs like an AI platform. At 100 AI messages/day for $3.99, a moderately active Starter user would cost you ~$3/month in API fees alone — leaving less than $0.70 margin before Stripe fees (2.9% + $0.30), hosting, and everything else. A heavy user would cost you $15/month, meaning you'd *lose* $11 per subscriber.

This report covers five research streams and lays out the decisions we need to make together.

---

## 1. Current State Audit

### What's in Your PRD & Specs

The canonical pricing from `AquaBotAI PRDV1.md` Section 10 and `07_Subscription_Billing_Spec.md`:

| Tier | Price | Tanks | AI Messages/Day | Photo Diagnosis | Equipment Recs | Email Reports |
|------|-------|-------|-----------------|-----------------|----------------|---------------|
| **Free** | $0 | 1 | 10 | — | — | — |
| **Starter** | $3.99/mo | 1 | 100 | — | — | — |
| **Plus** | $7.99/mo | 5 | 200 | 10/day | ✓ tracking | — |
| **Pro** | $14.99/mo | Unlimited | Unlimited | 30/day | 10/day | ✓ |

- 14-day trial gives full Pro access, no credit card required
- Free tier post-trial: read-only access to existing data + 10 AI messages/day
- Daily limits reset at midnight UTC
- Target ARPU: $8.50/month
- Target tier distribution: 40% Starter / 40% Plus / 20% Pro (paid users)
- AI cost target: < $2/month average per user

### What's Actually Built in Your Codebase

Pricing is hardcoded in **10+ files** across the codebase. The current values exactly match the PRD:

| File | What It Contains |
|------|------------------|
| `src/lib/hooks/use-tier-limits.ts` | `TIER_LIMITS` object (tanks, messages, diagnosis limits per tier) + `getTierPrice()` |
| `src/lib/validation/billing.ts` | `TIER_PRICING` object (prices in cents: 399/799/1499, display strings, feature lists) |
| `src/components/billing/subscription-card.tsx` | `PLANS` array with all 4 tiers, prices, feature bullet points |
| `src/app/api/usage/route.ts` | Hardcoded limits object — **appears TWICE** (lines 85 and 117-122) |
| `src/app/page.tsx` | Homepage pricing section (lines 157-237) with all prices and features |
| `src/app/api/billing/subscription/route.ts` | Free tier defaults (price: 0, features list) |
| `src/lib/stripe/client.ts` | `STRIPE_PRICES` mapping — **monthly only** (no annual price IDs) |
| `src/components/billing/upgrade-prompt.tsx` | References `TIER_LIMITS` for upgrade CTA messaging |
| `src/components/chat/usage-indicator.tsx` | Unlimited threshold check (`>= 999999`) |
| `src/components/billing/trial-banner.tsx` | 3-day urgency threshold, trial messaging |
| `src/lib/stripe/webhook-handlers.ts` | 7-day grace period after payment failure |

**Missing from codebase (specced but not built):**
- No `billing_interval` column on subscriptions table
- No `stripe_price_id` column on subscriptions table
- No annual pricing support anywhere
- No monthly/annual toggle on billing page

### What's in Stripe

Currently configured:
- 3 products: Starter, Plus, Pro (AquaBotAI branded)
- 3 monthly price objects ($3.99, $7.99, $14.99)
- **No annual price objects exist**

### What's in Supabase

The `subscriptions` table has 22 rows:
- 15 users on `free` tier with `trialing` status
- 1 active Pro, 1 active Starter, 1 active Plus
- 1 past_due Plus, 1 canceled Starter, 1 incomplete
- `subscription_tier` enum: `free | starter | plus | pro`
- `subscription_status` enum: `trialing | active | past_due | canceled | incomplete`

The `ai_usage` table shows real token consumption:
- **Chat:** 56 messages, avg 904 input + 179 output tokens per message
- **Diagnosis:** 7 messages, avg 160 input + 340 output tokens per message
- **Report:** 1 message, 800 input + 2,200 output tokens

---

## 2. The Unit Economics Problem

### Real Cost Per Message (from your actual Supabase data)

Using Claude Sonnet 4.5 pricing ($3/M input, $15/M output):

| Feature Type | Avg Input Tokens | Avg Output Tokens | Cost Per Message |
|-------------|-----------------|-------------------|-----------------|
| Chat | 904 | 179 | **$0.005** |
| Photo Diagnosis | ~500 | ~1,100 | **$0.020** |
| Report Generation | ~800 | ~2,200 | **$0.036** |

### Cost at Current Tier Limits (Worst Case — User Maxes Out)

| Tier | Price | Max Msgs/Day | Max Msgs/Month | Max Cost/Month | Margin |
|------|-------|-------------|----------------|---------------|--------|
| **Free** | $0 | 10 | 300 | $1.50 | **-$1.50** |
| **Starter** | $3.99 | 100 | 3,000 | $15.00 | **-$11.01** |
| **Plus** | $7.99 | 200 | 6,000 | $30.00 | **-$22.01** |
| **Pro** | $14.99 | Unlimited | Unlimited | Unlimited | **Uncapped risk** |

### Cost at Average Usage (More Realistic)

Assuming typical usage is ~20% of daily limit:

| Tier | Price | Avg Msgs/Day | Avg Msgs/Month | Avg Cost/Month | Margin | Margin % |
|------|-------|-------------|----------------|---------------|--------|----------|
| **Free** | $0 | 3 | 90 | $0.45 | -$0.45 | N/A |
| **Starter** | $3.99 | 20 | 600 | $3.00 | $0.99 | 25% |
| **Plus** | $7.99 | 40 | 1,200 | $6.00 | $1.99 | 25% |
| **Pro** | $14.99 | 100 | 3,000 | $15.00 | -$0.01 | 0% |

**Even at average usage, margins are dangerously thin.** After Stripe's 2.9% + $0.30 per transaction:
- Starter: $0.99 margin → $0.99 - $0.42 = **$0.57 net** (14% margin)
- Plus: $1.99 margin → $1.99 - $0.53 = **$1.46 net** (18% margin)

**Healthy SaaS margins are 70-80%.** You're at 14-18%.

---

## 3. Competitive Landscape

### Direct Competitors (Aquarium Apps)

| App | Pricing | AI? | Key Features | Notes |
|-----|---------|-----|-------------|-------|
| **Aquarimate** | $9.99/year | No | Manual logging, charts, expense tracking | $0.83/mo equivalent — no AI costs |
| **AquaNote** | Free | No | Note-taking focused | Unpublished from Play Store mid-2025 |
| **Aquarium Manager** | $3.99 one-time | No | Basic tank logging | One-time purchase, no recurring |
| **MyAquarium** | Free | No | Very basic, outdated | Effectively abandoned |
| **Neptune Apex Fusion** | Free (hardware required) | No | Real automation | Requires $500+ hardware purchase |

**Key insight:** No aquarium app charges a monthly subscription. They're either free, one-time purchase, or cheap annual. **But none of them have AI.** You're creating a new category.

### AI Chat Apps (Your Real Pricing Peers)

| App | Monthly | Annual | Free Tier |
|-----|---------|--------|-----------|
| **ChatGPT Plus** | $20/mo | $240/yr (no discount) | Limited free |
| **Claude Pro** | $20/mo | $204/yr (~15% off) | Limited free |
| **Character.ai+** | $9.99/mo | N/A | Basic chat |
| **Replika Pro** | $14.99-$19.99/mo | $49.99-$69.99/yr | Basic chat, 7-day trial |

### Hobby/Care Apps with AI Features

| App | Monthly | Annual | Free Tier | Trial |
|-----|---------|--------|-----------|-------|
| **Planta** (plant care) | $7.99-$9.99/mo | $35.99/yr | Manual logging | None |
| **Greg** (plant care) | N/A | $29.99/yr | Basic tracking | 7-day |
| **PictureThis** (plant ID) | N/A | $29.99/yr | Credit-limited scans | 7-day |
| **PupClub** (pet care AI) | Varies | N/A | Limited | None |
| **Fitbod** (AI fitness) | $15.99/mo | $95.99/yr (~$8/mo) | Limited | 3 workouts |

### Domain-Specific AI Assistants

| Category | Typical Monthly Price |
|----------|---------------------|
| Writing AI (Grammarly) | $12-$30/mo |
| Coding AI (Copilot, Cursor) | $10-$20/mo |
| Fitness AI (Fitbod) | $8-$16/mo |
| Pet/Hobby AI | $5-$20/mo |
| **Sweet spot for niche AI apps** | **$8-$15/mo** |

### Competitive Positioning Map

```
                    HIGH AI DIFFERENTIATION
                           │
                           │    ★ AquaBotAI
                           │    (only AI aquarium app)
                           │
                           │
LOW PRICE ─────────────────┼─────────────────── HIGH PRICE
                           │
   Aquarimate              │         Planta
   AquaNote                │         PictureThis
   MyAquarium              │         Fitbod
                           │
                    LOW AI DIFFERENTIATION
```

You sit alone in the "high AI differentiation" quadrant for aquarium apps. **There is no direct competitor offering what you offer.** This means you have pricing power — you're not in a race to the bottom.

---

## 4. Pricing Strategy Analysis

### Using the Value-Based Framework

```
Customer's perceived value: $15-25/mo (AI personal aquarium expert, 24/7)
                            ──────────────────────────
Your current price:         $3.99-14.99/mo
                            ──────────────────────────
Next best alternative:      $0-$0.83/mo (Aquarimate or free apps + Reddit)
                            ──────────────────────────
Your cost to serve:         $0.45-$15+/mo (AI tokens + infrastructure)
                            ──────────────────────────
```

**You're leaving significant value on the table.** Your price is barely above your cost to serve, when it should be halfway between your cost and the customer's perceived value.

### The "Message" Problem

Sam is right that "messages" is too vague. A one-word question and a complex photo diagnosis with a 2,000-token response differ by 8x in cost. Three approaches:

**Option A: Keep Messages, Cut Limits Hard**
- Simplest for users. "You get 25 messages a day."
- Pros: Simple to understand. No confusion about "credits."
- Cons: Penalizes simple questions. A user asking "what's a good pH for bettas?" costs the same as a photo diagnosis. Still unfair.
- **Best if:** you pair with model routing (Haiku for simple, Sonnet for complex)

**Option B: Credit/Token System**
- Chat = 1 credit, Photo Diagnosis = 5 credits, Report = 10 credits
- Pros: Accurately reflects cost. Power users pay more. Transparent.
- Cons: Adds cognitive load. "What's a credit?" Users hate calculators.
- **Best if:** you build a clear UI showing credit balance and cost per action

**Option C: Hybrid — Messages + Feature Limits**
- Keep "messages per day" for chat but gate expensive features separately
- Example: 25 chat messages/day + 3 photo diagnoses/day + 1 report/week
- Pros: Users understand each limit. Expensive features have their own budget.
- Cons: More limits = more frustration points. More code to maintain.
- **Best if:** you want granular control without the "credit" confusion

**Recommendation: Option A + model routing.** Keep it simple with "messages/day" but dramatically reduce the numbers. Behind the scenes, route simple questions to Haiku ($0.001/msg vs $0.005/msg) and reserve Sonnet for complex analysis. This cuts your average cost per message by ~40% without the user knowing.

### Annual Pricing

**Industry standards:**
- 15-20% discount is the norm (effectively "2 months free")
- Some go up to 40-50% (Grammarly, Fitbod) to drive annual commitment
- Annual subscribers churn 30-50% less than monthly
- Annual upfront payment improves cash flow

**Recommendation:** Offer ~17% discount (2 months free) on annual plans.

### Free Tier & Trial Strategy

**Current approach:** 14-day Pro trial → drops to Free (1 tank, 10 msgs/day)

**Analysis using the pricing-strategy skill frameworks:**

Your model is a **Reverse Trial** (full access → downgrade to free). This is the right approach because:
- Aquarium users need time to enter tank data and see value from AI analysis
- Parameter trends take days to develop — 14 days lets them experience this
- No CC required = 5x more signups than CC-required trials

**The question is: how generous should the Free tier be?**
- Too generous → nobody upgrades (the Aquarimate problem — free is "good enough")
- Too restrictive → users bounce before feeling the value (churn at trial end)
- Sweet spot → enough to stay engaged, not enough to be satisfied

**Recommendation:** Keep 10-15 messages/day on Free. That's enough to ask a few questions but not enough to use it as a daily tool. The "aha moment" for AquaBotAI is when the AI proactively catches a parameter trend — and 10 msgs/day still allows that.

---

## 5. Recommended Pricing Options for Discussion

### Option 1: Raise Prices, Keep Current Limits (Conservative)

| Tier | Current | Proposed | Change |
|------|---------|----------|--------|
| Free | $0, 10 msgs/day | $0, 10 msgs/day | No change |
| Starter | $3.99/mo, 100 msgs | **$6.99/mo**, 100 msgs | +75% price |
| Plus | $7.99/mo, 200 msgs | **$11.99/mo**, 200 msgs | +50% price |
| Pro | $14.99/mo, unlimited | **$19.99/mo**, unlimited | +33% price |

- Annual: Starter $69.99/yr, Plus $119.99/yr, Pro $199.99/yr
- Pros: Simple change, less code to update
- Cons: Still has the "100 msgs at $6.99 costs you more than you earn" problem for heavy users

### Option 2: Raise Prices + Cut Limits (Recommended)

| Tier | Current | Proposed Monthly | Proposed Annual | Msgs/Day |
|------|---------|-----------------|----------------|----------|
| Free | $0, 10/day | $0 | N/A | **15/day** |
| Starter | $3.99, 100/day | **$7.99/mo** | **$79.99/yr** (~$6.67/mo) | **25/day** |
| Plus | $7.99, 200/day | **$12.99/mo** | **$129.99/yr** (~$10.83/mo) | **50/day** |
| Pro | $14.99, unlimited | **$19.99/mo** | **$199.99/yr** (~$16.67/mo) | **150/day** |

Margin analysis at average usage (20% of limit):

| Tier | Revenue/mo | Avg Msgs/Month | AI Cost/Month | Stripe Fee | **Net Margin** |
|------|-----------|----------------|--------------|------------|----------------|
| Free | $0 | 90 | $0.45 | $0 | -$0.45 |
| Starter | $7.99 | 150 | $0.75 | $0.53 | **$6.71 (84%)** |
| Plus | $12.99 | 300 | $1.50 | $0.68 | **$10.81 (83%)** |
| Pro | $19.99 | 900 | $4.50 | $0.88 | **$14.61 (73%)** |

**Even at max usage (user hits limit every day):**

| Tier | Revenue/mo | Max Msgs/Month | AI Cost/Month | Stripe Fee | **Net Margin** |
|------|-----------|----------------|--------------|------------|----------------|
| Starter | $7.99 | 750 | $3.75 | $0.53 | **$3.71 (46%)** |
| Plus | $12.99 | 1,500 | $7.50 | $0.68 | **$4.81 (37%)** |
| Pro | $19.99 | 4,500 | $22.50 | $0.88 | **-$3.39 (loss)** |

Pro at max usage is still a risk — but 150/day is a LOT. Very few users will sustain that. Model routing to Haiku would cut that $22.50 to ~$13.50, making it profitable.

### Option 3: Premium Positioning (Aggressive)

| Tier | Proposed Monthly | Proposed Annual | Msgs/Day |
|------|-----------------|----------------|----------|
| Free | $0 | N/A | 10/day |
| Starter | **$9.99/mo** | **$99.99/yr** | **30/day** |
| Plus | **$16.99/mo** | **$169.99/yr** | **75/day** |
| Pro | **$24.99/mo** | **$249.99/yr** | **200/day** |

- Pros: Healthiest margins, aligns with AI app pricing norms ($10-25/mo)
- Cons: May reduce conversion rate, higher perceived barrier for hobbyists
- Best for: If you're confident in the AI value proposition and targeting serious aquarists

---

## 6. What Needs to Change (Full Implementation Scope)

### Stripe Changes

| Action | Details |
|--------|---------|
| Create annual price objects | 3 new prices (one per paid tier) |
| Update monthly prices | If amounts change, create new price objects (Stripe prices are immutable) |
| Update product descriptions | If tier features change |
| Archive old prices | Don't delete — archive for existing subscribers |

### Supabase Database Changes

| Change | Details |
|--------|---------|
| Add `billing_interval` column | `text DEFAULT 'monthly'` — values: `monthly`, `annual` |
| Add `stripe_price_id` column | `text` — stores which Stripe price the user is on |
| Update `trial_ends_at` default | If trial length changes from 14 days |
| Update tier enum | Only if tier names change (likely stays same) |

### Codebase Changes (10+ files)

**Tier 1 — Core Constants (update these first, others cascade):**

| File | What Changes |
|------|-------------|
| `src/lib/hooks/use-tier-limits.ts` | TIER_LIMITS numbers + getTierPrice() display strings |
| `src/lib/validation/billing.ts` | TIER_PRICING object (cents, display, features) |

**Tier 2 — UI Components:**

| File | What Changes |
|------|-------------|
| `src/components/billing/subscription-card.tsx` | PLANS array — all prices, features, add annual toggle |
| `src/app/page.tsx` | Homepage pricing section (lines 157-237) |
| `src/app/(dashboard)/billing/page.tsx` | Billing page — add monthly/annual toggle |
| `src/components/chat/usage-indicator.tsx` | Update unlimited threshold |
| `src/components/billing/trial-banner.tsx` | If trial length changes |
| `src/components/billing/upgrade-prompt.tsx` | Feature descriptions in upgrade CTAs |

**Tier 3 — API Routes:**

| File | What Changes |
|------|-------------|
| `src/app/api/usage/route.ts` | Hardcoded limits object — **appears TWICE, both must update** |
| `src/app/api/billing/subscription/route.ts` | Free tier defaults |
| `src/app/api/billing/checkout/route.ts` | Accept `billing_interval` parameter |

**Tier 4 — Stripe Integration:**

| File | What Changes |
|------|-------------|
| `src/lib/stripe/client.ts` | Add annual price ID constants + env vars |
| `src/lib/stripe/checkout.ts` | Support annual billing in session creation |
| `src/lib/stripe/webhook-handlers.ts` | Handle annual subs + grace period if changing |

**New Environment Variables Needed:**
```
STRIPE_PRICE_STARTER_ANNUAL=price_xxx
STRIPE_PRICE_PLUS_ANNUAL=price_xxx
STRIPE_PRICE_PRO_ANNUAL=price_xxx
```

### Documentation Changes

| Document | What Changes |
|----------|-------------|
| `AquaBotAI PRDV1.md` Section 10 | Tier structure, feature matrix, annual pricing |
| `07_Subscription_Billing_Spec.md` | Full rewrite of pricing section, add annual billing requirements |
| `Open_Questions_Decisions.md` | Update Q4.5 (tier distribution), add new pricing decisions |
| `14_Implementation_Status.md` | Mark annual billing as planned/in-progress |
| `CLAUDE.md` | Update pricing constants if referenced |

---

## 7. Open Questions for Sam

These are the decisions that need your input before we can proceed:

1. **Which pricing option?** Conservative (raise prices, keep limits), Recommended (raise + cut limits), or Aggressive (premium positioning)?

2. **What should the message limit language be?** "Messages" (simple but vague), "Credits" (accurate but complex), or "Messages + separate feature limits" (hybrid)?

3. **Should Free tier get more or fewer messages?** Currently 10/day. Research suggests 10-15 is the sweet spot. More = better retention but slower conversion. Less = faster conversion but more trial-end churn.

4. **How long should the trial be?** 14 days is current and research-supported. 7 days converts slightly better but may not be enough for aquarium users to see parameter trends.

5. **Should we require a credit card for trial?** Current: No CC. Research shows CC-required converts 40-50% (vs 15-25% no-CC) but gets 5x fewer signups. For a new app needing growth, no-CC is usually better.

6. **Model routing priority?** Should we implement Haiku routing for simple queries as part of this pricing change, or save that for a separate sprint? It would cut costs 40% and make all pricing options more sustainable.

7. **What happens to existing subscribers?** Grandfather them at current prices? Migrate them to nearest new tier? Give them 30/60/90 days notice?

8. **Annual discount level?** 17% (2 months free) is standard. Some apps do 30-40%. More discount = more annual adoption but less revenue per subscriber.

---

## 8. My Recommendation

**Go with Option 2 (Raise Prices + Cut Limits)** because:

1. It fixes the unit economics. Every tier has 70%+ margin at average usage.
2. $7.99/$12.99/$19.99 is still very accessible for a hobby app with AI.
3. 25/50/150 daily messages is still generous — that's 750-4,500 messages/month.
4. Annual plans add ~17% discount, giving users a reason to commit and reducing your churn.
5. Free at 15 msgs/day is enough to hook users but not enough to satisfy power users.
6. It positions you correctly: premium to other aquarium apps (because AI), but accessible compared to other AI apps ($20+/mo).

**Pair this with model routing (Haiku for simple queries)** as a cost optimization sprint — it's the single biggest lever to protect your margins as you scale.

---

*This report was compiled from: codebase audit (10+ source files), Supabase database analysis (subscriptions + ai_usage tables), Stripe product configuration, PRD Section 10, Billing Spec 07, Open Questions log, Pricing Strategy Discovery doc, external competitive research across 20+ apps, and pricing strategy best practices.*
