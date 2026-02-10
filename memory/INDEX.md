# AquaBotAI Memory System

> **Last Updated:** February 10, 2026 | **Sprint:** 22

This is the team's collective memory. Every bug, decision, pattern, and mistake is documented here so we never repeat errors and always apply lessons learned.

## Categories

| Category | Count | Description |
|----------|-------|-------------|
| [bugs/](./bugs/) | 0 | Bug reports with severity, status, and fixes |
| [decisions/](./decisions/) | 3 | Architecture and implementation decisions |
| [patterns/](./patterns/) | 3 | Reusable solutions and approaches |
| [mistakes/](./mistakes/) | 0 | Wrong turns and how we recovered |
| [feedback/](./feedback/) | 0 | Sam's feedback and PM responses |
| [sprints/](./sprints/) | 1 | Sprint summaries |

## Quick Reference

### Most Important Patterns
- **P022-1:** Edge Function Service Role Pattern — use service role key for cross-user access
- **P022-2:** Push Cleanup Pattern — batch-delete expired subscriptions
- **P022-3:** Dry Run Pattern — accept {"dry_run": true} for testing cron jobs

### Active Bugs
None currently tracked.

### Recent Decisions
- **D022-1:** 24-hour lookahead for maintenance reminders (not exact time matching)
- **D022-2:** esm.sh for npm packages in Deno Edge Functions
- **D022-3:** Quiet hours respect user timezone

---

*Memory system initialized Sprint 22. Update after every sprint.*
