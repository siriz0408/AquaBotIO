# B023-4: Tank Photos Bucket Missing in Remote Supabase

**Severity:** P0  
**Status:** PENDING VERIFICATION  
**Domain:** storage  
**Date:** 2026-02-10  
**Sprint:** 23

---

## Description

"Add tank photo" button gives "bucket not found" error. Migration `20260208000000_storage_buckets.sql` creates `tank-photos` bucket but it may not exist in remote Supabase.

## Root Cause

Migration exists but may not have been applied to remote Supabase project. Storage buckets are created via SQL migration but need to be applied.

## Impact

Users cannot upload tank photos, breaking a core feature.

## Fix

1. Verify bucket exists in Supabase Dashboard → Storage
2. If missing, apply migration: `npx supabase db push`
3. OR manually create bucket:
   - Name: `tank-photos`
   - Public: true
   - File size limit: 5MB
   - Allowed MIME types: image/png, image/jpeg, image/gif, image/webp

## Files Changed

- None (migration already exists)

## Prevention

- Verify migrations are applied to remote after creating them
- Add migration status check to deployment checklist
- Test storage buckets in staging before production

## Related

- Feedback: FB-MLH4WBWX
- Migration: `20260208000000_storage_buckets.sql`
