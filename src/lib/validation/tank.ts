import { z } from "zod";

export const TANK_TYPES = [
  "freshwater",
  "saltwater",
  "brackish",
  "reef",
  "planted",
  "pond",
] as const;

export type TankType = (typeof TANK_TYPES)[number];

export const tankSchema = z.object({
  name: z
    .string()
    .min(1, "Tank name is required")
    .max(50, "Tank name must be 50 characters or less")
    .trim(),
  type: z.enum(TANK_TYPES, {
    message: "Please select a valid tank type",
  }),
  volume_gallons: z
    .number({ message: "Volume must be a number" })
    .positive("Volume must be greater than 0")
    .max(100000, "Volume cannot exceed 100,000 gallons"),
  length_inches: z
    .number()
    .positive("Length must be greater than 0")
    .max(1000, "Length cannot exceed 1,000 inches")
    .nullable()
    .optional(),
  width_inches: z
    .number()
    .positive("Width must be greater than 0")
    .max(1000, "Width cannot exceed 1,000 inches")
    .nullable()
    .optional(),
  height_inches: z
    .number()
    .positive("Height must be greater than 0")
    .max(1000, "Height cannot exceed 1,000 inches")
    .nullable()
    .optional(),
  substrate: z
    .string()
    .max(100, "Substrate must be 100 characters or less")
    .trim()
    .nullable()
    .optional(),
  notes: z
    .string()
    .max(1000, "Notes must be 1,000 characters or less")
    .trim()
    .nullable()
    .optional(),
  setup_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Setup date must be in YYYY-MM-DD format")
    .nullable()
    .optional(),
  photo_url: z
    .string()
    .url("Photo URL must be a valid URL")
    .nullable()
    .optional(),
  photo_path: z
    .string()
    .nullable()
    .optional(),
});

export type TankFormData = z.infer<typeof tankSchema>;

// Helper to parse form input to schema format
export function parseFormToTankData(formData: {
  name: string;
  type: string;
  volume: string;
  length?: string;
  width?: string;
  height?: string;
  substrate?: string;
  notes?: string;
  setup_date?: string;
  photo_url?: string;
  photo_path?: string;
}): TankFormData {
  return {
    name: formData.name,
    type: formData.type as TankType,
    volume_gallons: formData.volume ? parseFloat(formData.volume) : 0,
    length_inches: formData.length ? parseFloat(formData.length) : null,
    width_inches: formData.width ? parseFloat(formData.width) : null,
    height_inches: formData.height ? parseFloat(formData.height) : null,
    substrate: formData.substrate || null,
    notes: formData.notes || null,
    setup_date: formData.setup_date || null,
    photo_url: formData.photo_url || null,
    photo_path: formData.photo_path || null,
  };
}

// Validate and return errors or validated data
export function validateTank(data: TankFormData): {
  success: boolean;
  data?: TankFormData;
  errors?: Record<string, string>;
} {
  const result = tankSchema.safeParse(data);

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
