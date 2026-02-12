/**
 * Starter Tasks Library
 *
 * Auto-generates helpful starter tasks for new users based on their
 * onboarding situation (new tank vs existing tank).
 *
 * These tasks help guide users through essential setup steps and
 * establish good aquarium maintenance habits.
 */

import type { TaskType, TaskFrequency } from "@/lib/validation/maintenance";
import type { SupabaseClient } from "@supabase/supabase-js";

// ============================================================================
// TASK TEMPLATES
// ============================================================================

export interface StarterTaskTemplate {
  title: string;
  type: TaskType;
  description: string;
  frequency: TaskFrequency;
  /** Days from tank creation to set as due date (for "once" tasks) */
  daysFromNow?: number;
  /** Reminder hours before due date */
  reminderHours?: number;
}

/**
 * Starter tasks for users setting up a new tank.
 * These are checklist-style tasks that guide users through the cycling process.
 */
export const NEW_TANK_STARTER_TASKS: StarterTaskTemplate[] = [
  {
    title: "Cycle your tank",
    type: "custom",
    description:
      "Establish beneficial bacteria before adding fish. This typically takes 4-6 weeks. The AI assistant can help you track your cycling progress.",
    frequency: "once",
    daysFromNow: 42, // 6 weeks target
    reminderHours: 168, // 1 week reminder
  },
  {
    title: "Test water parameters",
    type: "water_testing",
    description:
      "Monitor ammonia, nitrite, and nitrate to track cycling progress. Daily testing during cycling is essential.",
    frequency: "daily",
    reminderHours: 24,
  },
  {
    title: "Research compatible fish",
    type: "custom",
    description:
      "Plan your stocking list before buying fish. Use the Species page to check compatibility and tank size requirements.",
    frequency: "once",
    daysFromNow: 14, // 2 weeks into cycling
    reminderHours: 48,
  },
  {
    title: "Add first fish",
    type: "custom",
    description:
      "Start with hardy species and add slowly over weeks. Don't rush - adding fish too quickly can crash your cycle.",
    frequency: "once",
    daysFromNow: 42, // After cycling completes
    reminderHours: 24,
  },
];

/**
 * Starter tasks for users with an existing tank.
 * These help them get set up with the app and establish tracking habits.
 */
export const EXISTING_TANK_STARTER_TASKS: StarterTaskTemplate[] = [
  {
    title: "Log current water parameters",
    type: "water_testing",
    description:
      "Establish a baseline for AI analysis. Log your current ammonia, nitrite, nitrate, pH, and temperature.",
    frequency: "once",
    daysFromNow: 0, // Due today
    reminderHours: 24,
  },
  {
    title: "Add your livestock",
    type: "custom",
    description:
      "Record what's in your tank so AI can check compatibility and give personalized advice.",
    frequency: "once",
    daysFromNow: 1, // Due tomorrow
    reminderHours: 24,
  },
  {
    title: "Set up maintenance schedule",
    type: "custom",
    description:
      "Based on your tank setup, I'll suggest regular maintenance tasks. Open AI chat and ask for recommendations!",
    frequency: "once",
    daysFromNow: 3, // A few days to get set up first
    reminderHours: 24,
  },
];

// ============================================================================
// GENERATION FUNCTION
// ============================================================================

export type StarterTaskSituation = "new_tank" | "existing_tank";

/**
 * Creates starter tasks for a tank based on the user's situation.
 *
 * @param supabase - Authenticated Supabase client
 * @param userId - The user's ID (for validation)
 * @param tankId - The tank to create tasks for
 * @param situation - "new_tank" or "existing_tank"
 * @returns Object with created tasks count and any errors
 */
export async function createStarterTasks(
  supabase: SupabaseClient,
  userId: string,
  tankId: string,
  situation: StarterTaskSituation
): Promise<{
  success: boolean;
  tasksCreated: number;
  error?: string;
}> {
  try {
    // Verify tank exists and belongs to user
    const { data: tank, error: tankError } = await supabase
      .from("tanks")
      .select("id, user_id, name")
      .eq("id", tankId)
      .is("deleted_at", null)
      .single();

    if (tankError || !tank) {
      return {
        success: false,
        tasksCreated: 0,
        error: "Tank not found",
      };
    }

    if (tank.user_id !== userId) {
      return {
        success: false,
        tasksCreated: 0,
        error: "Permission denied",
      };
    }

    // Check if starter tasks already exist for this tank
    // We identify starter tasks by checking for exact title matches
    const templates =
      situation === "new_tank"
        ? NEW_TANK_STARTER_TASKS
        : EXISTING_TANK_STARTER_TASKS;

    const starterTitles = templates.map((t) => t.title);

    const { data: existingTasks, error: existingError } = await supabase
      .from("maintenance_tasks")
      .select("title")
      .eq("tank_id", tankId)
      .in("title", starterTitles);

    if (existingError) {
      console.error("Error checking existing tasks:", existingError);
      return {
        success: false,
        tasksCreated: 0,
        error: "Failed to check existing tasks",
      };
    }

    // Filter out tasks that already exist (idempotency)
    const existingTitles = new Set(
      (existingTasks || []).map((t: { title: string }) => t.title)
    );
    const tasksToCreate = templates.filter((t) => !existingTitles.has(t.title));

    if (tasksToCreate.length === 0) {
      // All tasks already exist - this is fine, return success
      return {
        success: true,
        tasksCreated: 0,
      };
    }

    // Calculate due dates and prepare insert data
    const now = new Date();
    const insertData = tasksToCreate.map((template) => {
      let nextDueDate: Date;

      if (template.frequency === "once" && template.daysFromNow !== undefined) {
        // For one-time tasks, set due date based on daysFromNow
        nextDueDate = new Date(now);
        nextDueDate.setDate(nextDueDate.getDate() + template.daysFromNow);
      } else {
        // For recurring tasks, start tomorrow
        nextDueDate = new Date(now);
        nextDueDate.setDate(nextDueDate.getDate() + 1);
      }

      return {
        tank_id: tankId,
        type: template.type,
        title: template.title,
        description: template.description,
        frequency: template.frequency,
        next_due_date: nextDueDate.toISOString().split("T")[0], // DATE format
        reminder_before_hours: template.reminderHours || 24,
        is_active: true,
      };
    });

    // Insert all tasks
    const { error: insertError } = await supabase
      .from("maintenance_tasks")
      .insert(insertData);

    if (insertError) {
      console.error("Error creating starter tasks:", insertError);
      return {
        success: false,
        tasksCreated: 0,
        error: "Failed to create starter tasks",
      };
    }

    return {
      success: true,
      tasksCreated: insertData.length,
    };
  } catch (error) {
    console.error("Unexpected error in createStarterTasks:", error);
    return {
      success: false,
      tasksCreated: 0,
      error: "An unexpected error occurred",
    };
  }
}

/**
 * Get starter task templates for a given situation.
 * Useful for displaying what tasks will be created in the UI.
 */
export function getStarterTaskTemplates(
  situation: StarterTaskSituation
): StarterTaskTemplate[] {
  return situation === "new_tank"
    ? NEW_TANK_STARTER_TASKS
    : EXISTING_TANK_STARTER_TASKS;
}
