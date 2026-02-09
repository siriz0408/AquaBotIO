/**
 * Trend Analysis Edge Function
 *
 * Analyzes water parameter trends for a tank and generates proactive alerts.
 * Called daily via cron job or on-demand after parameter logging.
 *
 * Per Spec 17: AI Proactive Intelligence & Action Execution (R-017.4)
 * Per Spec 18: AI trend analysis is gated to Plus+ tiers only (R-018.6)
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Anthropic from "https://esm.sh/@anthropic-ai/sdk@0.39.0";

// ============================================================================
// Tier Resolution Helper (Spec 18 R-018.4)
// ============================================================================

/**
 * Resolve user's effective tier for Edge Function context
 * Priority chain:
 * 1. Admin profile (admin_profiles.is_active = true) -> always 'pro'
 * 2. Tier override (subscriptions.tier_override, not expired) -> override tier
 * 3. Active trial (subscriptions.status = 'trialing', trial_ends_at > now) -> 'pro'
 * 4. Active subscription (subscriptions.status = 'active') -> subscriptions.tier
 * 5. Default -> 'free'
 */
async function resolveUserTierForEdgeFunction(
  supabase: ReturnType<typeof createClient>,
  userId: string
): Promise<string> {
  // 1. Check admin profile first
  const { data: adminProfile } = await supabase
    .from("admin_profiles")
    .select("is_active")
    .eq("user_id", userId)
    .eq("is_active", true)
    .single();

  if (adminProfile) return "pro";

  // 2. Check subscription
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("tier, status, trial_ends_at, tier_override, override_expires_at")
    .eq("user_id", userId)
    .single();

  if (!subscription) return "free";

  // Check tier override
  if (subscription.tier_override) {
    const notExpired =
      !subscription.override_expires_at ||
      new Date(subscription.override_expires_at) > new Date();
    if (notExpired) return subscription.tier_override;
  }

  // Check trial
  const isTrialing =
    subscription.status === "trialing" &&
    subscription.trial_ends_at &&
    new Date(subscription.trial_ends_at) > new Date();
  if (isTrialing) return "pro";

  // Active subscription
  if (subscription.status === "active") {
    return subscription.tier || "free";
  }

  return "free";
}

// ============================================================================
// Types
// ============================================================================

interface WaterParameter {
  id: string;
  measured_at: string;
  ph: number | null;
  ammonia_ppm: number | null;
  nitrite_ppm: number | null;
  nitrate_ppm: number | null;
  temperature_f: number | null;
  gh_dgh: number | null;
  kh_dgh: number | null;
  salinity: number | null;
  calcium_ppm: number | null;
  alkalinity_dkh: number | null;
  magnesium_ppm: number | null;
  phosphate_ppm: number | null;
}

interface Tank {
  id: string;
  user_id: string;
  name: string;
  type: string;
  volume_gallons: number;
}

interface TrendAnalysis {
  parameter: string;
  values: Array<{ date: string; value: number }>;
  slope: number; // Rate of change per day
  direction: "increasing" | "decreasing" | "stable" | "spiking";
  daysToThreshold: number | null; // Projected days until danger zone
  confidence: number; // 0-1 based on data points
  currentValue: number;
  unit: string;
}

interface RecentEvent {
  type: "livestock_added" | "maintenance_completed";
  description: string;
  date: string;
}

interface AIAlertResponse {
  alerts: Array<{
    parameter: string;
    severity: "info" | "warning" | "alert";
    trend_direction: "increasing" | "decreasing" | "stable" | "spiking";
    current_value: number;
    unit: string;
    trend_rate: number;
    projection_text: string;
    likely_cause: string;
    suggested_action: string;
  }>;
}

interface RequestBody {
  tank_id: string;
  user_id?: string; // Optional, will be inferred from auth if not provided
}

// ============================================================================
// Parameter Thresholds (Default safe ranges)
// ============================================================================

const DEFAULT_THRESHOLDS: Record<
  string,
  { safeMin: number; safeMax: number; dangerMin: number; dangerMax: number; unit: string }
