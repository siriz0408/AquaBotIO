import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { successResponse, errorResponse } from "@/lib/api/response";

/**
 * GET /api/dashboard
 *
 * Fetch all dashboard data in a single request.
 * This endpoint parallelizes multiple queries to reduce latency.
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

    // Parse optional tank_id query param
    const { searchParams } = new URL(request.url);
    const tankId = searchParams.get("tank_id");

    // Run all queries in parallel for better performance
    const [userResult, tanksResult, subscriptionResult] = await Promise.all([
      // User profile
      supabase
        .from("users")
        .select("id, email, full_name, skill_level, onboarding_completed")
        .eq("id", user.id)
        .single(),

      // User's tanks - only needed columns
      supabase
        .from("tanks")
        .select("id, name, type, volume_gallons, photo_url, created_at")
        .eq("user_id", user.id)
        .is("deleted_at", null)
        .order("created_at", { ascending: false }),

      // User's subscription
      supabase
        .from("subscriptions")
        .select("id, tier, status, trial_ends_at")
        .eq("user_id", user.id)
        .single(),
    ]);

    const { data: profile, error: profileError } = userResult;
    const { data: tanks } = tanksResult;
    const { data: subscription } = subscriptionResult;

    if (profileError || !profile) {
      return errorResponse("NOT_FOUND", "User profile not found");
    }

    // If user hasn't completed onboarding, return early
    if (!profile.onboarding_completed) {
      return successResponse({
        needs_onboarding: true,
        user: profile,
        tanks: [],
        subscription,
      });
    }

    // If no tanks, return early
    if (!tanks || tanks.length === 0) {
      return successResponse({
        user: profile,
        tanks: [],
        subscription,
        selected_tank: null,
        parameters: [],
        maintenance: [],
        livestock: [],
      });
    }

    // Determine selected tank
    const selectedTankId = tankId || tanks[0].id;
    const selectedTank = tanks.find((t) => t.id === selectedTankId) || tanks[0];

    // Fetch tank-specific data in parallel
    const [parametersResult, maintenanceResult, livestockResult] = await Promise.all([
      // Latest water parameters for selected tank - last 5 readings
      supabase
        .from("water_parameters")
        .select("id, measured_at, ph, ammonia_ppm, nitrite_ppm, nitrate_ppm, temperature_f, salinity")
        .eq("tank_id", selectedTank.id)
        .order("measured_at", { ascending: false })
        .limit(5),

      // Upcoming maintenance tasks for selected tank
      supabase
        .from("maintenance_tasks")
        .select("id, type, title, next_due_date, is_active")
        .eq("tank_id", selectedTank.id)
        .is("deleted_at", null)
        .eq("is_active", true)
        .order("next_due_date", { ascending: true })
        .limit(5),

      // Livestock summary for selected tank
      supabase
        .from("livestock")
        .select(`
          id,
          custom_name,
          nickname,
          quantity,
          species:species_id (
            id,
            common_name,
            photo_url
          )
        `)
        .eq("tank_id", selectedTank.id)
        .is("deleted_at", null)
        .eq("is_active", true)
        .limit(6),
    ]);

    const { data: parameters } = parametersResult;
    const { data: maintenance } = maintenanceResult;
    const { data: livestock } = livestockResult;

    // Calculate overdue status for maintenance tasks
    const now = new Date();
    const maintenanceWithOverdue = (maintenance || []).map((task) => ({
      ...task,
      overdue: new Date(task.next_due_date) < now,
    }));

    return successResponse({
      user: profile,
      tanks,
      subscription,
      selected_tank: selectedTank,
      parameters: parameters || [],
      maintenance: maintenanceWithOverdue,
      livestock: livestock || [],
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return errorResponse("INTERNAL_SERVER_ERROR", "An unexpected error occurred");
  }
}
