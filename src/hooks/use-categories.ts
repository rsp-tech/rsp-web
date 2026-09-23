import { useQuery } from "@tanstack/react-query";
import { QUERY_KEY, STORE, SYNC_INTERVAL } from "@/constants";
import { getDB } from "@/lib/idb";
import type { Category } from "@/types";

export const useCategories = () =>
  useQuery({
    queryKey: [QUERY_KEY.ALL_CATEGORIES],
    queryFn: async () =>
      (await getDB())?.getAll(STORE.CATEGORIES) as Category[] | undefined,
    staleTime: SYNC_INTERVAL,
  });
