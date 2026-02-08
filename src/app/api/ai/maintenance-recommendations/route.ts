import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { successResponse, errorResponse } from "@/lib/api/response";
import { buildTankContext } from "@/lib/ai/context-builder";
import { z } from "zod";

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

// Use Sonnet for maintenance recommendations (more complex reasoning)
const AI_MODEL =
  process.env.ANTHROPIC_MODEL_SONNET || "claude-sonnet-4-5-20250929";
const MAX_TOKENS = 2000;
const MAX_RETRIES = 3;

// Validation schema
const maintenanceRecommendationsSchema = z.object({
  tank_id: z.string().uuid("Invalid tank ID"),
});

/**
 * POST /api/ai/maintenance-recommendations
 *
 * Get AI-powered maintenance recommendations for a tank.
 * Free tier: Template-based recommendations
 * Paid tier: Claude AI personalized recommendations
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

    const validationResult = maintenanceRecommendationsSchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.flatten().fieldErrors;
      const message = Object.entries(errors)
        .map(([field, messages]) => `${field}: ${(messages || []).join(", ")}`)
        .join("; ");
      return errorResponse("INVALID_INPUT", message || "Invalid input");
    }

    const { tank_id } = validationResult.data;

    // Verify user owns this tank
    const { data: tank, error: tankError } = await supabase
      .from("tanks")
      .select("id, user_id, type, volume_gallons")
      .eq("id", tank_id)
      .is("deleted_at", null)
      .single();

    if (tankError || !tank) {
      return errorResponse("NOT_FOUND", "Tank not found");
    }

    if (tank.user_id !== user.id) {
      return errorResponse(
        "PERMISSION_DENIED",
        "You do not have access to this tank"
      );
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

    // Get existing maintenance tasks
    const { data: existingTasks } = await supabase
      .from("maintenance_tasks")
      .select("type, title, frequency, next_due_date")
      .eq("tank_id", tank_id)
      .eq("is_active", true)
      .is("deleted_at", null);

    // Get recent water parameters (may be used for future enhancements)
    const { data: _recentParameters } = await supabase
      .from("water_parameters")
      .select("*")
      .eq("tank_id", tank_id)
      .order("measured_at", { ascending: false })
      .limit(5);

    // Get livestock count
    const { data: livestock } = await supabase
      .from("livestock")
      .select("quantity")
      .eq("tank_id", tank_id)
      .eq("is_active", true)
      .is("deleted_at", null);

    const livestockCount =
      livestock?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;

    // Free tier: Return template-based recommendations
    if (tier === "free") {
      const recommendations = generateTemplateRecommendations(
        tank,
        livestockCount,
        existingTasks || []
      );

      return successResponse({
        recommendations,
        ai_powered: false,
      });
    }

    // Paid tier: Use Claude AI for personalized recommendations
    // Check AI usage limit
    const { data: canUse, error: usageError } = await supabase.rpc(
      "check_and_increment_ai_usage",
      {
        user_uuid: user.id,
        feature_name: "maintenance_recommendations",
      }
    );

    if (usageError) {
      console.error("Error checking AI usage:", usageError);
      // Fall back to template recommendations if usage check fails
      const recommendations = generateTemplateRecommendations(
        tank,
        livestockCount,
        existingTasks || []
      );
      return successResponse({
        recommendations,
        ai_powered: false,
      });
    }

    if (!canUse) {
      // Return template recommendations if daily limit reached
      const recommendations = generateTemplateRecommendations(
        tank,
        livestockCount,
        existingTasks || []
      );
      return successResponse({
        recommendations,
        ai_powered: false,
        limit_reached: true,
      });
    }

    // Build tank context for AI
    const tankContext = await buildTankContext(supabase, tank_id, user.id);

    if (!tankContext) {
      return errorResponse(
        "INTERNAL_SERVER_ERROR",
        "Failed to build tank context"
      );
    }

    // Perform AI recommendation check
    const aiRecommendations = await performAIMaintenanceRecommendations(
      tankContext,
      existingTasks || []
    );

    return successResponse({
      recommendations: aiRecommendations,
      ai_powered: true,
    });
  } catch (error) {
    console.error("Maintenance recommendations error:", error);
    return errorResponse(
      "INTERNAL_SERVER_ERROR",
      "An unexpected error occurred"
    );
  }
}

/**
 * Generate template-based recommendations for free tier
 */
