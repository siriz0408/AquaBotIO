# Next Due Date Calculation Pattern
P007 | 2026-02-08 | Impact: HIGH | Status: ACTIVE | Domain: api

**Summary:** Centralized `calculateNextDueDate()` function handles frequency-to-date logic for recurring tasks.

**Details:** Takes a base date and frequency, returns the next occurrence. Handles: once (same date), daily (+1), weekly (+7), biweekly (+14), monthly (+1 month with edge case handling), custom (+N days). Monthly uses `setMonth()` which handles boundary cases (Jan 31 → Feb 28).

**Action:** Reuse for any recurring schedule calculation. Located in `src/lib/validation/maintenance.ts`.

**Links:** File: `src/lib/validation/maintenance.ts`
