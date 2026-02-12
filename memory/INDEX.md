# AquaBotAI Memory System

> **Last Updated:** February 12, 2026 | **Sprint:** 29

This is the team's collective memory. Every bug, decision, pattern, and mistake is documented here so we never repeat errors and always apply lessons learned.

## Categories

| Category | Count | Description |
|----------|-------|-------------|
| [bugs/](./bugs/) | 0 | Bug reports with severity, status, and fixes |
| [decisions/](./decisions/) | 5 | Architecture and implementation decisions |
| [patterns/](./patterns/) | 7 | Reusable solutions and approaches |
| [mistakes/](./mistakes/) | 0 | Wrong turns and how we recovered |
| [feedback/](./feedback/) | 0 | Sam's feedback and PM responses |
| [sprints/](./sprints/) | 6 | Sprint summaries |

## Quick Reference

### Most Important Patterns
- **P029-1:** In-Modal Multi-Step Flow Pattern — use typed step state for modal flows that replace redirects
- **P029-2:** Self-Healing Storage Initialization — auto-create buckets on first upload failure
- **P026-1:** Resilient Button Handler Pattern — always complete user action even if DB call fails
- **P025-1:** Parallel Query Pattern — use Promise.all() for independent database queries
- **P025-2:** Skeleton Loading Pattern — pre-built skeletons for async component loading
- **P022-1:** Edge Function Service Role Pattern — use service role key for cross-user access
- **P022-2:** Push Cleanup Pattern — batch-delete expired subscriptions
- **P022-3:** Dry Run Pattern — accept {"dry_run": true} for testing cron jobs

### Active Bugs
None currently tracked.

### Recent Decisions
- **D029-1:** In-modal add flow over redirects — better UX, no context loss
- **D028-1:** Use `unoptimized` for external GBIF images — bypasses domain restrictions
- **D025-1:** Substrate dropdown with "Other" option — data consistency with flexibility
- **D025-2:** Single dashboard API — parallelizes queries server-side
- **D022-1:** 24-hour lookahead for maintenance reminders (not exact time matching)
- **D022-2:** esm.sh for npm packages in Deno Edge Functions
- **D022-3:** Quiet hours respect user timezone

---

*Memory system initialized Sprint 22. Updated Sprint 29.*
