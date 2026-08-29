import { describe, expect, it, vi } from "vitest";
import { STORE } from "@/constants";

const mockDbData: Record<string, any[]> = {
  [STORE.EVENTS]: [{ id: 1, name: "Janmashtami", short_name: "Jan" }],
  [STORE.SPEAKERS]: [
    { id: 1, name: "HG Radheshyamdas" },
    { id: 2, name: "Ananda Das" },
  ],
  [STORE.LANGUAGES]: [
    { id: 1, name: "English" },
    { id: 2, name: "Hindi" },
  ],
  [STORE.VENUES]: [
    { id: 1, name: "NVCC Pune" },
    { id: 2, name: "Vrindavan" },
  ],
};

vi.mock("@/lib/idb", () => ({
  getDB: () =>
    Promise.resolve({
      getAll: (table: string) => Promise.resolve(mockDbData[table] || []),
    }),
}));

vi.mock("@tanstack/react-query", () => ({
  useQuery: ({ queryFn }: any) => {
    let result: any = [];
    queryFn().then((res: any) => {
      result = res;
    });
    return {
      data: result,
      isPending: false,
      queryFn,
    };
  },
}));

import {
  useEvents,
  useLanguages,
  useMetadata,
  useSpeakers,
  useVenues,
} from "./use-metadata";

describe.concurrent("use-metadata suite", () => {
  it.concurrent("fetches and sorts events, speakers, languages, and venues from IDB", async () => {
    const eventsQ: any = useEvents();
    const events = await eventsQ.queryFn();
    expect(events.length).toBe(1);

    const speakersQ: any = useSpeakers();
    const speakers = await speakersQ.queryFn();
    expect(speakers[0].name).toBe("Ananda Das");

    const languagesQ: any = useLanguages();
    const languages = await languagesQ.queryFn();
    expect(languages[0].name).toBe("English");

    const venuesQ: any = useVenues();
    const venues = await venuesQ.queryFn();
    expect(venues[0].name).toBe("NVCC Pune");

    const meta = useMetadata();
    expect(meta.isPending).toBe(false);
  });
});