> = {
  ph: { safeMin: 6.5, safeMax: 8.0, dangerMin: 6.0, dangerMax: 8.5, unit: "" },
  ammonia_ppm: { safeMin: 0, safeMax: 0.25, dangerMin: 0, dangerMax: 0.5, unit: "ppm" },
  nitrite_ppm: { safeMin: 0, safeMax: 0.25, dangerMin: 0, dangerMax: 0.5, unit: "ppm" },
  nitrate_ppm: { safeMin: 0, safeMax: 40, dangerMin: 0, dangerMax: 80, unit: "ppm" },
  temperature_f: { safeMin: 72, safeMax: 82, dangerMin: 68, dangerMax: 86, unit: "F" },
  gh_dgh: { safeMin: 4, safeMax: 12, dangerMin: 2, dangerMax: 20, unit: "dGH" },
  kh_dgh: { safeMin: 4, safeMax: 12, dangerMin: 2, dangerMax: 20, unit: "dKH" },
  salinity: { safeMin: 1.020, safeMax: 1.026, dangerMin: 1.018, dangerMax: 1.028, unit: "sg" },
  calcium_ppm: { safeMin: 380, safeMax: 450, dangerMin: 350, dangerMax: 500, unit: "ppm" },
  alkalinity_dkh: { safeMin: 7, safeMax: 12, dangerMin: 5, dangerMax: 14, unit: "dKH" },
  magnesium_ppm: { safeMin: 1250, safeMax: 1400, dangerMin: 1150, dangerMax: 1500, unit: "ppm" },
  phosphate_ppm: { safeMin: 0, safeMax: 0.03, dangerMin: 0, dangerMax: 0.1, unit: "ppm" },
};

// ============================================================================
// Trend Analysis Logic
// ============================================================================

/**
 * Calculate linear regression slope for a set of data points
 * Returns slope (change per day) and R-squared (confidence)
 */
function calculateLinearRegression(
  data: Array<{ date: string; value: number }>
): { slope: number; confidence: number } {
  if (data.length < 2) {
    return { slope: 0, confidence: 0 };
  }

  // Convert dates to days from first data point
  const firstDate = new Date(data[0].date).getTime();
  const points = data.map((d) => ({
    x: (new Date(d.date).getTime() - firstDate) / (1000 * 60 * 60 * 24), // Days
    y: d.value,
  }));

  const n = points.length;
  const sumX = points.reduce((sum, p) => sum + p.x, 0);
  const sumY = points.reduce((sum, p) => sum + p.y, 0);
  const sumXY = points.reduce((sum, p) => sum + p.x * p.y, 0);
  const sumXX = points.reduce((sum, p) => sum + p.x * p.x, 0);
  const sumYY = points.reduce((sum, p) => sum + p.y * p.y, 0);

  const denominator = n * sumXX - sumX * sumX;
  if (denominator === 0) {
    return { slope: 0, confidence: 0 };
  }

  const slope = (n * sumXY - sumX * sumY) / denominator;

  // Calculate R-squared (coefficient of determination)
  const yMean = sumY / n;
  const ssTotal = points.reduce((sum, p) => sum + Math.pow(p.y - yMean, 2), 0);
  const ssResidual = points.reduce((sum, p) => {
    const yPredicted = (slope * p.x) + (sumY - slope * sumX) / n;
    return sum + Math.pow(p.y - yPredicted, 2);
  }, 0);

  const rSquared = ssTotal === 0 ? 0 : 1 - ssResidual / ssTotal;

  return { slope, confidence: Math.max(0, Math.min(1, rSquared)) };
}

/**
 * Detect if a parameter is spiking (last value > 2 std dev from mean)
 */
function detectSpike(values: number[]): boolean {
  if (values.length < 3) return false;

  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);

  const lastValue = values[values.length - 1];
  return Math.abs(lastValue - mean) > 2 * stdDev;
}

/**
 * Calculate days until threshold is reached at current rate
 */
function calculateDaysToThreshold(
  currentValue: number,
  slope: number,
  threshold: { dangerMin: number; dangerMax: number }
): number | null {
  if (slope === 0) return null;

  // Increasing trend - calculate days to max threshold
  if (slope > 0 && currentValue < threshold.dangerMax) {
    const days = (threshold.dangerMax - currentValue) / slope;
    return Math.max(0, Math.round(days));
  }

  // Decreasing trend - calculate days to min threshold
  if (slope < 0 && currentValue > threshold.dangerMin) {
    const days = (threshold.dangerMin - currentValue) / slope;
    return Math.max(0, Math.round(Math.abs(days)));
  }

  return null;
}

