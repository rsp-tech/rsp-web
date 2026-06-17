import { QUERY_KEY, STORE } from "@/constants";
import { getDB } from "@/lib/idb";
import { useQuery } from "@tanstack/react-query";

export const useCategories = () =>
  useQuery({
    queryKey: [QUERY_KEY.ALL_CATEGORIES],
    queryFn: async () => (await getDB())?.getAll(STORE.CATEGORIES),
  });
