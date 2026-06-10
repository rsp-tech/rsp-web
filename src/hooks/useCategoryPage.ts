"use client";

import { useQuery } from "@tanstack/react-query";
import { INDEX, QUERY_KEY, STORE } from "@/constants";
import { getDB, type RSPDatabase } from "@/lib/idb";
import type { Category, EnrichedRecording, Material, Recording } from "@/types";

export interface CategoryPageData {
  category: Category;
  subcategories: Category[];
  recordings: EnrichedRecording[];
}

type NumberKeyStore = {
  [StoreName in keyof RSPDatabase]: RSPDatabase[StoreName]["key"] extends number
    ? StoreName
    : never;
}[keyof RSPDatabase];

const loadCategoryPage = async (
  slug: string[],
): Promise<CategoryPageData | null> => {
  const db = await getDB();
  if (!db) return null;

  const urlPath = slug.join(".");
  const category = await db.getFromIndex(
    STORE.CATEGORIES,
    INDEX.BY_URL,
    urlPath,
  );

  if (!category) return null;

  const expectedPath = `${category.path}.${category.id}`.replace(/^\./, "");

  const subcategories = await db.getAllFromIndex(
    STORE.CATEGORIES,
    INDEX.BY_PATH,
    expectedPath,
  );

  const recordings: Recording[] = await db.getAllFromIndex(
    STORE.RECORDINGS,
    INDEX.BY_CATEGORY_ID,
    category.id,
  );

  if (recordings.length === 0) {
    return { category, subcategories, recordings: [] };
  }

  const speakerIds = new Set<number>();
  const venueIds = new Set<number>();
  const eventIds = new Set<number>();
  const langIds = new Set<number>();
  const typeIds = new Set<number>();
  const recordingIds = recordings.map((r) => r.id);

  recordings.forEach((rec) => {
    rec.speaker_ids?.forEach((id: number) => {
      speakerIds.add(id);
    });
    rec.lang_ids?.forEach((id: number) => {
      langIds.add(id);
    });
    if (rec.venues_id) venueIds.add(rec.venues_id);
    if (rec.event_id) eventIds.add(rec.event_id);
    if (rec.type_id) typeIds.add(rec.type_id);
  });

  const fetchSelected = async <StoreName extends NumberKeyStore>(
    storeName: StoreName,
    ids: Set<number>,
  ): Promise<Map<number, RSPDatabase[StoreName]["value"]>> => {
    const tx = db.transaction(storeName, "readonly");
    const store = tx.store;
    const resultMap = new Map<number, RSPDatabase[StoreName]["value"]>();

    const promises = Array.from(ids).map((id) =>
      store.get(id).then((val) => {
        if (val) resultMap.set(id, val);
      }),
    );

    await Promise.all([...promises, tx.done]);

    return resultMap;
  };

  const fetchTargetedMaterials = async (): Promise<Map<number, Material[]>> => {
    const tx = db.transaction(STORE.MATERIALS, "readonly");
    const index = tx.store.index(INDEX.BY_RECORDING_ID);
    const materialsMap = new Map<number, Material[]>();

    await Promise.all(
      recordingIds.map(async (rId) => {
        const mats = await index.getAll(rId);
        if (mats.length > 0) materialsMap.set(rId, mats);
      }),
    );
    await tx.done;

    return materialsMap;
  };

  const [speakerMap, venueMap, eventMap, langMap, ctMap, materialsMap] =
    await Promise.all([
      fetchSelected(STORE.SPEAKERS, speakerIds),
      fetchSelected(STORE.VENUES, venueIds),
      fetchSelected(STORE.EVENTS, eventIds),
      fetchSelected(STORE.LANGUAGES, langIds),
      fetchSelected(STORE.CONTENT_TYPES, typeIds),
      fetchTargetedMaterials(),
    ]);

  const enriched: EnrichedRecording[] = recordings.map((rec) => ({
    ...rec,
    speakers: (rec.speaker_ids ?? []).flatMap(
      (id: number) => speakerMap.get(id) ?? [],
    ),
    venue: rec.venues_id != null ? (venueMap.get(rec.venues_id) ?? null) : null,
    event: rec.event_id != null ? (eventMap.get(rec.event_id) ?? null) : null,
    languages: (rec.lang_ids ?? []).flatMap(
      (id: number) => langMap.get(id) ?? [],
    ),
    content_type: rec.type_id != null ? (ctMap.get(rec.type_id) ?? null) : null,
    materials: materialsMap.get(rec.id) ?? [],
  }));

  return { category, subcategories, recordings: enriched };
};

export const useCategoryPage = (slug: string[]) => {
  return useQuery({
    queryKey: [QUERY_KEY.CATEGORY_PAGE, slug.join(".")],
    queryFn: () => loadCategoryPage(slug),
    enabled: slug.length > 0,
  });
};
