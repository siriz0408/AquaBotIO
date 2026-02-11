/**
 * Fetch remaining species images using scientific names
 */
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

async function fetchGBIFImages(speciesKey: number): Promise<string | null> {
  try {
    const res = await fetch(
      `https://api.gbif.org/v1/occurrence/search?taxonKey=${speciesKey}&mediaType=StillImage&limit=10`
    );
    const data = await res.json();
    if (data.results) {
      for (const result of data.results) {
        if (result.media) {
          const img = result.media.find(
            (m: { type: string; identifier: string }) =>
              m.type === "StillImage" && m.identifier
          );
          if (img) return img.identifier;
        }
      }
    }
    return null;
  } catch {
    return null;
  }
}

async function main() {
  const { data: species } = await supabase
    .from("species")
    .select("id, common_name, scientific_name")
    .is("photo_url", null);

  console.log(
    `\nUpdating ${species?.length} remaining species by scientific name...\n`
  );

  let updated = 0;
  for (const s of species || []) {
    process.stdout.write(`${s.common_name} (${s.scientific_name})... `);

    const key = await searchGBIF(s.scientific_name);
    if (!key) {
      console.log("❌ not found");
      continue;
    }

    const url = await fetchGBIFImages(key);
    if (!url) {
      console.log("❌ no img");
      continue;
    }

    await supabase
      .from("species")
      .update({ photo_url: url, gbif_key: key })
      .eq("id", s.id);
    console.log("✅");
    updated++;
    await new Promise((r) => setTimeout(r, 100));
  }

  console.log(`\nUpdated: ${updated}/${species?.length}\n`);
}

main();
