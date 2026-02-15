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

// Deletion reasons per Spec 10 R-102.5
const DELETION_REASONS = ["replaced", "removed", "failed", "sold", "other"] as const;

// Validation schema for updating equipment
const updateEquipmentSchema = z.object({
  type: z.enum(EQUIPMENT_TYPES).optional(),
  custom_type: z.string().max(100).optional().nullable(),
  brand: z.string().max(100).optional().nullable(),
  model: z.string().max(100).optional().nullable(),
  purchase_date: z.string().refine(
    (date) => {
      const parsed = new Date(date);
      return !isNaN(parsed.getTime()) && parsed <= new Date();
    },
    { message: "Purchase date must be a valid date not in the future" }
  ).optional(),
  last_serviced_date: z.string().optional().nullable(),
  settings: z.string().max(1000).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  purchase_price: z.number().min(0).max(99999999.99).optional().nullable(),
  expected_lifespan_months: z.number().int().min(1).max(240).optional().nullable(),
  photo_url: z.string().url().max(500).optional().nullable(),
  location: z.string().max(100).optional().nullable(),
});

// Schema for marking as serviced
const serviceEquipmentSchema = z.object({
  action: z.literal("mark_serviced"),
});

// Schema for soft-delete
const deleteEquipmentSchema = z.object({
  reason: z.enum(DELETION_REASONS),
});

interface RouteContext {
  params: Promise<{ tankId: string; equipmentId: string }>;
}

/**
 * GET /api/tanks/[tankId]/equipment/[equipmentId]
 *
 * Get a single equipment item with status.
 * Requires Plus+ tier.
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { tankId, equipmentId } = await context.params;
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return errorResponse("AUTH_REQUIRED", "You must be logged in");
    }

    // Check tier - Equipment tracking requires Plus+
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

    // Get equipment with lifespan default for status calculation
    const { data: equipment, error: equipmentError } = await supabase
      .from("equipment")
      .select(`
        *,
        lifespan_default:equipment_lifespan_defaults!inner(
          lifespan_months_min,
          lifespan_months_max,
          notes
        )
      `)
      .eq("id", equipmentId)
      .eq("tank_id", tankId)
      .is("deleted_at", null)
      .single();

    if (equipmentError || !equipment) {
      return errorResponse("NOT_FOUND", "Equipment not found");
    }

    // Calculate status
    const lastDate = equipment.last_serviced_date || equipment.purchase_date;
    const ageMs = Date.now() - new Date(lastDate).getTime();
    const ageMonths = Math.floor(ageMs / (1000 * 60 * 60 * 24 * 30.44));
    const lifespanMonths = equipment.expected_lifespan_months ||
      equipment.lifespan_default?.lifespan_months_max || 24;
    const monthsRemaining = lifespanMonths - ageMonths;

    let status: "good" | "due_soon" | "overdue";
    if (ageMonths >= lifespanMonths) {
      status = "overdue";
    } else if (ageMonths >= lifespanMonths * 0.8) {
      status = "due_soon";
    } else {
      status = "good";
    }

    return successResponse({
      equipment: {
        ...equipment,
        age_months: ageMonths,
        lifespan_months: lifespanMonths,
        months_remaining: monthsRemaining,
        status,
      },
    });
  } catch (error) {
    console.error("Equipment GET error:", error);
    return errorResponse("INTERNAL_SERVER_ERROR", "An unexpected error occurred");
  }
}

/**
 * PATCH /api/tanks/[tankId]/equipment/[equipmentId]
 *
 * Update equipment or mark as serviced.
 * Requires Plus+ tier.
 */
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { tankId, equipmentId } = await context.params;
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return errorResponse("AUTH_REQUIRED", "You must be logged in");
    }

    // Check tier - Equipment tracking requires Plus+
    const tier = await resolveUserTier(supabase, user.id);
    if (tier === "free" || tier === "starter") {
      return errorResponse(
        "TIER_REQUIRED",
        "Equipment tracking requires Plus or Pro plan. Upgrade to track your aquarium equipment."
      );
    }

    // Parse request body
    const body = await request.json();

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

    // Check if this is a "mark as serviced" action
    const serviceResult = serviceEquipmentSchema.safeParse(body);
    if (serviceResult.success) {
      // Mark equipment as serviced - reset the timer
      const today = new Date().toISOString().split("T")[0];

      const { data: updatedEquipment, error: updateError } = await supabase
        .from("equipment")
        .update({
          last_serviced_date: today,
        })
        .eq("id", equipmentId)
        .eq("tank_id", tankId)
        .is("deleted_at", null)
        .select()
        .single();

      if (updateError || !updatedEquipment) {
        console.error("Error marking equipment as serviced:", updateError);
        return errorResponse("INTERNAL_SERVER_ERROR", "Failed to update equipment");
      }

      return successResponse({
        equipment: updatedEquipment,
        message: "Equipment marked as serviced. Timer has been reset.",
      });
    }

    // Otherwise, treat as regular update
    const validationResult = updateEquipmentSchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.flatten().fieldErrors;
      const message = Object.entries(errors)
        .map(([field, messages]) => `${field}: ${(messages || []).join(", ")}`)
        .join("; ");
      return errorResponse("INVALID_INPUT", message || "Invalid input");
    }

    const updateData = validationResult.data;

    // Validate custom_type requirement
    if (updateData.type === "other" && !updateData.custom_type) {
      // Check if existing equipment has custom_type
      const { data: existing } = await supabase
        .from("equipment")
        .select("custom_type")
        .eq("id", equipmentId)
        .single();

      if (!existing?.custom_type) {
        return errorResponse("INVALID_INPUT", "custom_type is required when type is 'other'");
      }
    }

    // Update equipment
    const { data: updatedEquipment, error: updateError } = await supabase
      .from("equipment")
      .update(updateData)
      .eq("id", equipmentId)
      .eq("tank_id", tankId)
      .is("deleted_at", null)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating equipment:", updateError);
      return errorResponse("INTERNAL_SERVER_ERROR", "Failed to update equipment");
    }

    if (!updatedEquipment) {
      return errorResponse("NOT_FOUND", "Equipment not found");
    }

    return successResponse({ equipment: updatedEquipment });
  } catch (error) {
    console.error("Equipment PATCH error:", error);
    return errorResponse("INTERNAL_SERVER_ERROR", "An unexpected error occurred");
  }
}

