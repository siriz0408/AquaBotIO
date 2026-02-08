# Threshold Validation: Zod .refine() for safe ⊆ warning Constraint
D004 | 2026-02-08 | Impact: LOW | Status: ACTIVE | Domain: api

**Summary:** Used Zod `.refine()` to enforce that safe zone must be within warning zone.

**Details:** Options: validate in Zod vs database constraint vs both. Chose Zod with `.refine()` for clear error messages. First refine checks all values provided together, second refine validates `safe_min >= warning_min && safe_max <= warning_max`.

**Action:** Use this pattern for any multi-field validation with constraints.

**Links:** File: `src/lib/validation/parameters.ts`
