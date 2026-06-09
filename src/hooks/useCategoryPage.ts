"use client";

import { useQuery } from "@tanstack/react-query";
import { getDB } from "@/lib/idb";
import type {
  Category,
  ContentType,
  Event,
  Language,
  Material,
  Recording,
  Speaker,
  Venue,
} from "@/types";

export interface EnrichedRecording extends Recording {
  speakers: Speaker[];
  venue: Venue | null;
  event: Event | null;
  languages: Language[];
  content_type: ContentType | null;
  materials: Material[];
}

export interface CategoryPageData {
  category: Category;
  subcategories: Category[];
  recordings: EnrichedRecording[];
}

const loadCategoryPage = async (
  slug: string[],
): Promise<CategoryPageData | null> => {
  const db = await getDB();
  if (!db) return null;

  const urlPath = slug.join(".");
  const category = await db.getFromIndex("categories", "by-url", urlPath);
  if (!category) return null;

  const expectedPrefix = `${category.path}.${category.id}`;
  const subcategories = await db.getAllFromIndex(
    "categories",
    "by-path",
    expectedPrefix,
  );

  const recordings = (await db.getAllFromIndex(
    "recordings",
    "by-category_id",
    category.id,
  )) as Recording[];

  if (recordings.length === 0) {
    return { category, subcategories, recordings: [] };
  }

  // Extract Unique IDs needed for lookups
  const speakerIds = new Set<number>();
  const venueIds = new Set<number>();
  const eventIds = new Set<number>();
  const langIds = new Set<number>();
  const typeIds = new Set<number>();
  const recordingIds = recordings.map((r) => r.id);

  recordings.forEach((rec) => {
    rec.speaker_ids?.forEach((id) => {
      speakerIds.add(id);
    });
    rec.lang_ids?.forEach((id) => {
      langIds.add(id);
    });
    if (rec.venues_id) venueIds.add(rec.venues_id);
    if (rec.event_id) eventIds.add(rec.event_id);
    if (rec.type_id) typeIds.add(rec.type_id);
  });

  // Helper to fetch only explicit records by their IDs in a single transaction
  const fetchSelected = async <T>(
    storeName: string,
    ids: Set<number>,
  ): Promise<Map<number, T>> => {
    const tx = db.transaction(storeName, "readonly");
    const store = tx.store;
    const resultMap = new Map<number, T>();

    const promises = Array.from(ids).map((id) =>
      store.get(id).then((val) => {
        if (val) resultMap.set(id, val as T);
      }),
    );

    await Promise.all([...promises, tx.done]);

    return resultMap;
  };

  // 4. Fetch materials bound ONLY to these specific recording IDs
  const fetchTargetedMaterials = async (): Promise<Map<number, Material[]>> => {
    const tx = db.transaction("materials", "readonly");
    const index = tx.store.index("by-recording_id");
    const materialsMap = new Map<number, Material[]>();

    await Promise.all(
      recordingIds.map(async (rId) => {
        const mats = await index.getAll(rId);
        if (mats.length > 0) materialsMap.set(rId, mats);
      }),
    );
    return materialsMap;
  };

  // 5. Execute all targeted reads concurrently
  const [speakerMap, venueMap, eventMap, langMap, ctMap, materialsMap] =
    await Promise.all([
      fetchSelected<Speaker>("speakers", speakerIds),
      fetchSelected<Venue>("venues", venueIds),
      fetchSelected<Event>("events", eventIds),
      fetchSelected<Language>("languages", langIds),
      fetchSelected<ContentType>("content_types", typeIds),
      fetchTargetedMaterials(),
    ]);

  // 6. Assemble payload
  const enriched: EnrichedRecording[] = recordings.map((rec) => ({
    ...rec,
    speakers: (rec.speaker_ids ?? []).flatMap((id) => speakerMap.get(id) ?? []),
    venue: rec.venues_id != null ? (venueMap.get(rec.venues_id) ?? null) : null,
    event: rec.event_id != null ? (eventMap.get(rec.event_id) ?? null) : null,
    languages: (rec.lang_ids ?? []).flatMap((id) => langMap.get(id) ?? []),
    content_type: rec.type_id != null ? (ctMap.get(rec.type_id) ?? null) : null,
    materials: materialsMap.get(rec.id) ?? [],
  }));

  return { category, subcategories, recordings: enriched };
};

export const useCategoryPage = (slug: string[]) => {
  return useQuery({
    queryKey: ["category-page", slug.join(".")],
    queryFn: () => loadCategoryPage(slug),
    enabled: slug.length > 0,
  });
};
