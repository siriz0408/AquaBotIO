import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { successResponse, errorResponse } from "@/lib/api/response";
import { resolveUserTier } from "@/lib/hooks/use-tier-limits";

/**
 * GET /api/tanks/compare
 *
 * Get parameter comparison data across multiple tanks.
 * Pro tier only (R-105.4).
 *
 * Query params:
 * - tankIds: comma-separated list of tank IDs (2-3 tanks)
 * - parameter: parameter name to compare (e.g., "ph", "ammonia_ppm")
 * - days: time range in days (7, 30, 90)
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

    // Check tier - Pro only
    const tier = await resolveUserTier(supabase, user.id);
    if (tier !== "pro") {
      return errorResponse(
        "TIER_REQUIRED",
        "Multi-tank comparison requires a Pro plan. Upgrade to compare tanks side-by-side.",
        403
      );
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const tankIdsParam = searchParams.get("tankIds");
    const parameter = searchParams.get("parameter") || "ph";
    const days = parseInt(searchParams.get("days") || "30", 10);

    if (!tankIdsParam) {
      return errorResponse("INVALID_INPUT", "tankIds parameter is required");
    }

    const tankIds = tankIdsParam.split(",").slice(0, 3); // Max 3 tanks

    if (tankIds.length < 2) {
      return errorResponse("INVALID_INPUT", "At least 2 tanks required for comparison");
    }

    // Validate days parameter
    const validDays = [7, 30, 90];
    const normalizedDays = validDays.includes(days) ? days : 30;

    // Calculate date range
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - normalizedDays);

    // Verify user owns all tanks
    const { data: tanks, error: tanksError } = await supabase
      .from("tanks")
      .select("id, name, type, photo_url")
      .in("id", tankIds)
      .eq("user_id", user.id)
      .is("deleted_at", null);

    if (tanksError) {
      console.error("Error fetching tanks:", tanksError);
      return errorResponse("INTERNAL_SERVER_ERROR", "Failed to fetch tanks");
    }

    if (!tanks || tanks.length !== tankIds.length) {
      return errorResponse("PERMISSION_DENIED", "You don't have access to one or more of these tanks");
    }

    // Valid parameters that can be compared
    const validParameters = [
      "temperature_f", "ph", "ammonia_ppm", "nitrite_ppm", "nitrate_ppm",
      "salinity_ppt", "calcium_ppm", "alkalinity_dkh"
    ];

    if (!validParameters.includes(parameter)) {
      return errorResponse("INVALID_INPUT", "Invalid parameter for comparison");
    }

    // Get parameter data for each tank
    const comparisonData = await Promise.all(
      tanks.map(async (tank) => {
        const { data: params } = await supabase
          .from("water_parameters")
          .select("measured_at, temperature_f, ph, ammonia_ppm, nitrite_ppm, nitrate_ppm, salinity_ppt, calcium_ppm, alkalinity_dkh")
          .eq("tank_id", tank.id)
          .gte("measured_at", startDate.toISOString())
          .order("measured_at", { ascending: true });

        // Transform to chart-friendly format, filtering for the selected parameter
        const dataPoints = (params || [])
          .filter((p) => {
            const value = p[parameter as keyof typeof p];
            return value !== null && value !== undefined;
          })
          .map((p) => ({
            date: p.measured_at,
            value: p[parameter as keyof typeof p] as number | null,
          }));

        // Calculate stats
        const values = dataPoints.filter((d) => d.value !== null).map((d) => d.value as number);
        const stats = values.length > 0
          ? {
              min: Math.min(...values),
              max: Math.max(...values),
              avg: values.reduce((a, b) => a + b, 0) / values.length,
              latest: values[values.length - 1],
              trend: values.length >= 2 ? (values[values.length - 1] > values[0] ? "up" : values[values.length - 1] < values[0] ? "down" : "stable") : "stable",
            }
          : null;

        return {
          tank: {
            id: tank.id,
            name: tank.name,
            type: tank.type,
            photoUrl: tank.photo_url,
          },
          dataPoints,
          stats,
        };
      })
    );

    // Generate AI insight placeholder (actual AI analysis would be a separate endpoint)
    const generateInsight = () => {
      const tanksWithData = comparisonData.filter((d) => d.stats);
      if (tanksWithData.length < 2) {
        return "Not enough data to generate insights. Log more parameters to see comparison insights.";
      }

      const stats = tanksWithData.map((d) => ({
        name: d.tank.name,
        avg: d.stats?.avg || 0,
        latest: d.stats?.latest || 0,
      }));

      const sortedByAvg = [...stats].sort((a, b) => a.avg - b.avg);
      const lowest = sortedByAvg[0];
      const highest = sortedByAvg[sortedByAvg.length - 1];

      const diff = highest.avg - lowest.avg;
      if (diff < 0.1) {
        return `Your tanks show consistent ${parameter.replace("_ppm", "").replace("_f", "")} levels. Great job maintaining stability across your systems!`;
      }

      return `${highest.name} averages ${diff.toFixed(2)} higher ${parameter.replace("_ppm", "").replace("_f", "")} than ${lowest.name}. Consider comparing their filtration, stocking, or feeding routines.`;
    };

    return successResponse({
      parameter,
      days: normalizedDays,
      tanks: comparisonData,
      insight: generateInsight(),
    });
  } catch (error) {
    console.error("Tank comparison GET error:", error);
    return errorResponse("INTERNAL_SERVER_ERROR", "An unexpected error occurred");
  }
}
