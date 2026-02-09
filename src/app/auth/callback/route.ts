import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next");
  const origin = requestUrl.origin;

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Check if user has completed onboarding
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Try to fetch the profile - may not exist yet due to trigger timing
        let profile = await fetchProfileWithRetry(supabase, user.id);

        // If profile still doesn't exist after retries, create it as fallback
        if (!profile) {
          const { data: newProfile, error: insertError } = await supabase
            .from("users")
            .insert({
              id: user.id,
              email: user.email!,
              full_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
              avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
            })
            .select("onboarding_completed")
            .single();

          if (!insertError) {
            profile = newProfile;
          }
          // If insert fails (e.g., duplicate key because trigger ran), try fetching again
          if (insertError) {
            const { data: retryProfile } = await supabase
              .from("users")
              .select("onboarding_completed")
              .eq("id", user.id)
              .single();
            profile = retryProfile;
          }
        }

        // Redirect to onboarding if profile doesn't exist or onboarding not completed
        if (!profile || !profile.onboarding_completed) {
          return NextResponse.redirect(`${origin}/onboarding`);
        }
      }

      // Successful authentication with onboarding complete - redirect to intended destination
      const destination = next ?? "/dashboard";
      return NextResponse.redirect(`${origin}${destination}`);
    }
  }

  // Auth code exchange failed - redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}

// Helper function to fetch profile with retries for trigger race condition
async function fetchProfileWithRetry(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  maxRetries = 3,
  delayMs = 100
): Promise<{ onboarding_completed: boolean } | null> {
  for (let i = 0; i < maxRetries; i++) {
    const { data: profile } = await supabase
      .from("users")
      .select("onboarding_completed")
      .eq("id", userId)
      .single();

    if (profile) {
      return profile;
    }

    // Wait before retrying (exponential backoff)
    if (i < maxRetries - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs * (i + 1)));
    }
  }

  return null;
}
