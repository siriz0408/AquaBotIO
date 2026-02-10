import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { successResponse, errorResponse } from "@/lib/api/response";
import {
  actionExecuteRequestSchema,
  type LogParametersPayload,
  type AddLivestockPayload,
  type ScheduleMaintenancePayload,
  type CompleteMaintenancePayload,
} from "@/lib/validation/actions";
import { calculateNextDueDate, TaskFrequency } from "@/lib/validation/maintenance";

/**
 * POST /api/ai/actions/execute
 *
 * Execute actions directly from AI chat.
 * Supports: log_parameters, add_livestock, schedule_maintenance, complete_maintenance
 *
 * Per Spec 17: AI Proactive Intelligence & Action Execution (R-017.2)
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
      return errorResponse("AUTH_REQUIRED", "You must be logged in to execute actions");
    }

    // Parse and validate request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return errorResponse("INVALID_INPUT", "Invalid JSON in request body");
    }

    // Normalize AI-generated payloads before validation
    // The AI sometimes generates slightly off field values (e.g., "water change" instead of "water_change")
    const normalized = normalizeActionPayload(body as Record<string, unknown>);

    const validationResult = actionExecuteRequestSchema.safeParse(normalized);

    if (!validationResult.success) {
      const errors = validationResult.error.flatten().fieldErrors;
      const message = Object.entries(errors)
        .map(([field, messages]) => `${field}: ${(messages || []).join(", ")}`)
        .join("; ");
      return errorResponse("INVALID_INPUT", message || "Invalid action request");
    }

    const { action, tank_id, payload } = validationResult.data;

    // Verify user owns the tank
    const { data: tank, error: tankError } = await supabase
      .from("tanks")
      .select("id, user_id, name, type")
      .eq("id", tank_id)
      .is("deleted_at", null)
      .single();

    if (tankError || !tank) {
      return errorResponse("NOT_FOUND", "Tank not found");
    }

    if (tank.user_id !== user.id) {
      return errorResponse("PERMISSION_DENIED", "You do not have access to this tank");
    }

    // Execute the appropriate action
    switch (action) {
      case "log_parameters":
        return await executeLogParameters(supabase, tank_id, tank.name, payload as LogParametersPayload);
      case "add_livestock":
        return await executeAddLivestock(supabase, tank_id, tank, payload as AddLivestockPayload);
      case "schedule_maintenance":
        return await executeScheduleMaintenance(supabase, tank_id, tank.name, payload as ScheduleMaintenancePayload);
      case "complete_maintenance":
        return await executeCompleteMaintenance(supabase, tank_id, tank.name, payload as CompleteMaintenancePayload);
      default:
        return errorResponse("INVALID_INPUT", `Unknown action type: ${action}`);
    }
  } catch (error) {
    console.error("Action execution error:", error);
    return errorResponse("INTERNAL_SERVER_ERROR", "An unexpected error occurred while executing action");
  }
}

/**
 * Execute log_parameters action
 */
