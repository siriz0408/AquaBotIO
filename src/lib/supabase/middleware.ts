import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Do not write any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Define public routes that don't require authentication
  const publicRoutes = ["/", "/login", "/signup", "/forgot-password", "/auth/callback", "/auth/confirm", "/privacy", "/terms", "/support", "/about", "/contact"];
  const isPublicRoute = publicRoutes.some(
    (route) => request.nextUrl.pathname === route || request.nextUrl.pathname.startsWith("/auth/")
  );
  // API auth routes must be accessible without a session (login, signup, magic-link, etc.)
  const isApiAuthRoute = request.nextUrl.pathname.startsWith("/api/auth/");
  // Onboarding page should be accessible to authenticated users
  const isOnboardingRoute = request.nextUrl.pathname === "/onboarding";

  if (!user && !isPublicRoute && !isApiAuthRoute) {
    // Redirect unauthenticated users to login page
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Check if authenticated user needs to complete onboarding before accessing dashboard
  if (user && !isPublicRoute && !isApiAuthRoute && !isOnboardingRoute) {
    // Check if user has completed onboarding
    const { data: profile } = await supabase
      .from("users")
      .select("onboarding_completed")
      .eq("id", user.id)
      .single();

    // If profile doesn't exist or onboarding not completed, redirect to onboarding
    if (!profile || !profile.onboarding_completed) {
      const url = request.nextUrl.clone();
      url.pathname = "/onboarding";
      // Copy cookies to preserve session
      const redirectResponse = NextResponse.redirect(url);
      supabaseResponse.cookies.getAll().forEach((cookie) => {
        redirectResponse.cookies.set(cookie.name, cookie.value, {
          ...cookie,
        });
      });
      return redirectResponse;
    }
  }

  // IMPORTANT: You *must* return the supabaseResponse object as-is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse;
}
