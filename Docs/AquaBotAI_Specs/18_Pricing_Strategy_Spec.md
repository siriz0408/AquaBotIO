# Pricing Strategy & Tier Restructuring — Feature Specification
**Aquatic AI | R-018 | P0 — Must-Have (Pre-Launch)**

## Problem Statement

AquaBotAI's current pricing model ($3.99/$7.99/$14.99) was designed before real AI cost data was available. Multi-agent analysis revealed the Starter tier ($3.99/mo with 100 AI messages/day) is unsustainable — AI costs can reach $15/mo at max usage, resulting in negative margin after Stripe fees and infrastructure. Additionally, the current tier structure doesn't differentiate between non-AI tool access and AI-enhanced features, missing an opportunity to attract price-sensitive aquarium hobbyists with free/cheap tools before upselling to AI.

The pricing restructuring addresses three problems:
1. **Cost sustainability**: Align message limits and prices with actual AI costs per message type
2. **GTM strategy**: Create a "free tools + AI premium" funnel that attracts users with what competitors charge for, then upsells AI
3. **Operational readiness**: Fix schema gaps, add admin/beta access mechanisms, and shorten trial to 7 days

## Goals

- G1: Ensure every paid tier maintains >50% gross margin at average usage
- G2: Create a free tier compelling enough to attract users without AI costs (tools-first approach)
- G3: Establish clear upgrade path: Free tools -> Starter (taste of AI) -> Plus (AI-powered) -> Pro (everything)
- G4: Reduce trial from 14 to 7 days to shorten time-to-conversion decision
- G5: Enable beta tester and admin access without billing workarounds
- G6: Fix schema gaps (`billing_interval`, `stripe_price_id`) blocking future annual billing
- G7: Gate backend AI costs (trend analysis) to paid tiers only

## Non-Goals

- NG1: Annual billing implementation — deferred to post-launch (need churn data). Schema prepared now.
- NG2: Model routing (Haiku for simple queries) — deferred to post-launch optimization
- NG3: Credit-based usage system — keeping daily message limits for simplicity
- NG4: Dynamic/usage-based pricing — fixed tiers only in v1
- NG5: Enterprise tier — single-user subscriptions only
- NG6: Building free tools — this spec covers pricing only; tools are covered in Spec 16

## User Stories

- US-P1: As a new hobbyist, I want to use basic aquarium tools (water change calculator, species DB, parameter logging) for free, so I can manage my tank without paying.
- US-P2: As a free user, I want to see what AI can do (smart recommendations, trend analysis teasers) without using it directly, so I understand the upgrade value.
- US-P3: As a Starter subscriber ($3.99-4.99/mo), I want 5-10 AI messages per day, so I can get a taste of AI advice without committing to a higher tier.
- US-P4: As a Plus subscriber ($9.99/mo), I want AI-enhanced tools, photo diagnosis, and proactive alerts, so I get full AI-powered tank management.
- US-P5: As a Pro subscriber ($19.99/mo), I want unlimited features including email reports and equipment recommendations, so I can manage multiple tanks with zero friction.
- US-P6: As a new user, I want a 7-day free trial with full Pro access, so I can experience everything before choosing a plan.
- US-P7: As a beta tester, I want a coupon code that gives me free access for 3 months, so I can test and provide feedback.
- US-P8: As an admin, I want full Pro access always without a subscription, so I can test and manage the platform.

## Requirements

### Must-Have (P0)

#### R-018.1: Revised Tier Structure

**Canonical Tier/Feature Matrix (Replaces Spec 07 Matrix):**

