import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { successResponse, errorResponse, validationErrorResponse } from "@/lib/api/response";
import {
  checkAdminAuth,
  canManageUsers,
  getClientInfo,
} from "@/middleware/admin";
import {
  validateUserListQuery,
  validateUserUpdate,
} from "@/lib/validation/admin";
import {
  logSubscriptionTierChanged,
  logTrialExtended,
} from "@/lib/admin/audit-logger";

/**
 * GET /api/admin/users
 *
 * List all users with pagination, search, and filters.
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
      "You do not have permission to manage users"
    );
  }

  // Validate query parameters
  const { searchParams } = new URL(request.url);
  const validation = validateUserListQuery(searchParams);
  if (!validation.success || !validation.data) {
    return validationErrorResponse(validation.errors || {});
  }

  const { page, limit, search, tier, sort_by, sort_order } = validation.data;
  const offset = (page - 1) * limit;

  try {
    const supabase = await createClient();

    // Build query
    let query = supabase
      .from("users")
      .select(
        `
        id,
        email,
        full_name,
        avatar_url,
        skill_level,
        created_at,
        updated_at,
        subscriptions (
          tier,
          status,
          trial_ends_at,
          current_period_end
        )
      `,
        { count: "exact" }
      );

    // Apply search filter
    if (search) {
      query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
    }

    // Apply tier filter (requires joining with subscriptions)
    if (tier) {
      query = query.eq("subscriptions.tier", tier);
    }

    // Apply sorting
    const sortColumn = sort_by === "last_login" ? "updated_at" : sort_by;
    query = query.order(sortColumn, { ascending: sort_order === "asc" });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: users, error, count } = await query;

    if (error) {
      console.error("Error fetching users:", error);
      return errorResponse("INTERNAL_SERVER_ERROR", "Failed to fetch users");
    }

    // Transform data for response
    const transformedUsers = (users || []).map((user) => ({
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      avatar_url: user.avatar_url,
      skill_level: user.skill_level,
      created_at: user.created_at,
      subscription: user.subscriptions?.[0] || null,
    }));

    return successResponse({
      users: transformedUsers,
      pagination: {
        page,
        limit,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error("Admin users list error:", error);
    return errorResponse("INTERNAL_SERVER_ERROR", "An unexpected error occurred");
  }
}

/**
 * PATCH /api/admin/users
 *
 * Bulk update users (e.g., batch tier changes).
 * Not implemented in Phase 1 MVP - placeholder for future.
 */
export async function PATCH(request: NextRequest) {
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
      "You do not have permission to manage users"
    );
  }

  // Parse request body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("INVALID_INPUT", "Invalid JSON in request body");
  }

  // Validate - for now this is a single user update with user_id in body
  const validation = validateUserUpdate(body);
  if (!validation.success || !validation.data) {
    return validationErrorResponse(validation.errors || {});
  }

  // Extract user_id from body
  const requestBody = body as { user_id?: string } & typeof validation.data;
  const targetUserId = requestBody.user_id;

  if (!targetUserId) {
    return errorResponse("INVALID_INPUT", "user_id is required");
  }

  const { tier, trial_extension_days, reason } = validation.data;

  try {
    const supabase = await createClient();
    const clientInfo = getClientInfo(request);

    // Get current user data for audit log
    const { data: currentUser, error: userError } = await supabase
      .from("users")
      .select("id, email, subscriptions(tier, trial_ends_at)")
      .eq("id", targetUserId)
      .single();

    if (userError || !currentUser) {
      return errorResponse("NOT_FOUND", "User not found");
    }

    const currentSubscription = (currentUser.subscriptions as { tier: string; trial_ends_at: string | null }[])?.[0];
    const currentTier = currentSubscription?.tier || "free";

    // Handle tier change
    if (tier && tier !== currentTier) {
      const { error: updateError } = await supabase
        .from("subscriptions")
        .update({ tier, updated_at: new Date().toISOString() })
        .eq("user_id", targetUserId);

      if (updateError) {
        console.error("Error updating tier:", updateError);
        return errorResponse("INTERNAL_SERVER_ERROR", "Failed to update tier");
      }

      // Log the action
      await logSubscriptionTierChanged(
        admin.userId,
        targetUserId,
        currentTier,
        tier,
        reason,
        clientInfo
      );
    }

    // Handle trial extension
    if (trial_extension_days) {
      const currentTrialEnd = currentSubscription?.trial_ends_at
        ? new Date(currentSubscription.trial_ends_at)
        : new Date();
      const newTrialEnd = new Date(currentTrialEnd);
      newTrialEnd.setDate(newTrialEnd.getDate() + trial_extension_days);

      const { error: trialError } = await supabase
        .from("subscriptions")
        .update({
          trial_ends_at: newTrialEnd.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", targetUserId);

      if (trialError) {
        console.error("Error extending trial:", trialError);
        return errorResponse("INTERNAL_SERVER_ERROR", "Failed to extend trial");
      }

      // Log the action
      await logTrialExtended(
        admin.userId,
        targetUserId,
        trial_extension_days,
        newTrialEnd.toISOString(),
        reason,
        clientInfo
      );
    }

    return successResponse({
      message: "User updated successfully",
      user_id: targetUserId,
    });
  } catch (error) {
    console.error("Admin user update error:", error);
    return errorResponse("INTERNAL_SERVER_ERROR", "An unexpected error occurred");
  }
}
