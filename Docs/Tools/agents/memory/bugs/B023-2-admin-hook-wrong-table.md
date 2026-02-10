# B023-2: Admin Hook Uses Wrong Table Name

**Severity:** P0  
**Status:** RESOLVED  
**Domain:** db/api  
**Date:** 2026-02-10  
**Sprint:** 23

---

## Description

The `use-admin.ts` hook checked `admin_profiles` table (which doesn't exist) instead of `admin_users` table. This caused admin checks to always fail, preventing Sam from accessing admin pages.

## Root Cause

Copy-paste error or outdated reference. The hook used `admin_profiles` (line 44) while the admin layout correctly uses `admin_users` (line 28 in `admin/layout.tsx`).

## Impact

Sam (siriz0408@gmail.com) couldn't see admin sidebar or access `/admin` routes, even though he should be a super_admin.

## Fix

1. Changed hook to use `admin_users` table (line 44)
2. Added `is_active` filter to match admin layout logic
3. Created migration to add Sam as super_admin in `admin_users` table

## Files Changed

- `src/lib/hooks/use-admin.ts`
- `supabase/migrations/20260210220000_add_sam_as_admin.sql` (new)

## Prevention

- Always verify table names match between hooks and layouts
- Use grep/search to find all references when renaming tables
- Add integration tests that verify admin access works end-to-end

## Related

- Feedback: FB-MLH59AZV
- Mistake: M023-1