| Feature | Free ($0) | Starter ($3.99-4.99) | Plus ($9.99) | Pro ($19.99) |
|---------|-----------|---------------------|--------------|--------------|
| **Tanks** | 1 | 1-2 | 5 | Unlimited |
| **AI Messages/day** | 0 | 5-10 | 75-100 | 500 (capped) |
| **Parameter Logging** | Yes | Yes | Yes | Yes |
| **Species Database** | Yes (browse) | Yes (browse) | Yes (browse) | Yes (browse) |
| **Livestock Management** | Yes (basic) | Yes | Yes | Yes |
| **Maintenance Tasks** | 3 total | 10/tank | 10/tank | Unlimited |
| **Basic Calculators** | Static versions | Static versions | AI-enhanced | AI-enhanced |
| **AI Chat** | No | Yes (limited) | Yes (full) | Yes (full) |
| **AI Action Execution** | No | Limited (log params) | Full | Full |
| **Proactive Alerts** | None | None | Full (AI trend detection) | Full + push notifications |
| **Photo Diagnosis** | No | No | 10/day | 30/day |
| **Equipment Tracking** | No | No | Manual tracking | Full + AI recs (10/day) |
| **Email Reports** | No | No | No | Weekly AI digest |
| **Multi-Tank Comparison** | No | No | No | Yes |
| **AI Equipment Web Search** | No | No | No | 10/day |

**Notes:**
- "Static versions" of calculators = formula-based (no AI costs). E.g., water change calculator uses tank volume x % = gallons.
- "AI-enhanced" calculators = AI recommends values based on user's actual tank data, parameters, and livestock.
- Free tier gets 0 AI messages post-trial. The value prop is: useful tools (what competitors charge for) plus visibility into what AI CAN do via teasers/prompts.
- Exact Starter price ($3.99 vs $4.99) and message limits (5 vs 10) TBD based on final tool availability.

**Acceptance Criteria:**
- Given any tier, the feature matrix above is enforced across all app features
- Given a free user post-trial, AI chat is completely disabled with clear upgrade prompts
- Given a Starter user, AI-enhanced calculators show "Upgrade to Plus for AI-powered recommendations"
- Given a Pro user at 500 messages/day, they see a usage warning and are blocked at 500

#### R-018.2: 7-Day Trial (Replaces 14-Day in Spec 07)

Reduce trial from 14 days to 7 days. Same no-CC-required flow.

**Acceptance Criteria:**
- Given a new user signs up, they receive 7 days of full Pro access (previously 14)
- Given a user is in trial, the app displays "X days left in your trial" countdown
- Given the trial expires, user is downgraded to Free tier (0 AI messages, basic tools only)
- Trial expiration reminders sent at 3-day and 1-day marks (same as current)

**Implementation:**
- Update `subscriptions` table trigger: Change `DEFAULT (NOW() + INTERVAL '14 days')` to `INTERVAL '7 days'`
- Update `trial-banner.tsx` countdown logic (no code change needed — already reads from `trial_ends_at`)
- Update email reminder timing if applicable

#### R-018.3: Beta Tester Access via Stripe Coupons

Enable free access for beta testers using Stripe promotion codes.

**Acceptance Criteria:**
- Given a beta tester has a valid coupon code, they can subscribe to any tier at 100% off for 3 months
- Given the coupon expires after 3 months, the user is automatically charged the regular price
- Given the app already has `allow_promotion_codes: true` in checkout, no code change is needed for basic coupon support
- Coupons are created and managed in Stripe Dashboard (or via Stripe API)
- Each beta tester gets a unique code for tracking (e.g., `BETA-SAM-001`)

**Implementation:**
- Create Stripe coupon: 100% off, 3-month duration, redeemable per-customer
- Generate unique promo codes per beta tester
- No codebase changes needed — `checkout.ts` already supports promotion codes

#### R-018.4: Admin Tier Override

Enable admin users to bypass tier limits permanently.

**Schema Changes (subscriptions table):**
```sql
ALTER TABLE public.subscriptions ADD COLUMN tier_override subscription_tier DEFAULT NULL;
ALTER TABLE public.subscriptions ADD COLUMN override_reason TEXT DEFAULT NULL;
ALTER TABLE public.subscriptions ADD COLUMN override_expires_at TIMESTAMPTZ DEFAULT NULL;
```

**Acceptance Criteria:**
- Given a user has `tier_override = 'pro'` in their subscription row, they get Pro access regardless of actual subscription
- Given an admin profile exists in `admin_profiles` with `is_active = true`, the tier resolution returns 'pro'
- Given a beta tester has `tier_override = 'pro'` with `override_expires_at = '2026-06-01'`, they get Pro until that date
- Given `override_expires_at` has passed, the override is ignored and normal tier applies

