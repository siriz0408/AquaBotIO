/**
 * User Preferences Types and Validation
 * TypeScript types and Zod schemas for personalized AI interactions
 * and onboarding data
 */

import { z } from "zod";

// ============================================================================
// ENUM VALUES
// ============================================================================

export const experienceLevels = [
  "first_timer",
  "returning",
  "experienced",
  "expert",
] as const;

export const currentSituations = [
  "new_tank",
  "existing_tank",
  "exploring",
  "multiple_tanks",
] as const;

export const motivations = [
  "relaxation",
  "family_project",
  "specific_species",
  "nature_interest",
  "other",
] as const;

export const explanationDepths = ["brief", "moderate", "detailed"] as const;

export const communicationStyles = [
  "friendly",
  "professional",
  "casual",
] as const;

export const budgetRanges = [
  "tight",
  "moderate",
  "flexible",
  "unspecified",
] as const;

export const timeAvailabilities = [
  "minimal",
  "moderate",
  "plenty",
  "unspecified",
] as const;

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type ExperienceLevel = (typeof experienceLevels)[number];
export type CurrentSituation = (typeof currentSituations)[number];
export type Motivation = (typeof motivations)[number];
export type ExplanationDepth = (typeof explanationDepths)[number];
export type CommunicationStyle = (typeof communicationStyles)[number];
export type BudgetRange = (typeof budgetRanges)[number];
export type TimeAvailability = (typeof timeAvailabilities)[number];

/**
 * AI Learned Fact - facts the AI learns about users from conversations
 */
export interface AILearnedFact {
  fact: string;
  source: "conversation" | "onboarding" | "inferred";
  confidence: number; // 0-1
  learned_at: string; // ISO timestamp
}

/**
 * User Preferences - full database record
 */
export interface UserPreferences {
  id: string;
  user_id: string;

  // Experience & Background
  experience_level: ExperienceLevel | null;
  years_in_hobby: number | null;
  previous_tank_types: string[] | null;

  // Current Situation
  current_situation: CurrentSituation | null;
  primary_goal: string | null;
  motivation: Motivation | null;
  motivation_details: string | null;

  // Learning Style & Preferences
  explanation_depth: ExplanationDepth;
  wants_scientific_names: boolean;
  wants_reminders: boolean;
  communication_style: CommunicationStyle;

  // Challenges & Context
  current_challenges: string[] | null;
  avoided_topics: string[] | null;
  completed_topics: string[] | null;

  // Tank Preferences
  preferred_tank_types: string[] | null;
  budget_range: BudgetRange | null;
  time_available: TimeAvailability | null;

  // AI Memory
  ai_learned_facts: AILearnedFact[];
  ai_interaction_summary: string | null;
  last_interaction_topics: string[] | null;

  // Timestamps
  onboarding_completed_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Onboarding Data - submitted during initial onboarding flow
 */
export interface OnboardingData {
  experience_level: ExperienceLevel;
  years_in_hobby?: number;
  previous_tank_types?: string[];
  current_situation: CurrentSituation;
  primary_goal?: string;
  motivation: Motivation;
  motivation_details?: string;
  explanation_depth?: ExplanationDepth;
  wants_scientific_names?: boolean;
  wants_reminders?: boolean;
  communication_style?: CommunicationStyle;
  current_challenges?: string[];
  preferred_tank_types?: string[];
  budget_range?: BudgetRange;
  time_available?: TimeAvailability;
}

/**
 * Preferences Update - partial update payload
 */
export type UserPreferencesUpdate = Partial<
  Omit<UserPreferences, "id" | "user_id" | "created_at" | "updated_at">
>;

// ============================================================================
// ZOD SCHEMAS
// ============================================================================

/**
 * AI Learned Fact schema
 */
export const aiLearnedFactSchema = z.object({
  fact: z.string().min(1).max(500),
  source: z.enum(["conversation", "onboarding", "inferred"]),
  confidence: z.number().min(0).max(1),
  learned_at: z.string().datetime(),
});

/**
 * Onboarding data schema - required fields for initial submission
 */
export const onboardingDataSchema = z.object({
  experience_level: z.enum(experienceLevels, {
    message: "Invalid experience level",
  }),
  years_in_hobby: z.number().int().min(0).max(100).optional(),
  previous_tank_types: z.array(z.string().max(100)).max(20).optional(),
  current_situation: z.enum(currentSituations, {
    message: "Invalid current situation",
  }),
  primary_goal: z.string().max(500).optional(),
  motivation: z.enum(motivations, {
    message: "Invalid motivation",
  }),
  motivation_details: z.string().max(1000).optional(),
  explanation_depth: z.enum(explanationDepths).optional(),
  wants_scientific_names: z.boolean().optional(),
  wants_reminders: z.boolean().optional(),
  communication_style: z.enum(communicationStyles).optional(),
  current_challenges: z.array(z.string().max(200)).max(20).optional(),
  preferred_tank_types: z.array(z.string().max(100)).max(20).optional(),
  budget_range: z.enum(budgetRanges).optional(),
  time_available: z.enum(timeAvailabilities).optional(),
});

/**
 * User preferences update schema - all fields optional for partial updates
 */
export const userPreferencesUpdateSchema = z.object({
  experience_level: z.enum(experienceLevels).nullable().optional(),
  years_in_hobby: z.number().int().min(0).max(100).nullable().optional(),
  previous_tank_types: z
    .array(z.string().max(100))
    .max(20)
    .nullable()
    .optional(),
  current_situation: z.enum(currentSituations).nullable().optional(),
  primary_goal: z.string().max(500).nullable().optional(),
  motivation: z.enum(motivations).nullable().optional(),
  motivation_details: z.string().max(1000).nullable().optional(),
  explanation_depth: z.enum(explanationDepths).optional(),
  wants_scientific_names: z.boolean().optional(),
  wants_reminders: z.boolean().optional(),
  communication_style: z.enum(communicationStyles).optional(),
  current_challenges: z.array(z.string().max(200)).max(20).nullable().optional(),
  avoided_topics: z.array(z.string().max(200)).max(50).nullable().optional(),
  completed_topics: z.array(z.string().max(200)).max(100).nullable().optional(),
  preferred_tank_types: z
    .array(z.string().max(100))
    .max(20)
    .nullable()
    .optional(),
  budget_range: z.enum(budgetRanges).nullable().optional(),
  time_available: z.enum(timeAvailabilities).nullable().optional(),
  ai_learned_facts: z.array(aiLearnedFactSchema).optional(),
  ai_interaction_summary: z.string().max(5000).nullable().optional(),
  last_interaction_topics: z
    .array(z.string().max(200))
    .max(20)
    .nullable()
    .optional(),
  onboarding_completed_at: z.string().datetime().nullable().optional(),
});

export type OnboardingDataInput = z.infer<typeof onboardingDataSchema>;
export type UserPreferencesUpdateInput = z.infer<
  typeof userPreferencesUpdateSchema
>;

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate onboarding data
 */
export function validateOnboardingData(data: unknown): {
  success: boolean;
  data?: OnboardingDataInput;
  errors?: Record<string, string[]>;
} {
  const result = onboardingDataSchema.safeParse(data);

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
 * Validate user preferences update
 */
export function validateUserPreferencesUpdate(data: unknown): {
  success: boolean;
  data?: UserPreferencesUpdateInput;
  errors?: Record<string, string[]>;
} {
  const result = userPreferencesUpdateSchema.safeParse(data);

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
