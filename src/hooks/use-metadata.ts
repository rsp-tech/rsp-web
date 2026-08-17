import { useQuery } from "@tanstack/react-query";
import { QUERY_KEY, STORE } from "@/constants";
import { getDB } from "@/lib/idb";
import type { Event, Language, Speaker, Venue } from "@/types";

export const useEvents = () =>
  useQuery({
    queryKey: [QUERY_KEY.EVENTS],
    queryFn: async (): Promise<Event[]> => {
      const db = await getDB();
      if (!db) return [];
      const data = (await db.getAll(STORE.EVENTS)) as Event[];
      return data.sort((a, b) =>
        (a.short_name || a.name).localeCompare(b.short_name || b.name),
      );
    },
  });

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
  const eventsQuery = useEvents();

  return {
    speakers: speakersQuery.data ?? [],
    languages: languagesQuery.data ?? [],
    venues: venuesQuery.data ?? [],
    events: eventsQuery.data ?? [],
    isPending:
      speakersQuery.isPending ||
      languagesQuery.isPending ||
      venuesQuery.isPending ||
      eventsQuery.isPending,
  };
};
