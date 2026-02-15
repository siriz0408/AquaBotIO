import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { successResponse, errorResponse } from "@/lib/api/response";
import { resolveUserTier } from "@/lib/hooks/use-tier-limits";
import { sendTankReport, generateReportSummary, isEmailEnabled } from "@/lib/email";
import { calculateHealthScore } from "@/lib/health/calculate-health-score";
import { format, addDays } from "date-fns";

/**
 * POST /api/reports/send
 *
 * Generate and send a tank health report to the user.
 * Pro tier only (R-104.4).
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
      return errorResponse("AUTH_REQUIRED", "You must be logged in");
    }

    // Check tier - Pro only
    const tier = await resolveUserTier(supabase, user.id);
    if (tier !== "pro") {
      return errorResponse(
        "TIER_REQUIRED",
        "Email reports require a Pro plan. Upgrade to receive weekly tank health digests.",
        403
      );
    }

    // Check if email is enabled
    if (!isEmailEnabled()) {
      return errorResponse(
        "INTERNAL_SERVER_ERROR",
        "Email service is not configured",
        500
      );
    }

    // Get user profile for name and email
    const { data: profile } = await supabase
      .from("users")
      .select("email, full_name")
      .eq("id", user.id)
      .single();

    if (!profile?.email) {
      return errorResponse("INVALID_INPUT", "User email not found");
    }

    // Optional: Check which tanks to include (from request body)
    const body = await request.json().catch(() => ({}));
    const tankIds: string[] | undefined = body.tank_ids;

    // Get user's tanks
    let tanksQuery = supabase
      .from("tanks")
      .select("id, name, type, volume_gallons")
      .eq("user_id", user.id)
      .is("deleted_at", null);

    if (tankIds && tankIds.length > 0) {
      tanksQuery = tanksQuery.in("id", tankIds);
    }

    const { data: tanks, error: tanksError } = await tanksQuery;

    if (tanksError) {
      console.error("Error fetching tanks:", tanksError);
      return errorResponse("INTERNAL_SERVER_ERROR", "Failed to fetch tanks");
    }

    if (!tanks || tanks.length === 0) {
      return errorResponse("INVALID_INPUT", "No tanks found to report on");
    }

    // Build tank health summaries
    const tankSummaries = await Promise.all(
      tanks.map(async (tank) => {
        // Get latest parameters
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
          .select("id, name, next_due_date, completed_at")
          .eq("tank_id", tank.id)
          .eq("is_active", true);

        // Calculate health score
        const healthScore = calculateHealthScore(
          tank.type,
          params,
          tasks || []
        );

        // Get upcoming tasks (next 7 days)
        const now = new Date();
        const nextWeek = addDays(now, 7);
        const upcomingTasks = (tasks || [])
          .filter((t) => {
            const dueDate = new Date(t.next_due_date);
            return dueDate >= now && dueDate <= nextWeek && !t.completed_at;
          })
          .map((t) => ({
            name: t.name,
            dueDate: format(new Date(t.next_due_date), "MMM d"),
          }));

        return {
          id: tank.id,
          name: tank.name,
          type: tank.type,
          healthScore: healthScore.overall,
          healthStatus: healthScore.status,
          parameterIssues: healthScore.parameterIssues,
          maintenanceIssues: healthScore.maintenanceIssues,
          upcomingTasks,
        };
      })
    );

    // Generate summary
    const overallSummary = generateReportSummary(tankSummaries);

    // Send the email
    const result = await sendTankReport({
      to: profile.email,
      userName: profile.full_name || "Aquarist",
      tanks: tankSummaries,
      overallSummary,
    });

    if (!result.success) {
      return errorResponse("INTERNAL_SERVER_ERROR", result.error || "Failed to send email");
    }

    // Log the report in history (optional - would need report_history table)
    // await supabase.from("report_history").insert({ ... });

    return successResponse({
      sent: true,
      email: profile.email,
      tanks_included: tanks.length,
      message_id: result.id,
    });
  } catch (error) {
    console.error("Report send error:", error);
    return errorResponse("INTERNAL_SERVER_ERROR", "An unexpected error occurred");
  }
}
