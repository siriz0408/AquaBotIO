# Trend Analysis: Stats for Free, AI for Paid
D005 | 2026-02-08 | Impact: MEDIUM | Status: ACTIVE | Domain: billing

**Summary:** Free tier gets statistical trends (min, max, avg, direction, status). Paid tiers get Claude AI insights on top.

**Details:** Matches pattern from D003 (compatibility). Basic functionality is free, AI enhancement requires Starter+. Rate limits: 5/day free, 50/day paid. Uses `ai_usage` table for tracking.

**Action:** Apply same tiering pattern to all future AI features.

**Links:** File: `src/app/api/ai/trend-analysis/route.ts`
