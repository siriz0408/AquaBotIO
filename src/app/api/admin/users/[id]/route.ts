import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { successResponse, errorResponse } from "@/lib/api/response";
import {
  checkAdminAuth,
  canManageUsers,
  getClientInfo,
} from "@/middleware/admin";
import { logUserViewed } from "@/lib/admin/audit-logger";

/**
 * GET /api/admin/users/[id]
 *
 * Get detailed user information including tanks, subscription, and usage stats.
 * Requires support_admin or super_admin role.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
      "You do not have permission to view user details"
    );
  }

  const { id: userId } = await params;

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(userId)) {
    return errorResponse("INVALID_INPUT", "Invalid user ID format");
  }

  try {
    const supabase = await createClient();
    const clientInfo = getClientInfo(request);

    // Get user basic info
    const { data: user, error: userError } = await supabase
      .from("users")
      .select(
        `
        id,
        email,
        full_name,
        avatar_url,
        skill_level,
        unit_preference_volume,
        unit_preference_temp,
        onboarding_completed,
        created_at,
        updated_at
      `
      )
      .eq("id", userId)
      .single();

    if (userError || !user) {
      return errorResponse("NOT_FOUND", "User not found");
    }

    // Get subscription info
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select(
        `
        tier,
        status,
        trial_ends_at,
        current_period_start,
        current_period_end,
        stripe_customer_id,
        stripe_subscription_id,
        cancel_at_period_end,
        created_at
      `
      )
      .eq("user_id", userId)
      .single();

    // Get tank count
    const { count: tankCount } = await supabase
      .from("tanks")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .is("deleted_at", null);

    // Get tanks with basic info
    const { data: tanks } = await supabase
      .from("tanks")
      .select(
        `
        id,
        name,
        type,
        volume_gallons,
        created_at,
        updated_at
      `
      )
      .eq("user_id", userId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(10);

    // Get AI usage for today
    const today = new Date().toISOString().split("T")[0];
    const { data: todayUsage } = await supabase
      .from("ai_usage")
      .select("message_count")
      .eq("user_id", userId)
      .eq("date", today)
      .eq("feature", "chat")
      .single();

    // Get total AI messages all time
    const { data: totalUsage } = await supabase
      .from("ai_usage")
      .select("message_count")
      .eq("user_id", userId)
      .eq("feature", "chat");

    const totalMessages = (totalUsage || []).reduce(
      (sum, row) => sum + (row.message_count || 0),
      0
    );

    // Get last activity (most recent AI message)
    const { data: lastMessage } = await supabase
      .from("ai_messages")
      .select("created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    // Get recent AI conversations summary
    const { data: recentConversations } = await supabase
      .from("ai_messages")
      .select(
        `
        id,
        role,
        content,
        created_at,
        tanks (
          id,
          name
        )
      `
      )
      .eq("user_id", userId)
      .eq("role", "user")
      .order("created_at", { ascending: false })
      .limit(5);

    // Log the view action
    await logUserViewed(admin.userId, userId, clientInfo);

    // Build response
    const response = {
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        avatar_url: user.avatar_url,
        skill_level: user.skill_level,
        preferences: {
          volume: user.unit_preference_volume,
          temp: user.unit_preference_temp,
        },
        onboarding_completed: user.onboarding_completed,
        created_at: user.created_at,
        updated_at: user.updated_at,
      },
      subscription: subscription
        ? {
            tier: subscription.tier,
            status: subscription.status,
            trial_ends_at: subscription.trial_ends_at,
            current_period_start: subscription.current_period_start,
            current_period_end: subscription.current_period_end,
            stripe_customer_id: subscription.stripe_customer_id,
            stripe_subscription_id: subscription.stripe_subscription_id,
            cancel_at_period_end: subscription.cancel_at_period_end,
          }
        : null,
      stats: {
        total_tanks: tankCount || 0,
        total_ai_messages_today: todayUsage?.message_count || 0,
        total_ai_messages_all_time: totalMessages,
        last_activity_at: lastMessage?.created_at || null,
      },
      tanks: (tanks || []).map((tank) => ({
        id: tank.id,
        name: tank.name,
        type: tank.type,
        volume_gallons: tank.volume_gallons,
        created_at: tank.created_at,
        updated_at: tank.updated_at,
      })),
      recent_conversations: (recentConversations || []).map((msg) => ({
        id: msg.id,
        content: msg.content?.substring(0, 100) + (msg.content?.length > 100 ? "..." : ""),
        created_at: msg.created_at,
        tank: msg.tanks,
      })),
    };

    return successResponse(response);
  } catch (error) {
    console.error("Admin user detail error:", error);
    return errorResponse("INTERNAL_SERVER_ERROR", "An unexpected error occurred");
  }
}
