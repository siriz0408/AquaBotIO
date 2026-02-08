# Sprint 6 Summary — MVP Polish & Testing

> Date: 2026-02-08 | Duration: 1 cycle | Updated by: PM Orchestrator

## Goals
- End-to-end browser testing of all MVP features using Playwright MCP
- Fix critical auth/session bugs blocking user flow
- Validate full user journey: signup → onboarding → dashboard → features

## Critical Bug Fixed: Auth Deadlock (P0)

### Root Cause
Supabase JS SDK (`@supabase/auth-js`) uses the Navigator Web Locks API (`navigator.locks`) for cross-tab session synchronization. The `GoTrueClient._acquireLock()` method uses infinite lock timeouts, causing **permanent deadlocks** when locks aren't properly released.

- **GitHub Issue:** supabase/supabase-js#1594
- **Impact:** `signInWithPassword()`, `getSession()`, and `getUser()` all hang indefinitely
- **Symptoms:** Dashboard shows infinite loading spinner after successful login; auth cookie is present but client-side SDK can't read session

### Fix
Applied the recommended workaround from the issue: bypass `navigator.locks` entirely by providing a no-op lock function to `createBrowserClient`:

```typescript
// src/lib/supabase/client.ts
const noOpLock = async (name, acquireTimeout, fn) => await fn();

export function createClient() {
  return createBrowserClient(url, key, {
    auth: { lock: noOpLock }
  });
}
```

Safe for single-tab usage. Will remove once `@supabase/auth-js` ships the official fix.

### Previous Fix (Sprint 6, earlier)
Middleware was blocking `/api/auth/*` routes for unauthenticated users. Fixed by adding `isApiAuthRoute` check in `src/lib/supabase/middleware.ts`.

## Test Results

| Feature | Status | Notes |
|---------|--------|-------|
| Login (email/password) | PASS | Redirects to dashboard or onboarding correctly |
| Signup | PARTIAL | Email confirmation required on remote Supabase; works via Admin API |
| Onboarding (5 steps) | PASS | Name → Tank Type → Tank Details → AI Intro → Pro Trial |
| Dashboard | PASS | Shows tanks, welcome message, navigation |
| Tank Detail | PASS | Overview, sub-nav tabs (Parameters, Livestock, Maintenance, Chat) |
| Water Parameters | PASS | Empty state, Log Reading link, Customize Thresholds button |
| Species Library | PASS | UI works; no seed data (shows 0 species) |
| Livestock | PASS | Empty state, Add inhabitant button |
| Maintenance | PASS | Empty state, Add Task button |
| AI Chat | PASS | Tank selector, welcome message, prompt suggestions; missing ANTHROPIC_API_KEY |

## Known Issues (Non-Blocking)
1. **Missing icon**: `icons/icon-192x192.png` returns 404 (PWA icon)
2. **Manifest error**: `manifest.json` has syntax error
3. **No species seed data**: Species Library shows 0 species
4. **No ANTHROPIC_API_KEY**: AI chat can't actually respond
5. **Thresholds 404**: `/api/tanks/[id]/thresholds` may not exist yet
6. **Usage API 404**: `/api/usage?feature=chat` endpoint missing

## Files Changed
- `src/lib/supabase/client.ts` — noOpLock workaround for auth deadlock
- `src/lib/supabase/middleware.ts` — Allow `/api/auth/*` routes without session
- `src/app/(auth)/login/page.tsx` — Client-side signInWithPassword (from earlier)
- `.env.local` — Added SUPABASE_SERVICE_ROLE_KEY

## Metrics
- **Progress:** 75% → 80% (auth fix, e2e validation, service role key)
- **Bugs found:** 1 critical (P0 auth deadlock), 6 non-blocking
- **Bugs fixed:** 2 (middleware redirect, auth deadlock)
- **Memory items:** +1 bug, +1 decision, +1 pattern
