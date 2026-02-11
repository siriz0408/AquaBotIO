/**
 * GBIF API Client (Global Biodiversity Information Facility)
 *
 * Fetches species images and occurrence data from GBIF (gbif.org).
 * GBIF provides CC0/CC-BY licensed images from various sources.
 *
 * API Docs: https://www.gbif.org/developer/summary
 *
 * Rate limits: Recommended max 3 requests per second
 */

const GBIF_API_URL = "https://api.gbif.org/v1";

export interface GBIFSpeciesMatch {
  usageKey: number;
  scientificName: string;
  canonicalName: string;
  rank: string;
  status: string;
  confidence: number;
  matchType: string;
  kingdom: string;
  phylum: string;
  class: string;
  order: string;
  family: string;
  genus: string;
  species: string;
  kingdomKey: number;
  phylumKey: number;
  classKey: number;
  orderKey: number;
  familyKey: number;
  genusKey: number;
  speciesKey: number;
  synonym: boolean;
  note?: string;
}

export interface GBIFOccurrence {
  key: number;
  datasetKey: string;
  publishingOrgKey: string;
  basisOfRecord: string;
  scientificName: string;
  kingdom: string;
  phylum: string;
  class: string;
  order: string;
  family: string;
  genus: string;
  species: string;
  genericName: string;
  specificEpithet: string;
  taxonRank: string;
  taxonKey: number;
  speciesKey: number;
  decimalLatitude?: number;
  decimalLongitude?: number;
  year?: number;
  month?: number;
  day?: number;
  eventDate?: string;
  mediaType?: string[];
  media?: GBIFMedia[];
}

export interface GBIFMedia {
  type: string; // "StillImage"
  format?: string; // MIME type
  identifier: string; // URL
  references?: string;
  title?: string;
  description?: string;
  created?: string;
  creator?: string;
  contributor?: string;
  publisher?: string;
  audience?: string;
  source?: string;
  license?: string;
  rightsHolder?: string;
}

export interface GBIFImage {
  url: string;
  thumbnail: string;
  attribution: string;
  license: string;
  source: "gbif";
}

export interface GBIFSearchResponse<T> {
  offset: number;
  limit: number;
  endOfRecords: boolean;
  count: number;
  results: T[];
}

/**
 * Match a scientific name to GBIF taxonomy
 */
export async function matchSpecies(
  scientificName: string
): Promise<GBIFSpeciesMatch | null> {
  try {
    const url = new URL(`${GBIF_API_URL}/species/match`);
    url.searchParams.set("name", scientificName);
    url.searchParams.set("strict", "true");
    url.searchParams.set("kingdom", "Animalia");

    const response = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      console.error(`GBIF match API error: ${response.status}`);
      return null;
    }

    const data = (await response.json()) as GBIFSpeciesMatch;

    // Only return high-confidence matches
    if (data.matchType === "NONE" || data.confidence < 90) {
      return null;
    }

    return data;
  } catch (error) {
    console.error("GBIF matchSpecies error:", error);
    return null;
  }
}

/**
 * Fetch images for a species from GBIF occurrences
 *
 * We look for occurrences that have media attached (photos).
 * GBIF images are typically CC0 or CC-BY licensed.
 */
