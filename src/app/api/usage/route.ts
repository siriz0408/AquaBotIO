import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { successResponse, errorResponse } from "@/lib/api/response";

/**
 * GET /api/usage
 *
 * Get user's current AI usage stats for today.
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

    // Get feature from query params (default to chat)
    const { searchParams } = new URL(request.url);
    const feature = searchParams.get("feature") || "chat";

    // Validate feature
    const validFeatures = ["chat", "diagnosis", "report", "search"];
    if (!validFeatures.includes(feature)) {
      return errorResponse("INVALID_INPUT", `Invalid feature. Must be one of: ${validFeatures.join(", ")}`);
    }

    // Try RPC function first, fall back to direct query
    let usageData: {
      message_count: number;
      input_tokens: number;
      output_tokens: number;
      daily_limit: number;
      tier: string;
    } | null = null;

    const { data: usage, error: usageError } = await supabase.rpc(
      "get_ai_usage_today",
      {
        user_uuid: user.id,
        feature_name: feature,
      }
    );

    if (!usageError) {
      // RPC succeeded
      usageData = Array.isArray(usage) ? usage[0] : usage;
    } else {
      // RPC not available — fall back to direct query
      console.warn("get_ai_usage_today RPC unavailable, using direct query:", usageError.message);

      const today = new Date().toISOString().split("T")[0];
      const { data: directUsage } = await supabase
        .from("ai_usage")
        .select("message_count, input_tokens, output_tokens")
        .eq("user_id", user.id)
        .eq("date", today)
        .eq("feature", feature)
        .single();

      if (directUsage) {
        // Get subscription tier for limit calculation
        const { data: subscription } = await supabase
          .from("subscriptions")
          .select("tier, status, trial_ends_at")
          .eq("user_id", user.id)
          .single();

        let tier = "free";
        if (subscription) {
          const isTrialing =
            subscription.status === "trialing" &&
            subscription.trial_ends_at &&
            new Date(subscription.trial_ends_at) > new Date();
          if (isTrialing) tier = "pro";
          else if (subscription.status === "active") tier = subscription.tier;
        }

        const limits: Record<string, number> = { free: 10, starter: 100, plus: 200, pro: 999999 };
        usageData = {
          message_count: directUsage.message_count || 0,
          input_tokens: directUsage.input_tokens || 0,
          output_tokens: directUsage.output_tokens || 0,
          daily_limit: limits[tier] || 10,
          tier,
        };
      }
    }

    if (!usageData) {
      // No usage today, return defaults
      const { data: subscription } = await supabase
        .from("subscriptions")
        .select("tier, status, trial_ends_at")
        .eq("user_id", user.id)
        .single();

      let tier = "free";
      if (subscription) {
        const isTrialing =
          subscription.status === "trialing" &&
          subscription.trial_ends_at &&
          new Date(subscription.trial_ends_at) > new Date();
        if (isTrialing) {
          tier = "pro";
        } else if (subscription.status === "active") {
          tier = subscription.tier;
        }
      }

      const limits: Record<string, number> = {
        free: 10,
        starter: 100,
        plus: 200,
        pro: 999999,
      };

      return successResponse({
        feature,
        message_count: 0,
        input_tokens: 0,
        output_tokens: 0,
        daily_limit: limits[tier] || 10,
        tier,
        remaining: limits[tier] || 10,
        percentage_used: 0,
      });
    }

    const remaining = Math.max(0, usageData.daily_limit - usageData.message_count);
    const percentageUsed = usageData.daily_limit > 0
      ? Math.round((usageData.message_count / usageData.daily_limit) * 100)
      : 0;

    return successResponse({
      feature,
      message_count: usageData.message_count,
      input_tokens: usageData.input_tokens,
      output_tokens: usageData.output_tokens,
      daily_limit: usageData.daily_limit,
      tier: usageData.tier,
      remaining,
      percentage_used: percentageUsed,
    });
  } catch (error) {
    console.error("Usage API error:", error);
    return errorResponse("INTERNAL_SERVER_ERROR", "An unexpected error occurred");
  }
}
