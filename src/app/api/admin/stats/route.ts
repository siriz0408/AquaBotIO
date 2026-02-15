import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { successResponse, errorResponse } from "@/lib/api/response";
import { checkAdminAuth, canManageUsers } from "@/middleware/admin";
import { TIER_PRICING } from "@/lib/validation/billing";

/**
 * GET /api/admin/stats
 *
 * Get dashboard statistics including user counts, subscription distribution,
 * and AI usage metrics.
 *
 * Requires support_admin or super_admin role.
 */
export async function GET(request: NextRequest) {
  // Check admin auth
  const authResult = await checkAdminAuth(request);
  if (!authResult.success) {
    return authResult.response;
  }

  const admin = authResult.admin;

  // Check role permission
  if (!canManageUsers(admin.role)) {
    return errorResponse(
      "PERMISSION_DENIED",
      "You do not have permission to view admin statistics"
    );
  }

  try {
    const supabase = await createClient();

    // Date calculations
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    const todayStr = today.toISOString();
    const weekAgoStr = weekAgo.toISOString();
    const monthAgoStr = monthAgo.toISOString();

    // ---- USER STATS ----

    // Total users
    const { count: totalUsers } = await supabase
      .from("users")
      .select("id", { count: "exact", head: true });

    // New users today
    const { count: newToday } = await supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .gte("created_at", todayStr);

    // New users this week
    const { count: newThisWeek } = await supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .gte("created_at", weekAgoStr);

    // New users this month
    const { count: newThisMonth } = await supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .gte("created_at", monthAgoStr);

    // Active users (based on updated_at as proxy for activity)
    // Note: In a production system, you'd track this via explicit activity logs
    const { count: activeToday } = await supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .gte("updated_at", todayStr);

    const { count: activeThisWeek } = await supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .gte("updated_at", weekAgoStr);

    const { count: activeThisMonth } = await supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .gte("updated_at", monthAgoStr);

    // ---- SUBSCRIPTION STATS ----

    // Count by tier using database aggregation (GROUP BY)
    // This is O(1) memory vs O(n) when fetching all rows
    const { data: tierCounts } = await supabase.rpc("get_subscription_tier_counts");

    const tierDistribution = {
      free: 0,
      starter: 0,
      plus: 0,
      pro: 0,
    };

    // Map RPC results to tier distribution
    (tierCounts || []).forEach((row: { tier: string; count: number }) => {
      const tier = row.tier as keyof typeof tierDistribution;
      if (tier in tierDistribution) {
        tierDistribution[tier] = Number(row.count);
      }
    });

    // Trialing users
    const { count: trialingCount } = await supabase
      .from("subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("status", "trialing");

    // Past due (failed payments)
    const { count: pastDueCount } = await supabase
      .from("subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("status", "past_due");

    // ---- AI USAGE STATS ----
    // Use database aggregation (SUM) instead of fetching rows and summing in JS

    const todayDate = today.toISOString().split("T")[0];
    const weekAgoDate = weekAgo.toISOString().split("T")[0];
    const monthAgoDate = monthAgo.toISOString().split("T")[0];

    // Run all AI usage queries in parallel using RPC with SUM aggregation
    const [todayUsageResult, weekUsageResult, monthUsageResult] = await Promise.all([
      supabase.rpc("get_ai_usage_stats", {
        start_date: todayDate,
        end_date: todayDate,
      }),
      supabase.rpc("get_ai_usage_stats", {
        start_date: weekAgoDate,
        end_date: todayDate,
      }),
      supabase.rpc("get_ai_usage_stats", {
        start_date: monthAgoDate,
        end_date: todayDate,
      }),
    ]);

    const messagesToday = todayUsageResult.data?.[0]?.total_messages || 0;
    const messagesThisWeek = weekUsageResult.data?.[0]?.total_messages || 0;
    const messagesThisMonth = monthUsageResult.data?.[0]?.total_messages || 0;

    // ---- REVENUE ESTIMATE ----
    // This is a placeholder - actual revenue should come from Stripe
    // Calculate estimated MRR based on subscription counts using centralized pricing
    const estimatedMRR =
      tierDistribution.starter * TIER_PRICING.starter.price +
      tierDistribution.plus * TIER_PRICING.plus.price +
      tierDistribution.pro * TIER_PRICING.pro.price;

    // Build response
    const stats = {
      users: {
        total: totalUsers || 0,
        active_today: activeToday || 0,
        active_this_week: activeThisWeek || 0,
        active_this_month: activeThisMonth || 0,
        new_today: newToday || 0,
        new_this_week: newThisWeek || 0,
        new_this_month: newThisMonth || 0,
      },
      subscriptions: {
        total_free: tierDistribution.free,
        total_starter: tierDistribution.starter,
        total_plus: tierDistribution.plus,
        total_pro: tierDistribution.pro,
        trialing: trialingCount || 0,
        past_due: pastDueCount || 0,
      },
      ai_usage: {
        messages_today: messagesToday,
        messages_this_week: messagesThisWeek,
        messages_this_month: messagesThisMonth,
      },
      revenue: {
        mrr_cents: estimatedMRR,
        estimated: true, // Flag that this is calculated locally, not from Stripe
      },
      generated_at: new Date().toISOString(),
    };

    return successResponse(stats);
  } catch (error) {
    console.error("Admin stats error:", error);
    return errorResponse("INTERNAL_SERVER_ERROR", "An unexpected error occurred");
  }
}
