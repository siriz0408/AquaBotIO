import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { successResponse, errorResponse } from "@/lib/api/response";
import { z } from "zod";

/**
 * GET /api/ai/coaching/history
 *
 * Retrieve the user's coaching history with pagination support.
 * Returns coaching messages in reverse chronological order (newest first).
 *
 * Query Parameters:
 * - limit: number (default: 10, max: 50)
 * - offset: number (default: 0)
 * - tank_id: string (optional, filter by tank)
 *
 * Spec Reference: 17_AI_Proactive_Intelligence_Spec.md
 */

// Query params validation schema
const querySchema = z.object({
  limit: z.coerce
    .number()
    .int()
    .min(1, "Limit must be at least 1")
    .max(50, "Limit cannot exceed 50")
    .default(10),
  offset: z.coerce
    .number()
    .int()
    .min(0, "Offset must be non-negative")
    .default(0),
  tank_id: z.string().uuid("Invalid tank ID").optional(),
});

export async function GET(request: NextRequest) {
  try {
    // Initialize Supabase client
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return errorResponse("AUTH_REQUIRED", "You must be logged in to view coaching history");
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const queryResult = querySchema.safeParse({
      limit: searchParams.get("limit") || 10,
      offset: searchParams.get("offset") || 0,
      tank_id: searchParams.get("tank_id") || undefined,
    });

    if (!queryResult.success) {
      const errors = queryResult.error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join("; ");
      return errorResponse("INVALID_INPUT", errors);
    }

    const { limit, offset, tank_id } = queryResult.data;

    // Build query - RLS will automatically filter to user's own data
    let query = supabase
      .from("coaching_history")
      .select("id, tank_id, message, context, tokens_used, created_at", { count: "exact" })
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    // Optional tank filter
    if (tank_id) {
      query = query.eq("tank_id", tank_id);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: history, count, error: historyError } = await query;

    if (historyError) {
      console.error("Error fetching coaching history:", historyError);
      return errorResponse("INTERNAL_SERVER_ERROR", "Failed to fetch coaching history");
    }

    // Optionally fetch tank names for display
    const tankIdSet = new Set(history?.filter((h) => h.tank_id).map((h) => h.tank_id) || []);
    const tankIds = Array.from(tankIdSet);
    let tankMap: Record<string, string> = {};

    if (tankIds.length > 0) {
      const { data: tanks } = await supabase
        .from("tanks")
        .select("id, name")
        .in("id", tankIds);

      if (tanks) {
        tankMap = Object.fromEntries(tanks.map((t) => [t.id, t.name]));
      }
    }

    // Enrich history with tank names
    const enrichedHistory = history?.map((entry) => ({
      ...entry,
      tank_name: entry.tank_id ? tankMap[entry.tank_id] || null : null,
    })) || [];

    return successResponse({
      history: enrichedHistory,
      pagination: {
        total: count || 0,
        limit,
        offset,
        has_more: (count || 0) > offset + limit,
      },
    });
  } catch (error) {
    console.error("Coaching history API error:", error);
    return errorResponse(
      "INTERNAL_SERVER_ERROR",
      "An unexpected error occurred. Please try again."
    );
  }
}
