# PM Handoff: Pricing Strategy Implementation
**Date:** February 9, 2026  
**From:** R&D Discovery Agent  
**To:** PM Orchestrator  
**Priority:** P0 — Pre-Launch  
**Spec:** `Docs/AquaBotAI_Specs/18_Pricing_Strategy_Spec.md`  
**Research:** `Docs/Tools/agents/memory/research/pricing-strategy-discovery.md`

---

## What Changed and Why

Multi-agent analysis found the current Starter tier ($3.99/mo with 100 AI msgs/day) is unsustainable — AI costs can exceed the price at max usage. Sam confirmed a revised pricing strategy:

| | Old | New |
|--|-----|-----|
| **Free** | $0, 1 tank, 10 AI msgs/day (trial only) | $0, 1 tank, **0 AI msgs** post-trial, basic tools |
| **Starter** | $3.99/mo, 1 tank, 100 AI msgs/day | $3.99-4.99/mo, 1-2 tanks, **5-10 AI msgs/day** |
| **Plus** | $7.99/mo, 5 tanks, 200 AI msgs/day | **$9.99/mo**, 5 tanks, **75-100 AI msgs/day**, photo dx, proactive alerts |
| **Pro** | $14.99/mo, unlimited, unlimited AI | **$19.99/mo**, unlimited tanks, **500 AI msgs/day cap** |
| **Trial** | 14-day, no CC | **7-day**, no CC |

**GTM Strategy:** "Free tools + AI premium." Attract users with free non-AI tools (what competitors charge for), hook them on Starter with a taste of AI, then convert to Plus/Pro for full AI-powered features.

---

## Sprint Sequencing

### Critical Dependency: Free Tools Must Ship First

The new free tier depends on having useful non-AI tools to offer. Without them, the free tier is empty and unattractive. **Spec 16 (AI Chat Embedded Widgets) must ship before pricing changes go live.**

Specifically needed:
- Water change calculator (static formula version)
- Stocking density calculator (basic version)
- Parameter troubleshooting guide (static version)
- These can be simple, non-AI tools rendered in the app (not necessarily in chat)

### Recommended Sprint Order

```
Sprint N:   Free Tools (Spec 16 — static calculator versions)
Sprint N+1: Pricing Backend (Spec 18 — schema, Stripe, tier limits, AI gating)
Sprint N+2: Pricing Frontend (Spec 18 — billing UI, upgrade prompts, usage indicator)
Sprint N+3: Testing + Polish (full upgrade/downgrade flow, admin/beta verification)
```

---

## Sprint N: Free Tools (Pre-Requisite)

**Goal:** Build static (non-AI) versions of key tools so the Free tier has value.

**Scope:**
- Static water change calculator (tank volume x percentage = gallons to change)
- Static stocking density calculator (basic fish-inches-per-gallon formula)
- Basic parameter reference guide (safe/warning/danger zones table)
- These tools accessible to ALL tiers including Free

**Reference:** Spec 16 (AI Chat Embedded Widgets) for tool designs. The AI-enhanced versions come later; this sprint builds the static base.

**Estimated Effort:** 1-2 sprints (mostly frontend UI, no AI integration)

**Deliverables:**
- [ ] Water change calculator component
- [ ] Stocking calculator component
- [ ] Parameter reference component
- [ ] Accessible from dashboard and/or tools section (not just chat)

---

## Sprint N+1: Pricing Backend

**Goal:** Schema migration, Stripe reconfiguration, tier limit updates, backend AI gating.

**Scope:**

### 1. Supabase Migration (Backend Engineer)
```sql
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS billing_interval TEXT DEFAULT 'monthly'
    CHECK (billing_interval IN ('monthly', 'annual')),
  ADD COLUMN IF NOT EXISTS stripe_price_id TEXT,
  ADD COLUMN IF NOT EXISTS tier_override subscription_tier DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS override_reason TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS override_expires_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS grace_period_ends_at TIMESTAMPTZ DEFAULT NULL;
```