async function executeLogParameters(
  supabase: Awaited<ReturnType<typeof createClient>>,
  tankId: string,
  tankName: string,
  payload: LogParametersPayload
) {
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

  // Map payload fields to database columns
  const insertData = {
    tank_id: tankId,
    measured_at: new Date().toISOString(),
    ph: payload.ph ?? null,
    ammonia_ppm: payload.ammonia ?? null,
    nitrite_ppm: payload.nitrite ?? null,
    nitrate_ppm: payload.nitrate ?? null,
    temperature_f: payload.temperature ?? null,
    gh_dgh: payload.gh ?? null,
    kh_dgh: payload.kh ?? null,
    salinity: payload.salinity ?? null,
    calcium_ppm: payload.calcium ?? null,
    alkalinity_dkh: payload.alkalinity ?? null,
    magnesium_ppm: payload.magnesium ?? null,
    phosphate_ppm: payload.phosphate ?? null,
    notes: payload.notes?.trim() || null,
  };

  const { data: newParameter, error: insertError } = await supabase
    .from("water_parameters")
    .insert(insertData)
    .select()
    .single();

  if (insertError) {
    console.error("Error inserting parameter:", insertError);
    return errorResponse("INTERNAL_SERVER_ERROR", "Failed to log parameters");
  }

  // Build summary of logged parameters
  const loggedParams: string[] = [];
  if (payload.ph !== null && payload.ph !== undefined) loggedParams.push(`pH ${payload.ph}`);
  if (payload.ammonia !== null && payload.ammonia !== undefined) loggedParams.push(`ammonia ${payload.ammonia} ppm`);
  if (payload.nitrite !== null && payload.nitrite !== undefined) loggedParams.push(`nitrite ${payload.nitrite} ppm`);
  if (payload.nitrate !== null && payload.nitrate !== undefined) loggedParams.push(`nitrate ${payload.nitrate} ppm`);
  if (payload.temperature !== null && payload.temperature !== undefined) loggedParams.push(`temperature ${payload.temperature}°F`);

  return successResponse(
    {
      action_id: newParameter.id,
      executed_at: newParameter.created_at,
      result: {
        parameter_id: newParameter.id,
        tank_name: tankName,
        logged_parameters: loggedParams,
        summary: `Logged ${loggedParams.join(", ")} for ${tankName}`,
      },
    },
    201
  );
}

/**
 * Execute add_livestock action
 */
async function executeAddLivestock(
  supabase: Awaited<ReturnType<typeof createClient>>,
  tankId: string,
  tank: { id: string; name: string; type: string },
  payload: AddLivestockPayload
) {
  let speciesId: string | null = null;
  let speciesName: string;
  const compatibilityWarnings: string[] = [];

  // If species_id provided, verify and check compatibility
  if (payload.species_id) {
    const { data: species, error: speciesError } = await supabase
      .from("species")
      .select("id, common_name, type, temperament, min_tank_size_gallons")
      .eq("id", payload.species_id)
      .single();

    if (speciesError || !species) {
      return errorResponse("NOT_FOUND", "Species not found in database");
    }

    speciesId = species.id;
    speciesName = species.common_name;

    // Tank type compatibility check
    if (
      (tank.type === "freshwater" && species.type === "saltwater") ||
      (tank.type === "saltwater" && species.type === "freshwater")
    ) {
      compatibilityWarnings.push(
        `${species.common_name} is a ${species.type} species but your tank is ${tank.type}. This may cause health issues.`
      );
    }

    // Aggressive species check
    if (species.temperament === "aggressive") {
      const { data: existingLivestock } = await supabase
        .from("livestock")
        .select(`
          id,
          species:species_id (temperament, common_name)
        `)
        .eq("tank_id", tankId)
        .is("deleted_at", null)
        .eq("is_active", true);

      const hasConflict = existingLivestock?.some((item) => {
        const speciesData = item.species as { temperament?: string; common_name?: string } | null;
        return speciesData?.temperament === "peaceful";
      });

      if (hasConflict) {
        compatibilityWarnings.push(
          `${species.common_name} is aggressive and may harm peaceful fish in your tank.`
        );
      }
    }

    // If there are compatibility issues, return a CONFLICT error
    if (compatibilityWarnings.length > 0) {
      return errorResponse(
        "CONFLICT",
        `Compatibility concerns: ${compatibilityWarnings.join(" ")}`
      );
    }
  } else if (payload.species_name) {
    // Try to find species by name
    const { data: speciesResults } = await supabase
      .from("species")
      .select("id, common_name, type, temperament")
      .ilike("common_name", `%${payload.species_name}%`)
      .limit(1);

    if (speciesResults && speciesResults.length > 0) {
      speciesId = speciesResults[0].id;
      speciesName = speciesResults[0].common_name;
    } else {
      // Use custom name
      speciesName = payload.species_name;
    }
  } else {
    return errorResponse("INVALID_INPUT", "Either species_id or species_name is required");
  }

  // Insert livestock
  const { data: newLivestock, error: insertError } = await supabase
    .from("livestock")
    .insert({
      tank_id: tankId,
      species_id: speciesId,
      custom_name: speciesId ? null : speciesName,
      nickname: payload.nickname || null,
      quantity: payload.quantity,
      notes: payload.notes || null,
      date_added: new Date().toISOString().split("T")[0],
      is_active: true,
    })
    .select(`
      *,
      species:species_id (
        id,
        common_name,
        scientific_name,
        type,
        care_level,
        temperament
      )
    `)
    .single();

  if (insertError) {
    console.error("Error inserting livestock:", insertError);
    return errorResponse("INTERNAL_SERVER_ERROR", "Failed to add livestock");
  }

  return successResponse(
    {
      action_id: newLivestock.id,
      executed_at: newLivestock.created_at,
      result: {
        livestock_id: newLivestock.id,
        tank_name: tank.name,
        species_name: speciesName,
        quantity: payload.quantity,
        summary: `Added ${payload.quantity} ${speciesName} to ${tank.name}`,
        warnings: compatibilityWarnings.length > 0 ? compatibilityWarnings : undefined,
      },
    },
    201
  );
}

