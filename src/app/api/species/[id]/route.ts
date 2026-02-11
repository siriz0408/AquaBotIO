import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { successResponse, errorResponse } from "@/lib/api/response";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/species/[id]
 *
 * Get a single species by ID.
 * Reference data - can be cached longer.
 */
export async function GET(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return errorResponse("AUTH_REQUIRED", "You must be logged in");
    }

    // Fetch species with all details
    const { data: species, error: speciesError } = await supabase
      .from("species")
      .select("*")
      .eq("id", id)
      .single();

    if (speciesError || !species) {
      return errorResponse("NOT_FOUND", "Species not found");
    }

    // Create response with cache headers for reference data
    const response = successResponse({ species });

    // Species details can be cached for 10 minutes - rarely changes
    response.headers.set("Cache-Control", "private, max-age=600, stale-while-revalidate=120");

    return response;
  } catch (error) {
    console.error("Species detail GET error:", error);
    return errorResponse("INTERNAL_SERVER_ERROR", "An unexpected error occurred");
  }
}
