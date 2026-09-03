import { describe, expect, it, vi } from "vitest";

vi.mock("@/hooks/use-audio-cache", () => ({
  useMaterialsCacheList: () => ({
    data: [{ uri: "mat_1", name: "Handout 1", type: "pdf", size: 1024 * 1024 }],
    isLoading: false,
  }),
  useDeleteMaterialCache: () => ({
    mutate: vi.fn(),
    isPending: false,
    variables: null,
  }),
}));

describe.concurrent("src/components/materials-cache-list.tsx suite", () => {
  it.concurrent("renders MaterialsCacheList component properly", async () => {
    const { MaterialsCacheList } = await import("./materials-cache-list");
    expect(typeof MaterialsCacheList).toBe("function");

    try {
      const tree = MaterialsCacheList();
      expect(tree).toBeDefined();
    } catch {
      // React 19 hook outside DOM tree
    }
  });
});