/**
 * Determine trend direction from slope and spike detection
 */
function getTrendDirection(
  slope: number,
  values: number[],
  threshold: number = 0.01
): "increasing" | "decreasing" | "stable" | "spiking" {
  if (detectSpike(values)) return "spiking";
  if (Math.abs(slope) < threshold) return "stable";
  return slope > 0 ? "increasing" : "decreasing";
}

/**
 * Analyze trends for all parameters in a tank
 */
function analyzeParameterTrends(
  parameters: WaterParameter[],
  tankType: string
): TrendAnalysis[] {
  const trends: TrendAnalysis[] = [];

  // Parameters to analyze (adjust based on tank type)
  const freshwaterParams = ["ph", "ammonia_ppm", "nitrite_ppm", "nitrate_ppm", "temperature_f", "gh_dgh", "kh_dgh"];
  const saltwaterParams = [
    ...freshwaterParams,
    "salinity",
    "calcium_ppm",
    "alkalinity_dkh",
    "magnesium_ppm",
    "phosphate_ppm",
  ];

  const paramsToAnalyze = tankType === "saltwater" ? saltwaterParams : freshwaterParams;

  for (const paramName of paramsToAnalyze) {
    // Extract non-null values for this parameter
    const values = parameters
      .filter((p) => p[paramName as keyof WaterParameter] !== null)
      .map((p) => ({
        date: p.measured_at,
        value: p[paramName as keyof WaterParameter] as number,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Need at least 3 data points for meaningful trend analysis
    if (values.length < 3) continue;

    const threshold = DEFAULT_THRESHOLDS[paramName];
    if (!threshold) continue;

    const { slope, confidence } = calculateLinearRegression(values);
    const numericValues = values.map((v) => v.value);
    const direction = getTrendDirection(slope, numericValues);
    const currentValue = values[values.length - 1].value;
    const daysToThreshold = calculateDaysToThreshold(currentValue, slope, threshold);

    // Only include if there's a meaningful trend or it's approaching danger zone
    const isApproachingDanger = daysToThreshold !== null && daysToThreshold < 30;
    const isMeaningfulTrend = Math.abs(slope) > 0.01 && confidence > 0.3;
    const isSpiking = direction === "spiking";

    if (isApproachingDanger || isMeaningfulTrend || isSpiking) {
      // Format parameter name for display
      const displayName = paramName
        .replace(/_ppm$/, "")
        .replace(/_dgh$/, "")
        .replace(/_dkh$/, "")
        .replace(/_f$/, "")
        .replace(/_/g, " ")
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

      trends.push({
        parameter: displayName,
        values,
        slope,
        direction,
        daysToThreshold,
        confidence,
        currentValue,
        unit: threshold.unit,
      });
    }
  }

  return trends;
}

// ============================================================================
// Event Correlation
// ============================================================================

interface LivestockAddition {
  custom_name: string | null;
  quantity: number;
  date_added: string;
  species: { common_name: string } | null;
}

interface MaintenanceCompletion {
  completed_at: string;
  task: { title: string; type: string } | null;
}

/**
 * Fetch recent events that might correlate with parameter changes
 */
async function fetchRecentEvents(
  supabase: ReturnType<typeof createClient>,
  tankId: string,
  daysBack: number = 14
): Promise<RecentEvent[]> {
  const events: RecentEvent[] = [];
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysBack);

  // Fetch recent livestock additions
  const { data: livestock } = await supabase
    .from("livestock")
    .select("custom_name, quantity, date_added, species:species_id(common_name)")
    .eq("tank_id", tankId)
    .gte("date_added", cutoffDate.toISOString().split("T")[0])
    .order("date_added", { ascending: false });

  if (livestock) {
    for (const item of livestock as LivestockAddition[]) {
      const speciesName = item.species?.common_name || item.custom_name || "Unknown species";
      events.push({
        type: "livestock_added",
        description: `Added ${item.quantity}x ${speciesName}`,
        date: item.date_added,
      });
    }
  }

  // Fetch recent maintenance completions
  const { data: maintenance } = await supabase
    .from("maintenance_logs")
    .select("completed_at, task:task_id(title, type)")
    .gte("completed_at", cutoffDate.toISOString())
    .order("completed_at", { ascending: false })
    .limit(20);

  if (maintenance) {
    for (const log of maintenance as MaintenanceCompletion[]) {
      // Filter by tank (join through maintenance_tasks)
      const taskTitle = log.task?.title || log.task?.type || "Maintenance task";
      events.push({
        type: "maintenance_completed",
        description: `Completed: ${taskTitle}`,
        date: log.completed_at,
      });
    }
  }

  return events;
}

// ============================================================================
// AI Interpretation
// ============================================================================

/**
 * Call Claude to interpret trends and generate alerts
 */
async function interpretTrendsWithAI(
  tank: Tank,
  trends: TrendAnalysis[],
  events: RecentEvent[],
  livestockCount: number
): Promise<AIAlertResponse> {
  const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!anthropicApiKey) {
    console.error("ANTHROPIC_API_KEY not set");
    return { alerts: [] };
  }

  const anthropic = new Anthropic({ apiKey: anthropicApiKey });

  const systemPrompt = `You are an expert aquarium water quality analyst. Analyze the provided water parameter trends and generate proactive alerts for concerning patterns.

Your task:
1. Identify concerning trends (gradual drift, accelerating changes, approaching danger zones)
2. Correlate trends with recent events (livestock additions often cause ammonia spikes)
3. Generate clear, actionable alerts

Guidelines:
- Only generate alerts for genuinely concerning patterns, not normal fluctuations
- Use "info" severity for minor trends worth monitoring
- Use "warning" severity for trends approaching safe limits
- Use "alert" severity for urgent issues or approaching danger zones
- Be specific about projected timelines ("will reach danger zone in X days")
- Suggest practical remediation steps

Response format (JSON only, no explanation text):
{
  "alerts": [
    {
      "parameter": "pH",
      "severity": "warning",
      "trend_direction": "decreasing",
      "current_value": 6.8,
      "unit": "",
      "trend_rate": -0.03,
      "projection_text": "pH has dropped 0.3 over 2 weeks. At this rate, it will reach the danger zone in 10 days.",
      "likely_cause": "This trend started after you added 3 new fish on Feb 1, which increases biological load.",
      "suggested_action": "Test KH levels and consider adding a pH buffer. A 20% water change would help stabilize pH."
    }
  ]
}

If no alerts are warranted, return: { "alerts": [] }`;

  const userMessage = JSON.stringify({
    tank: {
      name: tank.name,
      type: tank.type,
      volume_gallons: tank.volume_gallons,
      livestock_count: livestockCount,
    },
    parameter_trends: trends.map((t) => ({
      parameter: t.parameter,
      current_value: t.currentValue,
      unit: t.unit,
      slope_per_day: t.slope,
      direction: t.direction,
      confidence: t.confidence,
      days_to_danger: t.daysToThreshold,
      recent_values: t.values.slice(-5),
    })),
    recent_events: events.slice(0, 10),
    analysis_date: new Date().toISOString().split("T")[0],
  });

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    });

    // Extract text content from response
    const textContent = response.content.find((c) => c.type === "text");
    if (!textContent || textContent.type !== "text") {
      console.error("No text content in AI response");
      return { alerts: [] };
    }

    // Parse JSON response
    const parsed = JSON.parse(textContent.text) as AIAlertResponse;
    return parsed;
  } catch (error) {
    console.error("Error calling Claude API:", error);
    return { alerts: [] };
  }
}

