import { SupabaseClient } from "@supabase/supabase-js";
import type { Database, UserPreference } from "@/types/database";

/**
 * User context helper for AI system prompt
 *
 * Fetches and formats user preferences from the user_preferences table
 * to provide personalized AI interactions based on the user's background,
 * experience level, and stated preferences.
 */

/**
 * User context data transformed for AI consumption
 */
export interface UserContextForAI {
  // Experience
  experience_level: string | null;
  years_in_hobby: number | null;
  previous_tank_types: string[] | null;

  // Current situation
  current_situation: string | null;
  primary_goal: string | null;
  motivation: string | null;

  // Preferences
  explanation_depth: string;
  wants_scientific_names: boolean;
  communication_style: string;

  // Challenges
  current_challenges: string[] | null;
  avoided_topics: string[] | null;

  // AI Memory
  ai_learned_facts: unknown[];
  ai_interaction_summary: string | null;

  // Flags
  has_completed_onboarding: boolean;
}

/**
 * Fetch user preferences for AI context
 *
 * Returns null if user has no preferences set (AI falls back to defaults)
 */
export async function getUserPreferencesForAI(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<UserContextForAI | null> {
  const { data, error } = await supabase
    .from("user_preferences")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    // No preferences set - AI uses defaults
    return null;
  }

  // Type assertion needed due to Supabase client type inference limitations
  const preferences = data as UserPreference;

  return {
    experience_level: preferences.experience_level,
    years_in_hobby: preferences.years_in_hobby,
    previous_tank_types: preferences.previous_tank_types,
    current_situation: preferences.current_situation,
    primary_goal: preferences.primary_goal,
    motivation: preferences.motivation,
    explanation_depth: preferences.explanation_depth || "moderate",
    wants_scientific_names: preferences.wants_scientific_names || false,
    communication_style: preferences.communication_style || "friendly",
    current_challenges: preferences.current_challenges,
    avoided_topics: preferences.avoided_topics,
    ai_learned_facts: (preferences.ai_learned_facts as unknown[]) || [],
    ai_interaction_summary: preferences.ai_interaction_summary,
    has_completed_onboarding: !!preferences.onboarding_completed_at,
  };
}

/**
 * Format experience level for display
 */
function formatExperienceLevel(level: string | null, years: number | null): string {
  if (!level) return "Unknown";

  const levelMap: Record<string, string> = {
    first_timer: "First-time aquarium keeper",
    returning: "Returning to the hobby",
    experienced: "Experienced aquarist",
    expert: "Expert/Breeder level",
  };

  const formatted = levelMap[level] || level;
  if (years !== null && years > 0) {
    return `${formatted} (${years} year${years === 1 ? "" : "s"} in hobby)`;
  }
  return formatted;
}

/**
 * Format current situation for display
 */
function formatCurrentSituation(situation: string | null): string {
  if (!situation) return "Not specified";

  const situationMap: Record<string, string> = {
    new_tank: "Setting up a new tank",
    existing_tank: "Managing an existing tank",
    exploring: "Exploring options before starting",
    multiple_tanks: "Managing multiple tanks",
  };

  return situationMap[situation] || situation;
}

/**
 * Format explanation depth preference
 */
function formatExplanationDepth(depth: string): string {
  const depthMap: Record<string, string> = {
    brief: "Brief and to-the-point",
    moderate: "Moderate detail",
    detailed: "Detailed explanations with background",
  };
  return depthMap[depth] || depth;
}

/**
 * Format challenges list
 */
function formatChallenges(challenges: string[] | null): string {
  if (!challenges || challenges.length === 0) return "None specified";

  const challengeMap: Record<string, string> = {
    keeping_alive: "Keeping fish alive",
    water_quality: "Maintaining water quality",
    compatibility: "Species compatibility",
    maintenance: "Regular maintenance",
    chemistry: "Understanding water chemistry",
    none: "No current challenges",
  };

  return challenges
    .map((c) => challengeMap[c] || c)
    .join(", ");
}