export async function fetchImages(
  scientificName: string,
  limit: number = 5
): Promise<GBIFImage[]> {
  try {
    // First, match the species to get the species key
    const match = await matchSpecies(scientificName);
    if (!match?.speciesKey) {
      console.warn(`No GBIF match for: ${scientificName}`);
      return [];
    }

    // Search for occurrences with images
    const url = new URL(`${GBIF_API_URL}/occurrence/search`);
    url.searchParams.set("speciesKey", match.speciesKey.toString());
    url.searchParams.set("mediaType", "StillImage");
    url.searchParams.set("limit", (limit * 3).toString()); // Get more to filter
    url.searchParams.set("basisOfRecord", "HUMAN_OBSERVATION");

    const response = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      console.error(`GBIF occurrence API error: ${response.status}`);
      return [];
    }

    const data = (await response.json()) as GBIFSearchResponse<GBIFOccurrence>;

    // Extract unique images
    const images: GBIFImage[] = [];
    const seenUrls = new Set<string>();

    for (const occurrence of data.results) {
      if (!occurrence.media) continue;

      for (const media of occurrence.media) {
        if (
          media.type !== "StillImage" ||
          !media.identifier ||
          seenUrls.has(media.identifier)
        ) {
          continue;
        }

        // Skip if URL looks invalid
        if (!media.identifier.startsWith("http")) {
          continue;
        }

        seenUrls.add(media.identifier);

        // Build attribution string
        const attributionParts: string[] = [];
        if (media.creator) attributionParts.push(media.creator);
        if (media.rightsHolder && media.rightsHolder !== media.creator) {
          attributionParts.push(`(c) ${media.rightsHolder}`);
        }
        if (media.publisher) attributionParts.push(`via ${media.publisher}`);

        images.push({
          url: media.identifier,
          thumbnail: generateThumbnailUrl(media.identifier),
          attribution:
            attributionParts.join(", ") || "GBIF Community",
          license: media.license || "CC BY 4.0",
          source: "gbif",
        });

        if (images.length >= limit) break;
      }
      if (images.length >= limit) break;
    }

    return images;
  } catch (error) {
    console.error("GBIF fetchImages error:", error);
    return [];
  }
}

/**
 * Generate a thumbnail URL from a GBIF image URL
 *
 * For iNaturalist images (common in GBIF), we can use their thumb API.
 * For others, we'll use the original URL (can be resized client-side).
 */
function generateThumbnailUrl(originalUrl: string): string {
  // iNaturalist: convert /photos/12345/original.jpg to /photos/12345/small.jpg
  if (originalUrl.includes("inaturalist.org") || originalUrl.includes("inat")) {
    return originalUrl
      .replace("/original.", "/small.")
      .replace("/large.", "/small.")
      .replace("/medium.", "/small.");
  }

  // Wikimedia Commons: use thumb service
  if (originalUrl.includes("wikimedia.org") || originalUrl.includes("wikipedia.org")) {
    // Wikimedia URLs can be converted to thumbnails
    // Example: https://upload.wikimedia.org/wikipedia/commons/a/ab/Example.jpg
    // Thumb: https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Example.jpg/300px-Example.jpg
    const match = originalUrl.match(
      /upload\.wikimedia\.org\/wikipedia\/commons\/([a-f0-9])\/([a-f0-9]{2})\/([^/]+)$/
    );
    if (match) {
      const [, a, ab, filename] = match;
      return `https://upload.wikimedia.org/wikipedia/commons/thumb/${a}/${ab}/${filename}/300px-${filename}`;
    }
  }

  // Default: return original (client will need to resize)
  return originalUrl;
}

/**
 * Get species information from GBIF
 */
export async function getSpeciesInfo(
  speciesKey: number
): Promise<GBIFSpeciesMatch | null> {
  try {
    const response = await fetch(`${GBIF_API_URL}/species/${speciesKey}`, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as GBIFSpeciesMatch;
  } catch (error) {
    console.error("GBIF getSpeciesInfo error:", error);
    return null;
  }
}

/**
 * Search for species by common name
 */
export async function searchByCommonName(
  commonName: string,
  limit: number = 10
): Promise<GBIFSpeciesMatch[]> {
  try {
    const url = new URL(`${GBIF_API_URL}/species/search`);
    url.searchParams.set("q", commonName);
    url.searchParams.set("rank", "SPECIES");
    url.searchParams.set("limit", limit.toString());

    const response = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      return [];
    }

    const data = (await response.json()) as GBIFSearchResponse<GBIFSpeciesMatch>;
    return data.results;
  } catch (error) {
    console.error("GBIF searchByCommonName error:", error);
    return [];
  }
}

/**
 * Rate-limited batch image fetcher
 */
export async function batchFetchImages(
  scientificNames: string[],
  imagesPerSpecies: number = 3,
  delayMs: number = 500
): Promise<Map<string, GBIFImage[]>> {
  const results = new Map<string, GBIFImage[]>();

  for (const name of scientificNames) {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    const images = await fetchImages(name, imagesPerSpecies);
    results.set(name, images);
  }

  return results;
}
