import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { successResponse, errorResponse } from "@/lib/api/response";
import { resolveUserTier } from "@/lib/hooks/use-tier-limits";
import { z } from "zod";

// Equipment types per Spec 10
const EQUIPMENT_TYPES = [
  "filter",
  "filter_media",
  "heater",
  "light_bulb",
  "light_led",
  "protein_skimmer",
  "powerhead",
  "dosing_pump",
  "controller",
  "test_kit",
  "substrate",
  "media",
  "carbon",
  "other",
] as const;

// Validation schema for adding equipment
const addEquipmentSchema = z.object({
  type: z.enum(EQUIPMENT_TYPES),
  custom_type: z.string().max(100).optional().nullable(),
  brand: z.string().max(100).optional().nullable(),
  model: z.string().max(100).optional().nullable(),
  purchase_date: z.string().refine(
    (date) => {
      const parsed = new Date(date);
      return !isNaN(parsed.getTime()) && parsed <= new Date();
    },
    { message: "Purchase date must be a valid date not in the future" }
  ),
  last_serviced_date: z.string().optional().nullable(),
  settings: z.string().max(1000).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  purchase_price: z.number().min(0).max(99999999.99).optional().nullable(),
  expected_lifespan_months: z.number().int().min(1).max(240).optional().nullable(),
  photo_url: z.string().url().max(500).optional().nullable(),
  location: z.string().max(100).optional().nullable(),
}).refine(
  (data) => data.type !== "other" || (data.custom_type && data.custom_type.length > 0),
  { message: "custom_type is required when type is 'other'" }
);

interface RouteContext {
  params: Promise<{ tankId: string }>;
}

/**
 * GET /api/tanks/[tankId]/equipment
 *
 * Get all equipment for a tank with calculated status.
 * Requires Plus+ tier.
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { tankId } = await context.params;
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return errorResponse("AUTH_REQUIRED", "You must be logged in");
    }

    // Check tier - Equipment tracking requires Plus+ (Spec 10 R-103.3)
    const tier = await resolveUserTier(supabase, user.id);
    if (tier === "free" || tier === "starter") {
      return errorResponse(
        "TIER_REQUIRED",
        "Equipment tracking requires Plus or Pro plan. Upgrade to track your aquarium equipment."
      );
    }

    // Verify user owns this tank
    const { data: tank, error: tankError } = await supabase
      .from("tanks")
      .select("id, user_id")
      .eq("id", tankId)
      .is("deleted_at", null)
      .single();

    if (tankError || !tank) {
      return errorResponse("NOT_FOUND", "Tank not found");
    }

    if (tank.user_id !== user.id) {
      return errorResponse("PERMISSION_DENIED", "You do not have access to this tank");
    }

    // Get equipment with status using RPC function
    const { data: equipment, error: equipmentError } = await supabase
      .rpc("get_equipment_with_status", { p_tank_id: tankId });

    if (equipmentError) {
      console.error("Error fetching equipment:", equipmentError);
      return errorResponse("INTERNAL_SERVER_ERROR", "Failed to fetch equipment");
    }

    // Calculate summary stats
    const stats = {
      total: equipment?.length || 0,
      overdue: equipment?.filter((e: { status: string }) => e.status === "overdue").length || 0,
      due_soon: equipment?.filter((e: { status: string }) => e.status === "due_soon").length || 0,
      good: equipment?.filter((e: { status: string }) => e.status === "good").length || 0,
      total_investment: equipment?.reduce((sum: number, e: { purchase_price: number | null }) =>
        sum + (e.purchase_price || 0), 0) || 0,
    };

    return successResponse({
      equipment: equipment || [],
      stats,
    });
  } catch (error) {
    console.error("Equipment GET error:", error);
    return errorResponse("INTERNAL_SERVER_ERROR", "An unexpected error occurred");
  }
}

/**
 * POST /api/tanks/[tankId]/equipment
 *
 * Add equipment to a tank.
 * Requires Plus+ tier.
 */
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { tankId } = await context.params;
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return errorResponse("AUTH_REQUIRED", "You must be logged in");
    }

    // Check tier - Equipment tracking requires Plus+ (Spec 10 R-103.3)
    const tier = await resolveUserTier(supabase, user.id);
    if (tier === "free" || tier === "starter") {
      return errorResponse(
        "TIER_REQUIRED",
        "Equipment tracking requires Plus or Pro plan. Upgrade to track your aquarium equipment."
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = addEquipmentSchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.flatten().fieldErrors;
      const message = Object.entries(errors)
        .map(([field, messages]) => `${field}: ${(messages || []).join(", ")}`)
        .join("; ");
      return errorResponse("INVALID_INPUT", message || "Invalid input");
    }

    const data = validationResult.data;

    // Verify user owns this tank
    const { data: tank, error: tankError } = await supabase
      .from("tanks")
      .select("id, user_id")
      .eq("id", tankId)
      .is("deleted_at", null)
      .single();

    if (tankError || !tank) {
      return errorResponse("NOT_FOUND", "Tank not found");
    }

    if (tank.user_id !== user.id) {
      return errorResponse("PERMISSION_DENIED", "You do not have access to this tank");
    }

    // Insert equipment
    const { data: newEquipment, error: insertError } = await supabase
      .from("equipment")
      .insert({
        tank_id: tankId,
        user_id: user.id,
        type: data.type,
        custom_type: data.custom_type || null,
        brand: data.brand || null,
        model: data.model || null,
        purchase_date: data.purchase_date,
        last_serviced_date: data.last_serviced_date || null,
        settings: data.settings || null,
        notes: data.notes || null,
        purchase_price: data.purchase_price || null,
        expected_lifespan_months: data.expected_lifespan_months || null,
        photo_url: data.photo_url || null,
        location: data.location || null,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting equipment:", insertError);
      return errorResponse("INTERNAL_SERVER_ERROR", "Failed to add equipment");
    }

    return successResponse({ equipment: newEquipment }, 201);
  } catch (error) {
    console.error("Equipment POST error:", error);
    return errorResponse("INTERNAL_SERVER_ERROR", "An unexpected error occurred");
  }
}
