# B023-1: Notification Settings Not Saving Extended Preferences

**Severity:** P0  
**Status:** RESOLVED  
**Domain:** ui/api  
**Date:** 2026-02-10  
**Sprint:** 23

---

## Description

The notification settings page (`src/app/(dashboard)/settings/notifications/page.tsx`) saved basic preferences (push_enabled, email_enabled, reminder_timing, quiet_hours) but NOT the extended preferences (`maintenance_reminders`, `parameter_alerts`, `ai_insights`) that were in the component state.

## Root Cause

The `handleSavePreferences()` function (line 136-152) only upserted basic fields. The extended preferences were in the `preferences` state but never included in the database upsert.

## Impact

Users couldn't control which types of notifications they received. All extended preferences defaulted to `true` regardless of user settings.

## Fix

1. Updated `handleSavePreferences()` to include all preference fields from state
2. Added conversion logic for `reminder_timing` enum → `reminder_time` + `reminder_days_before` (database format)
3. Updated fetch logic to load extended preferences from database instead of hardcoding to `true`

## Files Changed

- `src/app/(dashboard)/settings/notifications/page.tsx`

## Prevention

- Always check that ALL state fields are saved to database
- Use TypeScript to ensure type safety between component state and database schema
- Add tests to verify all form fields persist after save

## Related

- Feedback: FB-MLH5AKWR
- Mistake: M023-2
