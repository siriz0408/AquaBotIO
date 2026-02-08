import { createBrowserClient } from "@supabase/ssr";

/**
 * Workaround for supabase/supabase-js#1594:
 * GoTrueClient uses navigator.locks with infinite timeouts, which can
 * cause permanent deadlocks when locks aren't properly released.
 * This bypasses the Navigator Lock entirely to prevent hangs.
 * Safe for single-tab usage; remove once @supabase/auth-js ships a fix.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const noOpLock = async (name: string, acquireTimeout: number, fn: () => Promise<any>) => {
  return await fn();
};

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        lock: noOpLock,
      },
    }
  );
}
