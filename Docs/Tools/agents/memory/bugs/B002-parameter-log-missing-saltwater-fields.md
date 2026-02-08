# Parameter Log Missing Saltwater Fields
B002 | 2026-02-08 | Impact: MEDIUM | Status: RESOLVED | Domain: ui

**Summary:** Parameter log form was missing saltwater-specific fields (salinity, calcium, alkalinity, magnesium, phosphate).

**Details:** The log form only had freshwater parameters. Saltwater tank users couldn't log salinity, calcium, etc. Also missing Zod validation.

**Action:** Added conditional saltwater fields and Zod schema validation at `src/lib/validation/parameters.ts`.

**Links:** File: `src/app/(dashboard)/tanks/[id]/log/page.tsx`
