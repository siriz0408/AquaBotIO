# Tier Checking Pattern
P003 | 2026-02-08 | Impact: HIGH | Status: ACTIVE | Domain: billing

**Summary:** Standard pattern for checking user subscription tier before gated features.

**Details:** Check subscription status, handle trial period (trial = pro access), fallback to free tier. Trial users get Pro access if `subscription.status === 'trialing'` and `trial_ends_at > NOW()`.

**Action:** Reuse for all tier-gated features: photo diagnosis, equipment recs, email reports, etc.

**Links:** File: `src/app/api/ai/compatibility/route.ts`
