import { z } from "zod";

/**
 * AI feature validation schemas
 * Per Spec 09 (Photo Diagnosis) and Spec 01 (AI Chat Engine)
 */

// ============================================================================
// Photo Diagnosis Schemas
// ============================================================================

/**
 * Diagnosis type enum
 */
export const diagnosisTypeSchema = z.enum(["species_id", "disease", "both"]);
export type DiagnosisType = z.infer<typeof diagnosisTypeSchema>;

/**
 * Confidence level enum
 */
export const confidenceSchema = z.enum(["high", "medium", "low"]);
export type Confidence = z.infer<typeof confidenceSchema>;

/**
 * Severity level enum
 */
export const severitySchema = z.enum(["minor", "moderate", "severe"]);
export type Severity = z.infer<typeof severitySchema>;

/**
 * Species identification result
 */
export const speciesResultSchema = z.object({
  name: z.string(),
  scientificName: z.string().optional(),
  speciesId: z.string().uuid().optional(),
  confidence: confidenceSchema,
  careLevel: z.string().optional(),
  minTankSize: z.number().optional(),
  temperament: z.string().optional(),
  careSummary: z.string().optional(),
});
export type SpeciesResult = z.infer<typeof speciesResultSchema>;

/**
 * Disease diagnosis result
 */
export const diseaseResultSchema = z.object({
  diagnosis: z.string(),
  confidence: confidenceSchema,
  severity: severitySchema,
  symptoms: z.array(z.string()),
  treatmentSteps: z.array(z.string()),
  medicationName: z.string().optional(),
  medicationDosage: z.string().optional(),
  treatmentDuration: z.string().optional(),
  medicationWarnings: z.array(z.string()).optional(),
});
export type DiseaseResult = z.infer<typeof diseaseResultSchema>;

/**
 * Photo diagnosis request schema - what the API expects
 * Note: The actual request comes as multipart/form-data, so we validate
 * the parsed fields after extraction.
 */
export const photoDiagnosisRequestSchema = z.object({
  tank_id: z.string().uuid("Invalid tank ID"),
  diagnosis_type: diagnosisTypeSchema,
});
export type PhotoDiagnosisRequest = z.infer<typeof photoDiagnosisRequestSchema>;

/**
 * Photo diagnosis response schema - what the API returns
 */
export const photoDiagnosisResponseSchema = z.object({
  id: z.string().uuid(),
  diagnosisType: diagnosisTypeSchema,
  photoUrl: z.string().url(),
  speciesResult: speciesResultSchema.optional(),
  diseaseResult: diseaseResultSchema.optional(),
  confidence: confidenceSchema.optional(),
  usage: z.object({
    input_tokens: z.number(),
    output_tokens: z.number(),
    remaining_today: z.number(),
  }),
});
export type PhotoDiagnosisResponse = z.infer<typeof photoDiagnosisResponseSchema>;

/**
 * Validate photo diagnosis request fields
 */
export function validatePhotoDiagnosisRequest(data: unknown): {
  success: boolean;
  data?: PhotoDiagnosisRequest;
  errors?: Record<string, string[]>;
} {
  const result = photoDiagnosisRequestSchema.safeParse(data);

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
 * Validate uploaded image
 */
export function validateImage(file: File | null): {
  valid: boolean;
  error?: string;
} {
  if (!file) {
    return { valid: false, error: "No image file provided" };
  }

  // Check MIME type
  const allowedTypes = ["image/jpeg", "image/png"];
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: "Invalid file type. Only JPEG and PNG are allowed." };
  }

  // Check file size (10MB max per spec)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return { valid: false, error: "File too large. Maximum size is 10MB." };
  }

  return { valid: true };
}

/**
 * User feedback schema for rating diagnosis quality
 */
export const userFeedbackSchema = z.object({
  diagnosis_id: z.string().uuid("Invalid diagnosis ID"),
  feedback: z.enum(["helpful", "not_helpful"]),
});
export type UserFeedback = z.infer<typeof userFeedbackSchema>;

/**
 * Validate user feedback
 */
export function validateUserFeedback(data: unknown): {
  success: boolean;
  data?: UserFeedback;
  errors?: Record<string, string[]>;
} {
  const result = userFeedbackSchema.safeParse(data);

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

// ============================================================================
// Re-exports from chat.ts for convenience
// ============================================================================
export { chatRequestSchema, aiActionSchema } from "./chat";
