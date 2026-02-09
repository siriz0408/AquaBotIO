import { z } from "zod";

/**
 * Notification validation schemas
 * Per CLAUDE.md: Use Zod schemas for all input validation
 */

// Web Push subscription keys schema
const pushSubscriptionKeysSchema = z.object({
  p256dh: z.string().min(1, "p256dh key is required"),
  auth: z.string().min(1, "auth key is required"),
});

// Push subscription schema (from Web Push API)
export const pushSubscriptionSchema = z.object({
  endpoint: z.string().url("Invalid endpoint URL"),
  expirationTime: z.number().nullable().optional(),
  keys: pushSubscriptionKeysSchema,
});

export type PushSubscriptionInput = z.infer<typeof pushSubscriptionSchema>;

// Subscribe request schema
export const subscribeRequestSchema = z.object({
  subscription: pushSubscriptionSchema,
  userAgent: z.string().optional(),
});

export type SubscribeRequest = z.infer<typeof subscribeRequestSchema>;

// Unsubscribe request schema
export const unsubscribeRequestSchema = z.object({
  endpoint: z.string().url("Invalid endpoint URL"),
});

export type UnsubscribeRequest = z.infer<typeof unsubscribeRequestSchema>;

// Notification preferences schema
export const notificationPreferencesSchema = z.object({
  push_enabled: z.boolean().optional(),
  email_enabled: z.boolean().optional(),
  maintenance_reminders: z.boolean().optional(),
  parameter_alerts: z.boolean().optional(),
  ai_insights: z.boolean().optional(),
  reminder_time: z
    .string()
    .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/, "Invalid time format (HH:MM or HH:MM:SS)")
    .optional(),
  reminder_days_before: z
    .number()
    .int()
    .min(0, "Must be at least 0")
    .max(7, "Must be at most 7")
    .optional(),
  quiet_hours_enabled: z.boolean().optional(),
  quiet_hours_start: z
    .string()
    .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/, "Invalid time format (HH:MM or HH:MM:SS)")
    .optional(),
  quiet_hours_end: z
    .string()
    .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/, "Invalid time format (HH:MM or HH:MM:SS)")
    .optional(),
});

export type NotificationPreferencesInput = z.infer<typeof notificationPreferencesSchema>;

// Full notification preferences (as stored in DB)
export interface NotificationPreferences {
  id: string;
  user_id: string;
  push_enabled: boolean;
  email_enabled: boolean;
  maintenance_reminders: boolean;
  parameter_alerts: boolean;
  ai_insights: boolean;
  reminder_time: string;
  reminder_days_before: number;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  created_at: string;
  updated_at: string;
}

// Push subscription as stored in DB
export interface PushSubscriptionRecord {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh_key: string;
  auth_key: string;
  user_agent: string | null;
  created_at: string;
  last_used_at: string | null;
}

/**
 * Validate subscribe request
 */
export function validateSubscribeRequest(data: unknown): {
  success: boolean;
  data?: SubscribeRequest;
  errors?: Record<string, string[]>;
} {
  const result = subscribeRequestSchema.safeParse(data);

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
 * Validate unsubscribe request
 */
export function validateUnsubscribeRequest(data: unknown): {
  success: boolean;
  data?: UnsubscribeRequest;
  errors?: Record<string, string[]>;
} {
  const result = unsubscribeRequestSchema.safeParse(data);

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
 * Validate notification preferences update
 */
export function validateNotificationPreferences(data: unknown): {
  success: boolean;
  data?: NotificationPreferencesInput;
  errors?: Record<string, string[]>;
} {
  const result = notificationPreferencesSchema.safeParse(data);

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
