/**
 * AI Coaching Module
 *
 * Generates personalized coaching tips for aquarium hobbyists based on
 * their preferences, tank data, and water parameters.
 *
 * Spec Reference: 17_AI_Proactive_Intelligence_Spec.md
 */

import Anthropic from "@anthropic-ai/sdk";

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

// Use Haiku for coaching tips (faster, cheaper, good for short content)
const AI_MODEL = process.env.ANTHROPIC_MODEL_HAIKU || "claude-haiku-4-5-20251001";
const MAX_TOKENS = 300;

/**
 * Context data required for generating coaching messages
 */
export interface CoachingContext {
  user: {
    experience_level: string | null;
    primary_goal: string | null;
    current_challenges: string[];
  };
  tank: {
    name: string;
    type: string;
    volume_gallons: number;
    setup_date?: string;
  };
  parameters?: {
    ph?: number;
    ammonia?: number;
    nitrite?: number;
    nitrate?: number;
    temperature?: number;
  };
  livestock_count: number;
  pending_tasks_count: number;
}

/**
 * Result of coaching message generation
 */
export interface CoachingResult {
  message: string;
  input_tokens: number;
  output_tokens: number;
}

/**
 * Build a system prompt for coaching generation
 */
function buildCoachingSystemPrompt(context: CoachingContext): string {
  const lines: string[] = [];

  lines.push("You are AquaBot, a friendly AI aquarium coach.");
  lines.push("Generate a single, short, helpful coaching tip for the user.");
  lines.push("");
  lines.push("Guidelines:");
  lines.push("- Keep the message under 150 characters");
  lines.push("- Be encouraging and positive");
  lines.push("- Make it actionable when possible");
  lines.push("- Personalize based on their experience level and goals");
  lines.push("- If parameters look off, gently mention it");
  lines.push("- Never use emojis");
  lines.push("- Speak directly to the user (use 'you' and 'your')");
  lines.push("");
  lines.push("Context:");
  lines.push(`- Tank: ${context.tank.name} (${context.tank.type}, ${context.tank.volume_gallons} gallons)`);

  if (context.user.experience_level) {
    lines.push(`- Experience: ${context.user.experience_level}`);
  }

  if (context.user.primary_goal) {
    lines.push(`- Goal: ${context.user.primary_goal}`);
  }

  if (context.user.current_challenges.length > 0) {
    lines.push(`- Challenges: ${context.user.current_challenges.join(", ")}`);
  }

  if (context.parameters) {
    const params: string[] = [];
    if (context.parameters.ph !== undefined) params.push(`pH: ${context.parameters.ph}`);
    if (context.parameters.ammonia !== undefined) params.push(`Ammonia: ${context.parameters.ammonia} ppm`);
    if (context.parameters.nitrite !== undefined) params.push(`Nitrite: ${context.parameters.nitrite} ppm`);
    if (context.parameters.nitrate !== undefined) params.push(`Nitrate: ${context.parameters.nitrate} ppm`);
    if (context.parameters.temperature !== undefined) params.push(`Temp: ${context.parameters.temperature}F`);
    if (params.length > 0) {
      lines.push(`- Latest parameters: ${params.join(", ")}`);
    }
  }

  lines.push(`- Livestock count: ${context.livestock_count}`);
  lines.push(`- Pending maintenance tasks: ${context.pending_tasks_count}`);

  if (context.tank.setup_date) {
    lines.push(`- Tank setup date: ${context.tank.setup_date}`);
  }

  return lines.join("\n");
}

/**
 * Generate a personalized coaching message for the user
 *
 * @param context - User and tank context data
 * @returns The coaching message and token usage
 */
export async function generateCoachingMessage(
  context: CoachingContext
): Promise<CoachingResult> {
  const systemPrompt = buildCoachingSystemPrompt(context);

  const response = await anthropic.messages.create({
    model: AI_MODEL,
    max_tokens: MAX_TOKENS,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: "Generate a coaching tip for me based on my tank and current situation.",
      },
    ],
  });

  // Extract text content
  const message = response.content
    .filter((block) => block.type === "text")
    .map((block) => (block as Anthropic.TextBlock).text)
    .join("\n")
    .trim();

  return {
    message,
    input_tokens: response.usage?.input_tokens || 0,
    output_tokens: response.usage?.output_tokens || 0,
  };
}
