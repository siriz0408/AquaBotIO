import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { successResponse, errorResponse } from "@/lib/api/response";

/**
 * GET /api/species
 *
 * Get species list with pagination, search, and filtering.
 * This is reference data so we can cache it.
 */
export async function GET(request: NextRequest) {
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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const type = searchParams.get("type");
    const careLevel = searchParams.get("care_level");
    const temperament = searchParams.get("temperament");
    const limitParam = searchParams.get("limit");
    const offsetParam = searchParams.get("offset");

    const limit = Math.min(parseInt(limitParam || "24"), 100);
    const offset = parseInt(offsetParam || "0");

    // Build query - select only needed columns for list view
    let query = supabase
      .from("species")
      .select("id, common_name, scientific_name, type, care_level, temperament, min_tank_size_gallons, max_size_inches, photo_url")
      .order("common_name", { ascending: true })
      .range(offset, offset + limit - 1);

    // Apply search filter
    if (search) {
      query = query.or(
        `common_name.ilike.%${search}%,scientific_name.ilike.%${search}%`
      );
    }

    // Apply type filter
    if (type && type !== "all") {
      query = query.eq("type", type);
    }

    // Apply care level filter
    if (careLevel && careLevel !== "all") {
      query = query.eq("care_level", careLevel);
    }

    // Apply temperament filter
    if (temperament && temperament !== "all") {
      query = query.eq("temperament", temperament);
    }

    const { data: species, error: speciesError } = await query;

    if (speciesError) {
      console.error("Error fetching species:", speciesError);
      return errorResponse("INTERNAL_SERVER_ERROR", "Failed to fetch species");
    }

    // Create response with cache headers for reference data
    const response = successResponse({
      species: species || [],
      count: species?.length || 0,
      has_more: (species?.length || 0) === limit,
    });

    // Add cache headers - species data can be cached for 5 minutes
    // This reduces database load for frequently accessed reference data
    response.headers.set("Cache-Control", "private, max-age=300, stale-while-revalidate=60");

    return response;
  } catch (error) {
    console.error("Species GET error:", error);
    return errorResponse("INTERNAL_SERVER_ERROR", "An unexpected error occurred");
  }
}
