import { z } from "zod";

/**
 * User Preferences validation schemas
 * Per CLAUDE.md: Use Zod schemas for all input validation
 */

// Experience level from onboarding questionnaire
export const experienceLevelSchema = z.enum([
  "first_timer",
  "returning",
  "experienced",
  "expert",
]);

// Current situation
export const currentSituationSchema = z.enum([
  "new_tank",
  "existing_tank",
  "exploring",
  "multiple_tanks",
]);

// Primary goal (stored as text in DB but we validate common values)
export const primaryGoalSchema = z.enum([
  "low_maintenance",
  "planted_tank",
  "specific_fish",
  "reef_tank",
]);

// Motivation
export const motivationSchema = z.enum([
  "relaxation",
  "family_project",
  "specific_species",
  "nature_interest",
  "other",
]);

// Explanation depth
export const explanationDepthSchema = z.enum(["brief", "moderate", "detailed"]);

// Communication style
export const communicationStyleSchema = z.enum(["friendly", "professional", "casual"]);

// Budget range
export const budgetRangeSchema = z.enum(["tight", "moderate", "flexible", "unspecified"]);

// Time available
export const timeAvailableSchema = z.enum(["minimal", "moderate", "plenty", "unspecified"]);

// Challenge types
export const challengeSchema = z.enum([
  "keeping_alive",
  "water_quality",
  "compatibility",
  "maintenance",
  "chemistry",
  "none",
]);

// User preferences input schema (for onboarding questionnaire)
export const userPreferencesInputSchema = z.object({
  // Experience & Background
  experience_level: experienceLevelSchema.optional(),
  years_in_hobby: z.number().int().min(0).max(100).optional(),
  previous_tank_types: z.array(z.string()).optional(),

  // Current Situation
  current_situation: currentSituationSchema.optional(),
  primary_goal: primaryGoalSchema.optional(),
  motivation: motivationSchema.optional(),
  motivation_details: z.string().max(500).optional(),

  // Learning Style & Preferences
  explanation_depth: explanationDepthSchema.optional(),
  wants_scientific_names: z.boolean().optional(),
  wants_reminders: z.boolean().optional(),
  communication_style: communicationStyleSchema.optional(),

  // Challenges & Context
  current_challenges: z.array(challengeSchema).optional(),
  avoided_topics: z.array(z.string().max(100)).optional(),

  // Tank Preferences
  preferred_tank_types: z.array(z.string()).optional(),
  budget_range: budgetRangeSchema.optional(),
  time_available: timeAvailableSchema.optional(),
});

export type UserPreferencesInput = z.infer<typeof userPreferencesInputSchema>;

// Full user preferences (as stored in DB)
export interface UserPreferences {
  id: string;
  user_id: string;
  experience_level: string | null;
  years_in_hobby: number | null;
  previous_tank_types: string[] | null;
  current_situation: string | null;
  primary_goal: string | null;
  motivation: string | null;
  motivation_details: string | null;
  explanation_depth: string;
  wants_scientific_names: boolean;
  wants_reminders: boolean;
  communication_style: string;
  current_challenges: string[] | null;
  avoided_topics: string[] | null;
  completed_topics: string[] | null;
  preferred_tank_types: string[] | null;
  budget_range: string | null;
  time_available: string | null;
  ai_learned_facts: unknown[];
  ai_interaction_summary: string | null;
  last_interaction_topics: string[] | null;
  onboarding_completed_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Validate user preferences input
 */
export function validateUserPreferences(data: unknown): {
  success: boolean;
  data?: UserPreferencesInput;
  errors?: Record<string, string[]>;
} {
  const result = userPreferencesInputSchema.safeParse(data);

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
