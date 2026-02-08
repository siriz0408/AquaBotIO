import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { successResponse, errorResponse } from "@/lib/api/response";
import {
  updateMaintenanceTaskSchema,
  calculateNextDueDate,
} from "@/lib/validation/maintenance";

interface RouteContext {
  params: Promise<{ tankId: string; taskId: string }>;
}

/**
 * GET /api/tanks/[tankId]/maintenance/[taskId]
 *
 * Get a single maintenance task with its recent logs (last 10).
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { tankId, taskId } = await context.params;
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
      return errorResponse(
        "PERMISSION_DENIED",
        "You do not have access to this tank"
      );
    }

    // Get the task and verify it belongs to this tank
    const { data: task, error: taskError } = await supabase
      .from("maintenance_tasks")
      .select("*")
      .eq("id", taskId)
      .eq("tank_id", tankId)
      .is("deleted_at", null)
      .single();

    if (taskError || !task) {
      return errorResponse("NOT_FOUND", "Maintenance task not found");
    }

    // Get recent logs (last 10)
    const { data: logs, error: logsError } = await supabase
      .from("maintenance_logs")
      .select("*")
      .eq("task_id", taskId)
      .order("completed_at", { ascending: false })
      .limit(10);

    if (logsError) {
      console.error("Error fetching maintenance logs:", logsError);
      // Don't fail the request if logs fail, just return empty array
    }

    // Calculate overdue flag
    const now = new Date();
    const nextDueDate = new Date(task.next_due_date);
    const overdue = nextDueDate < now;

    return successResponse({
      task: {
        ...task,
        overdue,
      },
      logs: logs || [],
      log_count: logs?.length || 0,
    });
  } catch (error) {
    console.error("Maintenance task GET error:", error);
    return errorResponse("INTERNAL_SERVER_ERROR", "An unexpected error occurred");
  }
}

/**
 * PUT /api/tanks/[tankId]/maintenance/[taskId]
 *
 * Update a maintenance task. Recalculates next_due_date if frequency changes.
 */
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { tankId, taskId } = await context.params;
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

    const validationResult = updateMaintenanceTaskSchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.flatten().fieldErrors;
      const message = Object.entries(errors)
        .map(([field, messages]) => `${field}: ${(messages || []).join(", ")}`)
        .join("; ");
      return errorResponse("INVALID_INPUT", message || "Invalid input");
    }

    const updateData = validationResult.data;

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
      return errorResponse(
        "PERMISSION_DENIED",
        "You do not have access to this tank"
      );
    }

    // Get the existing task
    const { data: existingTask, error: existingTaskError } = await supabase
      .from("maintenance_tasks")
      .select("*")
      .eq("id", taskId)
      .eq("tank_id", tankId)
      .is("deleted_at", null)
      .single();

    if (existingTaskError || !existingTask) {
      return errorResponse("NOT_FOUND", "Maintenance task not found");
    }

    // Prepare update data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updatePayload: any = {};

    if (updateData.type !== undefined) {
      updatePayload.type = updateData.type;
    }
    if (updateData.title !== undefined) {
      updatePayload.title = updateData.title.trim();
    }
    if (updateData.description !== undefined) {
      updatePayload.description = updateData.description?.trim() || null;
    }
    if (updateData.reminder_before_hours !== undefined) {
      updatePayload.reminder_before_hours = updateData.reminder_before_hours;
    }
    if (updateData.is_active !== undefined) {
      updatePayload.is_active = updateData.is_active;
    }

    // Handle frequency change - recalculate next_due_date if frequency changes
    if (updateData.frequency !== undefined) {
      updatePayload.frequency = updateData.frequency;
      updatePayload.custom_interval_days =
        updateData.custom_interval_days !== undefined
          ? updateData.custom_interval_days
          : existingTask.custom_interval_days;

      // Recalculate next_due_date based on new frequency
      const newFrequency = updateData.frequency;
      const baseDate = updateData.next_due_date
        ? new Date(updateData.next_due_date)
        : new Date(existingTask.next_due_date);

      if (newFrequency === "once") {
        // For "once", next_due_date must be provided
        if (!updateData.next_due_date) {
          return errorResponse(
            "INVALID_INPUT",
            "next_due_date is required when frequency is 'once'"
          );
        }
        updatePayload.next_due_date = new Date(
          updateData.next_due_date
        ).toISOString().split("T")[0];
      } else {
        // Calculate next occurrence from base date
        const nextDue = calculateNextDueDate(
          newFrequency as import("@/lib/validation/maintenance").TaskFrequency,
          baseDate,
          updatePayload.custom_interval_days || null
        );
        updatePayload.next_due_date = nextDue.toISOString().split("T")[0];
      }
    } else if (updateData.custom_interval_days !== undefined) {
      // If only custom_interval_days changed and frequency is custom, recalculate
      updatePayload.custom_interval_days = updateData.custom_interval_days;
      if (existingTask.frequency === "custom") {
        const baseDate = updateData.next_due_date
          ? new Date(updateData.next_due_date)
          : new Date(existingTask.next_due_date);
        const nextDue = calculateNextDueDate(
          "custom",
          baseDate,
          updateData.custom_interval_days
        );
        updatePayload.next_due_date = nextDue.toISOString().split("T")[0];
      }
    }

    // Handle next_due_date update (if provided and frequency is not changing)
    if (
      updateData.next_due_date !== undefined &&
      updateData.frequency === undefined
    ) {
      updatePayload.next_due_date = new Date(
        updateData.next_due_date
      ).toISOString().split("T")[0];
    }

    // Update the task
    const { data: updatedTask, error: updateError } = await supabase
      .from("maintenance_tasks")
      .update(updatePayload)
      .eq("id", taskId)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating maintenance task:", updateError);
      return errorResponse(
        "INTERNAL_SERVER_ERROR",
        "Failed to update maintenance task"
      );
    }

    return successResponse({
      task: updatedTask,
    });
  } catch (error) {
    console.error("Maintenance task PUT error:", error);
    return errorResponse("INTERNAL_SERVER_ERROR", "An unexpected error occurred");
  }
}

/**
 * DELETE /api/tanks/[tankId]/maintenance/[taskId]
 *
 * Soft-delete a maintenance task (set deleted_at).
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { tankId, taskId } = await context.params;
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
      return errorResponse(
        "PERMISSION_DENIED",
        "You do not have access to this tank"
      );
    }

    // Verify task exists and belongs to this tank
    const { data: task, error: taskError } = await supabase
      .from("maintenance_tasks")
      .select("id")
      .eq("id", taskId)
      .eq("tank_id", tankId)
      .is("deleted_at", null)
      .single();

    if (taskError || !task) {
      return errorResponse("NOT_FOUND", "Maintenance task not found");
    }

    // Soft-delete the task
    const { error: deleteError } = await supabase
      .from("maintenance_tasks")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", taskId);

    if (deleteError) {
      console.error("Error deleting maintenance task:", deleteError);
      return errorResponse(
        "INTERNAL_SERVER_ERROR",
        "Failed to delete maintenance task"
      );
    }

    return successResponse({ success: true });
  } catch (error) {
    console.error("Maintenance task DELETE error:", error);
    return errorResponse("INTERNAL_SERVER_ERROR", "An unexpected error occurred");
  }
}
