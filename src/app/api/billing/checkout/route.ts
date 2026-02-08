import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createCheckoutSession, getOrCreateCustomer } from "@/lib/stripe/checkout";
import { validateCheckoutRequest } from "@/lib/validation/billing";
import { successResponse, errorResponse, validationErrorResponse } from "@/lib/api/response";

/**
 * POST /api/billing/checkout
 *
 * Create a Stripe Checkout session for subscription.
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

    // Parse and validate request
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return errorResponse("INVALID_INPUT", "Invalid JSON in request body");
    }

    const validation = validateCheckoutRequest(body);
    if (!validation.success || !validation.data) {
      return validationErrorResponse(validation.errors || {});
    }

    const { tier, success_url, cancel_url } = validation.data;

    // Get user profile
    const { data: profile } = await supabase
      .from("users")
      .select("full_name, stripe_customer_id")
      .eq("id", user.id)
      .single();

    // Get or create Stripe customer
    let stripeCustomerId = profile?.stripe_customer_id;

    if (!stripeCustomerId && user.email) {
      stripeCustomerId = await getOrCreateCustomer(
        user.id,
        user.email,
        profile?.full_name || undefined
      );

      // Save customer ID to user profile
      await supabase
        .from("users")
        .update({ stripe_customer_id: stripeCustomerId })
        .eq("id", user.id);
    }

    // Default URLs
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const successRedirect = success_url || `${appUrl}/billing?success=true`;
    const cancelRedirect = cancel_url || `${appUrl}/billing?canceled=true`;

    // Create checkout session
    const session = await createCheckoutSession({
      userId: user.id,
      email: user.email || "",
      tier,
      stripeCustomerId,
      successUrl: successRedirect,
      cancelUrl: cancelRedirect,
    });

    return successResponse({
      checkout_url: session.url,
      session_id: session.id,
    });
  } catch (error) {
    console.error("Checkout API error:", error);

    // Handle Stripe-specific errors
    if (error instanceof Error && error.message.includes("Stripe")) {
      return errorResponse("STRIPE_ERROR", "Failed to create checkout session");
    }

    return errorResponse(
      "INTERNAL_SERVER_ERROR",
      "An unexpected error occurred"
    );
  }
}
