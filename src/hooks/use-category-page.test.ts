import { describe, expect, it, vi } from "vitest";
import { INDEX, STORE } from "@/constants";

vi.mock("@/lib/idb", () => ({
  getDB: () =>
    Promise.resolve({
      getAllFromIndex: (store: string) => {
        if (store === STORE.CATEGORIES) return Promise.resolve([{ id: 2, name: "Ch 1" }]);
        if (store === STORE.RECORDINGS) return Promise.resolve([{ id: 10, name: "Lecture 1", order_index: 1 }]);
        return Promise.resolve([]);
      },
      get: () => Promise.resolve(null),
      getFromIndex: () =>
        Promise.resolve({ id: 1, path: "gita", name: "Bhagavad Gita", url_path: "gita" }),
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
    data: queryFn ? queryFn() : initialData,
  }),
}));

import { useCategoryPage } from "./use-category-page";

describe.concurrent("use-category-page hook suite", () => {
  it.concurrent("useCategoryPage queries category and enriched recording data", async () => {
    const res = useCategoryPage("/gita");
    const data = await res.data;
    expect(data?.category?.name).toBe("Bhagavad Gita");
    expect(data?.recordings[0]?.materials.length).toBe(1);
  });
});


