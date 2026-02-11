/**
 * Species Database Seeding Script
 *
 * Generates SQL migration file with 100+ curated species.
 * Run: npx ts-node scripts/seed-species.ts
 *
 * Output: supabase/migrations/YYYYMMDD_seed_species_enhanced.sql
 */

import * as fs from "fs";
import * as path from "path";
import type { SpeciesSeed } from "./seed-species-types";

// Import expanded species data from organized data files
import { freshwaterFishExpanded as freshwaterSpecies } from "./species-data/freshwater-expanded";
import { saltwaterFishExpanded as saltwaterSpecies } from "./species-data/saltwater-expanded";
import { invertebratesExpanded as invertebrateSpecies } from "./species-data/invertebrates-expanded";
import { plantsExpanded as plantSpecies } from "./species-data/plants-expanded";
import { coralsExpanded as coralSpecies } from "./species-data/corals-expanded";

// ============================================================================
// SQL GENERATION HELPERS
// ============================================================================

function escapeSQL(str: string | undefined | null): string {
  if (!str) return "NULL";
  return `'${str.replace(/'/g, "''")}'`;
}

function arrayToSQL(arr: string[] | undefined): string {
  if (!arr || arr.length === 0) return "'{}'";
  // PostgreSQL array format: '{"value1","value2"}' - double-quote each element, comma separate
  const escaped = arr
    .map((s) => `"${s.replace(/"/g, '\\"').replace(/'/g, "''")}"`)
    .join(",");
  return `'{${escaped}}'`;
}

function generateInsertSQL(species: SpeciesSeed): string {
  return `INSERT INTO public.species (
  common_name, scientific_name, type, care_level, temperament,
  min_tank_size_gallons, max_size_inches, temp_min_f, temp_max_f,
  ph_min, ph_max, diet, compatibility_notes, description,
  lifespan_years, origin_region, habitat, group_behavior, min_school_size,
  breeding_difficulty, diet_type, feeding_frequency, common_diseases,
  hardness_min_dgh, hardness_max_dgh, salinity_min, salinity_max,
  care_tips, fun_facts, aliases, data_source
) VALUES (
  ${escapeSQL(species.common_name)}, ${escapeSQL(species.scientific_name)},
  ${escapeSQL(species.type)}, ${escapeSQL(species.care_level)}, ${escapeSQL(species.temperament)},
  ${species.min_tank_size_gallons}, ${species.max_size_inches},
  ${species.temp_min_f}, ${species.temp_max_f},
  ${species.ph_min}, ${species.ph_max},
  ${escapeSQL(species.diet)}, ${escapeSQL(species.compatibility_notes)}, ${escapeSQL(species.description)},
  ${species.lifespan_years ?? "NULL"}, ${escapeSQL(species.origin_region)},
  ${escapeSQL(species.habitat)}, ${escapeSQL(species.group_behavior)},
  ${species.min_school_size ?? "NULL"}, ${escapeSQL(species.breeding_difficulty)},
  ${escapeSQL(species.diet_type)}, ${escapeSQL(species.feeding_frequency)},
  ${arrayToSQL(species.common_diseases)},
  ${species.hardness_min_dgh ?? "NULL"}, ${species.hardness_max_dgh ?? "NULL"},
  ${species.salinity_min ?? "NULL"}, ${species.salinity_max ?? "NULL"},
  ${arrayToSQL(species.care_tips)}, ${arrayToSQL(species.fun_facts)}, ${arrayToSQL(species.aliases)},
  'manual'
) ON CONFLICT (scientific_name) DO UPDATE SET
  common_name = EXCLUDED.common_name,
  type = EXCLUDED.type,
  care_level = EXCLUDED.care_level,
  temperament = EXCLUDED.temperament,
  min_tank_size_gallons = EXCLUDED.min_tank_size_gallons,
  max_size_inches = EXCLUDED.max_size_inches,
  temp_min_f = EXCLUDED.temp_min_f,
  temp_max_f = EXCLUDED.temp_max_f,
  ph_min = EXCLUDED.ph_min,
  ph_max = EXCLUDED.ph_max,
  diet = EXCLUDED.diet,
  compatibility_notes = EXCLUDED.compatibility_notes,
  description = EXCLUDED.description,
  lifespan_years = EXCLUDED.lifespan_years,
  origin_region = EXCLUDED.origin_region,
  habitat = EXCLUDED.habitat,
  group_behavior = EXCLUDED.group_behavior,
  min_school_size = EXCLUDED.min_school_size,
  breeding_difficulty = EXCLUDED.breeding_difficulty,
  diet_type = EXCLUDED.diet_type,
  feeding_frequency = EXCLUDED.feeding_frequency,
  common_diseases = EXCLUDED.common_diseases,
  hardness_min_dgh = EXCLUDED.hardness_min_dgh,
  hardness_max_dgh = EXCLUDED.hardness_max_dgh,
  salinity_min = EXCLUDED.salinity_min,
  salinity_max = EXCLUDED.salinity_max,
  care_tips = EXCLUDED.care_tips,
  fun_facts = EXCLUDED.fun_facts,
  aliases = EXCLUDED.aliases,
  updated_at = NOW();`;
}

