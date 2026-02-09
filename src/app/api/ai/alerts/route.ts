import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { successResponse, errorResponse } from "@/lib/api/response";
import { alertUpdateSchema } from "@/lib/validation/actions";

/**
 * GET /api/ai/alerts
 *
 * Fetch active proactive alerts for the authenticated user's tanks.
 *
 * Query params:
 * - tank_id (optional): Filter alerts for a specific tank
 * - status (optional): Filter by status (default: 'active')
 * - limit (optional): Max number of alerts to return (default: 50)
 *
 * Per Spec 17: AI Proactive Intelligence & Action Execution (R-017.1)
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
      return errorResponse("AUTH_REQUIRED", "You must be logged in to view alerts");
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const tankId = searchParams.get("tank_id");
    const status = searchParams.get("status") || "active";
    const limitParam = searchParams.get("limit");

    // Validate status
    const validStatuses = ["active", "dismissed", "resolved", "all"];
    if (!validStatuses.includes(status)) {
      return errorResponse(
        "INVALID_INPUT",
        `Invalid status. Must be one of: ${validStatuses.join(", ")}`
      );
    }

    // Validate limit
    let limit = 50;
    if (limitParam) {
      limit = parseInt(limitParam, 10);
      if (isNaN(limit) || limit < 1 || limit > 200) {
        return errorResponse("INVALID_INPUT", "Limit must be between 1 and 200");
      }
    }

    // If tank_id provided, verify ownership
    if (tankId) {
      const { data: tank, error: tankError } = await supabase
        .from("tanks")
        .select("id, user_id")
        .eq("id", tankId)
        .is("deleted_at", null)
        .single();

      if (tankError || !tank) {
        return errorResponse("NOT_FOUND", "Tank not found");
      }

      if (tank.user_id !== user.id) {
        return errorResponse("PERMISSION_DENIED", "You do not have access to this tank");
      }
    }

    // Build query
    let query = supabase
      .from("proactive_alerts")
      .select(`
        *,
        tank:tank_id (
          id,
          name,
          type
        )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(limit);

    // Apply filters
    if (tankId) {
      query = query.eq("tank_id", tankId);
    }

    if (status !== "all") {
      query = query.eq("status", status);
    }

    const { data: alerts, error: alertsError } = await query;

    if (alertsError) {
      console.error("Error fetching alerts:", alertsError);
      return errorResponse("INTERNAL_SERVER_ERROR", "Failed to fetch alerts");
    }

    // Calculate counts by severity for active alerts
    let severityCounts = { info: 0, warning: 0, alert: 0 };
    if (alerts) {
      const activeAlerts = alerts.filter((a) => a.status === "active");
      severityCounts = activeAlerts.reduce(
        (counts, alert) => {
          counts[alert.severity as keyof typeof counts]++;
          return counts;
        },
        { info: 0, warning: 0, alert: 0 }
      );
    }

    return successResponse({
      alerts: alerts || [],
      count: alerts?.length || 0,
      active_count: alerts?.filter((a) => a.status === "active").length || 0,
      severity_counts: severityCounts,
    });
  } catch (error) {
    console.error("Alerts GET error:", error);
    return errorResponse("INTERNAL_SERVER_ERROR", "An unexpected error occurred");
  }
}

/**
 * POST /api/ai/alerts
 *
 * Update an alert's status (dismiss or resolve).
 *
 * Per Spec 17: AI Proactive Intelligence & Action Execution (R-017.1)
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
      return errorResponse("AUTH_REQUIRED", "You must be logged in to update alerts");
    }

    // Parse and validate request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return errorResponse("INVALID_INPUT", "Invalid JSON in request body");
    }

    const validationResult = alertUpdateSchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.flatten().fieldErrors;
      const message = Object.entries(errors)
        .map(([field, messages]) => `${field}: ${(messages || []).join(", ")}`)
        .join("; ");
      return errorResponse("INVALID_INPUT", message || "Invalid request");
    }

    const { action, alert_id, resolved_by_action_id } = validationResult.data;

    // Verify alert exists and belongs to user
    const { data: alert, error: alertError } = await supabase
      .from("proactive_alerts")
      .select("id, user_id, status")
      .eq("id", alert_id)
      .single();

    if (alertError || !alert) {
      return errorResponse("NOT_FOUND", "Alert not found");
    }

    if (alert.user_id !== user.id) {
      return errorResponse("PERMISSION_DENIED", "You do not have access to this alert");
    }

    // Check if alert is already processed
    if (alert.status !== "active") {
      return errorResponse(
        "CONFLICT",
        `Alert is already ${alert.status}. Only active alerts can be updated.`
      );
    }

    // Prepare update based on action
    const now = new Date().toISOString();
    let updateData: Record<string, unknown>;

    if (action === "dismiss") {
      updateData = {
        status: "dismissed",
        dismissed_at: now,
      };
    } else if (action === "resolve") {
      updateData = {
        status: "resolved",
        resolved_at: now,
        resolved_by_action_id: resolved_by_action_id || null,
      };
    } else {
      return errorResponse("INVALID_INPUT", "Invalid action. Must be 'dismiss' or 'resolve'.");
    }

    // Update the alert
    const { data: updatedAlert, error: updateError } = await supabase
      .from("proactive_alerts")
      .update(updateData)
      .eq("id", alert_id)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating alert:", updateError);
      return errorResponse("INTERNAL_SERVER_ERROR", "Failed to update alert");
    }

    return successResponse({
      alert: updatedAlert,
      message: `Alert ${action === "dismiss" ? "dismissed" : "resolved"} successfully`,
    });
  } catch (error) {
    console.error("Alerts POST error:", error);
    return errorResponse("INTERNAL_SERVER_ERROR", "An unexpected error occurred");
  }
}
