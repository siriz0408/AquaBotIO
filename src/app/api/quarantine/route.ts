import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { successResponse, errorResponse } from "@/lib/api/response";
import {
  createQuarantineSchema,
  updateQuarantineSchema,
  DEFAULT_QUARANTINE_STEPS,
} from "@/lib/validation/quarantine";

/**
 * GET /api/quarantine
 *
 * Fetch user's quarantine tracking records.
 * Query params:
 *   - tank_id: Filter by specific tank
 *   - status: Filter by status (in_progress, completed, cancelled)
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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const tankId = searchParams.get("tank_id");
    const status = searchParams.get("status");

    // Build query
    let query = supabase
      .from("quarantine_tracking")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    // Apply filters
    if (tankId) {
      query = query.eq("tank_id", tankId);
    }

    if (status) {
      query = query.eq("status", status);
    }

    const { data: records, error: fetchError } = await query;

    if (fetchError) {
      console.error("Error fetching quarantine records:", fetchError);
      return errorResponse(
        "INTERNAL_SERVER_ERROR",
        "Failed to fetch quarantine records"
      );
    }

    return successResponse({
      quarantine_records: records || [],
      count: records?.length || 0,
    });
  } catch (error) {
    console.error("Quarantine GET error:", error);
    return errorResponse("INTERNAL_SERVER_ERROR", "An unexpected error occurred");
  }
}

/**
 * POST /api/quarantine
 *
 * Create a new quarantine tracking record.
 */
export async function POST(request: NextRequest) {
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

    // Parse and validate request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return errorResponse("INVALID_INPUT", "Invalid JSON in request body");
    }

    const validationResult = createQuarantineSchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.flatten().fieldErrors;
      const message = Object.entries(errors)
        .map(([field, messages]) => `${field}: ${(messages || []).join(", ")}`)
        .join("; ");
      return errorResponse("INVALID_INPUT", message || "Invalid input");
    }

    const data = validationResult.data;

    // Verify user owns the tank
    const { data: tank, error: tankError } = await supabase
      .from("tanks")
      .select("id, user_id")
      .eq("id", data.tank_id)
      .is("deleted_at", null)
      .single();

    if (tankError || !tank) {
      return errorResponse("NOT_FOUND", "Tank not found");
    }

    if (tank.user_id !== user.id) {
      return errorResponse(
        "PERMISSION_DENIED",
        "You do not have access to this tank"
      );
    }

    // Use default steps if none provided
    const stepsCompleted =
      data.steps_completed.length > 0
        ? data.steps_completed
        : DEFAULT_QUARANTINE_STEPS;

    // Calculate default target end date (2 weeks from now) if not provided
    const targetEndDate = data.target_end_date
      ? new Date(data.target_end_date)
      : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days

    // Insert quarantine record
    const { data: newRecord, error: insertError } = await supabase
      .from("quarantine_tracking")
      .insert({
        user_id: user.id,
        tank_id: data.tank_id,
        species_name: data.species_name.trim(),
        target_end_date: targetEndDate.toISOString(),
        steps_completed: stepsCompleted,
        notes: data.notes?.trim() || null,
        status: "in_progress",
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting quarantine record:", insertError);
      return errorResponse(
        "INTERNAL_SERVER_ERROR",
        "Failed to create quarantine record"
      );
    }

    return successResponse(
      {
        quarantine: newRecord,
      },
      201
    );
  } catch (error) {
    console.error("Quarantine POST error:", error);
    return errorResponse("INTERNAL_SERVER_ERROR", "An unexpected error occurred");
  }
}

/**
 * PATCH /api/quarantine
 *
 * Update a quarantine tracking record (steps_completed, status, notes).
 */
export async function PATCH(request: NextRequest) {
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

    // Parse and validate request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return errorResponse("INVALID_INPUT", "Invalid JSON in request body");
    }

    const validationResult = updateQuarantineSchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.flatten().fieldErrors;
      const message = Object.entries(errors)
        .map(([field, messages]) => `${field}: ${(messages || []).join(", ")}`)
        .join("; ");
      return errorResponse("INVALID_INPUT", message || "Invalid input");
    }

    const { quarantine_id, ...updateData } = validationResult.data;

    // Build update object (only include defined fields)
    const updates: Record<string, unknown> = {};

    if (updateData.steps_completed !== undefined) {
      updates.steps_completed = updateData.steps_completed;
    }
    if (updateData.status !== undefined) {
      updates.status = updateData.status;
    }
    if (updateData.target_end_date !== undefined) {
      updates.target_end_date = updateData.target_end_date;
    }
    if (updateData.notes !== undefined) {
      updates.notes = updateData.notes?.trim() || null;
    }

    if (Object.keys(updates).length === 0) {
      return errorResponse("INVALID_INPUT", "No valid fields to update");
    }

    // Update record (RLS will ensure user owns it)
    const { data: updatedRecord, error: updateError } = await supabase
      .from("quarantine_tracking")
      .update(updates)
      .eq("id", quarantine_id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating quarantine record:", updateError);
      if (updateError.code === "PGRST116") {
        return errorResponse("NOT_FOUND", "Quarantine record not found");
      }
      return errorResponse(
        "INTERNAL_SERVER_ERROR",
        "Failed to update quarantine record"
      );
    }

    if (!updatedRecord) {
      return errorResponse("NOT_FOUND", "Quarantine record not found");
    }

    return successResponse({
      quarantine: updatedRecord,
    });
  } catch (error) {
    console.error("Quarantine PATCH error:", error);
    return errorResponse("INTERNAL_SERVER_ERROR", "An unexpected error occurred");
  }
}

/**
 * DELETE /api/quarantine
 *
 * Delete a quarantine tracking record.
 * Query param: quarantine_id
 */
export async function DELETE(request: NextRequest) {
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

    // Get quarantine_id from query params
    const { searchParams } = new URL(request.url);
    const quarantineId = searchParams.get("quarantine_id");

    if (!quarantineId) {
      return errorResponse(
        "INVALID_INPUT",
        "quarantine_id query parameter is required"
      );
    }

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(quarantineId)) {
      return errorResponse("INVALID_INPUT", "Invalid quarantine_id format");
    }

    // Delete record (RLS will ensure user owns it)
    const { error: deleteError } = await supabase
      .from("quarantine_tracking")
      .delete()
      .eq("id", quarantineId)
      .eq("user_id", user.id);

    if (deleteError) {
      console.error("Error deleting quarantine record:", deleteError);
      return errorResponse(
        "INTERNAL_SERVER_ERROR",
        "Failed to delete quarantine record"
      );
    }

    return successResponse({ deleted: true });
  } catch (error) {
    console.error("Quarantine DELETE error:", error);
    return errorResponse("INTERNAL_SERVER_ERROR", "An unexpected error occurred");
  }
}
