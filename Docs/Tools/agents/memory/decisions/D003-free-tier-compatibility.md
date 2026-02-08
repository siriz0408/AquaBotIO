# Free Tier: Rule-Based Compatibility Over AI
D003 | 2026-02-08 | Impact: MEDIUM | Status: ACTIVE | Domain: billing

**Summary:** Free tier gets basic rule-based compatibility checks; AI-enhanced checks require Starter+.

**Details:** Options: No checks for free vs basic rules vs full AI. Chose rule-based for free (tank type match, size check, temperament conflicts) with AI enhancement for paid tiers. Keeps free tier functional while incentivizing upgrade.

**Action:** Tier-gate AI features but always provide basic functionality. Check `subscription.status === 'trialing'` for trial users (get Pro access).

**Links:** File: `src/app/api/ai/compatibility/route.ts`
