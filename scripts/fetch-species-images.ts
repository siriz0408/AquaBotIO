/**
 * Fetch species images from GBIF and update the database
 * Run: npx tsx scripts/fetch-species-images.ts
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// GBIF API functions
async function searchGBIF(scientificName: string): Promise<number | null> {
  try {
    const res = await fetch(
      `https://api.gbif.org/v1/species/match?name=${encodeURIComponent(scientificName)}`
    );
    const data = await res.json();
    return data.usageKey || null;
  } catch {
    return null;
  }
}

async function fetchGBIFImages(
  speciesKey: number,
  limit = 1
): Promise<string | null> {
  try {
    const res = await fetch(
      `https://api.gbif.org/v1/occurrence/search?taxonKey=${speciesKey}&mediaType=StillImage&limit=${limit}`
    );
    const data = await res.json();

    if (data.results && data.results.length > 0) {
      for (const result of data.results) {
        if (result.media && result.media.length > 0) {
          const image = result.media.find(
            (m: { type: string; identifier: string }) =>
              m.type === "StillImage" && m.identifier
          );
          if (image) {
            return image.identifier;
          }
        }
      }
    }
    return null;
  } catch {
    return null;
  }
}

async function main() {
  console.log("\n=== Fetching Species Images from GBIF ===\n");

  // Get all species without photos
  const { data: species, error } = await supabase
    .from("species")
    .select("id, common_name, scientific_name, photo_url")
    .is("photo_url", null)
    .limit(100);

  if (error) {
    console.error("Error fetching species:", error);
    return;
  }

  console.log(`Found ${species?.length || 0} species without images\n`);

  let updated = 0;
  let failed = 0;

  for (const s of species || []) {
    process.stdout.write(`${s.common_name}... `);

    // Search GBIF for species
    const gbifKey = await searchGBIF(s.scientific_name);
    if (!gbifKey) {
      console.log("❌ Not found in GBIF");
      failed++;
      continue;
    }

    // Fetch image
    const imageUrl = await fetchGBIFImages(gbifKey);
    if (!imageUrl) {
      console.log("❌ No images");
      failed++;
      continue;
    }

    // Update database
    const { error: updateError } = await supabase
      .from("species")
      .update({
        photo_url: imageUrl,
        gbif_key: gbifKey,
      })
      .eq("id", s.id);

    if (updateError) {
      console.log(`❌ Update failed: ${updateError.message}`);
      failed++;
    } else {
      console.log("✅");
      updated++;
    }

    // Rate limit: 100ms between requests
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  console.log(`\n=== Results ===`);
  console.log(`Updated: ${updated}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total: ${species?.length || 0}\n`);
}

main();
