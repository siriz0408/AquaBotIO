import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createPortalSession } from "@/lib/stripe/portal";
import { validatePortalRequest } from "@/lib/validation/billing";
import { successResponse, errorResponse, validationErrorResponse } from "@/lib/api/response";

/**
 * POST /api/billing/portal
 *
 * Create a Stripe Customer Portal session.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return errorResponse("AUTH_REQUIRED", "You must be logged in");
    }

    // Parse request (optional body)
    let body: unknown = {};
    try {
      const text = await request.text();
      if (text) {
        body = JSON.parse(text);
      }
    } catch {
      // Empty body is fine
    }

    const validation = validatePortalRequest(body);
    if (!validation.success) {
      return validationErrorResponse(validation.errors || {});
    }

    const { return_url } = validation.data || {};

    // Get user's Stripe customer ID
    const { data: profile } = await supabase
      .from("users")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single();

    if (!profile?.stripe_customer_id) {
      return errorResponse(
        "NOT_FOUND",
        "No billing account found. Please subscribe first."
      );
    }

    // Default return URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const returnRedirect = return_url || `${appUrl}/billing`;

    // Create portal session
    const session = await createPortalSession({
      customerId: profile.stripe_customer_id,
      returnUrl: returnRedirect,
    });

    return successResponse({
      portal_url: session.url,
    });
  } catch (error) {
    console.error("Portal API error:", error);

    if (error instanceof Error && error.message.includes("Stripe")) {
      return errorResponse("STRIPE_ERROR", "Failed to create portal session");
    }

    return errorResponse(
      "INTERNAL_SERVER_ERROR",
      "An unexpected error occurred"
    );
  }
}
