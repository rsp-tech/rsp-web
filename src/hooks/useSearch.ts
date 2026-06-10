"use client";

import { useCallback, useEffect, useRef } from "react";
import { STORE, WORKER_MSG } from "@/constants";
import type { SearchableTable, SearchResult } from "@/types";

type PendingRequest = {
  resolve: (results: SearchResult[]) => void;
  reject: (err: Error) => void;
};

type ReadyWaiter = {
  resolve: () => void;
  reject: (err: Error) => void;
};

// Singleton storage to outlive React component lifecycles
let workerInstance: Worker | null = null;
let workerReady = false;
const pendingRequests = new Map<string, PendingRequest>();
const readyWaiters: ReadyWaiter[] = [];

const rejectPendingWork = (error: Error) => {
  for (const pending of pendingRequests.values()) {
    pending.reject(error);
  }
  pendingRequests.clear();

  while (readyWaiters.length > 0) {
    readyWaiters.shift()?.reject(error);
  }
};

const resolveReadyWaiters = () => {
  while (readyWaiters.length > 0) {
    readyWaiters.shift()?.resolve();
  }
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

// Essential cleanup hook called on session logout/role updates
export const terminateSearchWorker = () => {
  if (workerInstance) {
    workerInstance.terminate();
    workerInstance = null;
  }
  workerReady = false;
  rejectPendingWork(new Error("Search worker terminated"));
};

export const notifySearchWorker = (table: SearchableTable, ids: number[]) => {
  if (!workerInstance) return;
  workerInstance.postMessage({ type: WORKER_MSG.UPDATE_DOCS, table, ids });
};

export const useSearch = () => {
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    workerRef.current = getWorker();
  }, []);

  const searchAll = useCallback(
    async (term: string): Promise<SearchResult[]> => {
      const trimmedTerm = term.trim();
      if (!trimmedTerm) return [];

      const worker = workerRef.current ?? getWorker();

      const waitForReady = (): Promise<void> =>
        workerReady
          ? Promise.resolve()
          : new Promise<void>((resolve, reject) =>
              readyWaiters.push({ resolve, reject }),
            );

      await waitForReady();

      return new Promise<SearchResult[]>((resolve, reject) => {
        const reqId = `${crypto.randomUUID()}-${Date.now()}`;

        pendingRequests.set(reqId, { resolve, reject });

        worker.postMessage({
          type: WORKER_MSG.SEARCH_ALL,
          payload: {
            term: trimmedTerm,
            targets: [STORE.RECORDINGS, STORE.CATEGORIES, STORE.MATERIALS],
            reqId,
          },
        });
      });
    },
    [],
  );

  return { searchAll };
};
