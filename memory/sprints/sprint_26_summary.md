# Sprint 26 Summary

**Date:** February 11, 2026
**Goal:** Fix P0 bugs from Sam's feedback (onboarding buttons, logout)
**Status:** Complete

## What Was Built

### Bug Fixes
- **Onboarding "Skip for now" button (FB-MLHVJ7TB):** Fixed silent failure when `profile` is null. Now wraps database update in try/catch and always redirects to dashboard.
- **Onboarding "Go to Dashboard" button (FB-MLHVI5VP):** Same fix — was returning early if profile was null, preventing the redirect.
- **No way to log out (FB-MLHVIIUH):** Added Sign Out button to Settings > Security section with loading state, success/error toasts, and redirect to /login.

## Root Cause Analysis

The onboarding wizard had a pattern where both `handleSkip()` and `handleComplete()` functions started with:
```typescript
if (!profile) return; // Silent early return — user stuck!
```

This caused the buttons to do nothing when clicked if the profile hadn't loaded yet or was null. The fix was to:
1. Move the profile check inside a try/catch
2. Make the database update conditional (`if (profile) { ... }`)
3. Always execute `router.push("/dashboard")` regardless of profile state
4. Add error handling with toast feedback

## Files Changed

### Modified
- `src/components/onboarding/onboarding-wizard.tsx` — Fixed handleSkip() and handleComplete() to always redirect
- `src/app/(dashboard)/settings/page.tsx` — Added Sign Out button with handleSignOut() function

## Metrics
- Files modified: 2
- Lint: Pass
- Typecheck: Pass
- Build: Pass
- E2E Tests: 39 passed (auth + landing page tests)

## Feedback Addressed
- FB-MLHVJ7TB (P0 Bug: Skip for now button doesn't work) → Fixed
- FB-MLHVI5VP (P0 Bug: Go to Dashboard button doesn't redirect) → Fixed
- FB-MLHVIIUH (P0 Bug: No way to log out) → Fixed

## Code Pattern: Resilient Button Handlers

**Before (fragile):**
```typescript
const handleComplete = async () => {
  if (!profile) return; // User stuck if profile is null!
  await updateDatabase();
  router.push("/dashboard");
};
```

**After (resilient):**
```typescript
const handleComplete = async () => {
  setIsLoading(true);
  try {
    if (profile) {
      await updateDatabase(); // Only if profile exists
    }
    router.push("/dashboard"); // Always redirect
  } catch (error) {
    toast.error("Something went wrong. Redirecting...");
    router.push("/dashboard"); // Still redirect on error
  } finally {
    setIsLoading(false);
  }
};
```

## What Sam Should Test
1. **Onboarding Flow:** Fresh signup → complete onboarding → "Go to Dashboard" should work
2. **Onboarding Skip:** Fresh signup → click "Skip for now" → should redirect to dashboard
3. **Logout:** Dashboard → Settings → Security → "Sign Out" → should redirect to login

## Next Sprint Recommendations
Sprint 27 should focus on:
1. **Species Cards Revamp (FB-MLH5K7N7)** — R&D for images, add coral species
2. **AI Onboarding Wizard Planning (FB-MLH5PN6K)** — Design questionnaire flow
3. **Any bugs discovered from Sprint 26 testing**
