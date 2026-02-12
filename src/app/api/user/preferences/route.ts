import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
} from "@/lib/api/response";
import {
  validateUserPreferences,
  type UserPreferences,
} from "@/lib/validation/user-preferences";

/**
 * GET /api/user/preferences
 *
 * Get user preferences for the authenticated user.
 * Returns null data if preferences don't exist yet.
 *
 * Response:
 * {
 *   success: true,
 *   data: UserPreferences | null
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
      return errorResponse(
        "AUTH_REQUIRED",
        "You must be logged in to view preferences"
      );
    }

    // Get existing preferences
    const { data: preferences, error: selectError } = await supabase
      .from("user_preferences")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (selectError && selectError.code !== "PGRST116") {
      // PGRST116 = no rows found, which is expected for new users
      console.error("Error fetching user preferences:", selectError);
      return errorResponse(
        "INTERNAL_SERVER_ERROR",
        "Failed to fetch user preferences"
      );
    }

    // Return preferences (or null if not found)
    return successResponse(preferences as UserPreferences | null);
  } catch (error) {
    console.error("Get preferences API error:", error);
    return errorResponse(
      "INTERNAL_SERVER_ERROR",
      "An unexpected error occurred"
    );
  }
}

/**
 * POST /api/user/preferences
 *
 * Create or update user preferences (upsert behavior).
 * This is the main endpoint for the AI onboarding questionnaire.
 *
 * Request body: UserPreferencesInput
 * {
 *   experience_level?: string,
 *   current_situation?: string,
 *   primary_goal?: string,
 *   current_challenges?: string[],
 *   ... other optional fields
 * }
 *
 * Response:
 * {
 *   success: true,
 *   data: UserPreferences
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
      return errorResponse(
        "AUTH_REQUIRED",
        "You must be logged in to save preferences"
      );
    }

    // Parse and validate request
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return errorResponse("INVALID_INPUT", "Invalid JSON in request body");
    }

    const validation = validateUserPreferences(body);
    if (!validation.success || !validation.data) {
      return validationErrorResponse(validation.errors || {});
    }

    const onboardingData = {
      ...validation.data,
      onboarding_completed_at: new Date().toISOString(),
    };

    // Check if preferences already exist
    const { data: existing } = await supabase
      .from("user_preferences")
      .select("id")
      .eq("user_id", user.id)
      .single();

    let preferences: UserPreferences;

    if (existing) {
      // Update existing preferences
      const { data: updatedPreferences, error: updateError } = await supabase
        .from("user_preferences")
        .update(onboardingData)
        .eq("user_id", user.id)
        .select("*")
        .single();

      if (updateError) {
        console.error("Error updating user preferences:", updateError);
        return errorResponse(
          "INTERNAL_SERVER_ERROR",
          "Failed to update user preferences"
        );
      }

      preferences = updatedPreferences as UserPreferences;
    } else {
      // Create new preferences
      const { data: newPreferences, error: insertError } = await supabase
        .from("user_preferences")
        .insert({
          user_id: user.id,
          ...onboardingData,
        })
        .select("*")
        .single();

      if (insertError) {
        console.error("Error creating user preferences:", insertError);

        // Handle race condition - try update instead
        if (insertError.code === "23505") {
          const { data: retryUpdate, error: retryError } = await supabase
            .from("user_preferences")
            .update(onboardingData)
            .eq("user_id", user.id)
            .select("*")
            .single();

          if (retryError) {
            return errorResponse(
              "INTERNAL_SERVER_ERROR",
              "Failed to save user preferences"
            );
          }

          preferences = retryUpdate as UserPreferences;
        } else {
          return errorResponse(
            "INTERNAL_SERVER_ERROR",
            "Failed to create user preferences"
          );
        }
      } else {
        preferences = newPreferences as UserPreferences;
      }
    }

    // Also update the users table to mark onboarding as completed
    await supabase
      .from("users")
      .update({ onboarding_completed: true })
      .eq("id", user.id);

    return successResponse(preferences, 201);
  } catch (error) {
    console.error("Create/update preferences API error:", error);
    return errorResponse(
      "INTERNAL_SERVER_ERROR",
      "An unexpected error occurred"
    );
  }
}

/**
 * PATCH /api/user/preferences
 *
 * Update user preferences (partial updates).
 * If preferences don't exist, creates them with the provided fields.
 *
 * Request body: Partial<UserPreferences>
 * {
 *   explanation_depth?: string,
 *   wants_scientific_names?: boolean,
 *   ... other optional fields
 * }
 *
 * Response:
 * {
 *   success: true,
 *   data: UserPreferences
 * }
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return errorResponse(
        "AUTH_REQUIRED",
        "You must be logged in to update preferences"
      );
    }

    // Parse and validate request
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return errorResponse("INVALID_INPUT", "Invalid JSON in request body");
    }

    const validation = validateUserPreferences(body);
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
      .from("user_preferences")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!existing) {
      // Create with the provided values (upsert behavior)
      const { data: newPreferences, error: insertError } = await supabase
        .from("user_preferences")
        .insert({ user_id: user.id, ...updates })
        .select("*")
        .single();

      if (insertError) {
        console.error("Error creating user preferences:", insertError);

        // Handle race condition
        if (insertError.code === "23505") {
          // Try to update instead
          const { data: retryUpdate, error: retryError } = await supabase
            .from("user_preferences")
            .update(updates)
            .eq("user_id", user.id)
            .select("*")
            .single();

          if (retryError) {
            return errorResponse(
              "INTERNAL_SERVER_ERROR",
              "Failed to update user preferences"
            );
          }

          return successResponse(retryUpdate as UserPreferences);
        }

        return errorResponse(
          "INTERNAL_SERVER_ERROR",
          "Failed to create user preferences"
        );
      }

      return successResponse(newPreferences as UserPreferences, 201);
    }

    // Update existing preferences
    const { data: updatedPreferences, error: updateError } = await supabase
      .from("user_preferences")
      .update(updates)
      .eq("user_id", user.id)
      .select("*")
      .single();

    if (updateError) {
      console.error("Error updating user preferences:", updateError);
      return errorResponse(
        "INTERNAL_SERVER_ERROR",
        "Failed to update user preferences"
      );
    }

    return successResponse(updatedPreferences as UserPreferences);
  } catch (error) {
    console.error("Update preferences API error:", error);
    return errorResponse(
      "INTERNAL_SERVER_ERROR",
      "An unexpected error occurred"
    );
  }
}
