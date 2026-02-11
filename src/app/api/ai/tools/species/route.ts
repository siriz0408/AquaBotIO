/**
 * AI Species Tools API
 *
 * Provides tool endpoints for AI to search and query the species database.
 * These are called by the AI chat engine when it needs species information.
 *
 * Tools:
 * - search_species: Search by name or characteristics
 * - get_species_details: Get full species profile
 * - check_compatibility: Check species compatibility with user's tank
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface ToolRequest {
  tool: "search_species" | "get_species_details" | "check_compatibility";
  parameters: Record<string, unknown>;
}

interface SearchFilters {
  type?: string;
  care_level?: string;
  temperament?: string;
  max_tank_size?: number;
  diet_type?: string;
  group_behavior?: string;
}

interface ApiResponse<T = unknown> {
  success: boolean;
  data: T | null;
  error: { code: string; message: string } | null;
  meta: { timestamp: string; request_id: string };
}

function response<T>(
  success: boolean,
  data: T | null,
  error: { code: string; message: string } | null,
  status: number
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success,
      data,
      error,
      meta: {
        timestamp: new Date().toISOString(),
        request_id: crypto.randomUUID(),
      },
    },
    { status }
  );
}

/**
 * POST /api/ai/tools/species
 *
 * Execute a species tool call from the AI chat engine.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  // Verify authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return response(false, null, { code: "AUTH_REQUIRED", message: "Authentication required" }, 401);
  }

  try {
    const body = (await request.json()) as ToolRequest;
    const { tool, parameters } = body;

    if (!tool || !parameters) {
      return response(false, null, { code: "INVALID_INPUT", message: "Missing tool or parameters" }, 400);
    }

    switch (tool) {
      case "search_species":
        return await handleSearchSpecies(supabase, parameters);
      case "get_species_details":
        return await handleGetSpeciesDetails(supabase, parameters);
      case "check_compatibility":
        return await handleCheckCompatibility(supabase, parameters, user.id);
      default:
        return response(false, null, { code: "INVALID_INPUT", message: `Unknown tool: ${tool}` }, 400);
    }
  } catch (error) {
    console.error("Species tool error:", error);
    return response(
      false,
      null,
      { code: "INTERNAL_SERVER_ERROR", message: "Failed to execute species tool" },
      500
    );
  }
}

/**
 * Search species by name or characteristics
 */
async function handleSearchSpecies(
  supabase: Awaited<ReturnType<typeof createClient>>,
  params: Record<string, unknown>
) {
  const query = (params.query as string) || "";
  const filters = (params.filters as SearchFilters) || {};
  const limit = Math.min((params.limit as number) || 10, 25);

  let dbQuery = supabase
    .from("species")
    .select(`
      id,
      common_name,
      scientific_name,
      type,
      care_level,
      temperament,
      min_tank_size_gallons,
      max_size_inches,
      temp_min_f,
      temp_max_f,
      ph_min,
      ph_max,
      diet,
      diet_type,
      group_behavior,
      min_school_size,
      lifespan_years,
      origin_region,
      images,
      photo_url
    `)
    .limit(limit);

  // Text search
  if (query) {
    dbQuery = dbQuery.or(
      `common_name.ilike.%${query}%,scientific_name.ilike.%${query}%,aliases.cs.{${query}}`
    );
  }

  // Apply filters
  if (filters.type && filters.type !== "all") {
    dbQuery = dbQuery.eq("type", filters.type);
  }
  if (filters.care_level && filters.care_level !== "all") {
    dbQuery = dbQuery.eq("care_level", filters.care_level);
  }
  if (filters.temperament && filters.temperament !== "all") {
    dbQuery = dbQuery.eq("temperament", filters.temperament);
  }
  if (filters.max_tank_size) {
    dbQuery = dbQuery.lte("min_tank_size_gallons", filters.max_tank_size);
  }
  if (filters.diet_type) {
    dbQuery = dbQuery.eq("diet_type", filters.diet_type);
  }
  if (filters.group_behavior) {
    dbQuery = dbQuery.eq("group_behavior", filters.group_behavior);
  }

  dbQuery = dbQuery.order("common_name");

  const { data: species, error } = await dbQuery;

  if (error) {
    console.error("Species search error:", error);
    return response(false, null, { code: "INTERNAL_SERVER_ERROR", message: "Search failed" }, 500);
  }

  // Format results for AI consumption
  const results = (species || []).map((s) => ({
    id: s.id,
    name: s.common_name,
    scientific_name: s.scientific_name,
    type: s.type,
    care_level: s.care_level,
    temperament: s.temperament,
    min_tank_gallons: s.min_tank_size_gallons,
    max_size_inches: s.max_size_inches,
    temp_range: `${s.temp_min_f}-${s.temp_max_f}°F`,
    ph_range: `${s.ph_min}-${s.ph_max}`,
    diet: s.diet_type || s.diet,
    group_behavior: s.group_behavior,
    school_size: s.min_school_size,
    lifespan_years: s.lifespan_years,
    origin: s.origin_region,
    image_url: (s.images as Array<{ url: string }> | null)?.[0]?.url || s.photo_url,
  }));

  return response(true, { species: results, count: results.length }, null, 200);
}

