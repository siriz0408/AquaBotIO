# D023-2: Use Migration to Add Sam as Admin

**Date:** 2026-02-10  
**Domain:** db  
**Sprint:** 23

---

## What Was Decided

Create a migration file to add Sam (siriz0408@gmail.com) as super_admin instead of manually running SQL.

## Options Considered

1. **Manual SQL via Supabase Dashboard**
   - Pros: Quick, immediate
   - Cons: Not versioned, easy to forget, not repeatable
   - Rejected: Not maintainable

2. **Migration file** (chosen)
   - Pros: Versioned, repeatable, can be applied to staging/prod
   - Cons: Requires migration application step
   - Chosen: Better practice, maintainable

3. **Seed script**
   - Pros: Can be run multiple times safely
   - Cons: Seed scripts usually for test data, not production users
   - Rejected: Wrong tool for the job

## Reasoning

- Migrations are versioned and trackable
- Can be applied to staging and production consistently
- Safer than manual SQL (idempotent check included)
- Follows project conventions (all schema changes via migrations)

## Implementation

```sql
-- Migration: 20260210220000_add_sam_as_admin.sql
INSERT INTO public.admin_users (user_id, role, is_active, created_at)
SELECT 
  u.id,
  'super_admin',
  true,
  NOW()
FROM public.users u
WHERE u.email = 'siriz0408@gmail.com'
  AND NOT EXISTS (
    SELECT 1 
    FROM public.admin_users au 
    WHERE au.user_id = u.id
  );
```

## Related

- Bug: B023-2
- File: `supabase/migrations/20260210220000_add_sam_as_admin.sql`