Update trial duration default:
- Change `trial_ends_at` default from `INTERVAL '14 days'` to `INTERVAL '7 days'` in the `on_user_created_subscription` trigger

### 2. Stripe Configuration (Manual — Sam or Backend Engineer)
- Create new monthly prices: Starter $4.99, Plus $9.99, Pro $19.99
- Create annual prices (not exposed yet): Starter $49.90, Plus $99.90, Pro $199.90
- Create beta tester coupon: 100% off, 3-month duration
- Archive old prices ($3.99/$7.99/$14.99) — don't delete
- Update environment variables with new price IDs

### 3. Backend Code Updates (Backend Engineer)

**Files to modify:**
| File | Change |
|------|--------|
| `src/lib/hooks/use-tier-limits.ts` | Update `TIER_LIMITS` constant (new msg limits: 0/10/100/500). Extract `resolveUserTier()` helper with admin/override/trial priority chain. |
| `src/lib/validation/billing.ts` | Update `TIER_PRICING` constants ($4.99/$9.99/$19.99) |
| `src/lib/stripe/client.ts` | Update price ID mapping with new env vars. Add annual price ID mapping (unused but mapped). |
| `src/lib/stripe/webhook-handlers.ts` | Store `billing_interval` and `stripe_price_id` in subscriptions table |
| `src/app/api/billing/checkout/route.ts` | Accept `billing_interval` parameter (default 'monthly', future-proof for annual) |
| `src/app/api/billing/subscription/route.ts` | Return `billing_interval` in response |
| `supabase/functions/analyze-parameter-trends/index.ts` | Add tier check at start — skip AI analysis for Free/Starter users |

### 4. Admin/Beta Override (Backend Engineer)

Modify tier resolution in `use-tier-limits.ts`:
```
Priority: Admin > Override > Trial > Subscription > Free
```
- Check `admin_profiles` table for active admin
- Check `tier_override` + `override_expires_at` on subscriptions
- Existing trial and subscription logic
- Default to 'free'

**Estimated Effort:** 1 sprint

**Deliverables:**
- [ ] Schema migration applied (6 new columns + trial duration change)
- [ ] New Stripe prices created + env vars set
- [ ] `TIER_LIMITS` updated to new values
- [ ] `TIER_PRICING` updated to new prices
- [ ] Price ID mapping updated
- [ ] Webhook handlers store billing_interval + stripe_price_id
- [ ] Trend analysis Edge Function gated to Plus+ tiers
- [ ] Admin/beta tier override working
- [ ] `check_and_increment_ai_usage` RPC updated with new limits

---

## Sprint N+2: Pricing Frontend

**Goal:** Update all billing UI to reflect new pricing, tier names, and limits.

**Scope:**

**Files to modify (Frontend Engineer):**
| File | Change |
|------|--------|
| `src/app/(dashboard)/billing/page.tsx` | New prices, tier descriptions, feature comparison |
| `src/components/billing/subscription-card.tsx` | Updated plan cards ($4.99/$9.99/$19.99), feature bullets |
| `src/components/billing/trial-banner.tsx` | 7-day messaging (mostly auto from DB, verify copy) |
| `src/components/billing/upgrade-prompt.tsx` | New tier benefit descriptions, value-based messaging |
| `src/components/chat/usage-indicator.tsx` | New daily limits (0/10/100/500), show "Upgrade for AI" for free users |

**UX Principles (from Spec 18):**
- Emphasize value ("Prevent fish deaths", "Save 3+ hours/week") over feature lists
- Simple 3-visible-tier layout (Starter/Plus/Pro) with expandable "Compare all features"
- Free tier shown as "Get Started Free" CTA, not as a selectable plan
- Recommended tier (Plus) visually highlighted
- Free users who try to use AI chat see: "Upgrade to Starter for AI chat access"

**Estimated Effort:** 1 sprint

**Deliverables:**
- [ ] Billing page shows new prices and tier structure
- [ ] Subscription cards updated with correct features per tier
- [ ] Trial banner shows 7-day countdown
- [ ] Upgrade prompts use value-based messaging
- [ ] Usage indicator shows correct limits per tier
- [ ] Free users see AI upgrade prompts in chat area

