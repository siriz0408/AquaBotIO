/**
 * FishBase API Client
 *
 * Fetches species data from FishBase (fishbase.org) for enriching our species database.
 * Uses the rfishbase API endpoints: https://fishbase.ropensci.org/
 *
 * Rate limits: Be respectful - max 1 request per second
 */

const FISHBASE_API_URL = "https://fishbase.ropensci.org";

export interface FishBaseSpecies {
  SpecCode: number;
  Genus: string;
  Species: string;
  SpeciesRefNo: number | null;
  Author: string | null;
  FBname: string | null; // Common name from FishBase
  PicPreferredName: string | null;
  FamCode: number | null;
  Subfamily: string | null;
  GenCode: number | null;
  SubGenCode: number | null;
  BodyShapeI: string | null;
  Source: string | null;
  Remark: string | null;
  TaxIssue: number | null;
  Fresh: number | null; // -1 = freshwater
  Brack: number | null; // -1 = brackish
  Saltwater: number | null; // -1 = marine
  DemersPelag: string | null;
  AnaCat: string | null;
  MigratRef: number | null;
  DepthRangeShallow: number | null;
  DepthRangeDeep: number | null;
  DepthRangeRef: number | null;
  DepthRangeComShallow: number | null;
  DepthRangeComDeep: number | null;
  DepthComRef: number | null;
  LongevityWild: number | null; // Lifespan in wild (years)
  LongevityWildRef: number | null;
  LongevityCaptive: number | null; // Lifespan in captivity (years)
  Length: number | null; // Maximum length (cm)
  LTypeMaxM: string | null; // Length type (TL, SL, etc.)
  LengthFemale: number | null;
  LTypeMaxF: string | null;
  CommonLength: number | null;
  LTypeComM: string | null;
  CommonLengthF: number | null;
  LTypeComF: string | null;
  Weight: number | null; // Max weight (g)
  WeightFemale: number | null;
  MaxLengthRef: number | null;
  CommonLengthRef: number | null;
  Importance: string | null;
  PriceCateg: string | null;
  PriceReliability: string | null;
  Remarks7: string | null;
  LandingStatistics: string | null;
  Landings: string | null;
  MainCatchingMethod: string | null;
  II: string | null;
  MSeines: number | null;
  MGillnets: number | null;
  MCastnets: number | null;
  MTraps: number | null;
  MSpears: number | null;
  MTrawls: number | null;
  MDredges: number | null;
  MLiftnets: number | null;
  MHooksLines: number | null;
  MOther: number | null;
  UsedforAquaculture: string | null;
  LifeCycle: string | null;
  AquariumFishII: string | null;
  AquariumRef: number | null;
  GameFish: number | null;
  GameRef: number | null;
  Aquarium: string | null; // "never/rarely/commercial" - aquarium suitability
  Protection: string | null;
  ProtectionRef: number | null;
  Dangerous: string | null;
  DangerousRef: number | null;
  Electrogenic: string | null;
  ElectroRef: number | null;
  Complete: string | null;
  GoogleImage: number | null;
  Comments: string | null;
  Entered: number | null;
  DateEntered: string | null;
  Modified: number | null;
  DateModified: string | null;
  Expert: number | null;
  DateChecked: string | null;
  TS: string | null;
}

export interface FishBaseEcology {
  SpecCode: number;
  Herbivory2: string | null; // Diet category
  FoodTroph: number | null; // Trophic level
  DietTroph: number | null;
  FoodRefs: string | null;
  AddRems: string | null;
  AssocRef: number | null;
  Schooling: number | null; // -1 = schooling behavior
  SchoolingRef: number | null;
}

export interface FishBaseSearchResult {
  data: FishBaseSpecies[];
  count: number;
}

/**
 * Search FishBase by scientific name
 */
