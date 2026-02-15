import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { successResponse, errorResponse } from "@/lib/api/response";
import { calculateHealthScore } from "@/lib/health/calculate-health-score";

/**
 * GET /api/tanks/health
 *
 * Get health scores for all user's tanks.
 * Available to all authenticated users.
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

    // Get all user's tanks
    const { data: tanks, error: tanksError } = await supabase
      .from("tanks")
      .select("id, name, type, volume_gallons, photo_url")
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (tanksError) {
      console.error("Error fetching tanks:", tanksError);
      return errorResponse("INTERNAL_SERVER_ERROR", "Failed to fetch tanks");
    }

    if (!tanks || tanks.length === 0) {
      return successResponse({ tanks: [], summary: null });
    }

    // Get latest parameters and maintenance tasks for each tank
    const tankHealthData = await Promise.all(
      tanks.map(async (tank) => {
        // Get latest water parameters
        const { data: params } = await supabase
          .from("water_parameters")
          .select("temperature_f, ph, ammonia_ppm, nitrite_ppm, nitrate_ppm, salinity_ppt, calcium_ppm, alkalinity_dkh, measured_at")
          .eq("tank_id", tank.id)
          .order("measured_at", { ascending: false })
          .limit(1)
          .single();

        // Get active maintenance tasks
        const { data: tasks } = await supabase
          .from("maintenance_tasks")
          .select("id, next_due_date, completed_at")
          .eq("tank_id", tank.id)
          .eq("is_active", true);

        // Calculate health score
        const healthScore = calculateHealthScore(
          tank.type,
          params,
          tasks || []
        );

        return {
          ...tank,
          healthScore,
          latestParams: params,
          overdueTasks: tasks?.filter(
            (t) => new Date(t.next_due_date) < new Date() && !t.completed_at
          ).length || 0,
        };
      })
    );

    // Calculate summary stats
    const summary = {
      totalTanks: tanks.length,
      excellent: tankHealthData.filter((t) => t.healthScore.status === "excellent").length,
      good: tankHealthData.filter((t) => t.healthScore.status === "good").length,
      fair: tankHealthData.filter((t) => t.healthScore.status === "fair").length,
      poor: tankHealthData.filter((t) => t.healthScore.status === "poor").length,
      critical: tankHealthData.filter((t) => t.healthScore.status === "critical").length,
      averageScore: Math.round(
        tankHealthData.reduce((sum, t) => sum + t.healthScore.overall, 0) / tanks.length
      ),
      tanksNeedingAttention: tankHealthData.filter(
        (t) => t.healthScore.status === "fair" || t.healthScore.status === "poor" || t.healthScore.status === "critical"
      ).length,
    };

    return successResponse({
      tanks: tankHealthData,
      summary,
    });
  } catch (error) {
    console.error("Tank health GET error:", error);
    return errorResponse("INTERNAL_SERVER_ERROR", "An unexpected error occurred");
  }
}
