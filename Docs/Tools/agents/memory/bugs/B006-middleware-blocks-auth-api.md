# B006 — Middleware Blocks Auth API Routes

> Severity: P1 | Status: RESOLVED | Domain: auth | Sprint: 6

## Symptoms
- `POST /api/auth/login` returns 307 redirect to `/login`
- Frontend shows "An unexpected error occurred" on login

## Root Cause
`src/lib/supabase/middleware.ts` redirects unauthenticated users to `/login` but did not exclude `/api/auth/*` routes. Login API calls were being blocked by the very middleware that should allow them.

## Fix Applied
Added `isApiAuthRoute` check to middleware:

```typescript
const isApiAuthRoute = request.nextUrl.pathname.startsWith("/api/auth/");
if (!user && !isPublicRoute && !isApiAuthRoute) { /* redirect */ }
```

## Impact
Login flow completely blocked until fix.
