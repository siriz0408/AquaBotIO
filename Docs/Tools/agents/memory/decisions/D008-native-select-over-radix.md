# Native HTML Select Over Radix UI Select
D008 | 2026-02-08 | Impact: LOW | Status: ACTIVE | Domain: ui

**Summary:** Used native HTML select styled with `appearance-none` instead of installing `@radix-ui/react-select`.

**Details:** Options: Radix Select vs native select. Chose native because the dependency wasn't installed and native select is sufficient for task type/frequency dropdowns. Can upgrade to Radix later if better UX is needed.

**Action:** Use native select for simple dropdowns. Reserve Radix Select for complex multi-select or searchable dropdowns.

**Links:** File: `src/components/ui/select.tsx`