// ============================================================================
// MAIN SCRIPT
// ============================================================================

function main() {
  // Combine all species from expanded data files
  const allSpecies: SpeciesSeed[] = [
    ...freshwaterSpecies,
    ...saltwaterSpecies,
    ...invertebrateSpecies,
    ...plantSpecies,
    ...coralSpecies,
  ];

  // Log counts by category
  console.log("\n=== Species Database Seed Script ===\n");
  console.log(`Freshwater:    ${freshwaterSpecies.length} species`);
  console.log(`Saltwater:     ${saltwaterSpecies.length} species`);
  console.log(`Invertebrates: ${invertebrateSpecies.length} species`);
  console.log(`Plants:        ${plantSpecies.length} species`);
  console.log(`Corals:        ${coralSpecies.length} species`);
  console.log(`${"─".repeat(30)}`);
  console.log(`TOTAL:         ${allSpecies.length} species\n`);

  // Generate timestamp for migration filename
  const timestamp = new Date()
    .toISOString()
    .replace(/[-:T.]/g, "")
    .slice(0, 14);
  const filename = `supabase/migrations/${timestamp}_seed_species_enhanced.sql`;

  // Generate SQL
  let sql = `-- Species Database Seeding - Enhanced Data
-- Generated: ${new Date().toISOString()}
-- Total Species: ${allSpecies.length}
--
-- Breakdown:
-- - Freshwater:    ${freshwaterSpecies.length}
-- - Saltwater:     ${saltwaterSpecies.length}
-- - Invertebrates: ${invertebrateSpecies.length}
-- - Plants:        ${plantSpecies.length}
-- - Corals:        ${coralSpecies.length}
--
-- This migration adds/updates species with enriched data from Sprint 28

-- Ensure unique constraint on scientific_name exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'species_scientific_name_key'
  ) THEN
    ALTER TABLE public.species ADD CONSTRAINT species_scientific_name_key UNIQUE (scientific_name);
  END IF;
END $$;

-- ============================================================================
-- FRESHWATER SPECIES (${freshwaterSpecies.length})
-- ============================================================================
`;

  // Add freshwater species
  for (const species of freshwaterSpecies) {
    sql += `\n${generateInsertSQL(species)}\n`;
  }

  sql += `
-- ============================================================================
-- SALTWATER SPECIES (${saltwaterSpecies.length})
-- ============================================================================
`;

  // Add saltwater species
  for (const species of saltwaterSpecies) {
    sql += `\n${generateInsertSQL(species)}\n`;
  }

  sql += `
-- ============================================================================
-- INVERTEBRATES (${invertebrateSpecies.length})
-- ============================================================================
`;

  // Add invertebrates
  for (const species of invertebrateSpecies) {
    sql += `\n${generateInsertSQL(species)}\n`;
  }

  sql += `
-- ============================================================================
-- PLANTS (${plantSpecies.length})
-- ============================================================================
`;

  // Add plants
  for (const species of plantSpecies) {
    sql += `\n${generateInsertSQL(species)}\n`;
  }

  sql += `
-- ============================================================================
-- CORALS (${coralSpecies.length})
-- ============================================================================
`;

  // Add corals
  for (const species of coralSpecies) {
    sql += `\n${generateInsertSQL(species)}\n`;
  }

  sql += `
-- ============================================================================
-- UPDATE FULL-TEXT SEARCH VECTORS
-- ============================================================================

-- Update search vectors for all species (if search_vector column exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'species' AND column_name = 'search_vector'
  ) THEN
    UPDATE public.species SET search_vector =
      setweight(to_tsvector('english', coalesce(common_name, '')), 'A') ||
      setweight(to_tsvector('english', coalesce(scientific_name, '')), 'A') ||
      setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
      setweight(to_tsvector('english', coalesce(array_to_string(aliases, ' '), '')), 'B');
  END IF;
END $$;

-- End of species seeding
-- Total: ${allSpecies.length} species
`;

  // Write to file
  const outputPath = path.join(process.cwd(), filename);
  fs.writeFileSync(outputPath, sql);

  console.log(`Generated: ${outputPath}`);
  console.log(`File size: ${(sql.length / 1024).toFixed(1)} KB\n`);
}

main();
