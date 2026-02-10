import Anthropic from "@anthropic-ai/sdk";
import type { TankContext } from "./context-builder";
import type {
  DiagnosisType,
  SpeciesResult,
  DiseaseResult,
  Confidence,
} from "@/lib/validation/ai";

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

// Model configuration - using vision-capable Sonnet
const AI_MODEL = process.env.ANTHROPIC_MODEL_SONNET || "claude-sonnet-4-5-20250929";
const MAX_TOKENS = 2000;
const MAX_RETRIES = 3;

/**
 * Photo diagnosis result from Claude Vision
 */
export interface PhotoDiagnosisResult {
  speciesResult?: SpeciesResult;
  diseaseResult?: DiseaseResult;
  confidence: Confidence;
  rawResponse: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

/**
 * Generate system prompt for photo diagnosis
 */
function generateDiagnosisPrompt(
  diagnosisType: DiagnosisType,
  tankContext: TankContext | null
): string {
  const basePrompt = `You are AquaBotAI, an expert aquarium AI assistant specializing in species identification and disease diagnosis.

## Your Task
Analyze the provided aquarium photo and provide a detailed ${
    diagnosisType === "both"
      ? "species identification AND disease diagnosis"
      : diagnosisType === "species_id"
        ? "species identification"
        : "disease diagnosis"
  }.

## Response Format
You MUST respond with valid JSON in the following format. Do not include any text before or after the JSON.

${
  diagnosisType === "species_id" || diagnosisType === "both"
    ? `
### For Species Identification:
{
  "speciesResult": {
    "name": "Common Name (e.g., Neon Tetra)",
    "scientificName": "Scientific name (e.g., Paracheirodon innesi)",
    "confidence": "high" | "medium" | "low",
    "careLevel": "beginner" | "intermediate" | "advanced",
    "minTankSize": number (in gallons),
    "temperament": "peaceful" | "semi-aggressive" | "aggressive",
    "careSummary": "Brief 2-3 sentence care overview"
  }
}
`
    : ""
}

${
  diagnosisType === "disease" || diagnosisType === "both"
    ? `
### For Disease Diagnosis:
{
  "diseaseResult": {
    "diagnosis": "Disease/condition name (e.g., Ich, Fin Rot)",
    "confidence": "high" | "medium" | "low",
    "severity": "minor" | "moderate" | "severe",
    "symptoms": ["List", "of", "visible", "symptoms"],
    "treatmentSteps": ["Step 1", "Step 2", "Step 3", "..."],
    "medicationName": "Recommended medication (if applicable)",
    "medicationDosage": "Dosage adjusted for tank volume",
    "treatmentDuration": "Expected treatment duration",
    "medicationWarnings": ["Warning about invertebrates", "Other warnings"]
  }
}
`
    : ""
}

${
  diagnosisType === "both"
    ? `
### For Both (Combined Response):
{
  "speciesResult": { ... },
  "diseaseResult": { ... }  // Include only if disease/issue is detected
}
`
    : ""
}

## Guidelines

### Species Identification:
- Focus on physical characteristics visible in the photo
- Consider coloration, fin shape, body shape, and markings
- If multiple fish are visible, identify the most prominent one
- If unsure, indicate "medium" or "low" confidence
- Common aquarium species should be identifiable with "high" confidence

### Disease Diagnosis:
- Look for visible symptoms: white spots, fin damage, color changes, swelling, etc.
- Consider the tank context (parameters, livestock) when assessing
- For treatment, ALWAYS personalize dosage based on the tank volume provided
- ALWAYS warn about medication interactions with invertebrates, scaleless fish, or plants
- If no disease is visible, set confidence to "low" and note the fish appears healthy

### Confidence Levels:
- "high": Clear photo, obvious characteristics, highly confident
- "medium": Somewhat unclear or ambiguous, reasonable guess
- "low": Poor photo quality, obscured subject, or uncertain identification

### Safety:
- ALWAYS include the disclaimer about consulting a veterinary professional for serious conditions
- Never recommend medications that could harm other tank inhabitants without warning
- If in doubt, recommend monitoring and retesting before aggressive treatment`;

  // Add tank context if available
  let tankContextSection = "";
  if (tankContext) {
    tankContextSection = `

## Tank Context (Use for Personalized Treatment)
- Tank Name: ${tankContext.tank.name}
- Tank Type: ${tankContext.tank.type}
- Tank Volume: ${tankContext.tank.volume_gallons} gallons
${tankContext.tank.setup_date ? `- Setup Date: ${tankContext.tank.setup_date}` : ""}

### Current Livestock:
${
  tankContext.livestock.length > 0
    ? tankContext.livestock.map((l) => `- ${l.quantity}x ${l.name}${l.species ? ` (${l.species})` : ""}`).join("\n")
    : "- No livestock recorded"
}

### Latest Water Parameters:
${
  tankContext.parameters.length > 0
    ? Object.entries(tankContext.parameters[0])
        .filter(([key, val]) => key !== "date" && val !== undefined)
        .map(([key, val]) => `- ${key}: ${val}`)
        .join("\n")
    : "- No parameters recorded"
}

### Treatment Personalization:
- Calculate medication dosing for exactly ${tankContext.tank.volume_gallons} gallons
- Consider existing livestock when recommending treatment
- Flag any medications unsafe for current inhabitants`;
  }

  return basePrompt + tankContextSection;
}

/**
 * Analyze a photo using Claude Vision
 */
export async function analyzePhoto(
  imageBase64: string,
  mimeType: "image/jpeg" | "image/png",
  diagnosisType: DiagnosisType,
  tankContext: TankContext | null
): Promise<PhotoDiagnosisResult> {
  const systemPrompt = generateDiagnosisPrompt(diagnosisType, tankContext);

  // Build the message with the image
  const userContent: Anthropic.MessageParam["content"] = [
    {
      type: "image",
      source: {
        type: "base64",
        media_type: mimeType,
        data: imageBase64,
      },
    },
    {
      type: "text",
      text: `Please analyze this aquarium photo and provide a ${
        diagnosisType === "both"
          ? "species identification and disease diagnosis"
          : diagnosisType === "species_id"
            ? "species identification"
            : "disease diagnosis"
      }. Respond with JSON only.`,
    },
  ];

  let response: Anthropic.Message | null = null;
  let lastError: Error | null = null;

  // Retry loop with exponential backoff
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      response = await anthropic.messages.create({
        model: AI_MODEL,
        max_tokens: MAX_TOKENS,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: userContent,
          },
        ],
      });
      break;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`Photo diagnosis API attempt ${attempt + 1} failed:`, lastError);

      if (attempt < MAX_RETRIES - 1) {
        await new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, attempt) * 1000)
        );
      }
    }
  }

  if (!response) {
    throw new Error(
      `Photo diagnosis failed after ${MAX_RETRIES} attempts: ${lastError?.message}`
    );
  }

  // Extract response content
  const rawResponse = response.content
    .filter((block) => block.type === "text")
    .map((block) => (block as Anthropic.TextBlock).text)
    .join("\n");

  // Parse the JSON response
  const result = parseAIResponse(rawResponse, diagnosisType);

  return {
    ...result,
    rawResponse,
    usage: {
      input_tokens: response.usage?.input_tokens || 0,
      output_tokens: response.usage?.output_tokens || 0,
    },
  };
}