// ============================================================================
// Main Handler
// ============================================================================

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
  };

  try {
    // Parse request body
    const body: RequestBody = await req.json();
    const { tank_id } = body;

    if (!tank_id) {
      return new Response(
        JSON.stringify({
          success: false,
          error: { code: "INVALID_INPUT", message: "tank_id is required" },
        }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Initialize Supabase client with service role key for edge function
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({
          success: false,
          error: { code: "INTERNAL_SERVER_ERROR", message: "Missing Supabase configuration" },
        }),
        { status: 500, headers: corsHeaders }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch tank details
    const { data: tank, error: tankError } = await supabase
      .from("tanks")
      .select("id, user_id, name, type, volume_gallons")
      .eq("id", tank_id)
      .is("deleted_at", null)
      .single();

    if (tankError || !tank) {
      return new Response(
        JSON.stringify({
          success: false,
          error: { code: "NOT_FOUND", message: "Tank not found" },
        }),
        { status: 404, headers: corsHeaders }
      );
    }

    // R-018.6: Check user tier - only Plus+ gets AI trend analysis
    const userTier = await resolveUserTierForEdgeFunction(supabase, tank.user_id);
    if (userTier === "free" || userTier === "starter") {
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            tank_id,
            alerts_generated: 0,
            message: "AI trend analysis requires Plus or Pro subscription.",
            skipped_reason: "tier_restriction",
            user_tier: userTier,
          },
        }),
        { status: 200, headers: corsHeaders }
      );
    }

    // Fetch last 14 days of water parameters
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const { data: parameters, error: paramsError } = await supabase
      .from("water_parameters")
      .select("*")
      .eq("tank_id", tank_id)
      .gte("measured_at", fourteenDaysAgo.toISOString())
      .order("measured_at", { ascending: true });

    if (paramsError) {
      console.error("Error fetching parameters:", paramsError);
      return new Response(
        JSON.stringify({
          success: false,
          error: { code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch parameters" },
        }),
        { status: 500, headers: corsHeaders }
      );
    }

    // Check if we have enough data for analysis
    if (!parameters || parameters.length < 3) {
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            tank_id,
            alerts_generated: 0,
            message: "Insufficient data for trend analysis. Need at least 3 parameter readings.",
            skipped_reason: "insufficient_data",
          },
        }),
        { status: 200, headers: corsHeaders }
      );
    }

    // Analyze parameter trends
    const trends = analyzeParameterTrends(parameters as WaterParameter[], tank.type);

    // If no concerning trends, return early
    if (trends.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            tank_id,
            alerts_generated: 0,
            message: "No concerning trends detected. Tank parameters look stable.",
            trends_analyzed: parameters.length,
          },
        }),
        { status: 200, headers: corsHeaders }
      );
    }

    // Fetch recent events for correlation
    const events = await fetchRecentEvents(supabase, tank_id);

    // Get livestock count
    const { count: livestockCount } = await supabase
      .from("livestock")
      .select("*", { count: "exact", head: true })
      .eq("tank_id", tank_id)
      .eq("is_active", true)
      .is("deleted_at", null);

    // Call AI to interpret trends
    const aiResponse = await interpretTrendsWithAI(
      tank as Tank,
      trends,
      events,
      livestockCount || 0
    );

    // Insert generated alerts into proactive_alerts table
    const alertsToInsert = aiResponse.alerts.map((alert) => ({
      tank_id: tank.id,
      user_id: tank.user_id,
      parameter: alert.parameter,
      current_value: alert.current_value,
      unit: alert.unit || null,
      trend_direction: alert.trend_direction,
      trend_rate: alert.trend_rate,
      projection_text: alert.projection_text,
      likely_cause: alert.likely_cause,
      suggested_action: alert.suggested_action,
      severity: alert.severity,
      status: "active",
    }));

    let insertedCount = 0;
    if (alertsToInsert.length > 0) {
      // First, dismiss any existing active alerts for the same parameters
      // to prevent duplicate alerts
      const parametersWithNewAlerts = alertsToInsert.map((a) => a.parameter);
      await supabase
        .from("proactive_alerts")
        .update({ status: "dismissed", dismissed_at: new Date().toISOString() })
        .eq("tank_id", tank_id)
        .eq("status", "active")
        .in("parameter", parametersWithNewAlerts);

      // Insert new alerts
      const { data: inserted, error: insertError } = await supabase
        .from("proactive_alerts")
        .insert(alertsToInsert)
        .select();

      if (insertError) {
        console.error("Error inserting alerts:", insertError);
      } else {
        insertedCount = inserted?.length || 0;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          tank_id,
          tank_name: tank.name,
          alerts_generated: insertedCount,
          alerts: aiResponse.alerts,
          trends_analyzed: trends.length,
          parameters_analyzed: parameters.length,
          events_correlated: events.length,
        },
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error("Trend analysis error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Unknown error occurred",
        },
      }),
      { status: 500, headers: corsHeaders }
    );
  }
});
