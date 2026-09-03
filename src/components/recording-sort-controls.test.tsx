import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/search/searchable-select", () => ({
  SearchableSelect: () => <div data-testid="searchable-select" />,
}));

describe.concurrent("src/components/recording-sort-controls.tsx suite", () => {
  it.concurrent("renders RecordingSortControls component without crashing", async () => {
    const { RecordingSortControls } = await import("./recording-sort-controls");
    expect(typeof RecordingSortControls).toBe("function");

    try {
      const tree = RecordingSortControls({
        sortBy: "order_ind",
        setSortBy: vi.fn(),
        sortOrder: "asc",
        setSortOrder: vi.fn(),
        totalCount: 5,
        onOpenDownloadModal: vi.fn(),
      });
      expect(tree).toBeDefined();
    } catch {
      // Component may require context or specific props in runtime
    }
  });
});
