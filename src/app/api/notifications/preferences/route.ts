import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  validateNotificationPreferences,
  type NotificationPreferences,
} from "@/lib/validation/notifications";
import { successResponse, errorResponse, validationErrorResponse } from "@/lib/api/response";

/**
 * GET /api/notifications/preferences
 *
 * Get notification preferences for the authenticated user.
 * Creates default preferences if they don't exist.
 *
 * Response:
 * {
 *   success: true,
 *   data: NotificationPreferences
 * }
 */
export async function GET() {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return errorResponse("AUTH_REQUIRED", "You must be logged in to view notification preferences");
    }

    // Get existing preferences
    const { data: fetchedPreferences, error: selectError } = await supabase
      .from("notification_preferences")
      .select("*")
      .eq("user_id", user.id)
      .single();

    let preferences = fetchedPreferences;

    if (selectError && selectError.code !== "PGRST116") {
      // PGRST116 = no rows found, which is expected for new users
      console.error("Error fetching notification preferences:", selectError);
      return errorResponse("INTERNAL_SERVER_ERROR", "Failed to fetch notification preferences");
    }

    // If no preferences exist, create default ones
    if (!preferences) {
      const { data: newPreferences, error: insertError } = await supabase
        .from("notification_preferences")
        .insert({ user_id: user.id })
        .select("*")
        .single();

      if (insertError) {
        console.error("Error creating default notification preferences:", insertError);

        // Handle race condition - preferences may have been created by trigger
        if (insertError.code === "23505") {
          const { data: retryPreferences } = await supabase
            .from("notification_preferences")
            .select("*")
            .eq("user_id", user.id)
            .single();

          if (retryPreferences) {
            preferences = retryPreferences;
          } else {
            return errorResponse("INTERNAL_SERVER_ERROR", "Failed to create notification preferences");
          }
        } else {
          return errorResponse("INTERNAL_SERVER_ERROR", "Failed to create notification preferences");
        }
      } else {
        preferences = newPreferences;
      }
    }

    return successResponse(preferences as NotificationPreferences);
  } catch (error) {
    console.error("Get preferences API error:", error);
    return errorResponse("INTERNAL_SERVER_ERROR", "An unexpected error occurred");
  }
}

/**
 * PUT /api/notifications/preferences
 *
 * Update notification preferences for the authenticated user.
 *
 * Request body: Partial<NotificationPreferences>
 * {
 *   push_enabled?: boolean,
 *   email_enabled?: boolean,
 *   maintenance_reminders?: boolean,
 *   parameter_alerts?: boolean,
 *   ai_insights?: boolean,
 *   reminder_time?: string,
 *   reminder_days_before?: number,
 *   quiet_hours_enabled?: boolean,
 *   quiet_hours_start?: string,
 *   quiet_hours_end?: string
 * }
 *
 * Response:
 * {
 *   success: true,
 *   data: NotificationPreferences
 * }
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return errorResponse("AUTH_REQUIRED", "You must be logged in to update notification preferences");
    }

    // Parse and validate request
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return errorResponse("INVALID_INPUT", "Invalid JSON in request body");
    }

    const validation = validateNotificationPreferences(body);
    if (!validation.success || !validation.data) {
      return validationErrorResponse(validation.errors || {});
    }

    const updates = validation.data;

    // Check if we have anything to update
    if (Object.keys(updates).length === 0) {
      return errorResponse("INVALID_INPUT", "No fields to update");
    }

    // Check if preferences exist
    const { data: existing } = await supabase
      .from("notification_preferences")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!existing) {
      // Create with the provided values
      const { data: newPreferences, error: insertError } = await supabase
        .from("notification_preferences")
        .insert({ user_id: user.id, ...updates })
        .select("*")
        .single();

      if (insertError) {
        console.error("Error creating notification preferences:", insertError);
        return errorResponse("INTERNAL_SERVER_ERROR", "Failed to create notification preferences");
      }

      return successResponse(newPreferences as NotificationPreferences);
    }

    // Update existing preferences
    const { data: updatedPreferences, error: updateError } = await supabase
      .from("notification_preferences")
      .update(updates)
      .eq("user_id", user.id)
      .select("*")
      .single();

    if (updateError) {
      console.error("Error updating notification preferences:", updateError);
      return errorResponse("INTERNAL_SERVER_ERROR", "Failed to update notification preferences");
    }

    return successResponse(updatedPreferences as NotificationPreferences);
  } catch (error) {
    console.error("Update preferences API error:", error);
    return errorResponse("INTERNAL_SERVER_ERROR", "An unexpected error occurred");
  }
}

/**
 * PATCH /api/notifications/preferences
 *
 * Alias for PUT - both do partial updates
 */
export async function PATCH(request: NextRequest) {
  return PUT(request);
}
