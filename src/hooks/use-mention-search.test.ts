import { describe, expect, it, vi } from "vitest";
import { useMentionSearch } from "./use-mention-search";

vi.mock("@/hooks/use-search", () => ({
  useSearch: () => ({
    searchAll: vi.fn().mockResolvedValue([]),
  }),
}));

vi.mock("@/lib/idb", () => ({
  getDB: vi.fn().mockResolvedValue(null),
}));

describe("useMentionSearch suite", () => {
  it("exports useMentionSearch hook as function", () => {
    expect(typeof useMentionSearch).toBe("function");
  });
});
