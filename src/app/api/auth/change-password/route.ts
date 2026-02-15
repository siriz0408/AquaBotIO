import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { successResponse, errorResponse } from "@/lib/api/response";
import { checkAuthRateLimit, getClientIp } from "@/lib/rate-limit";
import { z } from "zod";

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

/**
 * POST /api/auth/change-password
 *
 * Change password for authenticated users.
 * Requires current password verification for security.
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limit check
    const clientIp = getClientIp(request);
    const rateLimitResult = await checkAuthRateLimit(`change-password:${clientIp}`);

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
    const validationResult = changePasswordSchema.safeParse(body);

    if (!validationResult.success) {
      return errorResponse(
        "INVALID_INPUT",
        validationResult.error.issues[0].message
      );
    }

    const { currentPassword, newPassword } = validationResult.data;
    const supabase = await createClient();

    // Check if user is authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return errorResponse(
        "AUTH_REQUIRED",
        "You must be logged in to change your password.",
        401
      );
    }

    // Check if user has email (required for password change)
    if (!user.email) {
      return errorResponse(
        "INVALID_INPUT",
        "Cannot change password for accounts without an email address."
      );
    }

    // Verify current password by attempting to sign in
    // Create a separate client for verification to avoid affecting the current session
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("Missing Supabase environment variables");
      return errorResponse(
        "INTERNAL_SERVER_ERROR",
        "Server configuration error"
      );
    }

    const verifyClient = createAdminClient(supabaseUrl, supabaseAnonKey);

    const { error: signInError } = await verifyClient.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });

    if (signInError) {
      // Don't reveal whether email exists - just say password is incorrect
      return errorResponse(
        "INVALID_INPUT",
        "Current password is incorrect."
      );
    }

    // Current password verified - now update to new password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      console.error("Password update error:", updateError);
      return errorResponse(
        "INTERNAL_SERVER_ERROR",
        "Failed to update password. Please try again."
      );
    }

    return successResponse({
      message: "Password changed successfully.",
    });
  } catch (error) {
    console.error("Change password error:", error);
    return errorResponse(
      "INTERNAL_SERVER_ERROR",
      "An unexpected error occurred"
    );
  }
}