function generateTemplateRecommendations(
  tank: { type: string; volume_gallons: number },
  livestockCount: number,
  existingTasks: Array<{ type: string; title: string }>
): Array<{
  type: string;
  title: string;
  description: string;
  suggested_frequency: string;
  priority: "high" | "medium" | "low";
}> {
  const recommendations: Array<{
    type: string;
    title: string;
    description: string;
    suggested_frequency: string;
    priority: "high" | "medium" | "low";
  }> = [];

  const existingTaskTypes = new Set(existingTasks.map((t) => t.type));

  // Water change recommendation (always high priority)
  if (!existingTaskTypes.has("water_change")) {
    const waterChangePercent =
      tank.volume_gallons <= 20 ? 25 : tank.volume_gallons <= 50 ? 20 : 15;
    recommendations.push({
      type: "water_change",
      title: `Weekly ${waterChangePercent}% Water Change`,
      description: `For a ${tank.volume_gallons}-gallon ${tank.type} tank, perform a ${waterChangePercent}% water change weekly to maintain water quality.`,
      suggested_frequency: "weekly",
      priority: "high",
    });
  }

  // Filter cleaning recommendation
  if (!existingTaskTypes.has("filter_cleaning")) {
    recommendations.push({
      type: "filter_cleaning",
      title: "Biweekly Filter Cleaning",
      description: `Clean your filter media every 2 weeks to maintain optimal filtration efficiency.`,
      suggested_frequency: "biweekly",
      priority: "medium",
    });
  }

  // Water testing recommendation
  if (!existingTaskTypes.has("water_testing")) {
    recommendations.push({
      type: "water_testing",
      title: "Weekly Water Parameter Testing",
      description: `Test key parameters (pH, ammonia, nitrite, nitrate) weekly to catch issues early.`,
      suggested_frequency: "weekly",
      priority: "high",
    });
  }

  // Feeding schedule (if livestock present)
  if (livestockCount > 0 && !existingTaskTypes.has("feeding")) {
    recommendations.push({
      type: "feeding",
      title: "Daily Feeding",
      description: `Feed your ${livestockCount} livestock once or twice daily with appropriate amounts.`,
      suggested_frequency: "daily",
      priority: "high",
    });
  }

  // Saltwater-specific recommendations
  if (tank.type === "saltwater" && !existingTaskTypes.has("dosing")) {
    recommendations.push({
      type: "dosing",
      title: "Weekly Reef Supplement Dosing",
      description: `For saltwater tanks, consider dosing calcium, alkalinity, and magnesium weekly to maintain reef health.`,
      suggested_frequency: "weekly",
      priority: "medium",
    });
  }

  return recommendations;
}

/**
 * Perform AI-enhanced maintenance recommendations using Claude Sonnet
 */
async function performAIMaintenanceRecommendations(
  tankContext: {
    tank: {
      name: string;
      type: string;
      volume_gallons: number;
    };
    parameters: Array<{
      date: string;
      ph?: number;
      ammonia?: number;
      nitrite?: number;
      nitrate?: number;
      temperature?: number;
    }>;
    livestock: Array<{
      name: string;
      species?: string;
      quantity: number;
    }>;
    maintenance: Array<{
      type: string;
      title: string;
      next_due?: string;
      last_completed?: string;
    }>;
  },
  existingTasks: Array<{ type: string; title: string; frequency: string }>
): Promise<
  Array<{
    type: string;
    title: string;
    description: string;
    suggested_frequency: string;
    priority: "high" | "medium" | "low";
  }>
> {
  const _existingTaskTypes = new Set(existingTasks.map((t) => t.type));

  // Build context string for AI
  const parametersSummary =
    tankContext.parameters.length > 0
      ? `Recent parameters: ${tankContext.parameters
          .slice(0, 3)
          .map(
            (p) =>
              `pH ${p.ph?.toFixed(1) || "N/A"}, Ammonia ${p.ammonia?.toFixed(2) || "N/A"}ppm, Nitrate ${p.nitrate?.toFixed(1) || "N/A"}ppm`
          )
          .join("; ")}`
      : "No recent parameter readings";

  const livestockSummary =
    tankContext.livestock.length > 0
      ? `Livestock: ${tankContext.livestock
          .map((l) => `${l.quantity}x ${l.name}`)
          .join(", ")}`
      : "No active livestock";

  const systemPrompt = `You are an expert aquarium maintenance advisor. Analyze a tank's setup and provide personalized maintenance recommendations.

Tank Details:
- Name: ${tankContext.tank.name}
- Type: ${tankContext.tank.type}
- Volume: ${tankContext.tank.volume_gallons} gallons
${parametersSummary}
${livestockSummary}
Existing Tasks: ${existingTasks.map((t) => t.title).join(", ") || "None"}

Provide maintenance recommendations as a JSON array. Each recommendation should have:
- type: one of "water_change", "filter_cleaning", "feeding", "dosing", "equipment_maintenance", "water_testing", "custom"
- title: Short, actionable title (e.g., "Weekly 25% Water Change")
- description: 1-2 sentence explanation of why this is recommended
- suggested_frequency: "daily", "weekly", "biweekly", "monthly", or "custom"
- priority: "high", "medium", or "low"

Focus on:
1. Tasks NOT already in existing tasks
2. Tank-specific needs based on type, size, and livestock
3. Parameter trends if available
4. Standard best practices for ${tankContext.tank.type} tanks

Return ONLY a valid JSON array, no other text.`;

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
            content: `Provide maintenance recommendations for this ${tankContext.tank.type} tank.`,
          },
        ],
      });

      const content = response.content[0];
      if (content.type !== "text") {
        throw new Error("Unexpected response type from AI");
      }

      // Parse JSON response
      const jsonMatch = content.text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error("No JSON array found in AI response");
      }

      const aiRecommendations = JSON.parse(jsonMatch[0]);

      // Validate and normalize response
      if (!Array.isArray(aiRecommendations)) {
        throw new Error("AI response is not an array");
      }

      return aiRecommendations.map((rec: { type?: string; title?: string; description?: string; suggested_frequency?: string; priority?: string }) => ({
        type: rec.type || "custom",
        title: rec.title || "Maintenance Task",
        description: rec.description || "",
        suggested_frequency: rec.suggested_frequency || "weekly",
        priority:
          rec.priority === "high" || rec.priority === "medium"
            ? rec.priority
            : "low",
      }));
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(
        `AI maintenance recommendations attempt ${attempt + 1} failed:`,
        lastError
      );

      if (attempt < MAX_RETRIES - 1) {
        // Wait before retry (exponential backoff)
        await new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, attempt) * 1000)
        );
      }
    }
  }

  // If all retries failed, fall back to template recommendations
  console.error("All AI maintenance recommendation attempts failed:", lastError);
  return generateTemplateRecommendations(
    tankContext.tank,
    tankContext.livestock.reduce((sum, l) => sum + l.quantity, 0),
    existingTasks
  );
}
