# Status Color Coding Pattern
P008 | 2026-02-08 | Impact: MEDIUM | Status: ACTIVE | Domain: ui

**Summary:** Standard color scheme for task/item status indicators.

**Details:** Red = overdue/danger, Yellow = due today/warning, Green = upcoming/safe, Orange = fully stocked. Applied via `border-l-4` with color classes. Normalize dates (set hours to 0) before comparing to avoid time-of-day issues.

**Action:** Reuse for any status-based UI element (maintenance, parameters, alerts).

**Links:** File: `src/components/maintenance/task-card.tsx`
