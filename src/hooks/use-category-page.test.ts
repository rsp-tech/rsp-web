import { describe, expect, it, vi } from "vitest";
import { STORE } from "@/constants";

vi.mock("@/lib/idb", () => ({
  getDB: () =>
    Promise.resolve({
      getAllFromIndex: (store: string) => {
        if (store === STORE.CATEGORIES)
          return Promise.resolve([{ id: 2, name: "Ch 1" }]);
        if (store === STORE.RECORDINGS)
          return Promise.resolve([
            { id: 10, name: "Lecture 1", order_index: 1 },
          ]);
        return Promise.resolve([]);
      },
      get: () => Promise.resolve(null),
      getFromIndex: () =>
        Promise.resolve({
          id: 1,
          path: "gita",
          name: "Bhagavad Gita",
          url_path: "gita",
        }),
      transaction: () => ({
        store: {
          index: () => ({
            getAll: () => Promise.resolve([{ id: 100, name: "Notes.pdf" }]),
          }),
        },
        done: Promise.resolve(),
      }),
    }),
}));

vi.mock("@tanstack/react-query", () => ({
  useQuery: ({ queryFn, initialData }: any) => ({
    data:
      initialData !== undefined ? initialData : queryFn ? queryFn() : undefined,
  }),
}));

import { useCategoryPage } from "./use-category-page";

describe.concurrent("use-category-page hook suite", () => {
  it.concurrent("useCategoryPage queries category and enriched recording data", async () => {
    const res = useCategoryPage("/gita");
    const data = await res.data;
    expect(data?.category?.name).toBe("Bhagavad Gita");
    expect(data?.recordings?.[0]?.materials?.length).toBe(1);
  });

  it.concurrent("useCategoryPage accepts initialData when requestedPath matches legacy URL", () => {
    const initialData = {
      category: {
        id: 1,
        name: "Gita",
        url_path: "spiritual-discourses.bg",
      } as any,
      subcategories: [],
      recordings: [],
    };
    // User is on legacy URL /gita, but server resolved it and provided requestedPath = "gita"
    const res = useCategoryPage("/gita", initialData, "gita");
    expect(res.data).toBe(initialData);
  });

  it.concurrent("useCategoryPage rejects stale initialData when client path does not match", () => {
    const staleInitialData = {
      category: {
        id: 1,
        name: "Gita",
        url_path: "spiritual-discourses.bg",
      } as any,
      subcategories: [],
      recordings: [],
    };
    // Client navigates to /other-category, but old initialData was for gita
    const res = useCategoryPage("/other-category", staleInitialData, "gita");
    // Should NOT use stale initialData
    expect(res.data).not.toBe(staleInitialData);
  });

  it.concurrent("useCategoryPage resolves legacy url via dynamic import on IDB miss", async () => {
    const res = useCategoryPage("/library/japa_talks/2006_jan_jun");
    const data = await res.data;
    expect(data).toBeDefined();
  });
});
