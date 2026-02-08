import { z } from "zod";

/**
 * Chat message validation schemas
 */

// Single message schema
export const messageSchema = z.object({
  id: z.string().uuid().optional(),
  role: z.enum(["user", "assistant", "system"]),
  content: z.string().min(1, "Message cannot be empty").max(10000, "Message too long"),
  timestamp: z.string().datetime().optional(),
});

export type Message = z.infer<typeof messageSchema>;

// Chat request schema - what the client sends
export const chatRequestSchema = z.object({
  tank_id: z.string().uuid("Invalid tank ID"),
  message: z.string().min(1, "Message cannot be empty").max(5000, "Message too long (max 5000 characters)"),
});

export type ChatRequest = z.infer<typeof chatRequestSchema>;

// AI action schema - for action execution
export const aiActionSchema = z.object({
  id: z.string(),
  type: z.enum([
    "add_livestock",
    "remove_livestock",
    "schedule_maintenance",
    "complete_maintenance",
    "log_parameter",
  ]),
  description: z.string(),
  confirmation_required: z.boolean().default(true),
  payload: z.record(z.string(), z.unknown()),
});

export type AIAction = z.infer<typeof aiActionSchema>;

// Chat response schema - what the API returns
export const chatResponseSchema = z.object({
  id: z.string(),
  role: z.literal("assistant"),
  content: z.string(),
  actions: z.array(aiActionSchema).optional(),
  usage: z.object({
    input_tokens: z.number(),
    output_tokens: z.number(),
  }),
});

export type ChatResponse = z.infer<typeof chatResponseSchema>;

// Validate chat request
export function validateChatRequest(data: unknown): {
  success: boolean;
  data?: ChatRequest;
  errors?: Record<string, string[]>;
} {
  const result = chatRequestSchema.safeParse(data);

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
