import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { successResponse, errorResponse } from "@/lib/api/response";
import { waterParameterSchema } from "@/lib/validation/parameters";

interface RouteContext {
  params: Promise<{ tankId: string }>;
}

/**
 * GET /api/tanks/[tankId]/parameters
 *
 * Fetch water parameters for a tank with optional date range filtering.
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

    // Parse query parameters for date range filtering
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");
    const limitParam = searchParams.get("limit");

    // Build query
    let query = supabase
      .from("water_parameters")
      .select("*")
      .eq("tank_id", tankId)
      .order("measured_at", { ascending: false });

    // Apply date range filters if provided
    if (startDate) {
      const start = new Date(startDate);
      if (isNaN(start.getTime())) {
        return errorResponse("INVALID_INPUT", "Invalid start_date format. Use ISO 8601 format.");
      }
      query = query.gte("measured_at", start.toISOString());
    }

    if (endDate) {
      const end = new Date(endDate);
      if (isNaN(end.getTime())) {
        return errorResponse("INVALID_INPUT", "Invalid end_date format. Use ISO 8601 format.");
      }
      query = query.lte("measured_at", end.toISOString());
    }

    // Apply limit if provided
    if (limitParam) {
      const limit = parseInt(limitParam, 10);
      if (isNaN(limit) || limit < 1 || limit > 1000) {
        return errorResponse("INVALID_INPUT", "Limit must be between 1 and 1000");
      }
      query = query.limit(limit);
    } else {
      // Default limit of 100 if not specified
      query = query.limit(100);
    }

    const { data: parameters, error: parametersError } = await query;

    if (parametersError) {
      console.error("Error fetching parameters:", parametersError);
      return errorResponse("INTERNAL_SERVER_ERROR", "Failed to fetch parameters");
    }

    return successResponse({
      parameters: parameters || [],
      count: parameters?.length || 0,
    });
  } catch (error) {
    console.error("Parameters GET error:", error);
    return errorResponse("INTERNAL_SERVER_ERROR", "An unexpected error occurred");
  }
}

/**
 * POST /api/tanks/[tankId]/parameters
 *
 * Log a new water parameter reading for a tank.
 */
export async function POST(
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

    // Validate with Zod schema (but override tank_id from URL param)
    const bodyWithTankId = typeof body === "object" && body !== null
      ? { ...body, tank_id: tankId }
      : { tank_id: tankId };
    const validationResult = waterParameterSchema.safeParse(bodyWithTankId);

    if (!validationResult.success) {
      const errors = validationResult.error.flatten().fieldErrors;
      const message = Object.entries(errors)
        .map(([field, messages]) => `${field}: ${(messages || []).join(", ")}`)
        .join("; ");
      return errorResponse("INVALID_INPUT", message || "Invalid input");
    }

    const parameterData = validationResult.data;

    // Verify user owns this tank
    const { data: tank, error: tankError } = await supabase
      .from("tanks")
      .select("id, user_id, type")
      .eq("id", tankId)
      .is("deleted_at", null)
      .single();

    if (tankError || !tank) {
      return errorResponse("NOT_FOUND", "Tank not found");
    }

    if (tank.user_id !== user.id) {
      return errorResponse("PERMISSION_DENIED", "You do not have access to this tank");
    }

    // Check rate limit: 50 entries per day per tank
    const today = new Date().toISOString().split("T")[0];
    const { count: todayCount } = await supabase
      .from("water_parameters")
      .select("id", { count: "exact", head: true })
      .eq("tank_id", tankId)
      .gte("measured_at", `${today}T00:00:00Z`)
      .lt("measured_at", `${today}T23:59:59Z`);

    if ((todayCount || 0) >= 50) {
      return errorResponse(
        "RATE_LIMIT_EXCEEDED",
        "Maximum 50 parameter entries per day per tank. Please try again tomorrow."
      );
    }

    // Validate measured_at is not in the future
    const measuredAt = parameterData.measured_at
      ? new Date(parameterData.measured_at)
      : new Date();

    if (isNaN(measuredAt.getTime())) {
      return errorResponse("INVALID_INPUT", "Invalid measured_at date format");
    }

    if (measuredAt > new Date()) {
      return errorResponse("INVALID_INPUT", "Cannot log parameters with a future date");
    }

    // Prepare data for insertion
    // Note: Database uses kh_dgh (not kh_dkh) - mapping from validation schema
    const insertData = {
      tank_id: tankId,
      measured_at: measuredAt.toISOString(),
      temperature_f: parameterData.temperature_f ?? null,
      ph: parameterData.ph ?? null,
      ammonia_ppm: parameterData.ammonia_ppm ?? null,
      nitrite_ppm: parameterData.nitrite_ppm ?? null,
      nitrate_ppm: parameterData.nitrate_ppm ?? null,
      gh_dgh: parameterData.gh_dgh ?? null,
      kh_dgh: parameterData.kh_dkh ?? null, // Map kh_dkh from schema to kh_dgh in DB
      salinity: parameterData.salinity ?? null,
      calcium_ppm: parameterData.calcium_ppm ?? null,
      alkalinity_dkh: parameterData.alkalinity_dkh ?? null,
      magnesium_ppm: parameterData.magnesium_ppm ?? null,
      phosphate_ppm: parameterData.phosphate_ppm ?? null,
      notes: parameterData.notes?.trim() || null,
    };

    // Insert parameter reading
    const { data: newParameter, error: insertError } = await supabase
      .from("water_parameters")
      .insert(insertData)
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting parameter:", insertError);
      return errorResponse("INTERNAL_SERVER_ERROR", "Failed to save parameter reading");
    }

    return successResponse(
      {
        parameter: newParameter,
      },
      201
    );
  } catch (error) {
    console.error("Parameters POST error:", error);
    return errorResponse("INTERNAL_SERVER_ERROR", "An unexpected error occurred");
  }
}
