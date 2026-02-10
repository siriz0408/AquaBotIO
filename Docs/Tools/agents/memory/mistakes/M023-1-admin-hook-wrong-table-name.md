# M023-1: Admin Hook Used Wrong Table Name

**Date:** 2026-02-10  
**Impact:** MEDIUM  
**Domain:** db  
**Status:** RESOLVED  
**Sprint:** 23

---

## What Went Wrong

The `use-admin.ts` hook checked `admin_profiles` table (which doesn't exist) instead of `admin_users` table. This caused admin checks to always fail.

## Root Cause

Copy-paste error or outdated reference. The hook used wrong table name while the admin layout correctly used `admin_users`. Should have verified table names match between hooks and layouts.

## How It Was Recovered

1. Identified mismatch by comparing hook and layout code
2. Changed hook to use `admin_users` table
3. Added `is_active` filter to match layout logic
4. Created migration to add Sam as admin

## Prevention Steps

- Always verify table names match between hooks and layouts
- Use grep/search to find all references when renaming tables
- Add integration tests that verify admin access works end-to-end
- Code review checklist: "Do all references use the same table name?"

## Related

- Bug: B023-2
- Pattern: P023-2
