import fs from "node:fs/promises";
import path from "node:path";
import { unzipSync } from "fflate";
import type { CategoryPageData } from "@/hooks/use-category-page";
import type {
  Category,
  ContentType,
  EnrichedRecording,
  Event,
  Language,
  Material,
  Recording,
  Redirect,
  Speaker,
  Venue,
} from "@/types";
import { generateSyncZip } from "./generate-sync-zip";
import { parseCSVTable } from "./sync-utils";

interface MetadataFileContent {
  data: {
    speakers?: Speaker[];
    venues?: Venue[];
    events?: Event[];
    languages?: Language[];
    content_types?: ContentType[];
    redirects?: Redirect[];
  };
}

// Memory cache
let cachedCategories: Category[] | null = null;
let cachedMetadata: MetadataFileContent | null = null;
let cachedRecordings: Recording[] | null = null;
let cachedMaterials: Material[] | null = null;

async function loadDataIntoMemory(): Promise<void> {
  if (process.env["NEXT_PHASE"] === "phase-production-build") {
    await generateSyncZip();
  }

  if (
    cachedCategories &&
    cachedMetadata &&
    cachedRecordings &&
    cachedMaterials
  ) {
    return;
  }

  const zipPath = path.join(process.cwd(), "public", "sync.zip");
  try {
    const zipBuffer = await fs.readFile(zipPath);
    const unzipped = unzipSync(new Uint8Array(zipBuffer));

    cachedCategories = parseCSVTable<Category>(unzipped, "categories");
    cachedRecordings = parseCSVTable<Recording>(unzipped, "recordings");
    cachedMaterials = parseCSVTable<Material>(unzipped, "materials");

    cachedMetadata = {
      data: {
        speakers: parseCSVTable<Speaker>(unzipped, "speakers"),
        venues: parseCSVTable<Venue>(unzipped, "venues"),
        events: parseCSVTable<Event>(unzipped, "events"),
        languages: parseCSVTable<Language>(unzipped, "languages"),
        content_types: parseCSVTable<ContentType>(unzipped, "content_types"),
        redirects: parseCSVTable<Redirect>(unzipped, "redirects"),
      },
    };
  } catch (e) {
    console.error("Failed to load/parse sync.zip:", e);
    cachedCategories = [];
    cachedRecordings = [];
    cachedMaterials = [];
    cachedMetadata = { data: {} };
  }
}

export async function getLocalCategories(): Promise<Category[]> {
  await loadDataIntoMemory();
  return cachedCategories || [];
}

export async function getLocalCategoryPageData(
  urlPath: string,
): Promise<CategoryPageData | null> {
  await loadDataIntoMemory();

  // 1. Check redirects from cachedMetadata
  const redirects = cachedMetadata?.data.redirects || [];
  const redirectEntry = redirects.find((r) => r.id === urlPath);
  if (redirectEntry) {
    return {
      subcategories: [],
      recordings: [],
      redirectTo: redirectEntry.to_path,
    };
  }

  const categories = cachedCategories || [];
  if (!urlPath) {
    return {
      subcategories: categories.filter((c: Category) => c.path === ""),
      recordings: [],
    };
  }
  const category = categories.find((c) => c.url_path === urlPath);
  if (!category) return null;

  // 2. Subcategories
  const expectedPath = `${category.path}.${category.id}`.replace(/^\./, "");
  const subcategories = categories.filter((c) => c.path === expectedPath);

  // 3. Recordings
  const recordings = (cachedRecordings || []).filter(
    (r) => r.category_id === category.id,
  );

  // Sort recordings by order_ind desc
  recordings.sort((a, b) => (b.order_ind || 0) - (a.order_ind || 0));

  if (recordings.length === 0) {
    return { category, subcategories, recordings: [] };
  }

  // 4. Enrich recordings
  const speakersMap = new Map<number, Speaker>(
    cachedMetadata?.data.speakers?.map((s) => [s.id, s]) || [],
  );
  const venuesMap = new Map<number, Venue>(
    cachedMetadata?.data.venues?.map((v) => [v.id, v]) || [],
  );
  const eventsMap = new Map<number, Event>(
    cachedMetadata?.data.events?.map((e) => [e.id, e]) || [],
  );
  const languagesMap = new Map<number, Language>(
    cachedMetadata?.data.languages?.map((l) => [l.id, l]) || [],
  );
  const contentTypesMap = new Map<number, ContentType>(
    cachedMetadata?.data.content_types?.map((c) => [c.id, c]) || [],
  );

  const materialsByRecId = new Map<number, Material[]>();
  for (const mat of cachedMaterials || []) {
    if (mat.recording_id) {
      if (!materialsByRecId.has(mat.recording_id)) {
        materialsByRecId.set(mat.recording_id, []);
      }
      materialsByRecId.get(mat.recording_id)?.push(mat);
    }
  }

  const enriched: EnrichedRecording[] = recordings.map((rec) => ({
    ...rec,
    speakers: (rec.speaker_ids ?? []).flatMap((id) => {
      const s = speakersMap.get(id);
      return s ? [s] : [];
    }),
    venue:
      rec.venues_id != null ? (venuesMap.get(rec.venues_id) ?? null) : null,
    event: rec.event_id != null ? (eventsMap.get(rec.event_id) ?? null) : null,
    languages: (rec.lang_ids ?? []).flatMap((id) => {
      const l = languagesMap.get(id);
      return l ? [l] : [];
    }),
    content_type:
      rec.type_id != null ? (contentTypesMap.get(rec.type_id) ?? null) : null,
    materials: materialsByRecId.get(rec.id) ?? [],
  }));

  return { category, subcategories, recordings: enriched };
}
