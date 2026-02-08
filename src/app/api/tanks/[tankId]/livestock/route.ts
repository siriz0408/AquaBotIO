import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { successResponse, errorResponse } from "@/lib/api/response";
import { z } from "zod";

// Validation schemas
const addLivestockSchema = z.object({
  species_id: z.string().uuid().optional(),
  custom_name: z.string().min(1).max(100).optional(),
  nickname: z.string().max(50).optional(),
  quantity: z.number().int().min(1).max(1000).default(1),
  notes: z.string().max(500).optional(),
}).refine(
  (data) => data.species_id || data.custom_name,
  { message: "Either species_id or custom_name is required" }
);

const updateLivestockSchema = z.object({
  nickname: z.string().max(50).optional(),
  quantity: z.number().int().min(1).max(1000).optional(),
  notes: z.string().max(500).optional(),
  is_active: z.boolean().optional(),
});

interface RouteContext {
  params: Promise<{ tankId: string }>;
}

/**
 * GET /api/tanks/[tankId]/livestock
 *
 * Get all livestock for a tank.
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

    // Get livestock with species info
    const { data: livestock, error: livestockError } = await supabase
      .from("livestock")
      .select(`
        *,
        species:species_id (
          id,
          common_name,
          scientific_name,
          type,
          care_level,
          temperament,
          photo_url
        )
      `)
      .eq("tank_id", tankId)
      .is("deleted_at", null)
      .eq("is_active", true)
      .order("date_added", { ascending: false });

    if (livestockError) {
      console.error("Error fetching livestock:", livestockError);
      return errorResponse("INTERNAL_SERVER_ERROR", "Failed to fetch livestock");
    }

    return successResponse({
      livestock: livestock || [],
      total_count: livestock?.reduce((sum, item) => sum + item.quantity, 0) || 0,
    });
  } catch (error) {
    console.error("Livestock GET error:", error);
    return errorResponse("INTERNAL_SERVER_ERROR", "An unexpected error occurred");
  }
}

/**
 * POST /api/tanks/[tankId]/livestock
 *
 * Add livestock to a tank.
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

    // Parse and validate request body
    const body = await request.json();
    const validationResult = addLivestockSchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.flatten().fieldErrors;
      const message = Object.entries(errors)
        .map(([field, messages]) => `${field}: ${(messages || []).join(", ")}`)
        .join("; ");
      return errorResponse("INVALID_INPUT", message || "Invalid input");
    }

    const { species_id, custom_name, nickname, quantity, notes } = validationResult.data;

    // Verify user owns this tank
    const { data: tank, error: tankError } = await supabase
      .from("tanks")
      .select("id, user_id, type")
      .eq("id", tankId)
      .is("deleted_at", null)
      .single();

    if (tankError || !tank) {
      return errorResponse("NOT_FOUND", "Tank not found");
    }

    if (tank.user_id !== user.id) {
      return errorResponse("PERMISSION_DENIED", "You do not have access to this tank");
    }

    // If species_id provided, verify species exists and check compatibility
    let compatibilityWarning: string | null = null;
    if (species_id) {
      const { data: species, error: speciesError } = await supabase
        .from("species")
        .select("id, common_name, type, temperament")
        .eq("id", species_id)
        .single();

      if (speciesError || !species) {
        return errorResponse("NOT_FOUND", "Species not found");
      }

      // Basic tank type compatibility check
      if (
        (tank.type === "freshwater" && species.type === "saltwater") ||
        (tank.type === "saltwater" && species.type === "freshwater")
      ) {
        compatibilityWarning = `${species.common_name} is a ${species.type} species but your tank is ${tank.type}. This may cause health issues.`;
      }

      // Check for aggressive species mixing
      if (species.temperament === "aggressive") {
        const { data: existingLivestock } = await supabase
          .from("livestock")
          .select(`
            id,
            species:species_id (temperament, common_name)
          `)
          .eq("tank_id", tankId)
          .is("deleted_at", null)
          .eq("is_active", true);

        const hasConflict = existingLivestock?.some(
          (item) => {
            const speciesData = item.species as { temperament?: string; common_name?: string } | null;
            return speciesData?.temperament === "peaceful";
          }
        );

        if (hasConflict) {
          compatibilityWarning = `${species.common_name} is aggressive and may harm peaceful fish in your tank.`;
        }
      }
    }

    // Insert livestock
    const { data: newLivestock, error: insertError } = await supabase
      .from("livestock")
      .insert({
        tank_id: tankId,
        species_id: species_id || null,
        custom_name: custom_name || null,
        nickname: nickname || null,
        quantity,
        notes: notes || null,
        date_added: new Date().toISOString().split("T")[0],
        is_active: true,
      })
      .select(`
        *,
        species:species_id (
          id,
          common_name,
          scientific_name,
          type,
          care_level,
          temperament,
          photo_url
        )
      `)
      .single();

    if (insertError) {
      console.error("Error inserting livestock:", insertError);
      return errorResponse("INTERNAL_SERVER_ERROR", "Failed to add livestock");
    }

    return successResponse({
      livestock: newLivestock,
      warning: compatibilityWarning,
    }, 201);
  } catch (error) {
    console.error("Livestock POST error:", error);
    return errorResponse("INTERNAL_SERVER_ERROR", "An unexpected error occurred");
  }
}

/**
 * PATCH /api/tanks/[tankId]/livestock
 *
 * Update livestock (requires livestock_id in body).
 */
