import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { successResponse, errorResponse } from "@/lib/api/response";
import { z } from "zod";

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

// Use Haiku for compatibility checks (faster, cheaper, sufficient for this task)
const AI_MODEL = process.env.ANTHROPIC_MODEL_HAIKU || "claude-haiku-4-5-20251001";
const MAX_TOKENS = 1000;
const MAX_RETRIES = 3;

// Validation schema
const compatibilityCheckSchema = z.object({
  tank_id: z.string().uuid("Invalid tank ID"),
  species_id: z.string().uuid("Invalid species ID"),
});

/**
 * POST /api/ai/compatibility
 *
 * Check compatibility of a species with existing livestock in a tank.
 * Uses Claude Haiku for AI-enhanced compatibility assessment (Starter+ only).
 * Free tier gets basic rule-based checks only.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return errorResponse("AUTH_REQUIRED", "You must be logged in");
    }

    // Parse and validate request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return errorResponse("INVALID_INPUT", "Invalid JSON in request body");
    }

    const validationResult = compatibilityCheckSchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.flatten().fieldErrors;
      const message = Object.entries(errors)
        .map(([field, messages]) => `${field}: ${(messages || []).join(", ")}`)
        .join("; ");
      return errorResponse("INVALID_INPUT", message || "Invalid input");
    }

    const { tank_id, species_id } = validationResult.data;

    // Verify user owns this tank
    const { data: tank, error: tankError } = await supabase
      .from("tanks")
      .select("id, user_id, type, volume_gallons")
      .eq("id", tank_id)
      .is("deleted_at", null)
      .single();

    if (tankError || !tank) {
      return errorResponse("NOT_FOUND", "Tank not found");
    }

    if (tank.user_id !== user.id) {
      return errorResponse("PERMISSION_DENIED", "You do not have access to this tank");
    }

    // Verify species exists
    const { data: species, error: speciesError } = await supabase
      .from("species")
      .select("*")
      .eq("id", species_id)
      .single();

    if (speciesError || !species) {
      return errorResponse("NOT_FOUND", "Species not found");
    }

    // Get user's subscription tier
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("tier, status, trial_ends_at")
      .eq("user_id", user.id)
      .single();

    // Determine tier (trial = pro access)
    let tier: "free" | "starter" | "plus" | "pro" = "free";
    if (subscription) {
      const isTrialing =
        subscription.status === "trialing" &&
        subscription.trial_ends_at &&
        new Date(subscription.trial_ends_at) > new Date();

      if (isTrialing) {
        tier = "pro";
      } else if (subscription.status === "active") {
        tier = subscription.tier as "free" | "starter" | "plus" | "pro";
      }
    }

    // Get existing livestock for this tank
    const { data: existingLivestockRaw } = await supabase
      .from("livestock")
      .select(`
        id,
        quantity,
        species_id,
        species:species_id (
          id,
          common_name,
          scientific_name,
          type,
          temperament,
          temp_min_f,
          temp_max_f,
          ph_min,
          ph_max,
          min_tank_size_gallons
        )
      `)
      .eq("tank_id", tank_id)
      .eq("is_active", true)
      .is("deleted_at", null);

    // Transform Supabase response (species is returned as object from join, not array)
    const existingLivestock = (existingLivestockRaw || []).map((item: any) => ({
      species_id: item.species_id,
      quantity: item.quantity,
      species: item.species || null,
    }));

    // Perform basic rule-based compatibility checks
    const basicChecks = performBasicCompatibilityChecks(
      tank,
      species,
      existingLivestock
    );

    // If free tier, return basic checks only
    if (tier === "free") {
      return successResponse({
        result: basicChecks.result,
        warnings: basicChecks.warnings,
        recommendation: basicChecks.recommendation,
        ai_assessment: false,
      });
    }

    // Starter+ tiers get AI-enhanced assessment
    // Check if we have a cached compatibility check
    // Note: compatibility_checks stores species pairs, so we check against first existing species
    // For simplicity, we'll always run AI check if there are multiple species
    let cachedCheck: any = null;
    if (existingLivestock.length > 0 && existingLivestock[0].species_id) {
      const { data: cached } = await supabase
        .from("compatibility_checks")
        .select("*")
        .eq("tank_id", tank_id)
        .eq("species_a_id", species_id)
        .eq("species_b_id", existingLivestock[0].species_id)
        .gt("expires_at", new Date().toISOString())
        .single();
      cachedCheck = cached;
    }

    // If cached and valid, return cached result
    if (cachedCheck) {
      return successResponse({
        result: getResultFromScore(cachedCheck.compatibility_score),
        warnings: cachedCheck.warnings || [],
        recommendation: cachedCheck.notes || "",
        ai_assessment: true,
        cached: true,
      });
    }

    // Check AI usage limit (compatibility checks count as AI messages)
    const { data: canUse, error: usageError } = await supabase.rpc(
      "check_and_increment_ai_usage",
      {
        user_uuid: user.id,
        feature_name: "compatibility",
      }
    );

    if (usageError) {
      console.error("Error checking AI usage:", usageError);
      // Fall back to basic checks if usage check fails
      return successResponse({
        result: basicChecks.result,
        warnings: basicChecks.warnings,
        recommendation: basicChecks.recommendation,
        ai_assessment: false,
      });
    }

    if (!canUse) {
      // Return basic checks if daily limit reached
      return successResponse({
        result: basicChecks.result,
        warnings: basicChecks.warnings,
        recommendation: basicChecks.recommendation,
        ai_assessment: false,
        limit_reached: true,
      });
    }

    // Perform AI compatibility check with Claude Haiku
    const aiResult = await performAICompatibilityCheck(
      tank,
      species,
      existingLivestock
    );

    // Store result in compatibility_checks table
    // Note: We need to compare against all existing species, so we'll store
    // one entry per species pair. For now, store the new species vs tank context.
    // The compatibility_checks table expects species_a_id and species_b_id,
    // so we'll use the new species as species_a and create entries for each existing species.
    if (existingLivestock && existingLivestock.length > 0) {
      const insertPromises = existingLivestock
        .filter((item) => item.species_id)
        .map((item) => {
          const speciesBId = item.species_id as string;
          return supabase
            .from("compatibility_checks")
            .upsert(
              {
                tank_id: tank_id,
                species_a_id: species_id,
                species_b_id: speciesBId,
                compatibility_score: aiResult.score,
                warnings: aiResult.warnings,
                notes: aiResult.recommendation,
                ai_model: AI_MODEL,
                expires_at: new Date(
                  Date.now() + 30 * 24 * 60 * 60 * 1000
                ).toISOString(), // 30 days
              },
              {
                onConflict: "tank_id,species_a_id,species_b_id",
              }
            );
        });

      await Promise.all(insertPromises);
    }

    return successResponse({
      result: aiResult.result,
      warnings: aiResult.warnings,
      recommendation: aiResult.recommendation,
      ai_assessment: true,
    });
  } catch (error) {
    console.error("Compatibility check error:", error);
    return errorResponse("INTERNAL_SERVER_ERROR", "An unexpected error occurred");
  }
}

/**
 * Perform basic rule-based compatibility checks
 */
