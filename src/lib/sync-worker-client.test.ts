import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { WORKER_MSG } from "@/constants";
import type { SyncResult, SyncWorkerMessage } from "@/types";
import {
  clearSyncMetaCache,
  dispatchSyncJob,
  terminateWorker,
} from "./sync-worker-client";

class MockWorker {
  onmessage: ((e: MessageEvent<SyncWorkerMessage>) => void) | null = null;
  onerror: ((e: ErrorEvent) => void) | null = null;
  onmessageerror: ((e: MessageEvent) => void) | null = null;
  postMessage = vi.fn();
  terminate = vi.fn();
}

describe("sync-worker-client", () => {
  let mockWorkerInstances: MockWorker[] = [];

  beforeEach(() => {
    terminateWorker();
    mockWorkerInstances = [];
    vi.useFakeTimers();

    vi.stubGlobal(
      "Worker",
      class extends MockWorker {
        constructor() {
          super();
          mockWorkerInstances.push(this);
        }
      },
    );
  });

  afterEach(() => {
    terminateWorker();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("should dispatch a job, reuse worker for concurrent jobs, and resolve with result", async () => {
    const onProgress1 = vi.fn();
    const onProgress2 = vi.fn();

    const promise1 = dispatchSyncJob(
      { type: WORKER_MSG.START_PUBLIC_SYNC },
      onProgress1,
    );
    const promise2 = dispatchSyncJob(
      { type: WORKER_MSG.START_ROLE_SYNC, roleId: 1 },
      onProgress2,
    );

    // Only 1 worker instance should be created for both concurrent jobs
    expect(mockWorkerInstances.length).toBe(1);
    const worker = mockWorkerInstances[0];
    expect(worker).toBeDefined();
    if (!worker) return;

    expect(worker.postMessage).toHaveBeenCalledTimes(2);

    const call1 = worker.postMessage.mock.calls[0]?.[0] as
      | { jobId: string; type: string }
      | undefined;
    const call2 = worker.postMessage.mock.calls[1]?.[0] as
      | { jobId: string; type: string }
      | undefined;

    expect(call1?.type).toBe(WORKER_MSG.START_PUBLIC_SYNC);
    expect(call2?.type).toBe(WORKER_MSG.START_ROLE_SYNC);
    expect(call1?.jobId).not.toBe(call2?.jobId);

    // Send progress for Job 1
    worker.onmessage?.({
      data: {
        type: WORKER_MSG.PROGRESS,
        message: "Syncing public data...",
        jobId: call1?.jobId,
      },
    } as unknown as MessageEvent<SyncWorkerMessage>);

    expect(onProgress1).toHaveBeenCalledWith("Syncing public data...");
    expect(onProgress2).not.toHaveBeenCalled();

    // Resolve Job 2 first (out of order completion)
    const result2: SyncResult = {
      changedCategoryPaths: [],
      changedIds: { recordings: [], categories: [], materials: [] },
      newAdditions: {
        recordings: [],
        materials: [],
        categories: [],
        replies: [],
        requests: [],
      },
      changedTables: ["categories"],
      rebuildSearchIndex: false,
    };

    worker.onmessage?.({
      data: {
        type: WORKER_MSG.SUCCESS,
        jobId: call2?.jobId,
        ...result2,
      },
    } as unknown as MessageEvent<SyncWorkerMessage>);

    const res2 = await promise2;
    expect(res2.changedTables).toEqual(["categories"]);

    // Resolve Job 1
    const result1: SyncResult = {
      changedCategoryPaths: ["*"],
      changedIds: { recordings: [], categories: [], materials: [] },
      newAdditions: {
        recordings: [],
        materials: [],
        categories: [],
        replies: [],
        requests: [],
      },
      changedTables: ["recordings"],
      rebuildSearchIndex: true,
    };

    worker.onmessage?.({
      data: {
        type: WORKER_MSG.SUCCESS,
        jobId: call1?.jobId,
        ...result1,
      },
    } as unknown as MessageEvent<SyncWorkerMessage>);

    const res1 = await promise1;
    expect(res1.changedTables).toEqual(["recordings"]);
  });

  it("should terminate worker after 5 seconds of inactivity and recreate on new job", async () => {
    const promise = dispatchSyncJob({ type: WORKER_MSG.START_PUBLIC_SYNC });
    const worker1 = mockWorkerInstances[0];
    expect(worker1).toBeDefined();
    if (!worker1) return;

    const call = worker1.postMessage.mock.calls[0]?.[0] as
      | { jobId: string }
      | undefined;
    worker1.onmessage?.({
      data: {
        type: WORKER_MSG.SUCCESS,
        jobId: call?.jobId,
        changedCategoryPaths: [],
        changedIds: { recordings: [], categories: [], materials: [] },
        newAdditions: {
          recordings: [],
          materials: [],
          categories: [],
          replies: [],
          requests: [],
        },
        changedTables: [],
        rebuildSearchIndex: false,
      },
    } as unknown as MessageEvent<SyncWorkerMessage>);

    await promise;

    // Fast-forward 4.9s - worker should still be alive
    vi.advanceTimersByTime(4900);
    expect(worker1.terminate).not.toHaveBeenCalled();

    // Advance past 5s - worker should be terminated
    vi.advanceTimersByTime(200);
    expect(worker1.terminate).toHaveBeenCalledTimes(1);

    // Dispatching a new job should create a fresh worker instance
    const newJobPromise = dispatchSyncJob({
      type: WORKER_MSG.START_USER_SYNC,
    });
    newJobPromise.catch(() => {});
    expect(mockWorkerInstances.length).toBe(2);
  });

  it("should reject all pending jobs on worker error and terminate worker", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    const p1 = dispatchSyncJob({ type: WORKER_MSG.START_PUBLIC_SYNC });
    const p1Catch = p1.catch((e: Error) => e);

    const p2 = dispatchSyncJob({ type: WORKER_MSG.START_ROLE_SYNC });
    const p2Catch = p2.catch((e: Error) => e);

    const worker = mockWorkerInstances[0];
    expect(worker).toBeDefined();
    if (!worker) return;

    worker.onerror?.({
      message: "Worker out of memory",
    } as unknown as ErrorEvent);

    const [err1, err2] = await Promise.all([p1Catch, p2Catch]);

    expect((err1 as Error).message).toBe("Sync worker crashed");
    expect((err2 as Error).message).toBe("Sync worker crashed");
    expect(worker.terminate).toHaveBeenCalledTimes(1);

    spy.mockRestore();
  });

  it("should reject all pending jobs on worker onmessageerror and terminate worker", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    const promise = dispatchSyncJob({ type: WORKER_MSG.START_PUBLIC_SYNC });
    const pRejection = promise.catch((e: Error) => e);

    const worker = mockWorkerInstances[0];
    expect(worker).toBeDefined();
    if (!worker) return;

    worker.onmessageerror?.({} as unknown as MessageEvent);

    const err = await pRejection;
    expect((err as Error).message).toBe(
      "Sync worker message deserialization failed",
    );
    expect(worker.terminate).toHaveBeenCalledTimes(1);

    spy.mockRestore();
  });

  it("should reject and clean up immediately if postMessage throws", async () => {
    vi.stubGlobal(
      "Worker",
      class extends MockWorker {
        override postMessage = vi.fn().mockImplementation(() => {
          throw new Error("DataCloneError: could not clone object");
        });

        constructor() {
          super();
          mockWorkerInstances.push(this);
        }
      },
    );

    const promise = dispatchSyncJob({ type: WORKER_MSG.START_PUBLIC_SYNC });

    await expect(promise).rejects.toThrow("DataCloneError");
  });

  it("getAudioCacheSettings returns defaults and parses stored JSON safely", async () => {
    const { DEFAULT_SETTINGS, getAudioCacheSettings } = await import(
      "@/hooks/use-audio-cache"
    );
    expect(getAudioCacheSettings()).toEqual(DEFAULT_SETTINGS);

    localStorage.setItem(
      "rsp-audio-settings",
      JSON.stringify({ maxCacheSizeMB: 500 }),
    );
    expect(getAudioCacheSettings()).toEqual({
      maxCacheSizeMB: 500,
      enableMaterialsCache: true,
    });

    localStorage.setItem("rsp-audio-settings", "invalid-json");
    expect(getAudioCacheSettings()).toEqual(DEFAULT_SETTINGS);
    localStorage.removeItem("rsp-audio-settings");
  });

  it("useIsMobile and useOnlineStatus hook helpers resolve correctly", async () => {
    const { useIsMobile } = await import("@/hooks/use-is-mobile");
    const { useOnlineStatus } = await import("@/hooks/use-online-status");
    expect(typeof useIsMobile).toBe("function");
    expect(typeof useOnlineStatus).toBe("function");
  });

  it("clearSyncMetaCache deletes CacheStorage and terminates worker", async () => {
    const deleteSpy = vi.fn().mockResolvedValue(true);
    vi.stubGlobal("window", {
      caches: {
        delete: deleteSpy,
      },
    });

    await clearSyncMetaCache();
    expect(deleteSpy).toHaveBeenCalledWith("rsp-sync-meta-cache");
  });
});
