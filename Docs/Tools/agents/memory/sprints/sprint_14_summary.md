# Sprint 14 Summary — Pricing Strategy Backend Foundation

> Date: 2026-02-09 | Spec: 18 | Status: COMPLETE

## Goals
Implement Spec 18 (Pricing Strategy) backend foundation to prepare for new pricing tiers ($4.99/$9.99/$19.99) and updated feature limits.

## Deliverables

### Schema Migration (`20260209120000_pricing_strategy_schema.sql`)

**New Columns Added to `subscriptions` table:**
| Column | Type | Purpose |
|--------|------|---------|
| `billing_interval` | TEXT DEFAULT 'monthly' | Track monthly vs annual billing |
| `stripe_price_id` | TEXT | Store specific Stripe price ID |
| `tier_override` | subscription_tier | Admin/beta override tier |
| `override_reason` | TEXT | Why override exists |
| `override_expires_at` | TIMESTAMPTZ | When override expires |
| `grace_period_ends_at` | TIMESTAMPTZ | Failed payment grace period |

**Trial Duration:** Default changed from 14 days → 7 days for new subscriptions

**New Table:** `admin_profiles` created for admin tier resolution

**SQL Functions Updated:**
- `check_and_increment_ai_usage()` — New limits + override/admin support
- `get_tier_limits()` — New limits + override/admin support
- `handle_new_user_subscription()` — 7-day trial

### TIER_LIMITS Updated (`use-tier-limits.ts`)

| Tier | Old AI Msgs | New AI Msgs | Old Tanks | New Tanks |
|------|-------------|-------------|-----------|-----------|
| Free | 10 | **0** | 1 | 1 |
| Starter | 100 | **10** | 1 | **2** |
| Plus | 200 | **100** | 5 | 5 |
| Pro | Unlimited | **500** | Unlimited | Unlimited |

### `resolveUserTier()` Helper

Centralized tier resolution with priority chain:
1. Admin profile (is_active=true) → Pro
2. Tier override (not expired) → override tier
3. Active trial → Pro
4. Active subscription → subscription tier
5. Default → Free

### Trend Analysis Gating

Edge Function now checks user tier before AI analysis:
- Free/Starter: Skipped with `skipped_reason: "tier_restriction"`
- Plus/Pro: Full AI trend analysis

### Pricing Display Updated

All frontend UIs updated to show new prices:
- Starter: $3.99 → **$4.99**/mo
- Plus: $7.99 → **$9.99**/mo
- Pro: $14.99 → **$19.99**/mo

## Files Modified

### Backend
- `supabase/migrations/20260209120000_pricing_strategy_schema.sql` (NEW)
- `src/lib/hooks/use-tier-limits.ts`
- `supabase/functions/analyze-parameter-trends/index.ts`
- `src/lib/stripe/client.ts`

### Frontend
- `src/components/billing/subscription-card.tsx`
- `src/app/page.tsx` (landing page pricing)
- `src/app/(auth)/signup/page.tsx`
- `src/app/(auth)/signup/layout.tsx`
- `src/components/onboarding/onboarding-wizard.tsx`
- `src/app/terms/page.tsx`
- `src/lib/validation/billing.ts`
- `src/app/api/billing/subscription/route.ts`

## Verification

| Check | Result |
|-------|--------|
| `npm run typecheck` | PASS |
| `npm run build` | PASS |
| Schema migration | Applied via MCP |
| SQL function verification | Confirmed |

## Decisions Made

1. **Unified TIER_LIMITS structure**: Used single `maintenance_tasks` key for all tiers (instead of `_total` vs `_per_tank`) for TypeScript type safety. Added helper function to distinguish semantics.

2. **Edge Function tier resolution duplicated**: Created separate function in Edge Function rather than importing from shared location (Deno runtime limitation).

3. **admin_profiles table created in migration**: Required for tier resolution priority chain.

## Patterns Discovered

**Tier Resolution Priority Chain** — Reusable pattern now implemented consistently in:
- Frontend (`use-tier-limits.ts`)
- Edge Functions
- SQL functions (`check_and_increment_ai_usage`, `get_tier_limits`)

## What's Next

1. **Sam Action Required:** Configure Stripe products in Dashboard
   - Create: Starter $4.99, Plus $9.99, Pro $19.99
   - Get live keys (publishable, secret, webhook)
   - Set env vars in Vercel

2. **Then:** Deploy to Vercel production

3. **P1:** Free Tools (Spec 16) — Static calculators for Free tier value prop
