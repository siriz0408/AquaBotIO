# B023-4: Tank Photos Bucket Missing in Remote Supabase

**Severity:** P0
**Status:** FIXED
**Domain:** storage
**Date:** 2026-02-10
**Sprint:** 23 (fixed in Sprint 29)

---

## Description

"Add tank photo" button gives "bucket not found" error. Migration `20260208000000_storage_buckets.sql` creates `tank-photos` bucket but it may not exist in remote Supabase.

## Root Cause

Migration exists but may not have been applied to remote Supabase project. Storage buckets are created via SQL migration but need to be applied.

## Impact

Users cannot upload tank photos, breaking a core feature.

## Fix Applied (Sprint 29)

1. Added storage bucket definitions to `supabase/config.toml` for local development
2. Created `/api/storage/init` endpoint that auto-creates buckets using service role key
3. Updated `tank-photos.ts` utility to auto-retry after initializing buckets if "bucket not found" error occurs
4. The upload flow now self-heals: if bucket is missing, it creates it automatically

### Files Changed

- `supabase/config.toml` - Added bucket definitions for local dev
- `src/app/api/storage/init/route.ts` - New endpoint to ensure buckets exist
- `src/lib/storage/tank-photos.ts` - Added auto-initialization on upload failure

## Prevention

- Verify migrations are applied to remote after creating them
- Add migration status check to deployment checklist
- Test storage buckets in staging before production
- Use the new `/api/storage/init` endpoint to ensure buckets exist

## Related

- Feedback: FB-MLH4WBWX
- Migration: `20260208000000_storage_buckets.sql`
