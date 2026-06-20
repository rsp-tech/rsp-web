import { useQuery } from "@tanstack/react-query";
import { QUERY_KEY, STORE } from "@/constants";
import { getDB } from "@/lib/idb";
import type { Language, Speaker, Venue } from "@/types";

export const useSpeakers = () =>
  useQuery({
    queryKey: [QUERY_KEY.SPEAKERS],
    queryFn: async () => {
      const db = await getDB();
      if (!db) return [];
      const data = (await db.getAll(STORE.SPEAKERS)) as Speaker[];
      return data.sort((a, b) => a.name.localeCompare(b.name));
    },
  });

export const useLanguages = () =>
  useQuery({
    queryKey: [QUERY_KEY.LANGUAGES],
    queryFn: async () => {
      const db = await getDB();
      if (!db) return [];
      const data = (await db.getAll(STORE.LANGUAGES)) as Language[];
      return data.sort((a, b) => a.name.localeCompare(b.name));
    },
  });

export const useVenues = () =>
  useQuery({
    queryKey: [QUERY_KEY.VENUES],
    queryFn: async () => {
      const db = await getDB();
      if (!db) return [];
      const data = (await db.getAll(STORE.VENUES)) as Venue[];
      return data.sort((a, b) => a.name.localeCompare(b.name));
    },
  });

export const useMetadata = () => {
  const speakersQuery = useSpeakers();
  const languagesQuery = useLanguages();
  const venuesQuery = useVenues();

  return {
    speakers: speakersQuery.data ?? [],
    languages: languagesQuery.data ?? [],
    venues: venuesQuery.data ?? [],
    isPending:
      speakersQuery.isPending ||
      languagesQuery.isPending ||
      venuesQuery.isPending,
  };
};
