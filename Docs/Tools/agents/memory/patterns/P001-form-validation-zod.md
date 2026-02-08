# Zod Form Validation Pattern
P001 | 2026-02-08 | Impact: HIGH | Status: ACTIVE | Domain: ui/api

**Summary:** Standard pattern for form validation using Zod schemas in `src/lib/validation/`.

**Details:** Create Zod schemas with `parseFormToXData` and `validateX` helper functions. Use `.nullable().optional()` for fields that can be empty, convert empty strings to null in parser. Mirror schema on client and server.

**Action:** Always create validation schemas in `src/lib/validation/`. Use this pattern for all new forms.

**Links:** Examples: `src/lib/validation/parameters.ts`, `src/lib/validation/tank.ts`
