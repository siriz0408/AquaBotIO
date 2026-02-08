import { z } from "zod";

// Task type enum values
export const TaskType = [
  "water_change",
  "filter_cleaning",
  "feeding",
  "dosing",
  "equipment_maintenance",
  "water_testing",
  "custom",
] as const;

export type TaskType = (typeof TaskType)[number];

// Task frequency enum values
export const TaskFrequency = [
  "once",
  "daily",
  "weekly",
  "biweekly",
  "monthly",
  "custom",
] as const;

export type TaskFrequency = (typeof TaskFrequency)[number];

/**
 * Calculate next_due_date based on frequency and a base date
 */
export function calculateNextDueDate(
  frequency: TaskFrequency,
  baseDate: Date,
  customIntervalDays?: number | null
): Date {
  const nextDate = new Date(baseDate);

  switch (frequency) {
    case "once":
      // For "once", next_due_date should be provided by user
      // This function shouldn't be called for "once" frequency
      return nextDate;
    case "daily":
      nextDate.setDate(nextDate.getDate() + 1);
      break;
    case "weekly":
      nextDate.setDate(nextDate.getDate() + 7);
      break;
    case "biweekly":
      nextDate.setDate(nextDate.getDate() + 14);
      break;
    case "monthly":
      // Add one month, handling edge cases (e.g., Jan 31 -> Feb 28)
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
    case "custom":
      if (!customIntervalDays || customIntervalDays <= 0) {
        throw new Error("custom_interval_days is required for custom frequency");
      }
      nextDate.setDate(nextDate.getDate() + customIntervalDays);
      break;
    default:
      throw new Error(`Unknown frequency: ${frequency}`);
  }

  return nextDate;
}

/**
 * Schema for creating a new maintenance task
 */
export const createMaintenanceTaskSchema = z
  .object({
    type: z.enum([...TaskType] as [string, ...string[]], {
      message: "Invalid task type",
    }),
    title: z
      .string()
      .min(1, "Title is required")
      .max(100, "Title must be 100 characters or less"),
    description: z
      .string()
      .max(500, "Description must be 500 characters or less")
      .nullable()
      .optional(),
    frequency: z.enum([...TaskFrequency] as [string, ...string[]], {
      message: "Invalid frequency",
    }),
    custom_interval_days: z
      .number()
      .int()
      .positive("custom_interval_days must be positive")
      .nullable()
      .optional(),
    next_due_date: z.string().datetime("Invalid date format").optional(),
    reminder_before_hours: z
      .number()
      .int()
      .min(0, "reminder_before_hours must be non-negative")
      .max(168, "reminder_before_hours cannot exceed 168 hours (7 days)")
      .optional()
      .default(24),
    is_active: z.boolean().optional().default(true),
  })
  .refine(
    (data) => {
      // If frequency is "custom", custom_interval_days is required
      if (data.frequency === "custom") {
        return (
          data.custom_interval_days !== null &&
          data.custom_interval_days !== undefined &&
          data.custom_interval_days > 0
        );
      }
      return true;
    },
    {
      message: "custom_interval_days is required when frequency is 'custom'",
      path: ["custom_interval_days"],
    }
  )
  .refine(
    (data) => {
      // If frequency is "once", next_due_date must be provided
      if (data.frequency === "once") {
        return data.next_due_date !== undefined && data.next_due_date !== null;
      }
      return true;
    },
    {
      message: "next_due_date is required when frequency is 'once'",
      path: ["next_due_date"],
    }
  );

export type CreateMaintenanceTaskData = z.infer<
  typeof createMaintenanceTaskSchema
>;

/**
 * Schema for updating a maintenance task (all fields optional except those that can't change)
 */
export const updateMaintenanceTaskSchema = z
  .object({
    type: z.enum([...TaskType] as [string, ...string[]]).optional(),
    title: z
      .string()
      .min(1, "Title cannot be empty")
      .max(100, "Title must be 100 characters or less")
      .optional(),
    description: z
      .string()
      .max(500, "Description must be 500 characters or less")
      .nullable()
      .optional(),
    frequency: z.enum([...TaskFrequency] as [string, ...string[]]).optional(),
    custom_interval_days: z
      .number()
      .int()
      .positive("custom_interval_days must be positive")
      .nullable()
      .optional(),
    next_due_date: z.string().datetime("Invalid date format").optional(),
    reminder_before_hours: z
      .number()
      .int()
      .min(0, "reminder_before_hours must be non-negative")
      .max(168, "reminder_before_hours cannot exceed 168 hours (7 days)")
      .optional(),
    is_active: z.boolean().optional(),
  })
  .refine(
    (data) => {
      // If frequency is being set to "custom", custom_interval_days must be provided
      if (data.frequency === "custom") {
        return (
          data.custom_interval_days !== null &&
          data.custom_interval_days !== undefined &&
          data.custom_interval_days > 0
        );
      }
      return true;
    },
    {
      message: "custom_interval_days is required when frequency is 'custom'",
      path: ["custom_interval_days"],
    }
  );

export type UpdateMaintenanceTaskData = z.infer<
  typeof updateMaintenanceTaskSchema
>;

/**
 * Schema for completing a task
 */
export const completeTaskSchema = z.object({
  notes: z.string().max(1000, "Notes must be 1000 characters or less").nullable().optional(),
  photo_url: z.string().url("Invalid photo URL").nullable().optional(),
});

export type CompleteTaskData = z.infer<typeof completeTaskSchema>;
