# P025-1: Parallel Query Pattern

**Sprint:** 25
**Discovered by:** Backend Engineer

## What
For dashboard-style pages that need data from multiple tables, run all independent queries with `Promise.all()` instead of sequentially.

## When to Use
- Loading data for a dashboard or summary page
- Any API route that fetches from multiple tables
- When queries don't depend on each other

## Example
```typescript
// Before: Sequential (slow)
const tanks = await supabase.from("tanks").select("*");
const params = await supabase.from("water_parameters").select("*");
const tasks = await supabase.from("maintenance_tasks").select("*");

// After: Parallel (fast)
const [tanks, params, tasks] = await Promise.all([
  supabase.from("tanks").select("id, name, type"),
  supabase.from("water_parameters").select("id, tank_id, test_date"),
  supabase.from("maintenance_tasks").select("id, task_type, next_due_date")
]);
```

## Where Applied
- `src/lib/ai/context-builder.ts` — 5 queries parallelized
- `src/app/api/dashboard/route.ts` — New endpoint using this pattern