function performBasicCompatibilityChecks(
  tank: { type: string; volume_gallons: number },
  species: {
    type: string;
    temperament?: string;
    temp_min_f?: number;
    temp_max_f?: number;
    ph_min?: number;
    ph_max?: number;
    min_tank_size_gallons?: number;
  },
  existingLivestock: Array<{
    species_id: string | null;
    quantity: number;
    species: {
      type?: string;
      temperament?: string;
      temp_min_f?: number;
      temp_max_f?: number;
      ph_min?: number;
      ph_max?: number;
    } | null;
  }>
): {
  result: "compatible" | "caution" | "incompatible";
  warnings: Array<{ type: string; severity: string; message: string }>;
  recommendation: string;
} {
  const warnings: Array<{ type: string; severity: string; message: string }> = [];
  let result: "compatible" | "caution" | "incompatible" = "compatible";

  // Check tank type compatibility
  if (tank.type === "freshwater" && species.type === "saltwater") {
    warnings.push({
      type: "tank_type",
      severity: "danger",
      message: `${species.type} species cannot live in a ${tank.type} tank.`,
    });
    result = "incompatible";
  } else if (tank.type === "saltwater" && species.type === "freshwater") {
    warnings.push({
      type: "tank_type",
      severity: "danger",
      message: `${species.type} species cannot live in a ${tank.type} tank.`,
    });
    result = "incompatible";
  }

  // Check tank size
  if (species.min_tank_size_gallons && tank.volume_gallons < species.min_tank_size_gallons) {
    warnings.push({
      type: "space",
      severity: "warning",
      message: `This species requires at least ${species.min_tank_size_gallons} gallons, but your tank is ${tank.volume_gallons} gallons.`,
    });
    if (result === "compatible") result = "caution";
  }

  // Check temperament conflicts with existing livestock
  if (species.temperament === "aggressive") {
    const hasPeaceful = existingLivestock.some((item) => {
      const s = item.species as { temperament?: string } | null;
      return s?.temperament === "peaceful";
    });

    if (hasPeaceful) {
      warnings.push({
        type: "temperament",
        severity: "warning",
        message: "This aggressive species may harm peaceful fish already in your tank.",
      });
      if (result === "compatible") result = "caution";
    }
  }

  // Check temperature range overlap (basic)
  if (species.temp_min_f && species.temp_max_f) {
    const hasTempConflict = existingLivestock.some((item) => {
      const s = item.species as {
        temp_min_f?: number;
        temp_max_f?: number;
      } | null;
      if (!s?.temp_min_f || !s?.temp_max_f) return false;

      // Check if temperature ranges overlap
      if (!species.temp_min_f || !species.temp_max_f || !s.temp_min_f || !s.temp_max_f) {
        return false;
      }
      return !(
        species.temp_max_f < s.temp_min_f || species.temp_min_f > s.temp_max_f
      );
    });

    if (!hasTempConflict && existingLivestock.length > 0) {
      warnings.push({
        type: "temperature",
        severity: "info",
        message: "Temperature range may not overlap with some existing species.",
      });
      if (result === "compatible") result = "caution";
    }
  }

  let recommendation = "";
  if (result === "incompatible") {
    recommendation = "Not recommended. Please reconsider adding this species.";
  } else if (result === "caution") {
    recommendation =
      "Proceed with caution. Monitor closely and ensure adequate hiding places.";
  } else {
    recommendation = "This species appears compatible with your tank setup.";
  }

  return { result, warnings, recommendation };
}