**Tier Resolution Priority Chain:**
```
1. Admin profile (admin_profiles.is_active = true) → always 'pro'
2. Tier override (subscriptions.tier_override, not expired) → override tier
3. Active trial (subscriptions.status = 'trialing', trial_ends_at > now) → 'pro'
4. Active subscription (subscriptions.status = 'active') → subscriptions.tier
5. Default → 'free'
```

**Implementation (use-tier-limits.ts):**
Extract shared `resolveUserTier()` helper used by both `canCreateTank` and `canSendAIMessage`:
```typescript
async function resolveUserTier(supabase, userId): Promise<SubscriptionTier> {
  // 1. Check admin
  const { data: adminProfile } = await supabase
    .from("admin_profiles")
    .select("role, is_active")
    .eq("user_id", userId)
    .eq("is_active", true)
    .single();
  if (adminProfile) return "pro";

  // 2. Check subscription + override
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("tier, status, trial_ends_at, tier_override, override_expires_at")
    .eq("user_id", userId)
    .single();

  if (subscription?.tier_override) {
    const notExpired = !subscription.override_expires_at ||
      new Date(subscription.override_expires_at) > new Date();
    if (notExpired) return subscription.tier_override;
  }

  // 3. Normal resolution
  if (subscription) {
    const isTrialing = subscription.status === "trialing" &&
      subscription.trial_ends_at &&
      new Date(subscription.trial_ends_at) > new Date();
    if (isTrialing) return "pro";
    if (subscription.status === "active") return subscription.tier;
  }

  return "free";
}
```

#### R-018.5: Schema Fixes (Pre-Requisite)

Fix columns that are specified in Spec 07 but missing from actual migrations.

**Migration:**
```sql
-- Add missing columns to subscriptions table
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS billing_interval TEXT DEFAULT 'monthly'
    CHECK (billing_interval IN ('monthly', 'annual')),
  ADD COLUMN IF NOT EXISTS stripe_price_id TEXT,
  ADD COLUMN IF NOT EXISTS tier_override subscription_tier DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS override_reason TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS override_expires_at TIMESTAMPTZ DEFAULT NULL;

-- Add missing column to support grace period tracking
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS grace_period_ends_at TIMESTAMPTZ DEFAULT NULL;
```

**Acceptance Criteria:**
- Given the migration runs, all new columns exist with correct types and defaults
- Given existing subscription rows, they default to `billing_interval = 'monthly'`, `tier_override = NULL`
- Given no data loss on existing test data (all 22 rows preserved)

#### R-018.6: Backend AI Cost Gating

Gate the `analyze-parameter-trends` Edge Function to paid tiers only.

**Acceptance Criteria:**
- Given a Free tier user's tank, the trend analysis function does NOT run (no AI cost)
- Given a Starter tier user's tank, the trend analysis function does NOT run
- Given a Plus or Pro tier user's tank, the trend analysis function runs as normal
- Given a user downgrades from Plus to Starter, trend analysis stops for their tanks on next scheduled run