/**
 * Get full species details by ID
 */
async function handleGetSpeciesDetails(
  supabase: Awaited<ReturnType<typeof createClient>>,
  params: Record<string, unknown>
) {
  const speciesId = params.species_id as string;

  if (!speciesId) {
    return response(false, null, { code: "INVALID_INPUT", message: "species_id required" }, 400);
  }

  const { data: species, error } = await supabase
    .from("species")
    .select("*")
    .eq("id", speciesId)
    .single();

  if (error || !species) {
    return response(false, null, { code: "NOT_FOUND", message: "Species not found" }, 404);
  }

  // Format for AI with all details
  const details = {
    id: species.id,
    name: species.common_name,
    scientific_name: species.scientific_name,
    aliases: species.aliases || [],
    type: species.type,
    care_level: species.care_level,
    temperament: species.temperament,
    parameters: {
      min_tank_gallons: species.min_tank_size_gallons,
      max_size_inches: species.max_size_inches,
      temp_range_f: { min: species.temp_min_f, max: species.temp_max_f },
      ph_range: { min: species.ph_min, max: species.ph_max },
      hardness_dgh: species.hardness_min_dgh
        ? { min: species.hardness_min_dgh, max: species.hardness_max_dgh }
        : null,
      salinity: species.salinity_min
        ? { min: species.salinity_min, max: species.salinity_max }
        : null,
    },
    care: {
      diet: species.diet,
      diet_type: species.diet_type,
      feeding_frequency: species.feeding_frequency,
      lifespan_years: species.lifespan_years,
      group_behavior: species.group_behavior,
      min_school_size: species.min_school_size,
      breeding_difficulty: species.breeding_difficulty,
      common_diseases: species.common_diseases || [],
      care_tips: species.care_tips || [],
    },
    origin: {
      region: species.origin_region,
      habitat: species.habitat,
    },
    description: species.description,
    compatibility_notes: species.compatibility_notes,
    fun_facts: species.fun_facts || [],
    images: species.images || [],
    photo_url: species.photo_url,
  };

  return response(true, { species: details }, null, 200);
}

/**
 * Check species compatibility with user's tank
 */
