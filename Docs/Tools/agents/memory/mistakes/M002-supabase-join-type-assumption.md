# Wrong Type Assumption for Supabase Joins
M002 | 2026-02-08 | Impact: MEDIUM | Status: RESOLVED | Domain: db

**Summary:** Assumed Supabase foreign key join returns array, but it returns a single object.

**Details:** Used `item.species[0]` instead of `item.species`. TypeScript strict mode caught this at compile time.

**Action:** Always check Supabase docs for join return types. See pattern P002.

**Links:** Pattern: `P002-supabase-join-response.md`
