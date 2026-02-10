# Sprint 23 Plan — Critical Bug Fixes

**Date:** February 10, 2026
**Status:** Planning → Ready for Execution
**Goal:** Fix 4 P0 bugs blocking user experience: notification settings, admin visibility, tank saving, storage bucket

---

## Sprint Summary

Sam submitted 14 feedback items. This sprint focuses on the 4 P0 bugs that are blocking core functionality:
1. Notification settings not saving (FB-MLH5AKWR)
2. Admin page not visible (FB-MLH59AZV)
3. Tank not saving from onboarding (FB-MLH58D8K)
4. Tank photo bucket not found (FB-MLH4WBWX)

These are all user-facing blockers that need immediate fixes.

---

## Task Breakdown

### Task 1: Fix Notification Settings Not Saving (FB-MLH5AKWR)
**Agent:** Frontend Engineer
**Priority:** P0
**Effort:** 0.5 sprint

**Problem:**
The notification settings page (`src/app/(dashboard)/settings/notifications/page.tsx`) saves basic preferences but NOT the extended preferences (`maintenance_reminders`, `parameter_alerts`, `ai_insights`) that are in the component state.

**Root Cause:**
Line 136-152 in `handleSavePreferences()` only upserts basic fields. The extended preferences are in `preferences` state but never saved.

**Fix:**
1. Update `handleSavePreferences()` to include all preference fields from state
2. Check database schema — ensure `notification_preferences` table has columns for `maintenance_reminders`, `parameter_alerts`, `ai_insights`
3. If columns missing, add migration first
4. Update the upsert to save all fields
5. Test: Change settings, save, refresh page, verify all settings persist

**Files:**
- `src/app/(dashboard)/settings/notifications/page.tsx` (fix handleSavePreferences)
- `supabase/migrations/` (if schema update needed)

**Success Criteria:**
- All notification preferences save correctly
- Settings persist after page refresh
- No console errors

---

### Task 2: Fix Admin Page Visibility (FB-MLH59AZV)
**Agent:** Backend Engineer
**Priority:** P0
**Effort:** 0.5 sprint

**Problem:**
Sam (siriz0408@gmail.com) is an admin but can't see the admin page. The admin layout checks `admin_users` table, but `use-admin.ts` hook checks `admin_profiles` table (which doesn't exist).

**Root Cause:**
Table name mismatch: `admin_users` vs `admin_profiles`. The hook uses wrong table name.

**Fix:**
1. Check if Sam's user ID exists in `admin_users` table
2. If not, add Sam as super_admin:
   ```sql
   INSERT INTO admin_users (user_id, role, is_active)
   SELECT id, 'super_admin', true
   FROM users
   WHERE email = 'siriz0408@gmail.com';
   ```
3. Fix `use-admin.ts` hook: Change `admin_profiles` → `admin_users` (line 43)
4. Verify admin layout uses correct table (`admin_users` — already correct)
5. Test: Login as Sam, verify admin sidebar appears, can access `/admin` routes

**Files:**
- `src/lib/hooks/use-admin.ts` (fix table name)
- SQL migration or manual insert for Sam's admin record

**Success Criteria:**
- Sam can see admin sidebar and access `/admin` routes
- `use-admin.ts` hook works correctly
- No table name mismatches

---

### Task 3: Fix Tank Not Saving from Onboarding (FB-MLH58D8K)
**Agent:** Frontend Engineer
**Priority:** P0
**Effort:** 0.5 sprint

**Problem:**
Tank created during onboarding doesn't appear in maintenance page or tank list. The tank is created (line 86-91 in onboarding-wizard.tsx) but context isn't refreshed.

**Root Cause:**
After creating tank in step 3, the component doesn't:
1. Refresh tank context
2. Navigate to tank page or refresh dashboard
3. Update active tank selection

**Fix:**
1. After tank creation (line 86-99), refresh tank context:
   - Import `useTankContext` or refresh tanks list
   - Set newly created tank as active tank
2. After onboarding completes, ensure tank is visible:
   - Refresh dashboard tanks list
   - Navigate to tank detail page OR refresh dashboard
3. Check maintenance page — ensure it loads tanks correctly
4. Test: Complete onboarding, verify tank appears in dashboard, maintenance page, tank selector