**Implementation:**
- Add tier check at the start of the Edge Function (query `subscriptions` table for tank's `user_id`)
- Free/Starter users still get basic static threshold alerts (parameter > danger zone) without AI

#### R-018.7: Updated Stripe Products

Create new Stripe price objects for the revised tiers.

**New Stripe Configuration:**
| Product | Monthly Price ID | Amount | Notes |
|---------|-----------------|--------|-------|
| Starter | `STRIPE_PRICE_STARTER_MONTHLY` | $3.99 or $4.99 | Replaces current $3.99 |
| Plus | `STRIPE_PRICE_PLUS_MONTHLY` | $9.99 | Replaces current $7.99 |
| Pro | `STRIPE_PRICE_PRO_MONTHLY` | $19.99 | Replaces current $14.99 |

**Annual Price IDs (Create Now, Enable Later):**
| Product | Annual Price ID | Amount | Discount |
|---------|----------------|--------|----------|
| Starter | `STRIPE_PRICE_STARTER_ANNUAL` | $39.90 or $49.90 | 20% off monthly |
| Plus | `STRIPE_PRICE_PLUS_ANNUAL` | $99.90 | 20% off monthly |
| Pro | `STRIPE_PRICE_PRO_ANNUAL` | $199.90 | 20% off monthly |

**Acceptance Criteria:**
- Given the Stripe Dashboard, all 6 price objects exist (3 monthly + 3 annual)
- Given annual prices are created, they are NOT exposed in the UI until post-launch
- Given existing test subscriptions, they are on old price IDs (acceptable — all test data)

**Environment Variables to Add:**
```
STRIPE_PRICE_STARTER_MONTHLY=price_xxx
STRIPE_PRICE_PLUS_MONTHLY=price_xxx
STRIPE_PRICE_PRO_MONTHLY=price_xxx
STRIPE_PRICE_STARTER_ANNUAL=price_xxx  # Created but not used yet
STRIPE_PRICE_PLUS_ANNUAL=price_xxx     # Created but not used yet
STRIPE_PRICE_PRO_ANNUAL=price_xxx      # Created but not used yet
```

### Nice-to-Have (P1)

#### R-018.8: Annual Billing UI
- Monthly/annual toggle on pricing page
- Annual price display with "Save 20%" badge
- Checkout supports `billing_interval` parameter
- Webhook handlers store `billing_interval` in subscriptions table
- **Deferred to post-launch** — implemented only after 90 days of monthly churn data

#### R-018.9: Cost Monitoring Dashboard (Internal)
- Admin view showing AI costs per user per tier
- Pulls from `ai_usage` table
- Shows: total messages, total tokens, estimated cost, margin per tier
- Alert when any tier's average cost approaches price point

#### R-018.10: Pricing Page Redesign
- Emphasize value ("Prevent fish deaths", "Save 3+ hours/week") over feature lists
- Simple 3-visible-tier layout (Starter/Plus/Pro) with expandable "Compare all features"
- Free tier shown as "Get Started Free" with clear path to upgrade
- Recommended tier (Plus) visually highlighted

### Future Considerations (P2)

- R-018.11: Model routing (Haiku for simple queries, 40% cost reduction)
- R-018.12: Prompt caching for repeated tank context (90% savings on cached tokens)
- R-018.13: Usage-based overage (buy additional message packs)
- R-018.14: Enterprise tier for fish stores/breeders ($50-200/month)
- R-018.15: Regional/localized pricing for international markets

## Data Model Changes

### Modified Table: `subscriptions`

| Column | Type | Change | Default | Purpose |
|--------|------|--------|---------|---------|
| `billing_interval` | `TEXT` | **ADD** | `'monthly'` | Track monthly vs annual billing (CHECK: 'monthly', 'annual') |
| `stripe_price_id` | `TEXT` | **ADD** | `NULL` | Store the specific Stripe price ID for the subscription |
| `tier_override` | `subscription_tier` | **ADD** | `NULL` | Admin/beta override — bypasses normal tier |
| `override_reason` | `TEXT` | **ADD** | `NULL` | Why override exists ('admin', 'beta_tester', 'vip', etc.) |
| `override_expires_at` | `TIMESTAMPTZ` | **ADD** | `NULL` | When override expires (NULL = permanent) |
| `grace_period_ends_at` | `TIMESTAMPTZ` | **ADD** | `NULL` | End of grace period after payment failure |
| `trial_ends_at` | `TIMESTAMPTZ` | **MODIFY DEFAULT** | `NOW() + INTERVAL '7 days'` | Changed from 14 days to 7 days |

### Updated Tier Limits (TIER_LIMITS constant)

```typescript
export const TIER_LIMITS = {
  free: {
    tanks: 1,
    ai_messages_daily: 0,        // Changed from 10
    maintenance_tasks_total: 3,   // NEW
    photo_diagnosis_daily: 0,
    equipment_recs_daily: 0,
  },
  starter: {
    tanks: 2,                     // Changed from 1
    ai_messages_daily: 10,        // Changed from 100
    maintenance_tasks_per_tank: 10,
    photo_diagnosis_daily: 0,
    equipment_recs_daily: 0,
  },
  plus: {
    tanks: 5,
    ai_messages_daily: 100,       // Changed from 200
    maintenance_tasks_per_tank: 10,
    photo_diagnosis_daily: 10,
    equipment_recs_daily: 0,
  },
  pro: {
    tanks: 999999,
    ai_messages_daily: 500,       // Changed from 999999
    maintenance_tasks_per_tank: 999999,
    photo_diagnosis_daily: 30,
    equipment_recs_daily: 10,
  },
} as const;
```

## AI Integration Points

- AI Chat: Enforced via `check_and_increment_ai_usage` RPC (server-side) and `canSendAIMessage` (client-side)
- Trend Analysis: Edge Function checks user tier before running AI interpretation
- Photo Diagnosis: Tier-gated at API route level (Plus+ only)
- Equipment Recs: Tier-gated at API route level (Pro only)
- Action Execution: Starter limited to `log_params` only; Plus/Pro get full actions

## Implementation Touchpoints

### Stripe (Dashboard/API — No Code)
- [ ] Create new monthly price objects ($4.99/$9.99/$19.99)
- [ ] Create annual price objects (deferred, but create them now)
- [ ] Create beta tester coupon (100% off, 3 months)
- [ ] Archive old price objects ($3.99/$7.99/$14.99)

### Supabase Migration
- [ ] Add `billing_interval`, `stripe_price_id`, `tier_override`, `override_reason`, `override_expires_at`, `grace_period_ends_at` columns
- [ ] Update `trial_ends_at` default to `INTERVAL '7 days'`
- [ ] Update `check_and_increment_ai_usage` RPC with new limits

### Backend Code Changes
- [ ] `src/lib/hooks/use-tier-limits.ts` — Update `TIER_LIMITS` constant, extract `resolveUserTier()` helper
- [ ] `src/lib/validation/billing.ts` — Update `TIER_PRICING` constants
- [ ] `src/lib/stripe/client.ts` — Update price ID mapping for new prices
- [ ] `src/lib/stripe/checkout.ts` — No changes needed (trial handled by DB, not Stripe)
- [ ] `src/lib/stripe/webhook-handlers.ts` — Store `billing_interval` and `stripe_price_id`
- [ ] `src/app/api/billing/checkout/route.ts` — Accept billing interval parameter (for future annual)
- [ ] `src/app/api/billing/subscription/route.ts` — Return billing interval
- [ ] `supabase/functions/analyze-parameter-trends/index.ts` — Add tier check, gate to Plus+

### Frontend Code Changes
- [ ] `src/app/(dashboard)/billing/page.tsx` — Update pricing display
- [ ] `src/components/billing/subscription-card.tsx` — New prices, tier names
- [ ] `src/components/billing/trial-banner.tsx` — 7-day messaging (auto from DB)
- [ ] `src/components/billing/upgrade-prompt.tsx` — New tier benefit descriptions
- [ ] `src/components/chat/usage-indicator.tsx` — New daily limits

### Documentation Updates
- [ ] `07_Subscription_Billing_Spec.md` — Cross-reference to Spec 18
- [ ] `14_Implementation_Status.md` — Add Spec 18 row
- [ ] `CLAUDE.md` — Add Spec 18 to index
- [ ] `Open_Questions_Decisions.md` — Mark pricing decisions
- [ ] `pm_orchestrator.md` — Update spec count to 21

### Environment Variables
- [ ] `STRIPE_PRICE_STARTER_MONTHLY` (new)
- [ ] `STRIPE_PRICE_PLUS_MONTHLY` (new)
- [ ] `STRIPE_PRICE_PRO_MONTHLY` (new)
- [ ] `STRIPE_PRICE_STARTER_ANNUAL` (created, not used)
- [ ] `STRIPE_PRICE_PLUS_ANNUAL` (created, not used)
- [ ] `STRIPE_PRICE_PRO_ANNUAL` (created, not used)

## Success Metrics

### Leading Indicators
- Trial-to-paid conversion: >15% within 30 days of trial end
- Average revenue per paid user (ARPU): Target $12.00/month (based on 40/40/20 Starter/Plus/Pro distribution)
- AI cost per paid user: <$5/month average
- Free-to-Starter conversion: >8% within 60 days

### Lagging Indicators
- Monthly Recurring Revenue (MRR): $5,000+ within 6 months
- Gross margin per tier: >50% at average usage
- Monthly churn rate: <8% for paid subscribers
- Customer lifetime value: $150+ (12+ months)

## Dependencies

- **Spec 16 (AI Chat Embedded Widgets)**: Free tools (static calculators) must be built BEFORE pricing changes go live. Free tier value prop depends on having useful non-AI tools.
- **Spec 07 (Subscription & Billing)**: This spec supersedes the tier structure and pricing in Spec 07. Spec 07 remains the source of truth for Stripe integration patterns, webhook handling, and grace period logic.
- **Spec 13 (Admin Portal)**: `admin_profiles` table must exist for admin tier override to work.
- **Spec 17 (AI Proactive Intelligence)**: Trend analysis gating (R-018.6) modifies the Edge Function from Spec 17.

## Timeline Considerations

### Sprint Sequencing (Recommended)

**Pre-Requisite Sprint: Free Tools (Spec 16)**
- Build static calculators (water change, stocking density)
- Build basic tool UI accessible to all tiers
- Estimated: 1-2 sprints

**Pricing Sprint 1: Schema + Stripe + Backend (~1 sprint)**
- Run schema migration (new columns + trial duration)
- Create new Stripe prices + archive old ones
- Update `TIER_LIMITS`, `TIER_PRICING`, price ID mappings
- Update webhook handlers
- Gate trend analysis Edge Function

**Pricing Sprint 2: Frontend + Testing (~1 sprint)**
- Update billing page, subscription cards, upgrade prompts
- Update usage indicator, trial banner
- Test full upgrade/downgrade flows
- Admin override + beta coupon verification

**Post-Launch: Annual Billing (~1 sprint, deferred)**
- Enable annual prices in UI
- Monthly/annual toggle on pricing page
- Checkout supports billing interval
- Validate with 90 days of churn data

## Acceptance Test Plan

### Tier Enforcement Tests
- [ ] Free user post-trial cannot access AI chat; sees upgrade prompt
- [ ] Free user CAN log parameters, browse species, use basic tools
- [ ] Starter user can send 5-10 AI messages/day; blocked at limit with upgrade prompt
- [ ] Starter user CANNOT use photo diagnosis; sees "Available on Plus"
- [ ] Plus user gets AI-enhanced tools, photo diagnosis (10/day), proactive alerts
- [ ] Pro user has 500 msg/day cap; warned at 450, blocked at 500
- [ ] Pro user has access to all features including email reports and equipment recs

### Trial Tests
- [ ] New user gets 7-day trial with full Pro access (not 14 days)
- [ ] Trial countdown displays correctly (7, 6, 5... days)
- [ ] Trial expiration emails sent at 3-day and 1-day marks
- [ ] Post-trial downgrade to Free tier works correctly

### Admin/Beta Tests
- [ ] Admin with `admin_profiles.is_active = true` gets Pro access with no subscription
- [ ] Beta tester with valid coupon can subscribe at 100% off
- [ ] `tier_override = 'pro'` grants Pro access regardless of subscription
- [ ] Expired `override_expires_at` correctly falls back to normal tier

### Pricing Tests
- [ ] Checkout shows correct new prices ($4.99/$9.99/$19.99)
- [ ] Upgrade from Starter to Plus works and changes tier immediately
- [ ] Downgrade from Pro to Plus takes effect at next billing cycle
- [ ] Stripe webhooks correctly update tier in database

### Backend AI Cost Tests
- [ ] Trend analysis does NOT run for Free/Starter tank
- [ ] Trend analysis DOES run for Plus/Pro tank
- [ ] Downgraded user's tank stops getting trend analysis on next run

---

**Document Status:** Initial Draft  
**Last Updated:** 2026-02-09  
**Author:** R&D Discovery Agent + Product Team  
**Research:** `Docs/Tools/agents/memory/research/pricing-strategy-discovery.md`  
**Supersedes:** Tier structure and pricing in Spec 07 (Spec 07 remains SoT for Stripe patterns)  
**Next Review:** Before pricing implementation sprint
