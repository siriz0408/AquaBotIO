import { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { getUserPreferencesForAI, type UserContextForAI } from "./user-context";

/**
 * Tank context builder for AI system prompt
 *
 * Fetches and formats all relevant tank data for the AI to provide
 * personalized, context-aware responses.
 */

export interface TankContext {
  tank: {
    id: string;
    name: string;
    type: string;
    volume_gallons: number;
    dimensions?: string;
    substrate?: string;
    setup_date?: string;
    notes?: string;
  };
  parameters: Array<{
    date: string;
    ph?: number;
    ammonia?: number;
    nitrite?: number;
    nitrate?: number;
    temperature?: number;
    salinity?: number;
  }>;
  livestock: Array<{
    name: string;
    species?: string;
    quantity: number;
    date_added: string;
  }>;
  maintenance: Array<{
    type: string;
    title: string;
    next_due?: string;
    last_completed?: string;
  }>;
  user: {
    skill_level: string;
    unit_preference_volume: string;
    unit_preference_temp: string;
  };
  userPreferences: UserContextForAI | null;
}

/**
 * Fetch full tank context for AI system prompt
 *
 * PERFORMANCE: All queries run in parallel using Promise.all to reduce latency.
 * Only specific columns are selected to minimize data transfer.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
export async function buildTankContext(
  supabase: SupabaseClient<Database>,
  tankId: string,
  userId: string
): Promise<TankContext | null> {
  // Run all queries in parallel for better performance
  const [tankResult, userResult, parametersResult, livestockResult, maintenanceResult, userPreferences] = await Promise.all([
    // Fetch tank details - only needed columns
    supabase
      .from("tanks")
      .select("id, name, type, volume_gallons, length_inches, width_inches, height_inches, substrate, setup_date, notes")
      .eq("id", tankId)
      .eq("user_id", userId)
      .is("deleted_at", null)
      .single() as unknown as Promise<{ data: any; error: any }>,

    // Fetch user profile for skill level and preferences
    supabase
      .from("users")
      .select("skill_level, unit_preference_volume, unit_preference_temp")
      .eq("id", userId)
      .single() as unknown as Promise<{ data: any; error: any }>,

    // Fetch last 5 water parameter readings - only needed columns
    supabase
      .from("water_parameters")
      .select("measured_at, ph, ammonia_ppm, nitrite_ppm, nitrate_ppm, temperature_f, salinity")
      .eq("tank_id", tankId)
      .order("measured_at", { ascending: false })
      .limit(5) as unknown as Promise<{ data: any[]; error: any }>,

    // Fetch active livestock with species info
    supabase
      .from("livestock")
      .select(`
        id,
        custom_name,
        nickname,
        quantity,
        date_added,
        species:species_id (
          common_name,
          scientific_name
        )
      `)
      .eq("tank_id", tankId)
      .eq("is_active", true)
      .is("deleted_at", null) as unknown as Promise<{ data: any[]; error: any }>,

    // Fetch active maintenance tasks with last completion
    supabase
      .from("maintenance_tasks")
      .select(`
        id,
        type,
        title,
        next_due_date,
        maintenance_logs (
          completed_at
        )
      `)
      .eq("tank_id", tankId)
      .eq("is_active", true)
      .is("deleted_at", null)
      .order("next_due_date", { ascending: true })
      .limit(10) as unknown as Promise<{ data: any[]; error: any }>,

    // Fetch user preferences for personalized AI context
    getUserPreferencesForAI(supabase, userId)
  ]);

  const { data: tank, error: tankError } = tankResult;
  const { data: user } = userResult;
  const { data: parameters } = parametersResult;
  const { data: livestock } = livestockResult;
  const { data: maintenanceTasks } = maintenanceResult;

  if (tankError || !tank) {
    console.error("Error fetching tank:", tankError);
    return null;
  }

  // Format dimensions if available
  const dimensions =
    tank.length_inches && tank.width_inches && tank.height_inches
      ? `${tank.length_inches}" x ${tank.width_inches}" x ${tank.height_inches}"`
      : undefined;

  return {
    tank: {
      id: tank.id,
      name: tank.name,
      type: tank.type,
      volume_gallons: tank.volume_gallons,
      dimensions,
      substrate: tank.substrate || undefined,
      setup_date: tank.setup_date || undefined,
      notes: tank.notes || undefined,
    },
    parameters: (parameters || []).map((p) => ({
      date: p.measured_at,
      ph: p.ph || undefined,
      ammonia: p.ammonia_ppm || undefined,
      nitrite: p.nitrite_ppm || undefined,
      nitrate: p.nitrate_ppm || undefined,
      temperature: p.temperature_f || undefined,
      salinity: p.salinity || undefined,
    })),
    livestock: (livestock || []).map((l) => ({
      name: l.custom_name || l.nickname || "Unknown",
      species: (l.species as { common_name: string } | null)?.common_name,
      quantity: l.quantity,
      date_added: l.date_added,
    })),
    maintenance: (maintenanceTasks || []).map((t) => ({
      type: t.type,
      title: t.title,
      next_due: t.next_due_date,
      last_completed:
        (t.maintenance_logs as Array<{ completed_at: string }> | null)?.[0]
          ?.completed_at || undefined,
    })),
    user: {
      skill_level: user?.skill_level || "beginner",
      unit_preference_volume: user?.unit_preference_volume || "gallons",
      unit_preference_temp: user?.unit_preference_temp || "fahrenheit",
    },
    userPreferences,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/**
 * Format tank context as a concise string for system prompt
 */
export function formatContextForPrompt(context: TankContext): string {
  const lines: string[] = [];

  // Tank info
  lines.push(`## Tank: ${context.tank.name}`);
  lines.push(`- Type: ${context.tank.type}`);
  lines.push(`- Volume: ${context.tank.volume_gallons} gallons`);
  if (context.tank.dimensions) {
    lines.push(`- Dimensions: ${context.tank.dimensions}`);
  }
  if (context.tank.substrate) {
    lines.push(`- Substrate: ${context.tank.substrate}`);
  }
  if (context.tank.setup_date) {
    lines.push(`- Setup Date: ${context.tank.setup_date}`);
  }

  // Latest parameters
  if (context.parameters.length > 0) {
    lines.push("\n## Latest Water Parameters");
    const latest = context.parameters[0];
    const params: string[] = [];
    if (latest.ph !== undefined) params.push(`pH: ${latest.ph}`);
    if (latest.ammonia !== undefined) params.push(`Ammonia: ${latest.ammonia} ppm`);
    if (latest.nitrite !== undefined) params.push(`Nitrite: ${latest.nitrite} ppm`);
    if (latest.nitrate !== undefined) params.push(`Nitrate: ${latest.nitrate} ppm`);
    if (latest.temperature !== undefined) params.push(`Temp: ${latest.temperature}°F`);
    if (latest.salinity !== undefined) params.push(`Salinity: ${latest.salinity}`);
    if (params.length > 0) {
      lines.push(`As of ${latest.date}: ${params.join(", ")}`);
    }
  }

  // Livestock
  if (context.livestock.length > 0) {
    lines.push("\n## Livestock");
    for (const animal of context.livestock) {
      const speciesInfo = animal.species ? ` (${animal.species})` : "";
      lines.push(`- ${animal.quantity}x ${animal.name}${speciesInfo}`);
    }
  }

  // Upcoming maintenance
  const upcomingTasks = context.maintenance.filter((t) => t.next_due);
  if (upcomingTasks.length > 0) {
    lines.push("\n## Upcoming Maintenance");
    for (const task of upcomingTasks.slice(0, 5)) {
      lines.push(`- ${task.title}: due ${task.next_due}`);
    }
  }

  // User preferences
  lines.push(`\n## User Profile`);
  lines.push(`- Skill Level: ${context.user.skill_level}`);
  lines.push(`- Units: ${context.user.unit_preference_volume}, ${context.user.unit_preference_temp}`);

  return lines.join("\n");
}
