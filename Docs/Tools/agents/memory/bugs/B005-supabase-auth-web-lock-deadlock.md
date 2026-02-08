# B005 — Supabase Auth Web Lock Deadlock

> Severity: P0 | Status: RESOLVED | Domain: auth | Sprint: 6

## Symptoms
- After successful `signInWithPassword()`, dashboard shows infinite loading spinner
- `supabase.auth.getSession()` and `supabase.auth.getUser()` hang indefinitely
- Auth cookie is present and valid, but client-side SDK cannot access it
- `navigator.locks.query()` shows an exclusive lock `lock:sb-*-auth-token` that is never released

## Root Cause
Supabase `@supabase/auth-js` `GoTrueClient._acquireLock()` uses the Navigator Web Locks API with infinite timeout. Under certain conditions (e.g., page navigation during auth, HMR in dev), the lock is acquired but never released, permanently blocking all subsequent auth operations.

**Upstream issue:** supabase/supabase-js#1594

## Fix Applied
Bypass `navigator.locks` with a no-op lock function:

```typescript
// src/lib/supabase/client.ts
const noOpLock = async (name, acquireTimeout, fn) => await fn();
createBrowserClient(url, key, { auth: { lock: noOpLock } });
```

## Impact
- Unblocked entire application — dashboard, onboarding, all features were inaccessible
- Safe for single-tab usage (no cross-tab session sync)
- Will revert once upstream fix ships

## Related
- B006 (middleware redirect) was found and fixed first during investigation
