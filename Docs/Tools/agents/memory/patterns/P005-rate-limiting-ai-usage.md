# Rate Limiting via ai_usage Table
P005 | 2026-02-08 | Impact: HIGH | Status: ACTIVE | Domain: api

**Summary:** Standard pattern for rate-limiting AI features using the `ai_usage` table.

**Details:** Query today's usage count from `ai_usage` where `feature = 'X'` and `created_at > today`. Compare against tier-specific limits (free: low, paid: high). Track usage after successful operation. Return `RATE_LIMIT_EXCEEDED` error code when exceeded.

**Action:** Reuse for all AI-powered features (photo diagnosis, equipment recs, etc).

**Links:** Files: `src/app/api/ai/trend-analysis/route.ts`, `src/app/api/ai/compatibility/route.ts`
