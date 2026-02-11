/**
 * Shared types for species seeding scripts
 */

export interface SpeciesSeed {
  common_name: string;
  scientific_name: string;
  type: "freshwater" | "saltwater" | "invertebrate" | "plant" | "coral";
  care_level: "beginner" | "intermediate" | "expert";
  temperament: "peaceful" | "semi_aggressive" | "aggressive";
  min_tank_size_gallons: number;
  max_size_inches: number;
  temp_min_f: number;
  temp_max_f: number;
  ph_min: number;
  ph_max: number;
  diet: string;
  compatibility_notes: string;
  description: string;
  lifespan_years?: number;
  origin_region?: string;
  habitat?: string;
  group_behavior?: "solitary" | "pair" | "small_group" | "schooling" | "colony";
  min_school_size?: number;
  breeding_difficulty?: "easy" | "moderate" | "difficult" | "very_difficult" | "impossible_in_captivity";
  diet_type?: "carnivore" | "herbivore" | "omnivore" | "planktivore" | "filter_feeder" | "detritivore" | "photosynthetic";
  feeding_frequency?: string;
  common_diseases?: string[];
  hardness_min_dgh?: number;
  hardness_max_dgh?: number;
  salinity_min?: number;
  salinity_max?: number;
  care_tips?: string[];
  fun_facts?: string[];
  aliases?: string[];
}
