import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/idb", () => ({
  getDB: () =>
    Promise.resolve({
      getAll: () => Promise.resolve([{ id: 1, name: "Gita" }]),
    }),
}));

vi.mock("@tanstack/react-query", () => ({
  useQuery: ({ queryFn }: any) => ({
    data: queryFn ? queryFn() : undefined,
  }),
}));

import { useCategories } from "./use-categories";

describe.concurrent("use-categories suite", () => {
  it.concurrent("useCategories fetches all categories", async () => {
    const res = useCategories();
    const data = await res.data;
    expect(data?.length).toBe(1);
    expect(data?.[0]?.name).toBe("Gita");
  });
});