**Files:**
- `src/components/onboarding/onboarding-wizard.tsx` (refresh context after tank creation)
- `src/context/tank-context.tsx` (ensure refresh method exists)
- `src/app/(dashboard)/maintenance/page.tsx` (verify tank loading)

**Success Criteria:**
- Tank created in onboarding appears immediately in dashboard
- Tank appears in maintenance page
- Tank selector shows the new tank
- No duplicate tanks created

---

### Task 4: Fix Tank Photo Bucket Not Found (FB-MLH4WBWX)
**Agent:** Backend Engineer
**Priority:** P0
**Effort:** 0.5 sprint

**Problem:**
"Add tank photo" button gives "bucket not found" error. Migration creates `tank-photos` bucket but it may not exist in remote Supabase.

**Root Cause:**
Migration `20260208000000_storage_buckets.sql` creates bucket, but:
1. Migration may not have been applied to remote
2. Bucket may have been deleted
3. Bucket name mismatch in code vs migration

**Fix:**
1. Check if `tank-photos` bucket exists in Supabase Dashboard → Storage
2. If missing, apply migration:
   ```bash
   npx supabase db push
   ```
3. OR manually create bucket via Supabase Dashboard:
   - Name: `tank-photos`
   - Public: true
   - File size limit: 5MB
   - Allowed MIME types: image/png, image/jpeg, image/gif, image/webp
4. Verify RLS policies are applied (from migration)
5. Test: Try uploading tank photo, verify no "bucket not found" error

**Files:**
- `supabase/migrations/20260208000000_storage_buckets.sql` (verify migration)
- Supabase Dashboard (manual bucket creation if needed)

**Success Criteria:**
- `tank-photos` bucket exists in Supabase Storage
- Photo upload works without errors
- RLS policies allow authenticated users to upload

---

## Dependencies

- Task 2 (Admin) can run in parallel with others
- Task 4 (Bucket) should be done first (quick fix, unblocks photo uploads)
- Task 1 (Notifications) and Task 3 (Onboarding) can run in parallel

---

## Testing Instructions

### After Task 1 (Notifications):
1. Go to Settings → Notifications
2. Toggle all switches (push, email, maintenance reminders, parameter alerts, AI insights)
3. Change reminder timing and quiet hours
4. Click "Save Preferences"
5. Refresh page
6. Verify all settings persisted

### After Task 2 (Admin):
1. Log in as siriz0408@gmail.com (Google OAuth)
2. Verify admin sidebar appears in top nav
3. Click "Admin" → should navigate to `/admin`
4. Verify admin dashboard loads
5. Check admin routes: `/admin/users`, `/admin/feature-flags`, `/admin/audit-log`

### After Task 3 (Onboarding):
1. Create new test account
2. Complete onboarding wizard (all 5 steps)
3. After completion, verify:
   - Tank appears in dashboard "My Tanks" section
   - Tank appears in maintenance page tank selector
   - Can navigate to tank detail page
   - Tank context is set as active tank

### After Task 4 (Bucket):
1. Go to any tank detail page
2. Click "Add Tank Photo" or edit tank → upload photo
3. Select image file
4. Verify upload succeeds (no "bucket not found" error)
5. Verify photo displays in tank detail page

---

## Memory Report (To Be Filled)

### Bugs Found
- B023-1: Notification settings not saving extended preferences
- B023-2: Admin hook uses wrong table name (`admin_profiles` vs `admin_users`)
- B023-3: Tank context not refreshed after onboarding tank creation
- B023-4: Storage bucket `tank-photos` missing in remote Supabase

### Decisions Made
- (To be filled by agents)

### Patterns Discovered
- (To be filled by agents)

### Mistakes Made
- (To be filled by agents)

---

## Next Sprint Recommendations

After these P0 bugs are fixed, Sprint 24 should address:
1. **P1 Bugs:**
   - AI chat code rendering temporarily (FB-MLH5UL4S)
   - Site performance optimization (FB-MLH54PQ4)
   - Tank selection in AI chat (FB-MLH4UAHT)

2. **P1 Features:**
   - Dashboard "My Tanks" section (FB-MLH54FLG) — high value, quick win
   - Tank management overhaul (FB-MLH5FZFB) — needs R&D first
   - AI onboarding wizard (FB-MLH5PN6K) — big need, multi-sprint

---

*Sprint plan created by PM Orchestrator based on Sam's feedback (14 items, 4 P0 bugs prioritized).*
