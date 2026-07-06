"use client";

import { useQuery } from "@tanstack/react-query";
import type { IDBPDatabase } from "idb";
import { INDEX, QUERY_KEY, STORE } from "@/constants";
import { getDB, type RSP_IDB } from "@/lib/idb";
import { getSupabaseClient } from "@/lib/supabase-browser";
import { sortByOrderInd } from "@/lib/utils";
import type { Category, EnrichedRecording, Material, Recording } from "@/types";

export interface CategoryPageData {
  category?: Category;
  subcategories: Category[];
  recordings: EnrichedRecording[];
  redirectTo?: string;
}

const fetchTargetedMaterials = async (
  db: IDBPDatabase<RSP_IDB>,
  recordingIds: number[],
): Promise<Map<number, Material[]>> => {
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

const loadCategoryPage = async (
  urlPath: string,
  initialData?: CategoryPageData | null,
): Promise<CategoryPageData | null> => {
  const db = await getDB();
  if (!db) return initialData || null;

  // If sync hasn't completed, fallback to RPC
  const supabase = getSupabaseClient();

  if (!urlPath) {
    let subcategories = await db.getAllFromIndex(
      STORE.CATEGORIES,
      INDEX.BY_PATH,
      "",
    );
    if (!subcategories.length) {
      if (initialData?.subcategories.length) {
        return initialData;
      }
      subcategories =
        ((await supabase.from("categories").select("*").eq("path", ""))
          .data as Category[]) ?? [];
    }
    return {
      subcategories,
      recordings: [],
    };
  }

  const redirectTo = await db.get(STORE.REDIRECTS, urlPath);
  if (redirectTo) {
    return {
      subcategories: [],
      recordings: [],
      redirectTo: redirectTo.to_path,
    };
  }

  const category = await db.getFromIndex(
    STORE.CATEGORIES,
    INDEX.BY_URL,
    urlPath,
  );

  if (!category) {
    if (initialData?.category) {
      return initialData;
    }

    const { data, error } = await supabase.rpc("get_category_page_data", {
      p_url_path: urlPath,
    });

    if (error || !data) {
      return null;
    }

    // Postgres native jsonb aggregation maps perfectly to your interface
    return data as unknown as CategoryPageData;
  }

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

  recordings.sort(sortByOrderInd(-1));

  if (recordings.length === 0) {
    return { category, subcategories, recordings: [] };
  }

  const recordingIds = recordings.map((r) => r.id);

  const materialsMap = await fetchTargetedMaterials(db, recordingIds);

  const enriched: EnrichedRecording[] = recordings.map((rec) => ({
    ...rec,
    materials: materialsMap.get(rec.id) ?? [],
  }));

  return { category, subcategories, recordings: enriched };
};

export const useCategoryPage = (
  slug: string[],
  initialData?: CategoryPageData,
) => {
  const urlPath = slug.join(".").replace(/-/g, "_");

  // Verify that the initial data matches the current URL route.
  // If the service worker falls back to "/" shell when offline, the initial data of "/" (root categories)
  // is passed down, which does not match the active dynamic route path.
  const isValidInitialData = urlPath
    ? initialData?.category?.url_path === urlPath
    : !initialData?.category;

  const queryInitialData = isValidInitialData ? initialData : undefined;

  return useQuery({
    queryKey: [QUERY_KEY.CATEGORY_PAGE, urlPath || "~"],
    queryFn: () => loadCategoryPage(urlPath, queryInitialData),
    initialData: queryInitialData,
  });
};
