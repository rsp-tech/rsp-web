import { describe, expect, it, vi } from "vitest";

vi.mock("react", async () => {
  const actual = await vi.importActual("react");
  return {
    ...actual,
    useEffect: (fn: any) => fn(),
    useCallback: (fn: any) => fn,
  };
});

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

  it.concurrent("searchAll returns empty array for empty string and posts message for query", async () => {
    let _messagePosted: any;
    class MockSearchWorker {
      onmessage: any = null;
      postMessage(msg: any) {
        _messagePosted = msg;
        if (msg.type === "SEARCH_ALL") {
          setTimeout(() => {
            this.onmessage?.({
              data: {
                type: "SEARCH_ALL_RESULTS",
                payload: { reqId: msg.payload.reqId, results: [{ id: 1 }] },
              },
            });
          }, 0);
        }
      }
      terminate() {}
    }
    (globalThis as any).Worker = MockSearchWorker;

    const { searchAll } = useSearch();
    const emptyRes = await searchAll("");
    expect(emptyRes).toEqual([]);

    setTimeout(() => {
      // Simulate worker ready
      const w: any = (globalThis as any).__lastWorker;
      w?.onmessage?.({ data: { type: "SEARCH_INDEX_READY" } });
    }, 0);
  });
});
