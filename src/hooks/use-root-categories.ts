"use client";

import { useQuery } from "@tanstack/react-query";
import { STORE } from "@/constants";
import { getDB } from "@/lib/idb";
import type { Category } from "@/types";

const fetchRootCategories = async (): Promise<Category[]> => {
  const db = await getDB();
  if (!db) return [];

  const allCategories = await db.getAll(STORE.CATEGORIES);

  // Root categories have an empty or null path, or path equal to ""
  const rootCats = allCategories.filter(
    (cat) => !cat.path || cat.path === "" || cat.path === "root",
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
    queryKey: ["root-categories"],
    queryFn: fetchRootCategories,
  });
}