export async function searchFishBase(
  scientificName: string
): Promise<FishBaseSpecies | null> {
  const [genus, species] = scientificName.split(" ");
  if (!genus || !species) {
    console.warn(`Invalid scientific name format: ${scientificName}`);
    return null;
  }

  try {
    const url = new URL(`${FISHBASE_API_URL}/species`);
    url.searchParams.set("Genus", genus);
    url.searchParams.set("Species", species);
    url.searchParams.set("limit", "1");

    const response = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      console.error(`FishBase API error: ${response.status}`);
      return null;
    }

    const data = (await response.json()) as { data: FishBaseSpecies[] };
    return data.data?.[0] ?? null;
  } catch (error) {
    console.error("FishBase search error:", error);
    return null;
  }
}

/**
 * Get species by FishBase SpecCode
 */
export async function getSpeciesByCode(
  specCode: number
): Promise<FishBaseSpecies | null> {
  try {
    const response = await fetch(
      `${FISHBASE_API_URL}/species?SpecCode=${specCode}&limit=1`,
      {
        headers: {
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as { data: FishBaseSpecies[] };
    return data.data?.[0] ?? null;
  } catch (error) {
    console.error("FishBase getSpeciesByCode error:", error);
    return null;
  }
}

/**
 * Get ecology data for a species
 */
export async function getEcology(
  specCode: number
): Promise<FishBaseEcology | null> {
  try {
    const response = await fetch(
      `${FISHBASE_API_URL}/ecology?SpecCode=${specCode}&limit=1`,
      {
        headers: {
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as { data: FishBaseEcology[] };
    return data.data?.[0] ?? null;
  } catch (error) {
    console.error("FishBase getEcology error:", error);
    return null;
  }
}

/**
 * Search for aquarium-suitable species
 */
export async function searchAquariumSpecies(
  limit: number = 100,
  offset: number = 0
): Promise<FishBaseSpecies[]> {
  try {
    const url = new URL(`${FISHBASE_API_URL}/species`);
    url.searchParams.set("Aquarium", "commercial");
    url.searchParams.set("limit", limit.toString());
    url.searchParams.set("offset", offset.toString());

    const response = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      return [];
    }

    const data = (await response.json()) as { data: FishBaseSpecies[] };
    return data.data ?? [];
  } catch (error) {
    console.error("FishBase searchAquariumSpecies error:", error);
    return [];
  }
}

/**
 * Convert FishBase data to our Species format (partial)
 */
export function mapFishBaseToSpecies(fb: FishBaseSpecies, ecology?: FishBaseEcology | null) {
  // Determine water type
  let type: "freshwater" | "saltwater" | "invertebrate" = "freshwater";
  if (fb.Saltwater === -1 && fb.Fresh !== -1) {
    type = "saltwater";
  } else if (fb.Fresh === -1) {
    type = "freshwater";
  }

  // Map diet from ecology
  let dietType: string | null = null;
  if (ecology?.Herbivory2) {
    const herb = ecology.Herbivory2.toLowerCase();
    if (herb.includes("herbivor")) dietType = "herbivore";
    else if (herb.includes("carnivor") || herb.includes("piscivor")) dietType = "carnivore";
    else if (herb.includes("omnivor")) dietType = "omnivore";
    else if (herb.includes("planktivor")) dietType = "planktivore";
    else if (herb.includes("detritivor")) dietType = "detritivore";
  }

  // Determine group behavior
  let groupBehavior: string | null = null;
  if (ecology?.Schooling === -1) {
    groupBehavior = "schooling";
  }

  return {
    fishbase_id: fb.SpecCode,
    scientific_name: `${fb.Genus} ${fb.Species}`,
    common_name: fb.FBname || `${fb.Genus} ${fb.Species}`,
    type,
    max_size_inches: fb.Length ? fb.Length / 2.54 : null, // cm to inches
    lifespan_years: fb.LongevityCaptive || fb.LongevityWild || null,
    diet_type: dietType,
    group_behavior: groupBehavior,
    data_source: "fishbase" as const,
  };
}

/**
 * Rate-limited fetch helper
 */
export async function rateLimitedFetch<T>(
  fetcher: () => Promise<T>,
  delayMs: number = 1000
): Promise<T> {
  await new Promise((resolve) => setTimeout(resolve, delayMs));
  return fetcher();
}
