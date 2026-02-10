import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { errorResponse } from "@/lib/api/response";

/**
 * Admin role types
 */
export type AdminRole = "super_admin" | "content_admin" | "support_admin";

/**
 * Admin user context returned after authentication
 */
export interface AdminContext {
  userId: string;
  email: string;
  role: AdminRole;
  isActive: boolean;
}

/**
 * Result of admin authentication check
 */
type AdminAuthResult =
  | { success: true; admin: AdminContext }
  | { success: false; response: NextResponse };

/**
 * Check if the current user is an admin
 *
 * @param request - NextRequest object (used for IP/user-agent extraction)
 * @param requiredRole - Optional specific role required (null = any admin role)
 * @returns AdminAuthResult with either admin context or error response
 */
export async function checkAdminAuth(
  request: NextRequest,
  requiredRole: AdminRole | null = null
): Promise<AdminAuthResult> {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        response: errorResponse("AUTH_REQUIRED", "You must be logged in to access this resource"),
      };
    }

    // Check if user is an admin
    const { data: adminUser, error: adminError } = await supabase
      .from("admin_users")
      .select("user_id, role, is_active")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .single();

    if (adminError || !adminUser) {
      return {
        success: false,
        response: errorResponse("PERMISSION_DENIED", "You do not have admin access"),
      };
    }

    // Check if specific role is required
    if (requiredRole !== null) {
      const hasPermission = checkRolePermission(adminUser.role as AdminRole, requiredRole);
      if (!hasPermission) {
        return {
          success: false,
          response: errorResponse(
            "PERMISSION_DENIED",
            `This action requires ${requiredRole} or higher privileges`
          ),
        };
      }
    }

    return {
      success: true,
      admin: {
        userId: user.id,
        email: user.email || "",
        role: adminUser.role as AdminRole,
        isActive: adminUser.is_active,
      },
    };
  } catch (error) {
    console.error("Admin auth check error:", error);
    return {
      success: false,
      response: errorResponse("INTERNAL_SERVER_ERROR", "Failed to verify admin access"),
    };
  }
}

/**
 * Check if a role has permission for a required role level
 * Role hierarchy: super_admin > support_admin = content_admin
 *
 * @param userRole - The admin's actual role
 * @param requiredRole - The role required for the action
 * @returns true if user has sufficient permissions
 */
export function checkRolePermission(userRole: AdminRole, requiredRole: AdminRole): boolean {
  // Super admin can do everything
  if (userRole === "super_admin") {
    return true;
  }

  // Otherwise, roles must match exactly
  // Note: content_admin and support_admin have different domains
  // - support_admin: user management, subscriptions
  // - content_admin: species, equipment, prompts
  return userRole === requiredRole;
}

/**
 * Higher-order function to wrap API route handlers with admin authentication
 *
 * @param handler - The route handler function
 * @param requiredRole - Optional specific role required
 * @returns Wrapped handler that checks admin auth before executing
 */
export function withAdminAuth<T extends unknown[]>(
  handler: (
    request: NextRequest,
    admin: AdminContext,
    ...args: T
  ) => Promise<NextResponse>,
  requiredRole: AdminRole | null = null
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    const authResult = await checkAdminAuth(request, requiredRole);

    if (!authResult.success) {
      return authResult.response;
    }

    return handler(request, authResult.admin, ...args);
  };
}

/**
 * Extract client info from request for audit logging
 */
export function getClientInfo(request: NextRequest): {
  ipAddress: string | null;
  userAgent: string | null;
} {
  // Get IP address from various headers (considering proxies)
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const ipAddress = forwardedFor?.split(",")[0]?.trim() || realIp || null;

  // Get user agent
  const userAgent = request.headers.get("user-agent");

  return { ipAddress, userAgent };
}

/**
 * Roles that can manage users (view, update subscriptions, suspend)
 */
export const USER_MANAGEMENT_ROLES: AdminRole[] = ["super_admin", "support_admin"];

/**
 * Roles that can manage content (species, equipment, prompts)
 */
export const CONTENT_MANAGEMENT_ROLES: AdminRole[] = ["super_admin", "content_admin"];

/**
 * Roles that can manage system config (feature flags, tier limits)
 */
export const SYSTEM_CONFIG_ROLES: AdminRole[] = ["super_admin"];

/**
 * Check if admin role can manage users
 */
export function canManageUsers(role: AdminRole): boolean {
  return USER_MANAGEMENT_ROLES.includes(role);
}

/**
 * Check if admin role can manage content
 */
export function canManageContent(role: AdminRole): boolean {
  return CONTENT_MANAGEMENT_ROLES.includes(role);
}

/**
 * Check if admin role can manage system config
 */
export function canManageSystemConfig(role: AdminRole): boolean {
  return SYSTEM_CONFIG_ROLES.includes(role);
}
