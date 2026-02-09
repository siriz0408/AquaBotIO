import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateUnsubscribeRequest } from "@/lib/validation/notifications";
import { successResponse, errorResponse, validationErrorResponse } from "@/lib/api/response";

/**
 * DELETE /api/notifications/unsubscribe
 *
 * Remove a push subscription for the authenticated user.
 * Deletes row from push_subscriptions table by endpoint.
 *
 * Request body:
 * {
 *   endpoint: string
 * }
 *
 * Response:
 * {
 *   success: true,
 *   data: null
 * }
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return errorResponse("AUTH_REQUIRED", "You must be logged in to unsubscribe from notifications");
    }

    // Parse and validate request
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return errorResponse("INVALID_INPUT", "Invalid JSON in request body");
    }

    const validation = validateUnsubscribeRequest(body);
    if (!validation.success || !validation.data) {
      return validationErrorResponse(validation.errors || {});
    }

    const { endpoint } = validation.data;

    // Delete the subscription (RLS ensures only user's own subscriptions can be deleted)
    const { error: deleteError } = await supabase
      .from("push_subscriptions")
      .delete()
      .eq("endpoint", endpoint)
      .eq("user_id", user.id);

    if (deleteError) {
      console.error("Error deleting push subscription:", deleteError);
      return errorResponse("INTERNAL_SERVER_ERROR", "Failed to delete push subscription");
    }

    // Note: We don't check if row existed - delete is idempotent
    return successResponse(null);
  } catch (error) {
    console.error("Unsubscribe API error:", error);
    return errorResponse("INTERNAL_SERVER_ERROR", "An unexpected error occurred");
  }
}

/**
 * POST /api/notifications/unsubscribe
 *
 * Alternative method for unsubscribing (for clients that don't support DELETE with body)
 */
export async function POST(request: NextRequest) {
  return DELETE(request);
}