export async function PATCH(
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

    // Parse request body
    const body = await request.json();
    const { livestock_id, ...updates } = body;

    if (!livestock_id) {
      return errorResponse("INVALID_INPUT", "livestock_id is required");
    }

    // Validate updates
    const validationResult = updateLivestockSchema.safeParse(updates);

    if (!validationResult.success) {
      const errors = validationResult.error.flatten().fieldErrors;
      const message = Object.entries(errors)
        .map(([field, messages]) => `${field}: ${(messages || []).join(", ")}`)
        .join("; ");
      return errorResponse("INVALID_INPUT", message || "Invalid input");
    }

    // Verify user owns the tank
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

    // Update livestock
    const { data: updatedLivestock, error: updateError } = await supabase
      .from("livestock")
      .update(validationResult.data)
      .eq("id", livestock_id)
      .eq("tank_id", tankId)
      .is("deleted_at", null)
      .select(`
        *,
        species:species_id (
          id,
          common_name,
          scientific_name,
          type,
          care_level,
          temperament,
          photo_url
        )
      `)
      .single();

    if (updateError) {
      console.error("Error updating livestock:", updateError);
      return errorResponse("INTERNAL_SERVER_ERROR", "Failed to update livestock");
    }

    if (!updatedLivestock) {
      return errorResponse("NOT_FOUND", "Livestock not found");
    }

    return successResponse({ livestock: updatedLivestock });
  } catch (error) {
    console.error("Livestock PATCH error:", error);
    return errorResponse("INTERNAL_SERVER_ERROR", "An unexpected error occurred");
  }
}

/**
 * DELETE /api/tanks/[tankId]/livestock
 *
 * Soft-delete livestock (requires livestock_id in query params).
 */
export async function DELETE(
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

    // Get livestock_id from query params
    const { searchParams } = new URL(request.url);
    const livestockId = searchParams.get("livestock_id");

    if (!livestockId) {
      return errorResponse("INVALID_INPUT", "livestock_id query parameter is required");
    }

    // Verify user owns the tank
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

    // Soft-delete livestock
    const { error: deleteError } = await supabase
      .from("livestock")
      .update({
        deleted_at: new Date().toISOString(),
        is_active: false,
      })
      .eq("id", livestockId)
      .eq("tank_id", tankId)
      .is("deleted_at", null);

    if (deleteError) {
      console.error("Error deleting livestock:", deleteError);
      return errorResponse("INTERNAL_SERVER_ERROR", "Failed to remove livestock");
    }

    return successResponse({ deleted: true });
  } catch (error) {
    console.error("Livestock DELETE error:", error);
    return errorResponse("INTERNAL_SERVER_ERROR", "An unexpected error occurred");
  }
}
