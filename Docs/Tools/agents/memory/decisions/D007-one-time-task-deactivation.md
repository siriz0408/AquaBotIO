# One-Time Tasks: Deactivate on Completion, Don't Delete
D007 | 2026-02-08 | Impact: MEDIUM | Status: ACTIVE | Domain: api

**Summary:** When a one-time task is completed, set `is_active = false` rather than soft-deleting.

**Details:** Options: soft-delete vs deactivate vs keep active. Chose deactivate because it preserves history (the task and its completion log remain visible), while soft-delete would hide the task entirely. Keeps audit trail intact.

**Action:** Use `is_active = false` for completed one-time tasks. Use `deleted_at` only for user-initiated deletions.

**Links:** File: `src/app/api/tanks/[tankId]/maintenance/[taskId]/complete/route.ts`
