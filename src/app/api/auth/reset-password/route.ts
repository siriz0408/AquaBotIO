import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { successResponse, errorResponse } from "@/lib/api/response";
import { checkAuthRateLimit, getClientIp } from "@/lib/rate-limit";
import { z } from "zod";

const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

/**
 * POST /api/auth/reset-password
 *
 * Update password after reset link clicked.
 * User must already be authenticated via the reset link.
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limit check
    const clientIp = getClientIp(request);
    const rateLimitResult = await checkAuthRateLimit(`reset-password:${clientIp}`);

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
    const validationResult = resetPasswordSchema.safeParse(body);

    if (!validationResult.success) {
      return errorResponse(
        "INVALID_INPUT",
        validationResult.error.issues[0].message
      );
    }

    const { password } = validationResult.data;
    const supabase = await createClient();

    // Check if user is authenticated (they should be via reset link)
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return errorResponse(
        "AUTH_REQUIRED",
        "Password reset link has expired. Please request a new one.",
        401
      );
    }

    // Update password
    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      console.error("Password update error:", error);
      return errorResponse(
        "INTERNAL_SERVER_ERROR",
        "Failed to update password. Please try again."
      );
    }

    return successResponse({
      message: "Password updated successfully. You can now log in with your new password.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return errorResponse(
      "INTERNAL_SERVER_ERROR",
      "An unexpected error occurred"
    );
  }
}