/**
 * Execute schedule_maintenance action
 */
async function executeScheduleMaintenance(
  supabase: Awaited<ReturnType<typeof createClient>>,
  tankId: string,
  tankName: string,
  payload: ScheduleMaintenancePayload
) {
  // Parse the due date
  let nextDueDate: Date;
  try {
    nextDueDate = new Date(payload.due_date);
    if (isNaN(nextDueDate.getTime())) {
      return errorResponse("INVALID_INPUT", "Invalid due date format");
    }
  } catch {
    return errorResponse("INVALID_INPUT", "Invalid due date format");
  }

  // For recurring tasks, validate next_due_date is not in the past
  if (payload.frequency !== "once" && nextDueDate < new Date()) {
    return errorResponse(
      "INVALID_INPUT",
      "Due date cannot be in the past for recurring tasks"
    );
  }

  // Prepare data for insertion
  const insertData = {
    tank_id: tankId,
    type: payload.task_type,
    title: payload.title.trim(),
    description: payload.description?.trim() || null,
    frequency: payload.frequency,
    custom_interval_days: payload.custom_interval_days || null,
    next_due_date: nextDueDate.toISOString().split("T")[0],
    reminder_before_hours: payload.reminder_before_hours || 24,
    is_active: true,
  };

  const { data: newTask, error: insertError } = await supabase
    .from("maintenance_tasks")
    .insert(insertData)
    .select()
    .single();

  if (insertError) {
    console.error("Error inserting maintenance task:", insertError);
    return errorResponse("INTERNAL_SERVER_ERROR", "Failed to schedule maintenance task");
  }

  return successResponse(
    {
      action_id: newTask.id,
      executed_at: newTask.created_at,
      result: {
        task_id: newTask.id,
        tank_name: tankName,
        task_type: payload.task_type,
        title: payload.title,
        due_date: nextDueDate.toISOString().split("T")[0],
        frequency: payload.frequency,
        summary: `Scheduled "${payload.title}" for ${tankName} on ${nextDueDate.toLocaleDateString()}`,
      },
    },
    201
  );
}

/**
 * Execute complete_maintenance action
 */
