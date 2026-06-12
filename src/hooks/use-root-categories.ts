"use client";

import { useQuery } from "@tanstack/react-query";
import { INDEX, QUERY_KEY, STORE } from "@/constants";
import { getDB } from "@/lib/idb";
import type { Category } from "@/types";

const fetchRootCategories = async (): Promise<Category[]> => {
  const db = await getDB();
  if (!db) return [];

  const rootCats = await db.getAllFromIndex(
    STORE.CATEGORIES,
    INDEX.BY_PATH,
    "",
  );

  // Sort by order index if available, otherwise by name
  return rootCats.sort((a, b) => {
    if (a.order_ind !== null && b.order_ind !== null) {
      return a.order_ind - b.order_ind;
    }
    return a.name.localeCompare(b.name);
  });
};

export function useRootCategories() {
  return useQuery({
    queryKey: [QUERY_KEY.ROOT_CATEGORIES],
    queryFn: fetchRootCategories,
  });
}
