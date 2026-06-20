import { useCallback } from "react";
import { STORE, WORKER_MSG } from "@/constants";
import type {
  RecordingSearchFilters,
  SearchableTable,
  SearchResult,
} from "@/types";

type PendingRequest = {
  resolve: (results: SearchResult[]) => void;
  reject: (err: Error) => void;
};

type ReadyWaiter = {
  resolve: () => void;
  reject: (err: Error) => void;
};

// Module-level singletons outlive unmounts
let workerInstance: Worker | null = null;
let workerReady = false;
const pendingRequests = new Map<string, PendingRequest>();
const readyWaiters: ReadyWaiter[] = [];

const rejectPendingWork = (error: Error) => {
  for (const pending of pendingRequests.values()) pending.reject(error);
  pendingRequests.clear();
  while (readyWaiters.length > 0) readyWaiters.shift()?.reject(error);
};

const resolveReadyWaiters = () => {
  while (readyWaiters.length > 0) readyWaiters.shift()?.resolve();
};

export const getWorker = (): Worker => {
  if (workerInstance) return workerInstance;

  workerInstance = new Worker(new URL("@/workers/search.ts", import.meta.url), {
    type: "module",
  });

  workerInstance.onmessage = (e: MessageEvent) => {
    const { type } = e.data;

    if (type === WORKER_MSG.INDEX_READY) {
      workerReady = true;
      resolveReadyWaiters();
      return;
    }

    if (type === WORKER_MSG.INDEX_ERROR || type === WORKER_MSG.ERROR) {
      workerReady = false;
      rejectPendingWork(new Error(e.data.message ?? "Search worker failed"));
      return;
    }

    if (type === WORKER_MSG.SEARCH_RESULT) {
      const { reqId, results, error } = e.data;
      const pending = pendingRequests.get(reqId);
      if (!pending) return;

      pendingRequests.delete(reqId);
      if (error) pending.reject(new Error(error));
      else pending.resolve(results);
    }
  };

  workerInstance.postMessage({ type: WORKER_MSG.BUILD_INDEX });
  return workerInstance;
};

export const terminateSearchWorker = () => {
  if (workerInstance) {
    workerInstance.terminate();
    workerInstance = null;
  }
  workerReady = false;
  rejectPendingWork(
    new Error("Search worker terminated explicitly (e.g., Auth Change)"),
  );
};

export const notifySearchWorker = (table: SearchableTable, ids: number[]) => {
  if (!workerInstance) return;
  workerInstance.postMessage({ type: WORKER_MSG.UPDATE_DOCS, table, ids });
};

export const useSearch = () => {
  const searchAll = useCallback(
    async (
      term: string,
      filters?: RecordingSearchFilters,
    ): Promise<SearchResult[]> => {
      const trimmedTerm = term.trim();
      if (!trimmedTerm) return [];

      const worker = getWorker();

      const waitForReady = (): Promise<void> =>
        workerReady
          ? Promise.resolve()
          : new Promise<void>((resolve, reject) =>
              readyWaiters.push({ resolve, reject }),
            );

      await waitForReady();

      const hasActiveFilters =
        filters &&
        ((filters.speaker_ids && filters.speaker_ids.length > 0) ||
          (filters.lang_ids && filters.lang_ids.length > 0) ||
          filters.venues_id !== undefined ||
          filters.date_start !== "" ||
          filters.date_end !== "");

      const targets = hasActiveFilters
        ? [STORE.RECORDINGS]
        : [STORE.RECORDINGS, STORE.CATEGORIES, STORE.MATERIALS];

      return new Promise<SearchResult[]>((resolve, reject) => {
        const reqId = `${crypto.randomUUID()}-${Date.now()}`;
        pendingRequests.set(reqId, { resolve, reject });

        worker.postMessage({
          type: WORKER_MSG.SEARCH_ALL,
          payload: {
            term: trimmedTerm,
            targets,
            reqId,
            filters,
          },
        });
      });
    },
    [],
  );

  return { searchAll };
};