/**
 * Perform AI-enhanced compatibility check using Claude Haiku
 */
async function performAICompatibilityCheck(
  tank: { type: string; volume_gallons: number },
  species: {
    common_name?: string;
    scientific_name?: string;
    type: string;
    temperament?: string;
    temp_min_f?: number;
    temp_max_f?: number;
    ph_min?: number;
    ph_max?: number;
    min_tank_size_gallons?: number;
    diet?: string;
    max_adult_size_inches?: number;
  },
  existingLivestock: Array<{
    species_id: string | null;
    quantity: number;
    species: {
      common_name?: string;
      temperament?: string;
      temp_min_f?: number;
      temp_max_f?: number;
      ph_min?: number;
      ph_max?: number;
    } | null;
  }>
): Promise<{
  result: "compatible" | "caution" | "incompatible";
  score: 1 | 2 | 3 | 4 | 5;
  warnings: Array<{ type: string; severity: string; message: string }>;
  recommendation: string;
}> {
  // Build context for AI
  const existingSpeciesList = existingLivestock
    .filter((item) => item.species)
    .map((item) => {
      const s = item.species as {
        common_name?: string;
        temperament?: string;
        temp_min_f?: number;
        temp_max_f?: number;
      };
      return `- ${s.common_name || "Unknown"} (${item.quantity}x, ${s.temperament || "unknown"} temperament, temp: ${s.temp_min_f || "?"}-${s.temp_max_f || "?"}°F)`;
    })
    .join("\n");

  const systemPrompt = `You are an expert aquarium compatibility advisor. Analyze whether a new species is compatible with an existing tank setup.

Tank Details:
- Type: ${tank.type}
- Volume: ${tank.volume_gallons} gallons

Existing Livestock:
${existingSpeciesList || "None"}

New Species to Add:
- Name: ${species.common_name || species.scientific_name || "Unknown"}
- Type: ${species.type}
- Temperament: ${species.temperament || "unknown"}
- Temperature Range: ${species.temp_min_f || "?"}-${species.temp_max_f || "?"}°F
- pH Range: ${species.ph_min || "?"}-${species.ph_max || "?"}
- Min Tank Size: ${species.min_tank_size_gallons || "?"} gallons
- Diet: ${species.diet || "unknown"}
- Max Size: ${species.max_adult_size_inches || "?"} inches

Analyze compatibility and respond with a JSON object:
{
  "score": 1-5, // 1=incompatible, 2=poor, 3=moderate, 4=good, 5=excellent
  "result": "compatible" | "caution" | "incompatible",
  "warnings": [
    {
      "type": "temperament" | "space" | "temperature" | "ph" | "tank_type" | "diet" | "bioload",
      "severity": "info" | "warning" | "danger",
      "message": "Human-readable warning message"
    }
  ],
  "recommendation": "Brief recommendation text (2-3 sentences)"
}`;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await anthropic.messages.create({
        model: AI_MODEL,
        max_tokens: MAX_TOKENS,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: `Analyze compatibility for adding ${species.common_name || species.scientific_name} to this ${tank.type} tank.`,
          },
        ],
      });

      const content = response.content[0];
      if (content.type !== "text") {
        throw new Error("Unexpected response type from AI");
      }

      // Parse JSON response
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in AI response");
      }

      const aiResult = JSON.parse(jsonMatch[0]);

      // Validate and normalize response
      const score = Math.max(1, Math.min(5, Math.round(aiResult.score || 3))) as 1 | 2 | 3 | 4 | 5;
      const result =
        aiResult.result === "incompatible"
          ? "incompatible"
          : aiResult.result === "caution"
            ? "caution"
            : "compatible";

      return {
        result,
        score,
        warnings: Array.isArray(aiResult.warnings) ? aiResult.warnings : [],
        recommendation: aiResult.recommendation || "Please review compatibility carefully.",
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`AI compatibility check attempt ${attempt + 1} failed:`, lastError);

      if (attempt < MAX_RETRIES - 1) {
        // Wait before retry (exponential backoff)
        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }

  // If all retries failed, fall back to basic checks
  console.error("All AI compatibility check attempts failed:", lastError);
  const basicChecks = performBasicCompatibilityChecks(tank, species, existingLivestock);
  return {
    result: basicChecks.result,
    score: basicChecks.result === "incompatible" ? 1 : basicChecks.result === "caution" ? 3 : 4,
    warnings: basicChecks.warnings,
    recommendation: basicChecks.recommendation,
  };
}

/**
 * Convert compatibility score to result string
 */
function getResultFromScore(score: 1 | 2 | 3 | 4 | 5): "compatible" | "caution" | "incompatible" {
  if (score <= 2) return "incompatible";
  if (score === 3) return "caution";
  return "compatible";
}
