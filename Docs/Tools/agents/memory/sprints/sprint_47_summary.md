# Sprint 47 Summary — Admin Dashboard Pricing Fix

> Date: 2026-02-15 | Status: COMPLETE

## Goals
1. Check for pending work
2. Review P1 backlog items
3. Fix any issues found

## Issue Found

**Admin Dashboard MRR Using Outdated Pricing**

The admin dashboard was calculating Monthly Recurring Revenue (MRR) using old prices:
- Old: Starter $3.99, Plus $7.99, Pro $14.99 (399/799/1499 cents)
- Current: Starter $4.99, Plus $9.99, Pro $19.99 (499/999/1999 cents)

This affected:
1. `/api/admin/stats` API route - hardcoded price values
2. `useAdminStats` hook - hardcoded price values

## Fix Applied

Replaced hardcoded prices with centralized `TIER_PRICING` constant from `@/lib/validation/billing`:

```typescript
// Before
const mrr = starterSubscribers * 399 + plusSubscribers * 799 + proSubscribers * 1499;

// After
const mrr =
  starterSubscribers * TIER_PRICING.starter.price +
  plusSubscribers * TIER_PRICING.plus.price +
  proSubscribers * TIER_PRICING.pro.price;
```

## Files Modified

| File | Changes |
|------|---------|
| `src/app/api/admin/stats/route.ts` | Import TIER_PRICING, use for MRR calculation |
| `src/lib/hooks/use-admin.ts` | Import TIER_PRICING, use for MRR calculation |

## Impact

Admin dashboard now shows accurate MRR estimates based on current pricing:
- Before: Underestimated by ~25% (using $3.99/$7.99/$14.99)
- After: Accurate with $4.99/$9.99/$19.99

## Verification
- Typecheck: PASS
- Lint: PASS
- Build: PASS

## Best Practice Applied

Always use centralized constants for pricing to prevent drift:
- `TIER_PRICING` in `src/lib/validation/billing.ts` is the single source of truth
- Any pricing changes only need to be made in one place
