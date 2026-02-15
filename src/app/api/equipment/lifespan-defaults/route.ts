import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { successResponse, errorResponse } from "@/lib/api/response";

/**
 * GET /api/equipment/lifespan-defaults
 *
 * Get all equipment lifespan defaults.
 * Available to all authenticated users (for display purposes).
 */
export async function GET(_request: NextRequest) {
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

    // Get all lifespan defaults
    const { data: defaults, error: defaultsError } = await supabase
      .from("equipment_lifespan_defaults")
      .select("*")
      .order("equipment_type");

    if (defaultsError) {
      console.error("Error fetching lifespan defaults:", defaultsError);
      return errorResponse("INTERNAL_SERVER_ERROR", "Failed to fetch lifespan defaults");
    }

    return successResponse({
      defaults: defaults || [],
    });
  } catch (error) {
    console.error("Lifespan defaults GET error:", error);
    return errorResponse("INTERNAL_SERVER_ERROR", "An unexpected error occurred");
  }
}
