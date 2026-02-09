import { z } from "zod";

/**
 * Quarantine tracking validation schemas
 * Per CLAUDE.md: Use Zod schemas for all input validation
 * Supports the AI Chat Embedded Quarantine Checklist Widget
 */

// Quarantine status enum matching database type
export const quarantineStatusEnum = z.enum(["in_progress", "completed", "cancelled"]);
export type QuarantineStatus = z.infer<typeof quarantineStatusEnum>;

// Step completion tracking schema
export const quarantineStepSchema = z.object({
  step_id: z.string().min(1, "Step ID is required"),
  step_name: z.string().min(1, "Step name is required"),
  completed: z.boolean(),
  completed_at: z.string().datetime().optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});
export type QuarantineStep = z.infer<typeof quarantineStepSchema>;

// Create quarantine tracking request schema
export const createQuarantineSchema = z.object({
  tank_id: z.string().uuid("Invalid tank ID"),
  species_name: z.string().min(1, "Species name is required").max(200),
  target_end_date: z.string().datetime().optional().nullable(),
  steps_completed: z.array(quarantineStepSchema).default([]),
  notes: z.string().max(1000).optional().nullable(),
});
export type CreateQuarantineRequest = z.infer<typeof createQuarantineSchema>;

// Update quarantine tracking request schema
export const updateQuarantineSchema = z.object({
  quarantine_id: z.string().uuid("Invalid quarantine ID"),
  steps_completed: z.array(quarantineStepSchema).optional(),
  status: quarantineStatusEnum.optional(),
  target_end_date: z.string().datetime().optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});
export type UpdateQuarantineRequest = z.infer<typeof updateQuarantineSchema>;

// Full quarantine record as stored in DB
export interface QuarantineRecord {
  id: string;
  user_id: string;
  tank_id: string;
  species_name: string;
  start_date: string;
  target_end_date: string | null;
  steps_completed: QuarantineStep[];
  status: QuarantineStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Validate create quarantine request
 */
export function validateCreateQuarantine(data: unknown): {
  success: boolean;
  data?: CreateQuarantineRequest;
  errors?: Record<string, string[]>;
} {
  const result = createQuarantineSchema.safeParse(data);

  if (!result.success) {
    const errors: Record<string, string[]> = {};
    for (const issue of result.error.issues) {
      const path = issue.path.join(".") || "general";
      if (!errors[path]) {
        errors[path] = [];
      }
      errors[path].push(issue.message);
    }
    return { success: false, errors };
  }

  return { success: true, data: result.data };
}

/**
 * Validate update quarantine request
 */
export function validateUpdateQuarantine(data: unknown): {
  success: boolean;
  data?: UpdateQuarantineRequest;
  errors?: Record<string, string[]>;
} {
  const result = updateQuarantineSchema.safeParse(data);

  if (!result.success) {
    const errors: Record<string, string[]> = {};
    for (const issue of result.error.issues) {
      const path = issue.path.join(".") || "general";
      if (!errors[path]) {
        errors[path] = [];
      }
      errors[path].push(issue.message);
    }
    return { success: false, errors };
  }

  return { success: true, data: result.data };
}

// Default quarantine steps (standard checklist for new livestock)
export const DEFAULT_QUARANTINE_STEPS: QuarantineStep[] = [
  {
    step_id: "setup",
    step_name: "Set up quarantine tank",
    completed: false,
    completed_at: null,
    notes: null,
  },
  {
    step_id: "acclimate",
    step_name: "Acclimate new arrival",
    completed: false,
    completed_at: null,
    notes: null,
  },
  {
    step_id: "observe_day1",
    step_name: "Day 1: Initial observation",
    completed: false,
    completed_at: null,
    notes: null,
  },
  {
    step_id: "observe_day3",
    step_name: "Day 3: Check for disease signs",
    completed: false,
    completed_at: null,
    notes: null,
  },
  {
    step_id: "observe_week1",
    step_name: "Week 1: Monitor eating/behavior",
    completed: false,
    completed_at: null,
    notes: null,
  },
  {
    step_id: "observe_week2",
    step_name: "Week 2: Final health assessment",
    completed: false,
    completed_at: null,
    notes: null,
  },
  {
    step_id: "transfer",
    step_name: "Transfer to main tank",
    completed: false,
    completed_at: null,
    notes: null,
  },
];
