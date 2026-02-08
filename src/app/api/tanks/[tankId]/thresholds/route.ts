import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { successResponse, errorResponse } from "@/lib/api/response";
import {
  thresholdUpsertSchema,
  PARAMETER_TYPES,
  type ParameterType,
} from "@/lib/validation/parameters";

interface RouteContext {
  params: Promise<{ tankId: string }>;
}

/**
 * GET /api/tanks/[tankId]/thresholds
 *
 * Fetch all parameter thresholds for a tank, including custom and default values.
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { tankId } = await context.params;
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return errorResponse("AUTH_REQUIRED", "You must be logged in");
    }

    // Verify user owns this tank
    const { data: tank, error: tankError } = await supabase
      .from("tanks")
      .select("id, user_id")
      .eq("id", tankId)
      .is("deleted_at", null)
      .single();

    if (tankError || !tank) {
      return errorResponse("NOT_FOUND", "Tank not found");
    }

    if (tank.user_id !== user.id) {
      return errorResponse("PERMISSION_DENIED", "You do not have access to this tank");
    }

    // Fetch all custom thresholds for this tank
    const { data: customThresholds, error: thresholdsError } = await supabase
      .from("parameter_thresholds")
      .select("*")
      .eq("tank_id", tankId);

    if (thresholdsError) {
      console.error("Error fetching thresholds:", thresholdsError);
      return errorResponse("INTERNAL_SERVER_ERROR", "Failed to fetch thresholds");
    }

    // Build a map of custom thresholds by parameter type
    const customMap = new Map<string, typeof customThresholds[0]>();
    (customThresholds || []).forEach((th) => {
      customMap.set(th.parameter_type, th);
    });

    // Build response with all parameter types, merging custom and defaults
    const thresholds: Record<
      string,
      {
        safe_min: number | null;
        safe_max: number | null;
        warning_min: number | null;
        warning_max: number | null;
        is_custom: boolean;
      }
    > = {};

    // For each parameter type, get custom or default
    for (const paramType of PARAMETER_TYPES) {
      const custom = customMap.get(paramType);

      if (custom) {
        thresholds[paramType] = {
          safe_min: custom.safe_min ? Number(custom.safe_min) : null,
          safe_max: custom.safe_max ? Number(custom.safe_max) : null,
          warning_min: custom.warning_min ? Number(custom.warning_min) : null,
          warning_max: custom.warning_max ? Number(custom.warning_max) : null,
          is_custom: true,
        };
      } else {
        // Use database function to get defaults
        const { data: defaultThresholds, error: defaultError } = await supabase.rpc(
          "get_parameter_thresholds",
          {
            tank_uuid: tankId,
            param_type: paramType,
          }
        );

        if (defaultError || !defaultThresholds || defaultThresholds.length === 0) {
          // If function returns no defaults, use nulls
          thresholds[paramType] = {
            safe_min: null,
            safe_max: null,
            warning_min: null,
            warning_max: null,
            is_custom: false,
          };
        } else {
          const defaults = defaultThresholds[0];
          thresholds[paramType] = {
            safe_min: defaults.safe_min ? Number(defaults.safe_min) : null,
            safe_max: defaults.safe_max ? Number(defaults.safe_max) : null,
            warning_min: defaults.warning_min ? Number(defaults.warning_min) : null,
            warning_max: defaults.warning_max ? Number(defaults.warning_max) : null,
            is_custom: false,
          };
        }
      }
    }

    return successResponse({
      thresholds,
    });
  } catch (error) {
    console.error("Thresholds GET error:", error);
    return errorResponse("INTERNAL_SERVER_ERROR", "An unexpected error occurred");
  }
}

/**
 * PUT /api/tanks/[tankId]/thresholds
 *
 * Upsert a threshold for a specific parameter.
 */
export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { tankId } = await context.params;
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

    const validationResult = thresholdUpsertSchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.flatten().fieldErrors;
      const message = Object.entries(errors)
        .map(([field, messages]) => `${field}: ${(messages || []).join(", ")}`)
        .join("; ");
      return errorResponse("INVALID_INPUT", message || "Invalid input");
    }

    const thresholdData = validationResult.data;

    // Verify user owns this tank
    const { data: tank, error: tankError } = await supabase
      .from("tanks")
      .select("id, user_id")
      .eq("id", tankId)
      .is("deleted_at", null)
      .single();

    if (tankError || !tank) {
      return errorResponse("NOT_FOUND", "Tank not found");
    }

    if (tank.user_id !== user.id) {
      return errorResponse("PERMISSION_DENIED", "You do not have access to this tank");
    }

    // Upsert threshold
    const { data: threshold, error: upsertError } = await supabase
      .from("parameter_thresholds")
      .upsert(
        {
          tank_id: tankId,
          parameter_type: thresholdData.parameter_type,
          safe_min: thresholdData.safe_min,
          safe_max: thresholdData.safe_max,
          warning_min: thresholdData.warning_min,
          warning_max: thresholdData.warning_max,
        },
        {
          onConflict: "tank_id,parameter_type",
        }
      )
      .select()
      .single();

    if (upsertError) {
      console.error("Error upserting threshold:", upsertError);
      return errorResponse("INTERNAL_SERVER_ERROR", "Failed to save threshold");
    }

    return successResponse({
      threshold: {
        ...threshold,
        safe_min: threshold.safe_min ? Number(threshold.safe_min) : null,
        safe_max: threshold.safe_max ? Number(threshold.safe_max) : null,
        warning_min: threshold.warning_min ? Number(threshold.warning_min) : null,
        warning_max: threshold.warning_max ? Number(threshold.warning_max) : null,
      },
    });
  } catch (error) {
    console.error("Thresholds PUT error:", error);
    return errorResponse("INTERNAL_SERVER_ERROR", "An unexpected error occurred");
  }
}

/**
 * DELETE /api/tanks/[tankId]/thresholds?parameter_type=ph
 *
 * Reset a parameter's threshold to defaults by deleting the custom record.
 */
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { tankId } = await context.params;
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return errorResponse("AUTH_REQUIRED", "You must be logged in");
    }

    // Parse query parameter
    const { searchParams } = new URL(request.url);
    const parameterType = searchParams.get("parameter_type");

    if (!parameterType) {
      return errorResponse("INVALID_INPUT", "parameter_type query parameter is required");
    }

    // Validate parameter type
    if (!PARAMETER_TYPES.includes(parameterType as ParameterType)) {
      return errorResponse("INVALID_INPUT", `Invalid parameter_type: ${parameterType}`);
    }

    // Verify user owns this tank
    const { data: tank, error: tankError } = await supabase
      .from("tanks")
      .select("id, user_id")
      .eq("id", tankId)
      .is("deleted_at", null)
      .single();

    if (tankError || !tank) {
      return errorResponse("NOT_FOUND", "Tank not found");
    }

    if (tank.user_id !== user.id) {
      return errorResponse("PERMISSION_DENIED", "You do not have access to this tank");
    }

    // Delete custom threshold
    const { error: deleteError } = await supabase
      .from("parameter_thresholds")
      .delete()
      .eq("tank_id", tankId)
      .eq("parameter_type", parameterType);

    if (deleteError) {
      console.error("Error deleting threshold:", deleteError);
      return errorResponse("INTERNAL_SERVER_ERROR", "Failed to delete threshold");
    }

    return successResponse({
      message: "Reset to defaults",
    });
  } catch (error) {
    console.error("Thresholds DELETE error:", error);
    return errorResponse("INTERNAL_SERVER_ERROR", "An unexpected error occurred");
  }
}