---

## Sprint N+3: Testing and Polish

**Goal:** End-to-end testing of full billing flow with new pricing.

**Scope:**
- Full upgrade/downgrade test matrix (Free->Starter->Plus->Pro and back)
- Admin override verification (create admin, confirm Pro access)
- Beta coupon verification (apply coupon, confirm 100% off)
- Stripe webhook verification (all events handled correctly)
- Trial expiration verification (7-day countdown, reminders, downgrade)
- Trend analysis gating verification (Free/Starter tanks skipped)
- Edge cases: expired override, past_due with grace period, canceled subscription

**Estimated Effort:** 0.5-1 sprint (can combine with other sprint work)

---

## Dependency Map

```
Spec 16 (Free Tools)
    |
    v
Spec 18 - Sprint N+1 (Backend)
    |
    v
Spec 18 - Sprint N+2 (Frontend)
    |
    v
Spec 18 - Sprint N+3 (Testing)
    |
    v
Annual Billing (Post-Launch, 90+ days after pricing goes live)
```

**Hard Dependencies:**
- Free tools (Spec 16) MUST ship before pricing changes — Free tier is empty without them
- Schema migration MUST run before backend code changes
- Stripe prices MUST be created before frontend shows new prices
- Backend tier limits MUST be updated before frontend displays them

**Soft Dependencies:**
- Admin portal (Spec 13) has `admin_profiles` table — needed for admin override. If table doesn't exist yet, create it in the schema migration.
- Annual billing deferred — schema prepared now, UI implemented post-launch

---

## Total Effort Estimate

| Sprint | Focus | Effort | Dependencies |
|--------|-------|--------|--------------|
| Sprint N | Free Tools (Spec 16) | 1-2 sprints | None — can start immediately |
| Sprint N+1 | Pricing Backend | 1 sprint | Free tools done |
| Sprint N+2 | Pricing Frontend | 1 sprint | Backend done |
| Sprint N+3 | Testing + Polish | 0.5-1 sprint | Frontend done |
| **Total** | | **3.5-5 sprints** | Sequential |

**Post-launch (deferred):**
| Item | Effort | Trigger |
|------|--------|---------|
| Annual billing UI | 1 sprint | 90 days of monthly churn data |
| Model routing (Haiku) | 1 sprint | Cost optimization needed |
| Cost monitoring dashboard | 0.5 sprint | Admin portal built |

---

## Roadmap Integration

These pricing sprints should be inserted into the roadmap **before MVP public launch**. The recommended position:

```
Current state: Phase 2 complete, Production deployment in progress
    |
    v
Sprint 14+: Free Tools (Spec 16 — static calculators)
    |
    v
Sprint 15+: Pricing Backend (Spec 18 — schema, Stripe, limits)
    |
    v
Sprint 16+: Pricing Frontend (Spec 18 — billing UI, prompts)
    |
    v
MVP Public Launch (with new pricing)
```

**Note:** Sprint numbers are approximate. The PM should determine exact numbering based on current sprint cadence and any other in-progress work.

---

## Open Items for PM

1. **Exact Starter price**: $3.99 or $4.99? Depends on final tool availability and competitive analysis.
2. **Exact message limits**: Starter 5 or 10/day? Plus 75 or 100/day? These should be tuned based on cost model sensitivity.
3. **Free tools scope**: Which static tools are minimum viable for the free tier? Water change calculator is most impactful.
4. **Admin profiles table**: Verify it exists in current migration. If not, include in pricing schema migration.
5. **Stripe product archival**: Confirm with Sam whether to archive old price objects or keep them alongside new ones.

---

**Document Status:** Ready for PM Orchestrator  
**Action Required:** PM to schedule pricing sprints in roadmap, assign to Frontend/Backend engineers  
**Spec Reference:** `Docs/AquaBotAI_Specs/18_Pricing_Strategy_Spec.md`
