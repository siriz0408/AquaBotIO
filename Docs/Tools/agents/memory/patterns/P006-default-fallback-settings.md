# Settings Default Fallback Pattern
P006 | 2026-02-08 | Impact: MEDIUM | Status: ACTIVE | Domain: ui

**Summary:** Try custom values first, fall back to hardcoded defaults if missing.

**Details:** For threshold settings: fetch custom thresholds from API, merge with `PARAMETER_DEFAULTS`. Mark `is_custom: boolean` so UI can show which are customized vs default. Reset = delete custom record, revert to default.

**Action:** Reuse for any user-customizable settings with sensible defaults.

**Links:** File: `src/components/parameters/parameter-dashboard.tsx`
