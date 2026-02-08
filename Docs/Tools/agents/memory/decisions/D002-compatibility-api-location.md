# AI Compatibility: Next.js API Route Over Edge Function
D002 | 2026-02-08 | Impact: MEDIUM | Status: ACTIVE | Domain: api

**Summary:** Built AI compatibility checking as Next.js API route instead of Supabase Edge Function.

**Details:** Options: Edge Function vs Next.js API route. Chose Next.js API route at `/api/ai/compatibility` for consistency with existing livestock API and simpler deployment. Edge Functions add complexity for no clear benefit here.

**Action:** Use Next.js API routes for features that need AI + database access. Reserve Edge Functions for cron jobs and heavy compute.

**Links:** File: `src/app/api/ai/compatibility/route.ts`
