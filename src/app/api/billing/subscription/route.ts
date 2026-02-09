import { createClient } from "@/lib/supabase/server";
import { successResponse, errorResponse } from "@/lib/api/response";
import { TIER_PRICING } from "@/lib/validation/billing";

/**
 * GET /api/billing/subscription
 *
 * Get the current user's subscription status.
 */
export async function GET() {
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

    // Get subscription from database
    const { data: subscription, error: subError } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (subError && subError.code !== "PGRST116") {
      // PGRST116 is "no rows found" - that's fine
      console.error("Error fetching subscription:", subError);
      return errorResponse("INTERNAL_SERVER_ERROR", "Failed to fetch subscription");
    }

    // Free tier info - per Spec 18: 0 AI messages, basic tools only
    const FREE_TIER_INFO = {
      name: "Free",
      price: 0,
      priceDisplay: "$0",
      description: "Basic tools for getting started",
      features: [
        "1 tank",
        "Parameter logging",
        "Species database",
        "3 maintenance tasks",
      ],
    };

    // Default to free tier if no subscription
    if (!subscription) {
      return successResponse({
        tier: "free",
        status: "active",
        is_trial: false,
        trial_ends_at: null,
        current_period_end: null,
        cancel_at_period_end: false,
        tier_info: FREE_TIER_INFO,
      });
    }

    // Determine effective tier
    const now = new Date();
    const isTrialing =
      subscription.status === "trialing" &&
      subscription.trial_ends_at &&
      new Date(subscription.trial_ends_at) > now;

    const effectiveTier = isTrialing ? "pro" : subscription.tier;

    // Get tier info
    const tierInfo =
      effectiveTier === "free"
        ? FREE_TIER_INFO
        : TIER_PRICING[effectiveTier as keyof typeof TIER_PRICING] || TIER_PRICING.starter;

    // Calculate days remaining in trial
    let trialDaysRemaining = null;
    if (isTrialing && subscription.trial_ends_at) {
      const trialEnd = new Date(subscription.trial_ends_at);
      trialDaysRemaining = Math.ceil(
        (trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
    }

    return successResponse({
      tier: subscription.tier,
      effective_tier: effectiveTier,
      status: subscription.status,
      is_trial: isTrialing,
      trial_ends_at: subscription.trial_ends_at,
      trial_days_remaining: trialDaysRemaining,
      current_period_start: subscription.current_period_start,
      current_period_end: subscription.current_period_end,
      cancel_at_period_end: subscription.cancel_at_period_end,
      stripe_subscription_id: subscription.stripe_subscription_id,
      tier_info: tierInfo,
    });
  } catch (error) {
    console.error("Subscription API error:", error);
    return errorResponse(
      "INTERNAL_SERVER_ERROR",
      "An unexpected error occurred"
    );
  }
}