/**
 * DELETE /api/tanks/[tankId]/equipment/[equipmentId]
 *
 * Soft-delete equipment with reason.
 * Requires Plus+ tier.
 */
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { tankId, equipmentId } = await context.params;
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return errorResponse("AUTH_REQUIRED", "You must be logged in");
    }

    // Check tier - Equipment tracking requires Plus+
    const tier = await resolveUserTier(supabase, user.id);
    if (tier === "free" || tier === "starter") {
      return errorResponse(
        "TIER_REQUIRED",
        "Equipment tracking requires Plus or Pro plan."
      );
    }

    // Get deletion reason from query params or body
    let reason: string = "removed";

    // Try query params first
    const { searchParams } = new URL(request.url);
    const queryReason = searchParams.get("reason");

    if (queryReason) {
      const validationResult = deleteEquipmentSchema.safeParse({ reason: queryReason });
      if (validationResult.success) {
        reason = validationResult.data.reason;
      }
    } else {
      // Try body
      try {
        const body = await request.json();
        const validationResult = deleteEquipmentSchema.safeParse(body);
        if (validationResult.success) {
          reason = validationResult.data.reason;
        }
      } catch {
        // No body provided, use default reason
      }
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

    // Soft-delete equipment
    const { error: deleteError } = await supabase
      .from("equipment")
      .update({
        deleted_at: new Date().toISOString(),
        deletion_reason: reason,
      })
      .eq("id", equipmentId)
      .eq("tank_id", tankId)
      .is("deleted_at", null);

    if (deleteError) {
      console.error("Error deleting equipment:", deleteError);
      return errorResponse("INTERNAL_SERVER_ERROR", "Failed to remove equipment");
    }

    return successResponse({
      deleted: true,
      reason,
      message: `Equipment removed (${reason})`,
    });
  } catch (error) {
    console.error("Equipment DELETE error:", error);
    return errorResponse("INTERNAL_SERVER_ERROR", "An unexpected error occurred");
  }
}
