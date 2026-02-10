# P023-1: Refresh Context After Creating Resources

**Domain:** ui  
**Usage:** Any component that creates resources (tanks, livestock, parameters, tasks, etc.)

---

## What the Pattern Is

After creating a resource in the database, always refresh the relevant context and set it as active (if applicable) so the UI updates immediately.

## When to Use It

- Creating tanks, livestock, parameters, maintenance tasks
- Any resource creation that should appear in UI immediately
- Onboarding flows where resources are created during setup

## Example

```typescript
// ✅ GOOD: Refresh context after creation
const { data: newTank, error } = await supabase
  .from("tanks")
  .insert({ ... })
  .select()
  .single();

if (error) {
  toast.error("Failed to create tank");
  return;
}

// Refresh context and set as active
await refreshTanks();
if (newTank) {
  setActiveTank({
    id: newTank.id,
    name: newTank.name,
    // ... other fields
  });
}

// ❌ BAD: Create but don't refresh
await supabase.from("tanks").insert({ ... });
// Tank created but UI doesn't update!
```

## Where It Applies

- `src/components/onboarding/onboarding-wizard.tsx` (tank creation)
- Any component using `useTank()`, `useLivestock()`, etc.
- Forms that create resources

## Related

- Bug: B023-3
- Context: `src/context/tank-context.tsx`