/**
 * Format user preferences into a system prompt section
 *
 * This creates a concise but informative section about the user
 * that helps the AI personalize responses.
 */
export function formatUserPreferencesForPrompt(prefs: UserContextForAI): string {
  const lines: string[] = [];

  lines.push("## User Profile & Memory");
  lines.push("");
  lines.push("This user's background and preferences:");
  lines.push("");

  // Experience
  lines.push(`- **Experience:** ${formatExperienceLevel(prefs.experience_level, prefs.years_in_hobby)}`);

  // Current situation
  lines.push(`- **Current situation:** ${formatCurrentSituation(prefs.current_situation)}`);

  // Primary goal
  if (prefs.primary_goal) {
    const goalMap: Record<string, string> = {
      low_maintenance: "Low-maintenance setup",
      planted_tank: "Beautiful planted tank",
      specific_fish: "Keep specific fish species",
      reef_tank: "Reef/coral tank",
    };
    lines.push(`- **Goal:** ${goalMap[prefs.primary_goal] || prefs.primary_goal}`);
  }

  // Current challenges
  lines.push(`- **Current challenges:** ${formatChallenges(prefs.current_challenges)}`);

  // Explanation preference
  lines.push(`- **Explanation preference:** ${formatExplanationDepth(prefs.explanation_depth)}`);

  // Scientific names
  if (prefs.wants_scientific_names) {
    lines.push("- **Prefers scientific names** when discussing species");
  }

  // Previous experience context
  if (prefs.previous_tank_types && prefs.previous_tank_types.length > 0) {
    lines.push(`- **Previous tank types:** ${prefs.previous_tank_types.join(", ")}`);
  }

  // AI learned facts
  if (prefs.ai_learned_facts && prefs.ai_learned_facts.length > 0) {
    lines.push("");
    lines.push("### Previously Learned Facts");
    for (const fact of prefs.ai_learned_facts.slice(0, 10)) {
      if (typeof fact === "string") {
        lines.push(`- ${fact}`);
      } else if (typeof fact === "object" && fact !== null && "fact" in fact) {
        lines.push(`- ${(fact as { fact: string }).fact}`);
      }
    }
  }

  // AI interaction summary
  if (prefs.ai_interaction_summary) {
    lines.push("");
    lines.push("### Conversation History Summary");
    lines.push(prefs.ai_interaction_summary);
  }

  // Avoided topics
  if (prefs.avoided_topics && prefs.avoided_topics.length > 0) {
    lines.push("");
    lines.push("### Topics to Avoid");
    lines.push(`The user has indicated they prefer not to discuss: ${prefs.avoided_topics.join(", ")}`);
  }

  // Guidelines based on preferences
  lines.push("");
  lines.push("### Personalization Guidelines");
  lines.push("");
  lines.push("Use this context to:");
  lines.push("1. Tailor explanations to their experience level");
  lines.push("2. Reference their stated goal when making recommendations");
  lines.push("3. Address their current challenges proactively when relevant");
  lines.push("4. Match their preferred explanation depth");
  if (prefs.wants_scientific_names) {
    lines.push("5. Include scientific names for species");
  }
  if (prefs.communication_style === "professional") {
    lines.push("5. Use a professional, technical tone");
  } else if (prefs.communication_style === "casual") {
    lines.push("5. Keep the tone casual and approachable");
  }

  return lines.join("\n");
}

/**
 * Get a brief user context summary for logging/debugging
 */
export function getUserContextSummary(prefs: UserContextForAI | null): string {
  if (!prefs) {
    return "No user preferences (using defaults)";
  }

  const parts: string[] = [];

  if (prefs.experience_level) {
    parts.push(`exp:${prefs.experience_level}`);
  }
  if (prefs.explanation_depth) {
    parts.push(`depth:${prefs.explanation_depth}`);
  }
  if (prefs.has_completed_onboarding) {
    parts.push("onboarded");
  }

  return parts.length > 0 ? parts.join(", ") : "Preferences set but minimal";
}
