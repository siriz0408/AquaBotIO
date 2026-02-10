import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { successResponse, errorResponse, validationErrorResponse } from "@/lib/api/response";
import {
  checkAdminAuth,
  canManageSystemConfig,
  getClientInfo,
} from "@/middleware/admin";
import {
  validateFeatureFlagCreate,
  validateFeatureFlagUpdate,
} from "@/lib/validation/admin";
import {
  logFeatureFlagCreated,
  logFeatureFlagUpdated,
} from "@/lib/admin/audit-logger";

/**
 * GET /api/admin/feature-flags
 *
 * List all feature flags.
 * Any authenticated user can read (for feature checking).
 */
export async function GET(request: NextRequest) {
  // Check admin auth
  const authResult = await checkAdminAuth(request);
  if (!authResult.success) {
    return authResult.response;
  }

  try {
    const supabase = await createClient();

    const { data: flags, error } = await supabase
      .from("feature_flags")
      .select(
        `
        id,
        name,
        description,
        is_enabled,
        scope,
        enabled_tiers,
        rollout_percent,
        created_by,
        created_at,
        updated_at
      `
      )
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching feature flags:", error);
      return errorResponse("INTERNAL_SERVER_ERROR", "Failed to fetch feature flags");
    }

    return successResponse({
      flags: flags || [],
    });
  } catch (error) {
    console.error("Feature flags list error:", error);
    return errorResponse("INTERNAL_SERVER_ERROR", "An unexpected error occurred");
  }
}

/**
 * POST /api/admin/feature-flags
 *
 * Create a new feature flag.
 * Requires super_admin role.
 */
export async function POST(request: NextRequest) {
  // Check admin auth
  const authResult = await checkAdminAuth(request, "super_admin");
  if (!authResult.success) {
    return authResult.response;
  }

  const admin = authResult.admin;

  // Verify system config permission
  if (!canManageSystemConfig(admin.role)) {
    return errorResponse(
      "PERMISSION_DENIED",
      "You do not have permission to manage feature flags"
    );
  }

  // Parse request body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("INVALID_INPUT", "Invalid JSON in request body");
  }

  // Validate
  const validation = validateFeatureFlagCreate(body);
  if (!validation.success || !validation.data) {
    return validationErrorResponse(validation.errors || {});
  }

  const flagData = validation.data;

  try {
    const supabase = await createClient();
    const clientInfo = getClientInfo(request);

    // Check if flag name already exists
    const { data: existing } = await supabase
      .from("feature_flags")
      .select("id")
      .eq("name", flagData.name)
      .single();

    if (existing) {
      return errorResponse("CONFLICT", `Feature flag '${flagData.name}' already exists`);
    }

    // Create the flag
    const { data: newFlag, error } = await supabase
      .from("feature_flags")
      .insert({
        name: flagData.name,
        description: flagData.description || null,
        is_enabled: flagData.is_enabled,
        scope: flagData.scope,
        enabled_tiers: flagData.enabled_tiers,
        rollout_percent: flagData.rollout_percent,
        created_by: admin.userId,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating feature flag:", error);
      return errorResponse("INTERNAL_SERVER_ERROR", "Failed to create feature flag");
    }

    // Log the action
    await logFeatureFlagCreated(admin.userId, flagData.name, newFlag, clientInfo);

    return successResponse(
      {
        flag: newFlag,
        message: "Feature flag created successfully",
      },
      201
    );
  } catch (error) {
    console.error("Feature flag create error:", error);
    return errorResponse("INTERNAL_SERVER_ERROR", "An unexpected error occurred");
  }
}

/**
 * PATCH /api/admin/feature-flags
 *
 * Update a feature flag by name.
 * Requires super_admin role.
 */
export async function PATCH(request: NextRequest) {
  // Check admin auth
  const authResult = await checkAdminAuth(request, "super_admin");
  if (!authResult.success) {
    return authResult.response;
  }

  const admin = authResult.admin;

  // Verify system config permission
  if (!canManageSystemConfig(admin.role)) {
    return errorResponse(
      "PERMISSION_DENIED",
      "You do not have permission to manage feature flags"
    );
  }

  // Parse request body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("INVALID_INPUT", "Invalid JSON in request body");
  }

  // Extract name from body
  const requestBody = body as { name?: string };
  const flagName = requestBody.name;

  if (!flagName) {
    return errorResponse("INVALID_INPUT", "Feature flag name is required");
  }

  // Validate update data
  const validation = validateFeatureFlagUpdate(body);
  if (!validation.success || !validation.data) {
    return validationErrorResponse(validation.errors || {});
  }

  const updateData = validation.data;

  try {
    const supabase = await createClient();
    const clientInfo = getClientInfo(request);

    // Get current flag data for audit log
    const { data: currentFlag, error: fetchError } = await supabase
      .from("feature_flags")
      .select("*")
      .eq("name", flagName)
      .single();

    if (fetchError || !currentFlag) {
      return errorResponse("NOT_FOUND", `Feature flag '${flagName}' not found`);
    }

    // Build update object (only include provided fields)
    const updates: Record<string, unknown> = {};
    if (updateData.description !== undefined) updates.description = updateData.description;
    if (updateData.is_enabled !== undefined) updates.is_enabled = updateData.is_enabled;
    if (updateData.scope !== undefined) updates.scope = updateData.scope;
    if (updateData.enabled_tiers !== undefined) updates.enabled_tiers = updateData.enabled_tiers;
    if (updateData.rollout_percent !== undefined) updates.rollout_percent = updateData.rollout_percent;

    // Update the flag
    const { data: updatedFlag, error: updateError } = await supabase
      .from("feature_flags")
      .update(updates)
      .eq("name", flagName)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating feature flag:", updateError);
      return errorResponse("INTERNAL_SERVER_ERROR", "Failed to update feature flag");
    }

    // Log the action
    await logFeatureFlagUpdated(admin.userId, flagName, currentFlag, updatedFlag, clientInfo);

    return successResponse({
      flag: updatedFlag,
      message: "Feature flag updated successfully",
    });
  } catch (error) {
    console.error("Feature flag update error:", error);
    return errorResponse("INTERNAL_SERVER_ERROR", "An unexpected error occurred");
  }
}
