# Patterns Index

> Entries: 10 | Last updated: 2026-02-10

Naming: `P{NNN}-{kebab-title}.md`

| ID | Domain | Title | Usage |
|----|--------|-------|-------|
| P023-1 | ui | Refresh context after creating resources | Any component creating tanks, livestock, parameters, tasks |
| P023-2 | db/api | Verify table names match between hooks and layouts | Admin/auth hooks, any hook checking database tables |
| P001 | ui/api | Zod form validation pattern | All forms — `src/lib/validation/` |
| P002 | db | Supabase foreign key join response handling | All API routes with joins |
| P003 | billing | Tier checking pattern (trial = Pro) | All tier-gated features |
| P004 | ui | Tank picker modal pattern | Any "add to tank" flow |
| P005 | api | Rate limiting via ai_usage table | All AI-powered features |
| P006 | ui | Settings default fallback pattern | User-customizable settings |
| P007 | api | Next due date calculation for recurring tasks | Any recurring schedule |
| P008 | ui | Status color coding (red/yellow/green) | Any status-based UI |

<!-- PM: Add patterns when a solution is proven to work well. Reference from Task Briefs. -->
