import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { successResponse, errorResponse } from "@/lib/api/response";
import { alertUpdateSchema } from "@/lib/validation/actions";
import type { SupabaseClient } from "@supabase/supabase-js";

// Alert type for formatting
interface ProactiveAlert {
  id: string;
  tank_id: string;
  user_id: string;
  parameter: string;
  current_value: number | null;
  unit: string | null;
  trend_direction: string;
  trend_rate: number | null;
  projection_text: string | null;
  likely_cause: string | null;
  suggested_action: string | null;
  severity: "info" | "warning" | "alert";
  status: string;
  created_at: string;
  dismissed_at: string | null;
  resolved_at: string | null;
  tank?: {
    id: string;
    name: string;
    type: string;
  };
}

/**
 * Format alerts for chat/AI consumption
 * Returns a human-readable summary suitable for inclusion in AI responses
 */
function formatAlertsForChat(alerts: ProactiveAlert[]): string {
  if (alerts.length === 0) {
    return "No active alerts. Your tank parameters look stable.";
  }

  const lines: string[] = [];

  // Group by severity
  const critical = alerts.filter((a) => a.severity === "alert");
  const warnings = alerts.filter((a) => a.severity === "warning");
  const info = alerts.filter((a) => a.severity === "info");

  if (critical.length > 0) {
    lines.push(`**${critical.length} Critical Alert${critical.length > 1 ? "s" : ""}:**`);
    for (const alert of critical) {
      lines.push(formatSingleAlert(alert));
    }
    lines.push("");
  }

  if (warnings.length > 0) {
    lines.push(`**${warnings.length} Warning${warnings.length > 1 ? "s" : ""}:**`);
    for (const alert of warnings) {
      lines.push(formatSingleAlert(alert));
    }
    lines.push("");
  }

  if (info.length > 0) {
    lines.push(`**${info.length} Info Alert${info.length > 1 ? "s" : ""}:**`);
    for (const alert of info) {
      lines.push(formatSingleAlert(alert));
    }
  }

  return lines.join("\n").trim();
}

/**
 * Format a single alert for display
 */
function formatSingleAlert(alert: ProactiveAlert): string {
  const parts: string[] = [];

  // Parameter and current value
  const valueStr = alert.current_value !== null
    ? ` (${alert.current_value}${alert.unit || ""})`
    : "";
  parts.push(`- **${alert.parameter}**${valueStr}: ${alert.projection_text || "Trend detected"}`);

  // Likely cause if available
  if (alert.likely_cause) {
    parts.push(`  - Cause: ${alert.likely_cause}`);
  }

  // Suggested action if available
  if (alert.suggested_action) {
    parts.push(`  - Action: ${alert.suggested_action}`);
  }

  return parts.join("\n");
}

/**
 * Handle analyze request - trigger trend analysis Edge Function
 * This is used to manually trigger analysis for a tank
 */
async function handleAnalyzeRequest(
  supabase: SupabaseClient,
  userId: string,
  tankId: string
) {
  // Verify user owns the tank
  const { data: tank, error: tankError } = await supabase
    .from("tanks")
    .select("id, user_id")
    .eq("id", tankId)
    .is("deleted_at", null)
    .single();

  if (tankError || !tank) {
    return errorResponse("NOT_FOUND", "Tank not found");
  }

  if (tank.user_id !== userId) {
    return errorResponse("PERMISSION_DENIED", "You do not have access to this tank");
  }

  // Call the Edge Function
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing Supabase configuration for Edge Function call");
    return errorResponse("INTERNAL_SERVER_ERROR", "Configuration error");
  }

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/analyze-parameter-trends`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({ tank_id: tankId }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Edge Function error:", errorText);
      return errorResponse(
        "INTERNAL_SERVER_ERROR",
        `Trend analysis failed: ${response.statusText}`
      );
    }

    const result = await response.json();
    return successResponse(result);
  } catch (error) {
    console.error("Error calling Edge Function:", error);
    return errorResponse("INTERNAL_SERVER_ERROR", "Failed to run trend analysis");
  }
}

/**
 * GET /api/ai/alerts
 *
 * Fetch active proactive alerts for the authenticated user's tanks.
 *
 * Query params:
 * - tank_id (optional): Filter alerts for a specific tank
 * - status (optional): Filter by status (default: 'active')
 * - limit (optional): Max number of alerts to return (default: 50)
 * - format (optional): 'json' (default) or 'chat' for AI-consumable format
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
    const format = searchParams.get("format") || "json"; // 'json' or 'chat'

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

    // Return response based on format
    if (format === "chat") {
      // Return formatted text for AI chat consumption
      const activeAlerts = (alerts || []).filter((a) => a.status === "active") as ProactiveAlert[];
      const chatSummary = formatAlertsForChat(activeAlerts);

      return successResponse({
        summary: chatSummary,
        alerts: activeAlerts,
        count: activeAlerts.length,
        severity_counts: severityCounts,
        has_critical: severityCounts.alert > 0,
        has_warnings: severityCounts.warning > 0,
      });
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
 * Two actions supported:
 * 1. Update an alert's status (dismiss or resolve) - action: 'dismiss' | 'resolve'
 * 2. Trigger trend analysis for a tank - action: 'analyze'
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

    // Check if this is an analyze request
    const rawBody = body as { action?: string; tank_id?: string };
    if (rawBody.action === "analyze" && rawBody.tank_id) {
      return handleAnalyzeRequest(supabase, user.id, rawBody.tank_id);
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
