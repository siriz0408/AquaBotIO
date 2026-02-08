import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { successResponse, errorResponse } from "@/lib/api/response";
import { checkAuthRateLimit, getClientIp } from "@/lib/rate-limit";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

/**
 * POST /api/auth/login
 *
 * Email/password login with rate limiting.
 * Per CLAUDE.md: 5 attempts per 15 minutes per IP.
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limit check
    const clientIp = getClientIp(request);
    const rateLimitResult = await checkAuthRateLimit(`login:${clientIp}`);

    if (!rateLimitResult.success) {
      const minutesRemaining = Math.ceil((rateLimitResult.reset - Date.now()) / 60000);

      return errorResponse(
        "RATE_LIMIT_EXCEEDED",
        `Too many login attempts. Please try again in ${minutesRemaining} minute${minutesRemaining === 1 ? "" : "s"}.`,
        429
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = loginSchema.safeParse(body);

    if (!validationResult.success) {
      return errorResponse(
        "INVALID_INPUT",
        validationResult.error.issues[0].message
      );
    }

    const { email, password } = validationResult.data;
    const supabase = await createClient();

    // Attempt login
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Generic message to prevent user enumeration
      return errorResponse(
        "AUTH_REQUIRED",
        "Invalid email or password",
        401
      );
    }

    if (!data.user) {
      return errorResponse(
        "AUTH_REQUIRED",
        "Invalid email or password",
        401
      );
    }

    // Fetch user profile to check onboarding status
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("onboarding_completed")
      .eq("id", data.user.id)
      .single();

    if (profileError) {
      console.error("Failed to fetch user profile:", profileError);
      // Don't fail login, but flag the issue
      return successResponse({
        user: {
          id: data.user.id,
          email: data.user.email,
        },
        onboardingCompleted: null, // Unknown
        redirectTo: "/dashboard",
        warning: "Could not verify onboarding status",
      });
    }

    const redirectTo = profile?.onboarding_completed ? "/dashboard" : "/onboarding";

    return successResponse({
      user: {
        id: data.user.id,
        email: data.user.email,
      },
      onboardingCompleted: profile?.onboarding_completed ?? false,
      redirectTo,
    });
  } catch (error) {
    console.error("Login error:", error);
    return errorResponse(
      "INTERNAL_SERVER_ERROR",
      "An unexpected error occurred"
    );
  }
}
