import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { successResponse, errorResponse } from "@/lib/api/response";
import { trendAnalysisSchema } from "@/lib/validation/parameters";

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

// Use Sonnet for trend analysis (more analytical capability)
const AI_MODEL = process.env.ANTHROPIC_MODEL_SONNET || "claude-sonnet-4-5-20250929";
const MAX_TOKENS = 2000;
const MAX_RETRIES = 3;

// Rate limits per tier
const RATE_LIMITS = {
  free: 5,
  starter: 50,
  plus: 50,
  pro: 50,
} as const;

/**
 * POST /api/ai/trend-analysis
 *
 * Analyze water parameter trends for a tank.
 * Free tier: statistical trends only.
 * Starter+ tier: AI-generated insights.
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

    // Parse and validate request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return errorResponse("INVALID_INPUT", "Invalid JSON in request body");
    }

    const validationResult = trendAnalysisSchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.flatten().fieldErrors;
      const message = Object.entries(errors)
        .map(([field, messages]) => `${field}: ${(messages || []).join(", ")}`)
        .join("; ");
      return errorResponse("INVALID_INPUT", message || "Invalid input");
    }

    const { tank_id, days } = validationResult.data;

    // Verify user owns this tank
    const { data: tank, error: tankError } = await supabase
      .from("tanks")
      .select("id, user_id, type")
      .eq("id", tank_id)
      .is("deleted_at", null)
      .single();

    if (tankError || !tank) {
      return errorResponse("NOT_FOUND", "Tank not found");
    }

    if (tank.user_id !== user.id) {
      return errorResponse("PERMISSION_DENIED", "You do not have access to this tank");
    }

    // Get user's subscription tier
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("tier, status, trial_ends_at")
      .eq("user_id", user.id)
      .single();

    // Determine tier (trial = pro access)
    let tier: "free" | "starter" | "plus" | "pro" = "free";
    if (subscription) {
      const isTrialing =
        subscription.status === "trialing" &&
        subscription.trial_ends_at &&
        new Date(subscription.trial_ends_at) > new Date();

      if (isTrialing) {
        tier = "pro";
      } else if (subscription.status === "active") {
        tier = subscription.tier as "free" | "starter" | "plus" | "pro";
      }
    }

    // Check rate limit
    const today = new Date().toISOString().split("T")[0];
    const { count: todayCount } = await supabase
      .from("ai_usage")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("feature", "trend_analysis")
      .gte("date", today);

    const limit = RATE_LIMITS[tier];
    if ((todayCount || 0) >= limit) {
      return errorResponse(
        "RATE_LIMIT_EXCEEDED",
        `Maximum ${limit} trend analyses per day for ${tier} tier. Please try again tomorrow.`
      );
    }

    // Fetch water parameters for the period
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateISO = startDate.toISOString();

    const { data: parameters, error: parametersError } = await supabase
      .from("water_parameters")
      .select("*")
      .eq("tank_id", tank_id)
      .gte("measured_at", startDateISO)
      .order("measured_at", { ascending: true });

    if (parametersError) {
      console.error("Error fetching parameters:", parametersError);
      return errorResponse("INTERNAL_SERVER_ERROR", "Failed to fetch parameters");
    }

    const readingCount = parameters?.length || 0;

    // Calculate statistical trends for each parameter
    // Note: water_parameters uses gh_dgh/kh_dgh, but parameter_thresholds uses gh_ppm/kh_ppm
    // We'll map them appropriately when checking thresholds
    const parameterKeys = [
      "temperature_f",
      "ph",
      "ammonia_ppm",
      "nitrite_ppm",
      "nitrate_ppm",
      "gh_dgh",
      "kh_dgh",
      "salinity",
      "calcium_ppm",
      "alkalinity_dkh",
      "magnesium_ppm",
      "phosphate_ppm",
    ] as const;

    // Map water_parameters column names to parameter_thresholds parameter_type
    const thresholdTypeMap: Record<string, string> = {
      gh_dgh: "gh_ppm",
      kh_dgh: "kh_ppm",
      salinity: "salinity_ppt",
    };

    // Get thresholds for status determination
    const { data: customThresholds } = await supabase
      .from("parameter_thresholds")
      .select("*")
      .eq("tank_id", tank_id);

    type ThresholdRow = {
      parameter_type: string;
      safe_min: number | null;
      safe_max: number | null;
      warning_min: number | null;
      warning_max: number | null;
    };

    const thresholdMap = new Map<string, ThresholdRow>();
    (customThresholds || []).forEach((th: ThresholdRow) => {
      thresholdMap.set(th.parameter_type, th);
    });

    const parametersAnalysis: Record<
      string,
      {
        current: number | null;
        min: number;
        max: number;
        avg: number;
        trend: "rising" | "falling" | "stable";
        status: "safe" | "warning" | "danger";
        insight?: string;
      }
    > = {};

    // Analyze each parameter
    for (const paramKey of parameterKeys) {
      // Filter readings that have this parameter
      const readings = (parameters || [])
        .map((p) => p[paramKey] as number | null)
        .filter((v) => v !== null && v !== undefined) as number[];

      if (readings.length === 0) {
        parametersAnalysis[paramKey] = {
          current: null,
          min: 0,
          max: 0,
          avg: 0,
          trend: "stable",
          status: "safe",
        };
        continue;
      }

      const min = Math.min(...readings);
      const max = Math.max(...readings);
      const avg = readings.reduce((sum, v) => sum + v, 0) / readings.length;
      const current = readings[readings.length - 1]; // Most recent

      // Determine trend (compare first half vs second half)
      let trend: "rising" | "falling" | "stable" = "stable";
      if (readings.length >= 4) {
        const midpoint = Math.floor(readings.length / 2);
        const firstHalfAvg =
          readings.slice(0, midpoint).reduce((sum, v) => sum + v, 0) /
          midpoint;
        const secondHalfAvg =
          readings.slice(midpoint).reduce((sum, v) => sum + v, 0) /
          (readings.length - midpoint);

        const diff = secondHalfAvg - firstHalfAvg;
        const threshold = (max - min) * 0.05; // 5% of range

        if (diff > threshold) {
          trend = "rising";
        } else if (diff < -threshold) {
          trend = "falling";
        }
      }

      // Determine status using thresholds
      let status: "safe" | "warning" | "danger" = "safe";
      // Map parameter key to threshold type (gh_dgh -> gh_ppm, etc.)
      const thresholdType = thresholdTypeMap[paramKey] || paramKey;
      const threshold = thresholdMap.get(thresholdType);
      if (threshold && current !== null) {
        const safeMin = threshold.safe_min ? Number(threshold.safe_min) : null;
        const safeMax = threshold.safe_max ? Number(threshold.safe_max) : null;
        const warningMin = threshold.warning_min ? Number(threshold.warning_min) : null;
        const warningMax = threshold.warning_max ? Number(threshold.warning_max) : null;

        if (safeMin !== null && safeMax !== null) {
          if (current >= safeMin && current <= safeMax) {
            status = "safe";
          } else if (
            warningMin !== null &&
            warningMax !== null &&
            current >= warningMin &&
            current <= warningMax
          ) {
            status = "warning";
          } else {
            status = "danger";
          }
        }
      } else {
        // Use defaults from get_parameter_thresholds function
        const { data: defaultThresholds } = await supabase.rpc(
          "get_parameter_thresholds",
          {
            tank_uuid: tank_id,
            param_type: thresholdType,
          }
        );

        if (
          defaultThresholds &&
          Array.isArray(defaultThresholds) &&
          defaultThresholds.length > 0 &&
          current !== null
        ) {
          const defaults = defaultThresholds[0] as {
            safe_min: number | null;
            safe_max: number | null;
            warning_min: number | null;
            warning_max: number | null;
          };
          const safeMin = defaults.safe_min ? Number(defaults.safe_min) : null;
          const safeMax = defaults.safe_max ? Number(defaults.safe_max) : null;
          const warningMin = defaults.warning_min ? Number(defaults.warning_min) : null;
          const warningMax = defaults.warning_max ? Number(defaults.warning_max) : null;

          if (safeMin !== null && safeMax !== null) {
            if (current >= safeMin && current <= safeMax) {
              status = "safe";
            } else if (
              warningMin !== null &&
              warningMax !== null &&
              current >= warningMin &&
              current <= warningMax
            ) {
              status = "warning";
            } else {
              status = "danger";
            }
          }
        }
      }

      parametersAnalysis[paramKey] = {
        current,
        min,
        max,
        avg,
        trend,
        status,
      };
    }

    // Calculate overall health
    const statusCounts = {
      safe: 0,
      warning: 0,
      danger: 0,
    };

    Object.values(parametersAnalysis).forEach((param) => {
      if (param.current !== null) {
        statusCounts[param.status]++;
      }
    });

    const totalParams = Object.values(parametersAnalysis).filter(
      (p) => p.current !== null
    ).length;

    let overallHealth: "excellent" | "good" | "fair" | "poor" = "excellent";
    if (totalParams > 0) {
      const safeRatio = statusCounts.safe / totalParams;
      const dangerRatio = statusCounts.danger / totalParams;

      if (dangerRatio > 0.2) {
        overallHealth = "poor";
      } else if (dangerRatio > 0.1 || safeRatio < 0.7) {
        overallHealth = "fair";
      } else if (safeRatio < 0.9) {
        overallHealth = "good";
      }
    }

    // For paid tiers, generate AI insights
    let aiSummary: string | undefined;
    const insights: Record<string, string> = {};

    if (tier !== "free") {
      // Track usage
      await supabase.from("ai_usage").upsert(
        {
          user_id: user.id,
          date: today,
          feature: "trend_analysis",
          message_count: 1,
        },
        {
          onConflict: "user_id,date,feature",
        }
      );

      // Build AI prompt with parameter data
      const parameterSummary = Object.entries(parametersAnalysis)
        .filter(([_key, data]) => data.current !== null)
        .map(([key, data]) => {
          return `${key}: current=${data.current?.toFixed(2)}, min=${data.min.toFixed(2)}, max=${data.max.toFixed(2)}, avg=${data.avg.toFixed(2)}, trend=${data.trend}, status=${data.status}`;
        })
        .join("\n");

      const systemPrompt = `You are an expert aquarium water quality analyst. Analyze water parameter trends and provide personalized insights.

Tank Type: ${tank.type}
Analysis Period: Last ${days} days
Reading Count: ${readingCount}

Parameter Data:
${parameterSummary}

Overall Health: ${overallHealth}

Provide:
1. A brief summary (2-3 sentences) of overall tank health
2. Specific insights for each parameter that needs attention (status = warning or danger)
3. Actionable recommendations

Respond in JSON format:
{
  "summary": "Overall health summary...",
  "insights": {
    "parameter_name": "Specific insight for this parameter..."
  }
}`;

      let lastError: Error | null = null;

      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
          const response = await anthropic.messages.create({
            model: AI_MODEL,
            max_tokens: MAX_TOKENS,
            system: systemPrompt,
            messages: [
              {
                role: "user",
                content: `Analyze the water parameter trends for this ${tank.type} tank over the last ${days} days.`,
              },
            ],
          });

          const content = response.content[0];
          if (content.type !== "text") {
            throw new Error("Unexpected response type from AI");
          }

          // Parse JSON response
          const jsonMatch = content.text.match(/\{[\s\S]*\}/);
          if (!jsonMatch) {
            throw new Error("No JSON found in AI response");
          }

          const aiResult = JSON.parse(jsonMatch[0]);

          aiSummary = aiResult.summary || "";
          if (aiResult.insights && typeof aiResult.insights === "object") {
            Object.entries(aiResult.insights).forEach(([key, value]) => {
              if (typeof value === "string") {
                insights[key] = value;
              }
            });
          }

          break;
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));
          console.error(`AI trend analysis attempt ${attempt + 1} failed:`, lastError);

          if (attempt < MAX_RETRIES - 1) {
            // Wait before retry (exponential backoff)
            await new Promise((resolve) =>
              setTimeout(resolve, Math.pow(2, attempt) * 1000)
            );
          }
        }
      }

      if (lastError && !aiSummary) {
        console.error("All AI trend analysis attempts failed:", lastError);
        // Continue without AI insights rather than failing
      }
    } else {
      // Free tier: track usage but don't call AI
      await supabase.from("ai_usage").upsert(
        {
          user_id: user.id,
          date: today,
          feature: "trend_analysis",
          message_count: 1,
        },
        {
          onConflict: "user_id,date,feature",
        }
      );
    }

    // Add insights to parameter analysis
    Object.keys(insights).forEach((key) => {
      if (parametersAnalysis[key]) {
        parametersAnalysis[key].insight = insights[key];
      }
    });

    return successResponse({
      tank_id,
      period_days: days,
      reading_count: readingCount,
      parameters: parametersAnalysis,
      overall_health: overallHealth,
      ai_summary: aiSummary,
    });
  } catch (error) {
    console.error("Trend analysis error:", error);
    return errorResponse("INTERNAL_SERVER_ERROR", "An unexpected error occurred");
  }
}
