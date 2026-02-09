import { z } from "zod";
import { TaskType, TaskFrequency } from "./maintenance";

/**
 * Zod schemas for AI action execution payloads
 * Per Spec 17: AI Proactive Intelligence & Action Execution
 */

// Supported action types
export const ActionType = [
  "log_parameters",
  "add_livestock",
  "schedule_maintenance",
  "complete_maintenance",
] as const;

export type ActionType = (typeof ActionType)[number];

// Parameter values payload (subset of water parameters)
export const logParametersPayloadSchema = z
  .object({
    ph: z.number().min(0).max(14).nullable().optional(),
    ammonia: z.number().min(0).nullable().optional(),
    nitrite: z.number().min(0).nullable().optional(),
    nitrate: z.number().min(0).nullable().optional(),
    temperature: z.number().min(32).max(120).nullable().optional(),
    gh: z.number().min(0).nullable().optional(),
    kh: z.number().min(0).nullable().optional(),
    salinity: z.number().min(0).max(2).nullable().optional(),
    calcium: z.number().min(0).nullable().optional(),
    alkalinity: z.number().min(0).nullable().optional(),
    magnesium: z.number().min(0).nullable().optional(),
    phosphate: z.number().min(0).nullable().optional(),
    notes: z.string().max(1000).optional(),
  })
  .refine(
    (data) => {
      // At least one parameter must be provided
      return (
        data.ph !== null && data.ph !== undefined ||
        data.ammonia !== null && data.ammonia !== undefined ||
        data.nitrite !== null && data.nitrite !== undefined ||
        data.nitrate !== null && data.nitrate !== undefined ||
        data.temperature !== null && data.temperature !== undefined ||
        data.gh !== null && data.gh !== undefined ||
        data.kh !== null && data.kh !== undefined ||
        data.salinity !== null && data.salinity !== undefined ||
        data.calcium !== null && data.calcium !== undefined ||
        data.alkalinity !== null && data.alkalinity !== undefined ||
        data.magnesium !== null && data.magnesium !== undefined ||
        data.phosphate !== null && data.phosphate !== undefined
      );
    },
    {
      message: "At least one parameter must be provided",
    }
  );

export type LogParametersPayload = z.infer<typeof logParametersPayloadSchema>;

// Add livestock payload
export const addLivestockPayloadSchema = z.object({
  species_id: z.string().uuid("Invalid species ID").optional(),
  species_name: z.string().min(1).max(100).optional(),
  quantity: z.number().int().min(1).max(1000).default(1),
  nickname: z.string().max(50).optional(),
  notes: z.string().max(500).optional(),
}).refine(
  (data) => data.species_id || data.species_name,
  { message: "Either species_id or species_name is required" }
);

export type AddLivestockPayload = z.infer<typeof addLivestockPayloadSchema>;

// Schedule maintenance payload
export const scheduleMaintenancePayloadSchema = z
  .object({
    task_type: z.enum([...TaskType] as [string, ...string[]], {
      message: "Invalid task type",
    }),
    title: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
    due_date: z.string().refine(
      (date) => {
        const parsed = new Date(date);
        return !isNaN(parsed.getTime());
      },
      { message: "Invalid date format" }
    ),
    frequency: z.enum([...TaskFrequency] as [string, ...string[]]).default("once"),
    custom_interval_days: z.number().int().positive().optional(),
    reminder_before_hours: z.number().int().min(0).max(168).default(24),
  })
  .refine(
    (data) => {
      if (data.frequency === "custom") {
        return data.custom_interval_days !== undefined && data.custom_interval_days > 0;
      }
      return true;
    },
    {
      message: "custom_interval_days is required when frequency is 'custom'",
      path: ["custom_interval_days"],
    }
  );

export type ScheduleMaintenancePayload = z.infer<typeof scheduleMaintenancePayloadSchema>;

// Complete maintenance payload
export const completeMaintenancePayloadSchema = z.object({
  task_id: z.string().uuid("Invalid task ID"),
  notes: z.string().max(1000).optional(),
});

export type CompleteMaintenancePayload = z.infer<typeof completeMaintenancePayloadSchema>;

// Main action execution request schema
export const actionExecuteRequestSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("log_parameters"),
    tank_id: z.string().uuid("Invalid tank ID"),
    payload: logParametersPayloadSchema,
    confirmation_token: z.string().optional(),
  }),
  z.object({
    action: z.literal("add_livestock"),
    tank_id: z.string().uuid("Invalid tank ID"),
    payload: addLivestockPayloadSchema,
    confirmation_token: z.string().optional(),
  }),
  z.object({
    action: z.literal("schedule_maintenance"),
    tank_id: z.string().uuid("Invalid tank ID"),
    payload: scheduleMaintenancePayloadSchema,
    confirmation_token: z.string().optional(),
  }),
  z.object({
    action: z.literal("complete_maintenance"),
    tank_id: z.string().uuid("Invalid tank ID"),
    payload: completeMaintenancePayloadSchema,
    confirmation_token: z.string().optional(),
  }),
]);

export type ActionExecuteRequest = z.infer<typeof actionExecuteRequestSchema>;

// Alert status update schema
export const alertUpdateSchema = z.object({
  action: z.enum(["dismiss", "resolve"]),
  alert_id: z.string().uuid("Invalid alert ID"),
  resolved_by_action_id: z.string().uuid().optional(),
});

export type AlertUpdateRequest = z.infer<typeof alertUpdateSchema>;

// Alert severity levels
export const AlertSeverity = ["info", "warning", "alert"] as const;
export type AlertSeverity = (typeof AlertSeverity)[number];

// Alert status values
export const AlertStatus = ["active", "dismissed", "resolved"] as const;
export type AlertStatus = (typeof AlertStatus)[number];

// Trend direction values
export const TrendDirection = ["increasing", "decreasing", "stable", "spiking"] as const;
export type TrendDirection = (typeof TrendDirection)[number];
