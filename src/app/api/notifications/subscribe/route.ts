import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateSubscribeRequest } from "@/lib/validation/notifications";
import { successResponse, errorResponse, validationErrorResponse } from "@/lib/api/response";

/**
 * POST /api/notifications/subscribe
 *
 * Register a push subscription for the authenticated user.
 * Creates a row in push_subscriptions table.
 *
 * Request body:
 * {
 *   subscription: {
 *     endpoint: string,
 *     keys: { p256dh: string, auth: string }
 *   },
 *   userAgent?: string
 * }
 *
 * Response:
 * {
 *   success: true,
 *   data: { subscriptionId: string }
 * }
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
      return errorResponse("AUTH_REQUIRED", "You must be logged in to subscribe to notifications");
    }

    // Parse and validate request
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return errorResponse("INVALID_INPUT", "Invalid JSON in request body");
    }

    const validation = validateSubscribeRequest(body);
    if (!validation.success || !validation.data) {
      return validationErrorResponse(validation.errors || {});
    }

    const { subscription, userAgent } = validation.data;

    // Check if subscription already exists (by endpoint)
    const { data: existingSubscription } = await supabase
      .from("push_subscriptions")
      .select("id")
      .eq("endpoint", subscription.endpoint)
      .single();

    if (existingSubscription) {
      // Update existing subscription (keys may have changed)
      const { data: updatedSubscription, error: updateError } = await supabase
        .from("push_subscriptions")
        .update({
          p256dh_key: subscription.keys.p256dh,
          auth_key: subscription.keys.auth,
          user_agent: userAgent || null,
          last_used_at: new Date().toISOString(),
        })
        .eq("id", existingSubscription.id)
        .select("id")
        .single();

      if (updateError) {
        console.error("Error updating push subscription:", updateError);
        return errorResponse("INTERNAL_SERVER_ERROR", "Failed to update push subscription");
      }

      return successResponse({ subscriptionId: updatedSubscription.id });
    }

    // Create new subscription
    const { data: newSubscription, error: insertError } = await supabase
      .from("push_subscriptions")
      .insert({
        user_id: user.id,
        endpoint: subscription.endpoint,
        p256dh_key: subscription.keys.p256dh,
        auth_key: subscription.keys.auth,
        user_agent: userAgent || null,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Error creating push subscription:", insertError);

      // Handle unique constraint violation
      if (insertError.code === "23505") {
        return errorResponse("CONFLICT", "This subscription already exists");
      }

      return errorResponse("INTERNAL_SERVER_ERROR", "Failed to create push subscription");
    }

    return successResponse({ subscriptionId: newSubscription.id }, 201);
  } catch (error) {
    console.error("Subscribe API error:", error);
    return errorResponse("INTERNAL_SERVER_ERROR", "An unexpected error occurred");
  }
}
