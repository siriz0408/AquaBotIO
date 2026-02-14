import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { successResponse, errorResponse } from "@/lib/api/response";
import { sendPushNotification, createAIInsightPayload } from "@/lib/notifications/push";
import { generateCoachingMessage, type CoachingContext } from "@/lib/ai/coaching";
import { z } from "zod";

/**
 * Get a service role client for admin operations that bypass RLS
 */
function getServiceRoleClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase service role configuration");
  }

  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * POST /api/ai/coaching
 *
 * Generate and send a personalized AI coaching tip to the user.
 * Can optionally focus on a specific tank or use the user's first tank.
 * Tracks AI usage and enforces tier limits.
 *
 * Spec Reference: 17_AI_Proactive_Intelligence_Spec.md
 */

// Request validation schema
const coachingRequestSchema = z.object({
  tank_id: z.string().uuid("Invalid tank ID").optional(),
  dry_run: z.boolean().optional().default(false),
});

/* eslint-disable @typescript-eslint/no-explicit-any */
export async function POST(request: NextRequest) {
  try {
    // Initialize Supabase client
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return errorResponse("AUTH_REQUIRED", "You must be logged in to use AI coaching");
    }

    // Parse and validate request body
    let body: unknown = {};
    try {
      const text = await request.text();
      if (text) {
        body = JSON.parse(text);
      }
    } catch {
      return errorResponse("INVALID_INPUT", "Invalid JSON in request body");
    }

    const validation = coachingRequestSchema.safeParse(body);
    if (!validation.success) {
      const errors = validation.error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join("; ");
      return errorResponse("INVALID_INPUT", errors);
    }

    const { tank_id, dry_run } = validation.data;

    // Check and increment AI usage (rate limiting)
    const { data: canUse, error: usageError } = await supabase.rpc(
      "check_and_increment_ai_usage",
      {
        user_uuid: user.id,
        feature_name: "chat", // Coaching counts as a chat message
      }
    );

    if (usageError) {
      console.error("Error checking AI usage:", usageError);
      return errorResponse("INTERNAL_SERVER_ERROR", "Failed to check usage limits");
    }

    if (!canUse) {
      // Get user's tier to provide helpful message
      const { data: subscription } = await supabase
        .from("subscriptions")
        .select("tier")
        .eq("user_id", user.id)
        .single();

      const tier = subscription?.tier || "free";
      return errorResponse(
        "DAILY_LIMIT_REACHED",
        `You've reached your daily AI message limit. ${tier !== "pro" ? "Upgrade your plan for more messages." : ""}`
      );
    }

    // Get the tank to focus on
    let tankQuery = supabase
      .from("tanks")
      .select("id, name, type, volume_gallons, setup_date")
      .eq("user_id", user.id)
      .is("deleted_at", null);

    if (tank_id) {
      tankQuery = tankQuery.eq("id", tank_id);
    } else {
      // Get the first active tank
      tankQuery = tankQuery.order("created_at", { ascending: true }).limit(1);
    }

    const { data: tanks, error: tankError } = await tankQuery;

    if (tankError || !tanks || tanks.length === 0) {
      return errorResponse(
        "NOT_FOUND",
        tank_id ? "Tank not found or you don't have access" : "No tanks found. Create a tank first."
      );
    }

    const tank = tanks[0];

    // Fetch context data in parallel
    const [userPrefsResult, parametersResult, livestockResult, tasksResult] = await Promise.all([
      // User preferences
      supabase
        .from("user_preferences")
        .select("experience_level, primary_goal, current_challenges")
        .eq("user_id", user.id)
        .single() as unknown as Promise<{ data: any; error: any }>,

      // Latest water parameters
      supabase
        .from("water_parameters")
        .select("ph, ammonia_ppm, nitrite_ppm, nitrate_ppm, temperature_f")
        .eq("tank_id", tank.id)
        .order("measured_at", { ascending: false })
        .limit(1),

      // Livestock count
      supabase
        .from("livestock")
        .select("id", { count: "exact", head: true })
        .eq("tank_id", tank.id)
        .eq("is_active", true)
        .is("deleted_at", null),

      // Pending maintenance tasks count
      supabase
        .from("maintenance_tasks")
        .select("id", { count: "exact", head: true })
        .eq("tank_id", tank.id)
        .eq("is_active", true)
        .is("deleted_at", null)
        .lte("next_due_date", new Date().toISOString().split("T")[0]),
    ]);

    const userPrefs = userPrefsResult.data;
    const latestParams = parametersResult.data?.[0];
    const livestockCount = livestockResult.count || 0;
    const pendingTasksCount = tasksResult.count || 0;

    // Build coaching context
    const context: CoachingContext = {
      user: {
        experience_level: userPrefs?.experience_level || null,
        primary_goal: userPrefs?.primary_goal || null,
        current_challenges: userPrefs?.current_challenges || [],
      },
      tank: {
        name: tank.name,
        type: tank.type,
        volume_gallons: tank.volume_gallons,
        setup_date: tank.setup_date || undefined,
      },
      parameters: latestParams
        ? {
            ph: latestParams.ph || undefined,
            ammonia: latestParams.ammonia_ppm || undefined,
            nitrite: latestParams.nitrite_ppm || undefined,
            nitrate: latestParams.nitrate_ppm || undefined,
            temperature: latestParams.temperature_f || undefined,
          }
        : undefined,
      livestock_count: livestockCount,
      pending_tasks_count: pendingTasksCount,
    };

    // Generate coaching message
    let result;
    try {
      result = await generateCoachingMessage(context);
    } catch (error) {
      console.error("Failed to generate coaching message:", error);
      return errorResponse(
        "AI_UNAVAILABLE",
        "The AI service is temporarily unavailable. Please try again."
      );
    }

    // Update token usage
    await supabase.rpc("update_ai_token_usage", {
      user_uuid: user.id,
      input_count: result.input_tokens,
      output_count: result.output_tokens,
    });

    // Save to coaching history using service role (bypasses RLS for INSERT)
    let historyId: string | null = null;
    try {
      const serviceClient = getServiceRoleClient();
      const { data: historyEntry, error: historyError } = await serviceClient
        .from("coaching_history")
        .insert({
          user_id: user.id,
          tank_id: tank.id,
          message: result.message,
          context: context,
          tokens_used: result.input_tokens + result.output_tokens,
        })
        .select("id")
        .single();

      if (historyError) {
        // Log error but don't fail the request - history is non-critical
        console.error("Failed to save coaching history:", historyError);
      } else {
        historyId = historyEntry?.id || null;
      }
    } catch (historyError) {
      console.error("Error saving coaching history:", historyError);
    }

    // Send push notification (unless dry_run)
    let notificationSent = false;
    if (!dry_run) {
      const payload = createAIInsightPayload(result.message, tank.name);
      const pushResults = await sendPushNotification(user.id, payload, "ai_insight");
      notificationSent = pushResults.some((r) => r.success);
    }

    return successResponse({
      message: result.message,
      tank_name: tank.name,
      notification_sent: notificationSent,
      dry_run,
      history_id: historyId,
      usage: {
        input_tokens: result.input_tokens,
        output_tokens: result.output_tokens,
      },
    });
  } catch (error) {
    console.error("Coaching API error:", error);
    return errorResponse(
      "INTERNAL_SERVER_ERROR",
      "An unexpected error occurred. Please try again."
    );
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */
