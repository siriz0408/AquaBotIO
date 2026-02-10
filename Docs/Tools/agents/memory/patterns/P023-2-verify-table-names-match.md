# P023-2: Verify Table Names Match Between Hooks and Layouts

**Domain:** db/api  
**Usage:** When creating hooks that check database tables, especially for auth/admin checks

---

## What the Pattern Is

Always verify that table names match between hooks and layouts/components that use the same table. Use grep/search to find all references.

## When to Use It

- Creating new hooks that check database tables
- Renaming tables or columns
- Admin/auth checks that span multiple files
- Any hook that queries a table also used by layouts

## Example

```typescript
// ✅ GOOD: Verify table name matches
// Hook: src/lib/hooks/use-admin.ts
const { data } = await supabase
  .from("admin_users")  // ✅ Matches layout
  .select("role")
  .eq("user_id", user.id)
  .eq("is_active", true)
  .single();

// Layout: src/app/admin/layout.tsx
const { data: adminProfile } = await supabase
  .from("admin_users")  // ✅ Same table name
  .select("role, user_id, is_active")
  .eq("user_id", user.id)
  .eq("is_active", true)
  .single();

// ❌ BAD: Mismatched table names
// Hook uses: admin_profiles (doesn't exist)
// Layout uses: admin_users (correct)
```

## Verification Steps

1. Search for table name: `grep -r "admin_users" src/`
2. Check all files use same name
3. Verify filters match (e.g., `is_active` check)
4. Test end-to-end: hook → layout → page

## Where It Applies

- Admin hooks (`use-admin.ts`)
- Auth hooks
- Any hook that checks user permissions/roles

## Related

- Bug: B023-2
- Mistake: M023-1
