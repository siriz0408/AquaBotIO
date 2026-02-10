# D023-1: Convert reminder_timing Enum to Database Format

**Date:** 2026-02-10  
**Domain:** ui/db  
**Sprint:** 23

---

## What Was Decided

Convert `reminder_timing` enum (`"day_before" | "morning_of" | "1_hour_before"`) to database format (`reminder_time` TIME + `reminder_days_before` INTEGER) in the notification settings component.

## Options Considered

1. **Change database schema** to use enum type
   - Pros: Simpler, no conversion needed
   - Cons: Requires migration, breaks existing data
   - Rejected: Too risky, existing data uses TIME + INTEGER

2. **Keep conversion in component** (chosen)
   - Pros: No schema change, works with existing data
   - Cons: Conversion logic needed
   - Chosen: Safer, maintains backward compatibility

3. **Use API route for conversion**
   - Pros: Centralized logic
   - Cons: Extra API call, more complexity
   - Rejected: Unnecessary overhead

## Reasoning

- Database schema already uses `reminder_time` + `reminder_days_before`
- Changing schema would require migration and data migration
- Component-level conversion is safer and maintains compatibility
- Conversion logic is simple and localized

## Implementation

```typescript
// Convert reminder_timing → reminder_time + reminder_days_before
let reminder_time = "09:00:00";
let reminder_days_before = 1;

if (preferences.reminder_timing === "day_before") {
  reminder_days_before = 1;
  reminder_time = "09:00:00";
} else if (preferences.reminder_timing === "morning_of") {
  reminder_days_before = 0;
  reminder_time = "09:00:00";
} else if (preferences.reminder_timing === "1_hour_before") {
  reminder_days_before = 0;
  reminder_time = "08:00:00";
}
```

## Related

- Bug: B023-1
- File: `src/app/(dashboard)/settings/notifications/page.tsx`
