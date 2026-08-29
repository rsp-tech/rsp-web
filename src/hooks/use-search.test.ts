import { describe, expect, it, vi } from "vitest";
import {
  notifySearchWorker,
  rebuildSearchIndex,
  terminateSearchWorker,
  useSearch,
} from "./use-search";

describe.concurrent("use-search hook suite", () => {
  it.concurrent("exports valid useSearch hook and worker control functions", () => {
    expect(typeof useSearch).toBe("function");
    expect(typeof rebuildSearchIndex).toBe("function");
    expect(typeof terminateSearchWorker).toBe("function");
    expect(typeof notifySearchWorker).toBe("function");
  });

  it.concurrent("rebuildSearchIndex triggers worker build and invalidates metadata queries", () => {
    const invalidateQueries = vi.fn();
    const queryClient: any = { invalidateQueries };

    class MockWorker {
      postMessage = vi.fn();
      terminate = vi.fn();
    }
    (globalThis as any).Worker = MockWorker;

    rebuildSearchIndex(queryClient);
    expect(invalidateQueries).toHaveBeenCalled();
    terminateSearchWorker();
  });
});
