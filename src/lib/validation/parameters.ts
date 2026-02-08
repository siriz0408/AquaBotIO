import { z } from "zod";

export const waterParameterSchema = z
  .object({
    tank_id: z.string().uuid("Invalid tank ID"),
    measured_at: z.string().datetime().optional(),
    // Core parameters
    temperature_f: z
      .number()
      .min(32, "Temperature must be at least 32°F")
      .max(120, "Temperature must be at most 120°F")
      .nullable()
      .optional(),
    ph: z
      .number()
      .min(0, "pH must be at least 0")
      .max(14, "pH must be at most 14")
      .nullable()
      .optional(),
    ammonia_ppm: z
      .number()
      .min(0, "Ammonia cannot be negative")
      .nullable()
      .optional(),
    nitrite_ppm: z
      .number()
      .min(0, "Nitrite cannot be negative")
      .nullable()
      .optional(),
    nitrate_ppm: z
      .number()
      .min(0, "Nitrate cannot be negative")
      .nullable()
      .optional(),
    // Freshwater optional
    gh_dgh: z.number().min(0).nullable().optional(),
    kh_dkh: z.number().min(0).nullable().optional(),
    // Saltwater specific
    salinity: z
      .number()
      .min(0, "Salinity cannot be negative")
      .max(2, "Salinity must be at most 2")
      .nullable()
      .optional(),
    calcium_ppm: z.number().min(0).nullable().optional(),
    alkalinity_dkh: z.number().min(0).nullable().optional(),
    magnesium_ppm: z.number().min(0).nullable().optional(),
    phosphate_ppm: z.number().min(0).nullable().optional(),
    notes: z.string().max(1000).trim().nullable().optional(),
  })
  .refine(
    (data) => {
      // At least one parameter must be provided
      return (
        data.temperature_f !== null ||
        data.ph !== null ||
        data.ammonia_ppm !== null ||
        data.nitrite_ppm !== null ||
        data.nitrate_ppm !== null ||
        data.gh_dgh !== null ||
        data.kh_dkh !== null ||
        data.salinity !== null ||
        data.calcium_ppm !== null ||
        data.alkalinity_dkh !== null ||
        data.magnesium_ppm !== null ||
        data.phosphate_ppm !== null
      );
    },
    {
      message: "At least one parameter must be provided",
    }
  );

export type WaterParameterFormData = z.infer<typeof waterParameterSchema>;

// Helper to parse form input to schema format
export function parseFormToParameterData(formData: {
  tank_id: string;
  temperature?: string;
  ph?: string;
  ammonia?: string;
  nitrite?: string;
  nitrate?: string;
  gh?: string;
  kh?: string;
  salinity?: string;
  calcium?: string;
  alkalinity?: string;
  magnesium?: string;
  phosphate?: string;
  notes?: string;
}): WaterParameterFormData {
  return {
    tank_id: formData.tank_id,
    measured_at: new Date().toISOString(),
    temperature_f: formData.temperature
      ? parseFloat(formData.temperature)
      : null,
    ph: formData.ph ? parseFloat(formData.ph) : null,
    ammonia_ppm: formData.ammonia ? parseFloat(formData.ammonia) : null,
    nitrite_ppm: formData.nitrite ? parseFloat(formData.nitrite) : null,
    nitrate_ppm: formData.nitrate ? parseFloat(formData.nitrate) : null,
    gh_dgh: formData.gh ? parseFloat(formData.gh) : null,
    kh_dkh: formData.kh ? parseFloat(formData.kh) : null,
    salinity: formData.salinity ? parseFloat(formData.salinity) : null,
    calcium_ppm: formData.calcium ? parseFloat(formData.calcium) : null,
    alkalinity_dkh: formData.alkalinity ? parseFloat(formData.alkalinity) : null,
    magnesium_ppm: formData.magnesium ? parseFloat(formData.magnesium) : null,
    phosphate_ppm: formData.phosphate ? parseFloat(formData.phosphate) : null,
    notes: formData.notes?.trim() || null,
  };
}

// Validate and return errors or validated data
export function validateWaterParameter(
  data: WaterParameterFormData
): {
  success: boolean;
  data?: WaterParameterFormData;
  errors?: Record<string, string>;
} {
  const result = waterParameterSchema.safeParse(data);

  if (!result.success) {
    const errors: Record<string, string> = {};
    result.error.issues.forEach((issue) => {
      const path = issue.path.join(".");
      if (!errors[path]) {
        errors[path] = issue.message;
      }
    });
    return { success: false, errors };
  }

  return { success: true, data: result.data };
}

// Valid parameter types — aligned with water_parameters column names
export const PARAMETER_TYPES = [
  "temperature_f",
  "ph",
  "ammonia_ppm",
  "nitrite_ppm",
  "nitrate_ppm",
  "gh_dgh",
  "kh_dkh",
  "salinity",
  "phosphate_ppm",
  "calcium_ppm",
  "alkalinity_dkh",
  "magnesium_ppm",
  "dissolved_oxygen_ppm",
] as const;

export type ParameterType = (typeof PARAMETER_TYPES)[number];

// Schema for threshold upsert
export const thresholdUpsertSchema = z
  .object({
    parameter_type: z.enum([
      "temperature_f",
      "ph",
      "ammonia_ppm",
      "nitrite_ppm",
      "nitrate_ppm",
      "gh_dgh",
      "kh_dkh",
      "salinity",
      "phosphate_ppm",
      "calcium_ppm",
      "alkalinity_dkh",
      "magnesium_ppm",
      "dissolved_oxygen_ppm",
    ] as [string, ...string[]], {
      message: "Invalid parameter type",
    }),
    safe_min: z.number().nullable(),
    safe_max: z.number().nullable(),
    warning_min: z.number().nullable(),
    warning_max: z.number().nullable(),
  })
  .refine(
    (data) => {
      // If any value is provided, all must be provided
      const hasAny =
        data.safe_min !== null ||
        data.safe_max !== null ||
        data.warning_min !== null ||
        data.warning_max !== null;

      if (hasAny) {
        return (
          data.safe_min !== null &&
          data.safe_max !== null &&
          data.warning_min !== null &&
          data.warning_max !== null
        );
      }
      return true;
    },
    {
      message: "All threshold values must be provided together",
    }
  )
  .refine(
    (data) => {
      // Safe zone must be within warning zone
      if (
        data.safe_min !== null &&
        data.safe_max !== null &&
        data.warning_min !== null &&
        data.warning_max !== null
      ) {
        return (
          data.safe_min >= data.warning_min && data.safe_max <= data.warning_max
        );
      }
      return true;
    },
    {
      message:
        "Safe zone must be within warning zone (safe_min >= warning_min, safe_max <= warning_max)",
    }
  );

export type ThresholdUpsertData = z.infer<typeof thresholdUpsertSchema>;

// Schema for trend analysis request
export const trendAnalysisSchema = z.object({
  tank_id: z.string().uuid("Invalid tank ID"),
  days: z.number().int().min(1).max(365).optional().default(30),
});
