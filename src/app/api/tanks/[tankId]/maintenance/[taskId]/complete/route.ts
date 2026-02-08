import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { successResponse, errorResponse } from "@/lib/api/response";
import {
  completeTaskSchema,
  calculateNextDueDate,
} from "@/lib/validation/maintenance";

interface RouteContext {
  params: Promise<{ tankId: string; taskId: string }>;
}

/**
 * POST /api/tanks/[tankId]/maintenance/[taskId]/complete
 *
 * Mark a maintenance task as completed.
 * Creates a maintenance_log entry and advances next_due_date for recurring tasks.
 */
export async function POST(request: NextRequest, context: RouteContext) {
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

    const validationResult = completeTaskSchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.flatten().fieldErrors;
      const message = Object.entries(errors)
        .map(([field, messages]) => `${field}: ${(messages || []).join(", ")}`)
        .join("; ");
      return errorResponse("INVALID_INPUT", message || "Invalid input");
    }

    const completionData = validationResult.data;

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

    // Create maintenance log entry
    const completedAt = new Date();
    const { data: logEntry, error: logError } = await supabase
      .from("maintenance_logs")
      .insert({
        task_id: taskId,
        completed_at: completedAt.toISOString(),
        notes: completionData.notes?.trim() || null,
        photo_url: completionData.photo_url || null,
      })
      .select()
      .single();

    if (logError) {
      console.error("Error creating maintenance log:", logError);
      return errorResponse(
        "INTERNAL_SERVER_ERROR",
        "Failed to log task completion"
      );
    }

    // Update task: advance next_due_date for recurring tasks
    const updatePayload: Record<string, unknown> = {};

    if (task.frequency === "once") {
      // For one-time tasks, mark as inactive
      updatePayload.is_active = false;
      // Keep next_due_date as is (or could set to null, but DB requires it)
    } else {
      // For recurring tasks, calculate next occurrence from completion time
      const nextDue = calculateNextDueDate(
        task.frequency,
        completedAt,
        task.custom_interval_days || null
      );
      updatePayload.next_due_date = nextDue.toISOString().split("T")[0];
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
      // Log was created, so don't fail the request - just log the error
      console.warn("Task completion logged but next_due_date update failed");
    }

    return successResponse(
      {
        task: updatedTask || task,
        log: logEntry,
      },
      201
    );
  } catch (error) {
    console.error("Task completion POST error:", error);
    return errorResponse("INTERNAL_SERVER_ERROR", "An unexpected error occurred");
  }
}
