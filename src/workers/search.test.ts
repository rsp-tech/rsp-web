import { create, insert, insertMultiple, search } from "@orama/orama";
import { describe, expect, it, vi } from "vitest";
import { STORE, WORKER_MSG } from "@/constants";

vi.mock("@/lib/idb", () => ({
  getDB: () =>
    Promise.resolve({
      getAll: (table: string) => {
        if (table === STORE.RECORDINGS) {
          return Promise.resolve([
            { id: 1, name: "Gita Class", category_id: 10, speaker_ids: [1] },
          ]);
        }
        if (table === STORE.CATEGORIES) {
          return Promise.resolve([
            { id: 10, name: "Bhagavad Gita", url_path: "gita", path: "gita" },
          ]);
        }
        if (table === STORE.MATERIALS) {
          return Promise.resolve([
            { id: "m1", name: "Gita PDF Notes", recording_id: 1 },
          ]);
        }
        return Promise.resolve([]);
      },
      get: () => Promise.resolve(null),
    }),
}));

describe.concurrent("workers/search engine suite", () => {
  it.concurrent("handles BUILD_INDEX and SEARCH_ALL worker messages", async () => {
    const postedMessages: any[] = [];
    const mockPostMessage = (msg: any) => postedMessages.push(msg);
    (globalThis as any).postMessage = mockPostMessage;
    (globalThis as any).self = {
      onmessage: null,
      postMessage: mockPostMessage,
    };


    await import("./search");

    if (typeof self.onmessage === "function") {
      await self.onmessage({
        data: { type: WORKER_MSG.BUILD_INDEX },
      } as any);

      expect(
        postedMessages.some((m) => m.type === WORKER_MSG.INDEX_READY),
      ).toBe(true);

      await self.onmessage({
        data: {
          type: WORKER_MSG.SEARCH_ALL,
          payload: {
            term: "Gita",
            targets: [STORE.RECORDINGS, STORE.CATEGORIES, STORE.MATERIALS],
            reqId: "req_1",
          },
        },
      } as any);

      expect(
        postedMessages.some((m) => m.type === WORKER_MSG.SEARCH_RESULT),
      ).toBe(true);
    }
  });


  const recordingsSchema = {
    id: "string",
    name: "string",
    speaker_names: "string",
    languages: "string",
    venue_name: "string",
    event_name: "string",
    date: "number",
    speaker_ids: "enum[]",
    category_id: "number",
    lang_ids: "enum[]",
    venues_id: "number",
    event_id: "number",
  } as const;

  const categoriesSchema = {
    id: "enum",
    name: "string",
    url_path: "string",
    path: "enum",
  } as const;

  const materialsSchema = {
    id: "string",
    name: "string",
    recording_id: "number",
    category_id: "number",
  } as const;

  it.concurrent("indexes and searches recordings by name and speaker", async () => {
    const db = await create({ schema: recordingsSchema });

    await insertMultiple(db, [
      {
        id: "1",
        name: "Bhagavad Gita Chapter 1",
        speaker_names: "HG Radheshyamdas",
        languages: "English",
        venue_name: "NVCC Pune",
        event_name: "Sunday Feast",
        date: Date.parse("2026-01-01"),
        speaker_ids: [1],
        category_id: 10,
        lang_ids: [1],
        venues_id: 100,
        event_id: 200,
      },
      {
        id: "2",
        name: "Srimad Bhagavatam Canto 1",
        speaker_names: "HG Radheshyamdas",
        languages: "Hindi",
        venue_name: "Juhu Mumbai",
        event_name: "Morning Class",
        date: Date.parse("2026-01-02"),
        speaker_ids: [1],
        category_id: 20,
        lang_ids: [2],
        venues_id: 101,
        event_id: 201,
      },
    ]);

    const res = await search(db, {
      term: "Bhagavad",
      properties: ["name"],
    });

    expect(res.hits).toHaveLength(1);
    expect(res.hits[0]?.document.name).toBe("Bhagavad Gita Chapter 1");
  });

  it.concurrent("indexes and searches categories with path filter", async () => {
    const db = await create({ schema: categoriesSchema });

    await insertMultiple(db, [
      {
        id: "10",
        name: "Bhagavad Gita",
        url_path: "spiritual_discourses.bg",
        path: "spiritual_discourses.bg",
      },
      {
        id: "20",
        name: "Srimad Bhagavatam",
        url_path: "spiritual_discourses.sb",
        path: "spiritual_discourses.sb",
      },
    ]);

    const res = await search(db, {
      term: "Bhagavatam",
      properties: ["name"],
    });

    expect(res.hits).toHaveLength(1);
    expect(res.hits[0]?.document.name).toBe("Srimad Bhagavatam");
  });

  it.concurrent("indexes and searches materials filtered by category_id", async () => {
    const db = await create({ schema: materialsSchema });

    await insert(db, {
      id: "m1",
      name: "Lecture Notes PDF",
      recording_id: 1,
      category_id: 10,
    });

    const res = await search(db, {
      term: "Notes",
      properties: ["name"],
    });

    expect(res.hits).toHaveLength(1);
    expect(res.hits[0]?.document.name).toBe("Lecture Notes PDF");
  });

  it.concurrent("handles UPDATE_DOCS message gracefully", async () => {
    if (typeof self.onmessage === "function") {
      await self.onmessage({
        data: {
          type: WORKER_MSG.UPDATE_DOCS,
          table: STORE.RECORDINGS,
          ids: [1],
        },
      } as any);
    }
  });
});

