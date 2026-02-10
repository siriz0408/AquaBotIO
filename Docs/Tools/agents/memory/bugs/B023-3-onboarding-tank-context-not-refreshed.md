# B023-3: Tank Context Not Refreshed After Onboarding Creation

**Severity:** P0  
**Status:** RESOLVED  
**Domain:** ui  
**Date:** 2026-02-10  
**Sprint:** 23

---

## Description

Tank created during onboarding wizard (step 3) didn't appear in dashboard or maintenance page because the tank context wasn't refreshed after creation.

## Root Cause

After creating tank in `onboarding-wizard.tsx` (line 86-99), the component didn't:
1. Refresh tank context (`refreshTanks()`)
2. Set newly created tank as active (`setActiveTank()`)

The tank was created in database but UI didn't update.

## Impact

Users completing onboarding couldn't see their tank in dashboard or maintenance page, making the onboarding flow feel broken.

## Fix

1. Import `useTank` hook in onboarding wizard
2. After tank creation, call `refreshTanks()` to reload tanks list
3. Call `setActiveTank()` with newly created tank to set it as active
4. Tank now appears immediately in all views

## Files Changed

- `src/components/onboarding/onboarding-wizard.tsx`

## Prevention

- Always refresh context after creating resources (tanks, livestock, parameters, etc.)
- Pattern: Create → Refresh → Set Active → Navigate
- Add tests that verify created resources appear in UI immediately

## Related

- Feedback: FB-MLH58D8K
- Pattern: P023-1
