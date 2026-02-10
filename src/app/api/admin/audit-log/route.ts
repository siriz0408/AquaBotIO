import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { successResponse, errorResponse, validationErrorResponse } from "@/lib/api/response";
import { checkAdminAuth } from "@/middleware/admin";
import { validateAuditLogQuery } from "@/lib/validation/admin";

/**
 * GET /api/admin/audit-log
 *
 * List audit log entries with filters.
 * All admins can read (super_admin sees all, others see their own).
 */
export async function GET(request: NextRequest) {
  // Check admin auth
  const authResult = await checkAdminAuth(request);
  if (!authResult.success) {
    return authResult.response;
  }

  const _admin = authResult.admin; // Available for future permission checks

  // Validate query parameters
  const { searchParams } = new URL(request.url);
  const validation = validateAuditLogQuery(searchParams);
  if (!validation.success || !validation.data) {
    return validationErrorResponse(validation.errors || {});
  }

  const { page, limit, admin_id, action, target_type, start_date, end_date } = validation.data;
  const offset = (page - 1) * limit;

  try {
    const supabase = await createClient();

    // Build query
    let query = supabase
      .from("admin_audit_log")
      .select(
        `
        id,
        admin_user_id,
        action,
        target_type,
        target_id,
        old_value,
        new_value,
        reason,
        ip_address,
        user_agent,
        created_at
      `,
        { count: "exact" }
      );

    // Non-super admins can only see their own logs (enforced by RLS)
    // Super admins can filter by admin_id or see all
    if (admin_id) {
      query = query.eq("admin_user_id", admin_id);
    }

    // Apply action filter
    if (action) {
      query = query.eq("action", action);
    }

    // Apply target_type filter
    if (target_type) {
      query = query.eq("target_type", target_type);
    }

    // Apply date range filters
    if (start_date) {
      query = query.gte("created_at", start_date);
    }
    if (end_date) {
      query = query.lte("created_at", end_date);
    }

    // Order by created_at descending (newest first)
    query = query.order("created_at", { ascending: false });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: logs, error, count } = await query;

    if (error) {
      console.error("Error fetching audit logs:", error);
      return errorResponse("INTERNAL_SERVER_ERROR", "Failed to fetch audit logs");
    }

    // Get admin emails for display
    const adminIds = Array.from(new Set((logs || []).map((log) => log.admin_user_id)));
    const { data: adminUsers } = await supabase
      .from("users")
      .select("id, email")
      .in("id", adminIds);

    const adminEmailMap = new Map(
      (adminUsers || []).map((u) => [u.id, u.email])
    );

    // Transform data for response
    const transformedLogs = (logs || []).map((log) => ({
      id: log.id,
      admin_user_id: log.admin_user_id,
      admin_email: adminEmailMap.get(log.admin_user_id) || null,
      action: log.action,
      target_type: log.target_type,
      target_id: log.target_id,
      old_value: log.old_value,
      new_value: log.new_value,
      reason: log.reason,
      ip_address: log.ip_address,
      user_agent: log.user_agent,
      created_at: log.created_at,
    }));

    return successResponse({
      logs: transformedLogs,
      pagination: {
        page,
        limit,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error("Admin audit log error:", error);
    return errorResponse("INTERNAL_SERVER_ERROR", "An unexpected error occurred");
  }
}
