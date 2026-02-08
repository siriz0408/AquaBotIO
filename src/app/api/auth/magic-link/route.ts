import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { successResponse, errorResponse } from "@/lib/api/response";
import { checkAuthRateLimit, getClientIp } from "@/lib/rate-limit";
import { z } from "zod";

const magicLinkSchema = z.object({
  email: z.string().email("Invalid email address"),
  redirectTo: z.string().url().optional(),
});

/**
 * POST /api/auth/magic-link
 *
 * Send magic link email with rate limiting.
 * Per CLAUDE.md: 5 attempts per 15 minutes per IP.
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limit check
    const clientIp = getClientIp(request);
    const rateLimitResult = await checkAuthRateLimit(`magic-link:${clientIp}`);

    if (!rateLimitResult.success) {
      const minutesRemaining = Math.ceil((rateLimitResult.reset - Date.now()) / 60000);

      return errorResponse(
        "RATE_LIMIT_EXCEEDED",
        `Too many requests. Please try again in ${minutesRemaining} minute${minutesRemaining === 1 ? "" : "s"}.`,
        429
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = magicLinkSchema.safeParse(body);

    if (!validationResult.success) {
      return errorResponse(
        "INVALID_INPUT",
        validationResult.error.issues[0].message
      );
    }

    const { email, redirectTo } = validationResult.data;
    const supabase = await createClient();

    // Get the origin for the redirect URL
    const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "";

    // Send magic link
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo || `${origin}/auth/callback`,
      },
    });

    if (error) {
      // Don't reveal if email exists or not
      console.error("Magic link error:", error);
    }

    // Always return success to prevent email enumeration
    return successResponse({
      message: "If an account exists with this email, you will receive a magic link shortly.",
      email,
    });
  } catch (error) {
    console.error("Magic link error:", error);
    return errorResponse(
      "INTERNAL_SERVER_ERROR",
      "An unexpected error occurred"
    );
  }
}
