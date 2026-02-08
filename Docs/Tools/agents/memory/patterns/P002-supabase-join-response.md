# Supabase Foreign Key Join Response Pattern
P002 | 2026-02-08 | Impact: HIGH | Status: ACTIVE | Domain: db

**Summary:** When using `.select()` with foreign key joins, Supabase returns the related object directly (not array).

**Details:** `supabase.from('livestock').select('*, species:species_id(*)')` returns `item.species` as a single object, not `item.species[0]`. This applies even for one-to-many relationships.

**Action:** Always access joined data directly: `item.species.common_name`, NOT `item.species[0].common_name`. Add proper TypeScript types.

**Links:** File: `src/app/api/ai/compatibility/route.ts`
