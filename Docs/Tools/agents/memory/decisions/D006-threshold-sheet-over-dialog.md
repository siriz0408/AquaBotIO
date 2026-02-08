# Threshold Settings: Sheet Over Dialog
D006 | 2026-02-08 | Impact: LOW | Status: ACTIVE | Domain: ui

**Summary:** Used Sheet (slides from side) instead of Dialog (centered modal) for threshold settings.

**Details:** Better mobile UX, can show full parameter list without scrolling in a cramped modal. Loads data lazily on open to avoid unnecessary API calls.

**Action:** Use Sheet for settings panels, Dialog for confirmations.

**Links:** File: `src/components/parameters/threshold-settings.tsx`
