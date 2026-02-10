# M023-2: Notification Settings Didn't Save All State Fields

**Date:** 2026-02-10  
**Impact:** MEDIUM  
**Domain:** ui  
**Status:** RESOLVED  
**Sprint:** 23

---

## What Went Wrong

Notification settings page had extended preferences (`maintenance_reminders`, `parameter_alerts`, `ai_insights`) in component state but `handleSavePreferences()` only saved basic fields. Extended preferences were never persisted.

## Root Cause

Incomplete save function. Only basic fields were included in the upsert, while extended preferences were in state but forgotten in the save logic.

## How It Was Recovered

1. Identified missing fields by comparing state vs save function
2. Updated `handleSavePreferences()` to include all preference fields
3. Added conversion logic for `reminder_timing` enum → database format
4. Updated fetch logic to load extended preferences from database

## Prevention Steps

- Always check that ALL state fields are saved to database
- Use TypeScript to ensure type safety between component state and database schema
- Add tests to verify all form fields persist after save
- Code review checklist: "Does save function include all state fields?"

## Related

- Bug: B023-1
