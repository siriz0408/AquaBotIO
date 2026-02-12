import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { successResponse, errorResponse } from "@/lib/api/response";
import {
  createStarterTasks,
  getStarterTaskTemplates,
  type StarterTaskSituation,
} from "@/lib/tasks/starter-tasks";
import { z } from "zod";

/**
 * Schema for generate starter tasks request
 */
const generateStarterTasksSchema = z.object({
  tank_id: z.string().uuid("Invalid tank ID"),
  situation: z.enum(["new_tank", "existing_tank"], {
    message: "Situation must be 'new_tank' or 'existing_tank'",
  }),
});

/**
 * POST /api/tasks/generate-starter
 *
 * Generates starter tasks for a tank based on the user's situation.
 * This endpoint is idempotent - calling it multiple times will not create
 * duplicate tasks.
 *
 * Request body:
 * {
 *   tank_id: string (UUID),
 *   situation: "new_tank" | "existing_tank"
 * }
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     tasks_created: number,
 *     message: string
 *   }
 * }
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

    const validationResult = generateStarterTasksSchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.flatten().fieldErrors;
      const message = Object.entries(errors)
        .map(([field, messages]) => `${field}: ${(messages || []).join(", ")}`)
        .join("; ");
      return errorResponse("INVALID_INPUT", message || "Invalid input");
    }

    const { tank_id, situation } = validationResult.data;

    // Create starter tasks
    const result = await createStarterTasks(
      supabase,
      user.id,
      tank_id,
      situation as StarterTaskSituation
    );

    if (!result.success) {
      // Map specific errors to appropriate error codes
      if (result.error === "Tank not found") {
        return errorResponse("NOT_FOUND", result.error);
      }
      if (result.error === "Permission denied") {
        return errorResponse(
          "PERMISSION_DENIED",
          "You do not have access to this tank"
        );
      }
      return errorResponse(
        "INTERNAL_SERVER_ERROR",
        result.error || "Failed to create starter tasks"
      );
    }

    // Build response message
    let message: string;
    if (result.tasksCreated === 0) {
      message = "Starter tasks already exist for this tank";
    } else {
      message = `Created ${result.tasksCreated} starter task${result.tasksCreated === 1 ? "" : "s"} for your ${situation === "new_tank" ? "new" : "existing"} tank`;
    }

    return successResponse(
      {
        tasks_created: result.tasksCreated,
        message,
      },
      result.tasksCreated > 0 ? 201 : 200
    );
  } catch (error) {
    console.error("Generate starter tasks API error:", error);
    return errorResponse("INTERNAL_SERVER_ERROR", "An unexpected error occurred");
  }
}

/**
 * GET /api/tasks/generate-starter
 *
 * Returns the list of starter task templates for preview purposes.
 * Does not require authentication since this is just template info.
 *
 * Query params:
 * - situation: "new_tank" | "existing_tank" (required)
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     situation: string,
 *     tasks: StarterTaskTemplate[]
 *   }
 * }
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const situation = searchParams.get("situation");

    if (!situation || !["new_tank", "existing_tank"].includes(situation)) {
      return errorResponse(
        "INVALID_INPUT",
        "Query param 'situation' must be 'new_tank' or 'existing_tank'"
      );
    }

    const templates = getStarterTaskTemplates(
      situation as StarterTaskSituation
    );

    return successResponse({
      situation,
      tasks: templates.map((t) => ({
        title: t.title,
        type: t.type,
        description: t.description,
        frequency: t.frequency,
      })),
    });
  } catch (error) {
    console.error("Get starter task templates API error:", error);
    return errorResponse("INTERNAL_SERVER_ERROR", "An unexpected error occurred");
  }
}