async function executeCompleteMaintenance(
  supabase: Awaited<ReturnType<typeof createClient>>,
  tankId: string,
  tankName: string,
  payload: CompleteMaintenancePayload
) {
  // Get the task and verify it belongs to this tank
  const { data: task, error: taskError } = await supabase
    .from("maintenance_tasks")
    .select("*")
    .eq("id", payload.task_id)
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
      task_id: payload.task_id,
      completed_at: completedAt.toISOString(),
      notes: payload.notes?.trim() || null,
    })
    .select()
    .single();

  if (logError) {
    console.error("Error creating maintenance log:", logError);
    return errorResponse("INTERNAL_SERVER_ERROR", "Failed to log task completion");
  }

  // Update task: advance next_due_date for recurring tasks
  const updatePayload: Record<string, unknown> = {};

  if (task.frequency === "once") {
    // For one-time tasks, mark as inactive
    updatePayload.is_active = false;
  } else {
    // For recurring tasks, calculate next occurrence from completion time
    const nextDue = calculateNextDueDate(
      task.frequency as TaskFrequency,
      completedAt,
      task.custom_interval_days || null
    );
    updatePayload.next_due_date = nextDue.toISOString().split("T")[0];
  }

  const { data: updatedTask, error: updateError } = await supabase
    .from("maintenance_tasks")
    .update(updatePayload)
    .eq("id", payload.task_id)
    .select()
    .single();

  if (updateError) {
    console.error("Error updating maintenance task:", updateError);
    // Log was created, so don't fail the request
    console.warn("Task completion logged but next_due_date update failed");
  }

  return successResponse(
    {
      action_id: logEntry.id,
      executed_at: logEntry.completed_at,
      result: {
        log_id: logEntry.id,
        task_id: payload.task_id,
        task_title: task.title,
        tank_name: tankName,
        completed_at: completedAt.toISOString(),
        next_due_date: updatedTask?.next_due_date || null,
        summary: `Completed "${task.title}" for ${tankName}`,
      },
    },
    201
  );
}

/**
 * Normalize AI-generated action payloads to match our Zod schemas.
 * The AI sometimes generates slightly off values that need correction.
 */
function normalizeActionPayload(body: Record<string, unknown>): Record<string, unknown> {
  if (!body || typeof body !== "object") return body;

  const result = { ...body };

  // Normalize the payload sub-object
  if (result.payload && typeof result.payload === "object") {
    const payload = { ...result.payload } as Record<string, unknown>;

    // Normalize task_type for schedule_maintenance
    if (result.action === "schedule_maintenance" && payload.task_type) {
      const taskTypeMap: Record<string, string> = {
        "water change": "water_change",
        "waterchange": "water_change",
        "filter clean": "filter_cleaning",
        "filter cleaning": "filter_cleaning",
        "filterclean": "filter_cleaning",
        "feed": "feeding",
        "dose": "dosing",
        "equipment maintenance": "equipment_maintenance",
        "equipment": "equipment_maintenance",
        "water test": "water_testing",
        "water testing": "water_testing",
        "test water": "water_testing",
      };
      const raw = String(payload.task_type).toLowerCase().trim();
      payload.task_type = taskTypeMap[raw] || raw.replace(/\s+/g, "_");
    }

    // Normalize frequency
    if (payload.frequency) {
      const freqMap: Record<string, string> = {
        "every day": "daily",
        "everyday": "daily",
        "every week": "weekly",
        "everyweek": "weekly",
        "every two weeks": "biweekly",
        "bi-weekly": "biweekly",
        "every month": "monthly",
        "one time": "once",
        "one-time": "once",
      };
      const rawFreq = String(payload.frequency).toLowerCase().trim();
      payload.frequency = freqMap[rawFreq] || rawFreq;
    }

    // Normalize due_date — handle relative dates
    if (payload.due_date) {
      const rawDate = String(payload.due_date).toLowerCase().trim();
      const now = new Date();

      if (rawDate === "today") {
        payload.due_date = now.toISOString().split("T")[0];
      } else if (rawDate === "tomorrow") {
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        payload.due_date = tomorrow.toISOString().split("T")[0];
      } else if (rawDate.match(/^in\s+(\d+)\s+days?$/)) {
        const days = parseInt(rawDate.match(/(\d+)/)![1]);
        const future = new Date(now);
        future.setDate(future.getDate() + days);
        payload.due_date = future.toISOString().split("T")[0];
      } else if (rawDate.match(/^next\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)$/i)) {
        const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
        const targetDay = dayNames.indexOf(rawDate.split(" ")[1].toLowerCase());
        if (targetDay >= 0) {
          const current = now.getDay();
          const daysUntil = (targetDay - current + 7) % 7 || 7;
          const future = new Date(now);
          future.setDate(future.getDate() + daysUntil);
          payload.due_date = future.toISOString().split("T")[0];
        }
      }
      // Otherwise leave as-is and let Zod validate
    }

    result.payload = payload;
  }

  return result;
}