/**
 * Parse and validate the AI response JSON
 */
function parseAIResponse(
  rawResponse: string,
  diagnosisType: DiagnosisType
): Omit<PhotoDiagnosisResult, "rawResponse" | "usage"> {
  // Try to extract JSON from the response
  let jsonStr = rawResponse.trim();

  // Sometimes the model wraps JSON in markdown code blocks
  const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim();
  }

  // Try to find JSON object in the response
  const jsonStart = jsonStr.indexOf("{");
  const jsonEnd = jsonStr.lastIndexOf("}");
  if (jsonStart !== -1 && jsonEnd !== -1) {
    jsonStr = jsonStr.slice(jsonStart, jsonEnd + 1);
  }

  try {
    const parsed = JSON.parse(jsonStr);

    let speciesResult: SpeciesResult | undefined;
    let diseaseResult: DiseaseResult | undefined;
    let overallConfidence: Confidence = "medium";

    // Extract species result
    if (parsed.speciesResult && (diagnosisType === "species_id" || diagnosisType === "both")) {
      speciesResult = {
        name: parsed.speciesResult.name || "Unknown Species",
        scientificName: parsed.speciesResult.scientificName,
        speciesId: parsed.speciesResult.speciesId,
        confidence: validateConfidence(parsed.speciesResult.confidence),
        careLevel: parsed.speciesResult.careLevel,
        minTankSize: parsed.speciesResult.minTankSize,
        temperament: parsed.speciesResult.temperament,
        careSummary: parsed.speciesResult.careSummary,
      };
      overallConfidence = speciesResult.confidence;
    }

    // Extract disease result
    if (parsed.diseaseResult && (diagnosisType === "disease" || diagnosisType === "both")) {
      diseaseResult = {
        diagnosis: parsed.diseaseResult.diagnosis || "Unknown Condition",
        confidence: validateConfidence(parsed.diseaseResult.confidence),
        severity: validateSeverity(parsed.diseaseResult.severity),
        symptoms: Array.isArray(parsed.diseaseResult.symptoms)
          ? parsed.diseaseResult.symptoms
          : [],
        treatmentSteps: Array.isArray(parsed.diseaseResult.treatmentSteps)
          ? parsed.diseaseResult.treatmentSteps
          : [],
        medicationName: parsed.diseaseResult.medicationName,
        medicationDosage: parsed.diseaseResult.medicationDosage,
        treatmentDuration: parsed.diseaseResult.treatmentDuration,
        medicationWarnings: Array.isArray(parsed.diseaseResult.medicationWarnings)
          ? parsed.diseaseResult.medicationWarnings
          : undefined,
      };
      // Disease confidence takes precedence if available
      if (diagnosisType === "disease") {
        overallConfidence = diseaseResult.confidence;
      }
    }

    // Handle cases where no disease was found but we were asked to look
    if (diagnosisType === "disease" && !diseaseResult) {
      diseaseResult = {
        diagnosis: "No visible disease or condition detected",
        confidence: "medium",
        severity: "minor",
        symptoms: [],
        treatmentSteps: ["Continue regular monitoring", "Maintain good water quality"],
      };
    }

    return {
      speciesResult,
      diseaseResult,
      confidence: overallConfidence,
    };
  } catch (parseError) {
    console.error("Failed to parse AI response as JSON:", parseError);
    console.error("Raw response:", rawResponse);

    // Return a fallback response indicating parsing failure
    if (diagnosisType === "species_id" || diagnosisType === "both") {
      return {
        speciesResult: {
          name: "Unable to identify",
          confidence: "low",
          careSummary: "The AI was unable to parse the identification results. Please try again with a clearer photo.",
        },
        confidence: "low",
      };
    } else {
      return {
        diseaseResult: {
          diagnosis: "Analysis inconclusive",
          confidence: "low",
          severity: "minor",
          symptoms: [],
          treatmentSteps: ["Please try again with a clearer, well-lit photo"],
        },
        confidence: "low",
      };
    }
  }
}

/**
 * Validate confidence value
 */
function validateConfidence(value: unknown): Confidence {
  if (value === "high" || value === "medium" || value === "low") {
    return value;
  }
  return "medium";
}

/**
 * Validate severity value
 */
function validateSeverity(value: unknown): "minor" | "moderate" | "severe" {
  if (value === "minor" || value === "moderate" || value === "severe") {
    return value;
  }
  return "moderate";
}

/**
 * Convert file to base64
 */
export async function fileToBase64(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return buffer.toString("base64");
}

/**
 * Get MIME type from file
 */
export function getMimeType(file: File): "image/jpeg" | "image/png" {
  if (file.type === "image/png") {
    return "image/png";
  }
  // Default to jpeg for other image types
  return "image/jpeg";
}
