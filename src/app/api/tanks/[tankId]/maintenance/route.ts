import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { successResponse, errorResponse } from "@/lib/api/response";
import {
  createMaintenanceTaskSchema,
  calculateNextDueDate,
} from "@/lib/validation/maintenance";

interface RouteContext {
  params: Promise<{ tankId: string }>;
}

/**
 * GET /api/tanks/[tankId]/maintenance
 *
 * List all maintenance tasks for a tank, ordered by next_due_date ASC.
 * Includes overdue flag and count of completed logs per task.
 */
export async function GET(request: NextRequest, context: RouteContext) {
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
      return errorResponse(
        "PERMISSION_DENIED",
        "You do not have access to this tank"
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get("include_inactive") === "true";

    // Build query for tasks
    let tasksQuery = supabase
      .from("maintenance_tasks")
      .select("*")
      .eq("tank_id", tankId)
      .is("deleted_at", null)
      .order("next_due_date", { ascending: true });

    if (!includeInactive) {
      tasksQuery = tasksQuery.eq("is_active", true);
    }

    const { data: tasks, error: tasksError } = await tasksQuery;

    if (tasksError) {
      console.error("Error fetching maintenance tasks:", tasksError);
      return errorResponse(
        "INTERNAL_SERVER_ERROR",
        "Failed to fetch maintenance tasks"
      );
    }

    // Get log counts for each task
    const taskIds = (tasks || []).map((task: { id: string }) => task.id);
    const logCounts: Record<string, number> = {};

    if (taskIds.length > 0) {
      const { data: logs, error: logsError } = await supabase
        .from("maintenance_logs")
        .select("task_id")
        .in("task_id", taskIds);

      if (!logsError && logs) {
        // Count logs per task
        logs.forEach((log: { task_id: string }) => {
          logCounts[log.task_id] = (logCounts[log.task_id] || 0) + 1;
        });
      }
    }

    // Transform tasks to include overdue flag and log count
    const now = new Date();
    const tasksWithMetadata = (tasks || []).map((task: { id: string; next_due_date: string; [key: string]: unknown }) => {
      const nextDueDate = new Date(task.next_due_date);
      const overdue = nextDueDate < now;

      return {
        ...task,
        overdue,
        log_count: logCounts[task.id] || 0,
      };
    });

    return successResponse({
      tasks: tasksWithMetadata,
      count: tasksWithMetadata.length,
    });
  } catch (error) {
    console.error("Maintenance tasks GET error:", error);
    return errorResponse("INTERNAL_SERVER_ERROR", "An unexpected error occurred");
  }
}

/**
 * POST /api/tanks/[tankId]/maintenance
 *
 * Create a new maintenance task for a tank.
 */
export async function POST(request: NextRequest, context: RouteContext) {
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

    const validationResult = createMaintenanceTaskSchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.flatten().fieldErrors;
      const message = Object.entries(errors)
        .map(([field, messages]) => `${field}: ${(messages || []).join(", ")}`)
        .join("; ");
      return errorResponse("INVALID_INPUT", message || "Invalid input");
    }

    const taskData = validationResult.data;

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

    // Calculate next_due_date if not provided (or if frequency is not "once")
    let nextDueDate: Date;
    if (taskData.next_due_date) {
      nextDueDate = new Date(taskData.next_due_date);
    } else if (taskData.frequency === "once") {
      // This should have been caught by validation, but double-check
      return errorResponse(
        "INVALID_INPUT",
        "next_due_date is required when frequency is 'once'"
      );
    } else {
      // Calculate based on frequency from today
      const today = new Date();
      nextDueDate = calculateNextDueDate(
        taskData.frequency as import("@/lib/validation/maintenance").TaskFrequency,
        today,
        taskData.custom_interval_days || null
      );
    }

    // Validate next_due_date is not in the past (unless frequency is "once" and user explicitly set it)
    if (taskData.frequency !== "once" && nextDueDate < new Date()) {
      return errorResponse(
        "INVALID_INPUT",
        "next_due_date cannot be in the past for recurring tasks"
      );
    }

    // Prepare data for insertion
    const insertData = {
      tank_id: tankId,
      type: taskData.type,
      title: taskData.title.trim(),
      description: taskData.description?.trim() || null,
      frequency: taskData.frequency,
      custom_interval_days: taskData.custom_interval_days || null,
      next_due_date: nextDueDate.toISOString().split("T")[0], // DATE type in DB
      reminder_before_hours: taskData.reminder_before_hours || 24,
      is_active: taskData.is_active !== undefined ? taskData.is_active : true,
    };

    // Insert task
    const { data: newTask, error: insertError } = await supabase
      .from("maintenance_tasks")
      .insert(insertData)
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting maintenance task:", insertError);
      return errorResponse(
        "INTERNAL_SERVER_ERROR",
        "Failed to create maintenance task"
      );
    }

    return successResponse(
      {
        task: newTask,
      },
      201
    );
  } catch (error) {
    console.error("Maintenance task POST error:", error);
    return errorResponse("INTERNAL_SERVER_ERROR", "An unexpected error occurred");
  }
}