async function handleCheckCompatibility(
  supabase: Awaited<ReturnType<typeof createClient>>,
  params: Record<string, unknown>,
  userId: string
) {
  const speciesId = params.species_id as string;
  const tankId = params.tank_id as string;

  if (!speciesId || !tankId) {
    return response(
      false,
      null,
      { code: "INVALID_INPUT", message: "species_id and tank_id required" },
      400
    );
  }

  // Fetch species
  const { data: species, error: speciesError } = await supabase
    .from("species")
    .select("*")
    .eq("id", speciesId)
    .single();

  if (speciesError || !species) {
    return response(false, null, { code: "NOT_FOUND", message: "Species not found" }, 404);
  }

  // Fetch tank with current livestock
  const { data: tank, error: tankError } = await supabase
    .from("tanks")
    .select(`
      id,
      name,
      type,
      volume_gallons,
      livestock (
        id,
        quantity,
        species:species_id (
          id,
          common_name,
          temperament,
          type,
          min_tank_size_gallons
        )
      )
    `)
    .eq("id", tankId)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .single();

  if (tankError || !tank) {
    return response(false, null, { code: "NOT_FOUND", message: "Tank not found" }, 404);
  }

  // Fetch latest parameters
  const { data: latestParams } = await supabase
    .from("water_parameters")
    .select("ph, temperature_f, salinity")
    .eq("tank_id", tankId)
    .order("measured_at", { ascending: false })
    .limit(1)
    .single();

  // Perform compatibility checks
  const warnings: Array<{ type: string; message: string; severity: "info" | "warning" | "danger" }> =
    [];

  // 1. Tank type compatibility
  const isCompatibleType = checkTankTypeCompatibility(species.type, tank.type);
  if (!isCompatibleType) {
    warnings.push({
      type: "tank_type",
      message: `${species.common_name} requires a ${species.type} setup, but your tank is ${tank.type}.`,
      severity: "danger",
    });
  }

  // 2. Tank size
  if (tank.volume_gallons < species.min_tank_size_gallons) {
    warnings.push({
      type: "tank_size",
      message: `${species.common_name} requires at least ${species.min_tank_size_gallons} gallons. Your tank is ${tank.volume_gallons} gallons.`,
      severity: "danger",
    });
  }

  // 3. Temperature compatibility with current parameters
  if (latestParams?.temperature_f) {
    if (
      latestParams.temperature_f < species.temp_min_f ||
      latestParams.temperature_f > species.temp_max_f
    ) {
      warnings.push({
        type: "temperature",
        message: `Current temperature (${latestParams.temperature_f}°F) is outside ${species.common_name}'s range (${species.temp_min_f}-${species.temp_max_f}°F).`,
        severity: "warning",
      });
    }
  }

  // 4. pH compatibility
  if (latestParams?.ph) {
    if (latestParams.ph < species.ph_min || latestParams.ph > species.ph_max) {
      warnings.push({
        type: "ph",
        message: `Current pH (${latestParams.ph}) is outside ${species.common_name}'s preferred range (${species.ph_min}-${species.ph_max}).`,
        severity: "warning",
      });
    }
  }

  // 5. Temperament compatibility with existing livestock
  interface LivestockSpecies {
    id: string;
    common_name: string;
    temperament: string;
    type: string;
    min_tank_size_gallons: number;
  }

  const existingLivestock = (tank.livestock || []) as Array<{
    id: string;
    quantity: number;
    species: LivestockSpecies | LivestockSpecies[] | null;
  }>;

  for (const livestock of existingLivestock) {
    // Handle both single object and array (Supabase returns array for joins)
    const speciesData = Array.isArray(livestock.species)
      ? livestock.species[0]
      : livestock.species;
    if (!speciesData) continue;

    // Aggressive species with peaceful tankmates
    if (
      species.temperament === "aggressive" &&
      speciesData.temperament === "peaceful"
    ) {
      warnings.push({
        type: "temperament",
        message: `${species.common_name} (aggressive) may harass your peaceful ${speciesData.common_name}.`,
        severity: "warning",
      });
    }

    // Multiple aggressive species
    if (
      species.temperament === "aggressive" &&
      speciesData.temperament === "aggressive"
    ) {
      warnings.push({
        type: "temperament",
        message: `Adding another aggressive species may cause territorial conflicts with ${speciesData.common_name}.`,
        severity: "warning",
      });
    }
  }

  // 6. Schooling requirements
  if (species.group_behavior === "schooling" && species.min_school_size) {
    warnings.push({
      type: "schooling",
      message: `${species.common_name} is a schooling fish. Consider getting at least ${species.min_school_size} for their wellbeing.`,
      severity: "info",
    });
  }

  // Calculate overall compatibility
  const hasDanger = warnings.some((w) => w.severity === "danger");
  const hasWarning = warnings.some((w) => w.severity === "warning");
  const compatibility = hasDanger ? "alert" : hasWarning ? "warning" : "good";

  const result = {
    species: {
      id: species.id,
      name: species.common_name,
      type: species.type,
      care_level: species.care_level,
    },
    tank: {
      id: tank.id,
      name: tank.name,
      type: tank.type,
      volume_gallons: tank.volume_gallons,
      livestock_count: existingLivestock.reduce((sum, l) => sum + l.quantity, 0),
    },
    compatibility,
    warnings,
    recommendation:
      compatibility === "good"
        ? `${species.common_name} should be compatible with your ${tank.name} setup!`
        : compatibility === "warning"
          ? `${species.common_name} can work in your tank, but review the warnings above.`
          : `${species.common_name} is not recommended for your current setup.`,
  };

  return response(true, result, null, 200);
}

/**
 * Check if species type is compatible with tank type
 */
function checkTankTypeCompatibility(speciesType: string, tankType: string): boolean {
  const compatibilityMap: Record<string, string[]> = {
    freshwater: ["freshwater"],
    saltwater: ["saltwater", "reef"],
    invertebrate: ["freshwater", "saltwater", "reef"],
    plant: ["freshwater"],
    coral: ["reef", "saltwater"],
  };

  return compatibilityMap[speciesType]?.includes(tankType) ?? false;
}
