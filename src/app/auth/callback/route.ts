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
        const { data: profile } = await supabase
          .from("users")
          .select("onboarding_completed")
          .eq("id", user.id)
          .single();

        // Redirect to onboarding if not completed
        if (profile && !profile.onboarding_completed) {
          return NextResponse.redirect(`${origin}/onboarding`);
        }
      }

      // Successful authentication - redirect to intended destination
      const destination = next ?? "/dashboard";
      return NextResponse.redirect(`${origin}${destination}`);
    }
  }

  // Auth code exchange failed - redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
