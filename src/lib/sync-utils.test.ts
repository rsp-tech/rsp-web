import { describe, expect, it } from "vitest";
import { createMockDb } from "@/test-utils/mock-idb";
import { STORE } from "../constants";

import {
  castValue,
  findFirstIndexAfter,
  getSyncColumnList,
  isRoleTable,
  parseCSVTable,
  pickSyncColumns,
  sliceAfterWatermark,
  stripUpdatedAt,
  toCSVRows,
  toUpdatedAtMap,
} from "./sync-utils";

describe.concurrent("sync-utils suite", () => {
  it.concurrent("getSyncColumnList returns array of column names for configured table", () => {
    const cols = getSyncColumnList(STORE.SPEAKERS);
    expect(cols).toEqual(["id", "name"]);
    expect(getSyncColumnList("unknown_store")).toEqual([]);
  });

  it.concurrent("pickSyncColumns picks only allowed sync columns from a record", () => {
    const speakerRow = {
      id: 1,
      name: "HG Radheshyamdas",
      unknown_field: "extra_data",
      created_at: "2026-01-01",
    };
    const picked = pickSyncColumns(speakerRow, STORE.SPEAKERS);
    expect(picked).toEqual({
      id: 1,
      name: "HG Radheshyamdas",
    });

    const unconfigured = { foo: "bar" };
    expect(pickSyncColumns(unconfigured, "unconfigured_table")).toEqual(
      unconfigured,
    );
  });

  it.concurrent("castValue handles null, undefined, numeric, and boolean conversions", () => {
    expect(castValue("categories", "name", null)).toBeNull();
    expect(castValue("categories", "name", undefined)).toBeNull();

    expect(castValue("categories", "id", "123")).toBe(123);
    expect(castValue("recordings", "category_id", "456")).toBe(456);
    expect(castValue("services", "order_ind", "5")).toBe(5);
    expect(castValue("categories", "id", "")).toBeNull();
    expect(castValue("categories", "id", "abc")).toBeNull();

    expect(castValue("services", "is_public", "true")).toBe(true);
    expect(castValue("services", "is_public", "t")).toBe(true);
    expect(castValue("services", "is_public", "1")).toBe(true);
    expect(castValue("services", "is_public", "false")).toBe(false);
    expect(castValue("services", "is_public", "0")).toBe(false);
    expect(castValue("services", "is_public", "")).toBeNull();
  });

  it.concurrent("castValue handles postgres array representations and string preserves", () => {
    expect(castValue("recordings", "speaker_ids", "{1,2,3}")).toEqual([
      1, 2, 3,
    ]);
    expect(castValue("recordings", "allowed_roles", "[1,2,3]")).toEqual([
      1, 2, 3,
    ]);
    expect(castValue("recordings", "lang_ids", "4,5,6")).toEqual([4, 5, 6]);
    expect(castValue("recordings", "speaker_ids", "")).toEqual([]);
    expect(castValue("recordings", "speaker_ids", "{}")).toEqual([]);
    expect(castValue("recordings", "speaker_ids", "[]")).toEqual([]);

    expect(castValue("services", "description", "Spiritual discourse")).toBe(
      "Spiritual discourse",
    );
    expect(castValue(STORE.REDIRECTS, "id", "/about-us")).toBe("/about-us");
    expect(castValue(STORE.USERS, "id", "usr_108")).toBe("usr_108");
  });

  it.concurrent("toCSVRows & parseCSVTable parses CSV archives into records", () => {
    const csvContent =
      "id,name,is_public\n1,Service 1,true\n2,Service 2,false\n";
    const unzipped = {
      "services.csv": new TextEncoder().encode(csvContent),
    };

    const rows = toCSVRows(unzipped, "services");
    expect(rows).toHaveLength(3);

    const records = parseCSVTable<{
      id: number;
      name: string;
      is_public: boolean;
    }>(rows, STORE.SERVICES);
    expect(records).toEqual([
      { id: 1, name: "Service 1", is_public: true },
      { id: 2, name: "Service 2", is_public: false },
    ]);

    expect(toCSVRows({}, "nonexistent")).toEqual([]);
    expect(parseCSVTable([], "services")).toEqual([]);
    expect(parseCSVTable([["id", "name"]], "services")).toEqual([]);
  });

  it.concurrent("toUpdatedAtMap, isRoleTable, and stripUpdatedAt format table data correctly", () => {
    const items = [
      { id: "1", updated_at: "2026-01-01T00:00:00Z" },
      { id: "2", updated_at: null },
      { id: "", updated_at: "2026-01-02T00:00:00Z" },
    ];
    expect(toUpdatedAtMap(items)).toEqual({ "1": "2026-01-01T00:00:00Z" });

    expect(isRoleTable(STORE.CATEGORIES)).toBe(true);
    expect(isRoleTable(STORE.SPEAKERS)).toBe(false);

    const rows = [{ id: 1, name: "Cat 1", updated_at: "2026-01-01" }];
    expect(stripUpdatedAt(rows)).toEqual([{ id: 1, name: "Cat 1" }]);
  });

  it.concurrent("findFirstIndexAfter and sliceAfterWatermark perform watermark binary searches", () => {
    const sortedData = [
      { id: 1, updated_at: "2026-01-01T00:00:00Z" },
      { id: 2, updated_at: "2026-01-05T00:00:00Z" },
      { id: 3, updated_at: "2026-01-10T00:00:00Z" },
      { id: 4, updated_at: "2026-01-15T00:00:00Z" },
    ];

    expect(findFirstIndexAfter(sortedData, "2026-01-03T00:00:00Z")).toBe(1);
    expect(findFirstIndexAfter(sortedData, "2026-01-05T00:00:00Z")).toBe(2);
    expect(findFirstIndexAfter(sortedData, "2026-01-20T00:00:00Z")).toBe(-1);
    expect(findFirstIndexAfter(sortedData, "2025-12-31T00:00:00Z")).toBe(0);

    const sliced = sliceAfterWatermark(
      sortedData,
      "2026-01-05T00:00:00Z",
      "2026-01-15T00:00:00Z",
    );
    expect(sliced.map((s) => s.id)).toEqual([3, 4]);

    expect(
      sliceAfterWatermark(
        sortedData,
        "2026-01-15T00:00:00Z",
        "2026-01-15T00:00:00Z",
      ),
    ).toEqual([]);
    expect(
      sliceAfterWatermark(sortedData, "2026-01-01T00:00:00Z", null),
    ).toEqual([]);
  });

  it.concurrent("mergeDeltas correctly merges and deduplicates public and role deltas", async () => {
    const { mergeDeltas } = await import("@/workers/utils");
    const publicDeltas = {
      categories: [{ id: 1, name: "Cat A" }],
    };
    const roleDeltas = {
      categories: [
        { id: 1, name: "Cat A Updated" },
        { id: 2, name: "Cat B" },
      ],
    };

    const merged = mergeDeltas(publicDeltas, roleDeltas);
    expect(merged.categories).toEqual([
      { id: 1, name: "Cat A Updated" },
      { id: 2, name: "Cat B" },
    ]);
  });

  it.concurrent("performRoleCleanup and performUserCleanup clean up storage when roles/users change", async () => {
    const { performRoleCleanup, performUserCleanup } = await import(
      "@/workers/cleanup-helpers"
    );

    const mockDb = createMockDb();

    // First run stores the role and returns false
    const res1 = await performRoleCleanup(mockDb, 1);
    expect(res1.clearedRole).toBe(false);

    // Same role returns false
    const res2 = await performRoleCleanup(mockDb, 1);
    expect(res2.clearedRole).toBe(false);

    // Shift in role triggers cleanup and returns true
    const res3 = await performRoleCleanup(mockDb, 2);
    expect(res3.clearedRole).toBe(true);

    // First user run
    const userRes1 = await performUserCleanup(mockDb, "u1");
    expect(userRes1.clearedUser).toBe(false);

    // User shift triggers cleanup
    const userRes2 = await performUserCleanup(mockDb, "u2");
    expect(userRes2.clearedUser).toBe(true);
  });

  it.concurrent("isDatabaseStale detects missing watermarks, up-to-date, or stale data", async () => {
    const { isDatabaseStale } = await import("@/workers/utils");

    const mockDbMissing: any = {
      get: () => Promise.resolve(undefined),
    };
    expect(
      await isDatabaseStale(mockDbMissing, { recordings: "2026-01-01" }),
    ).toBe(true);

    const mockDbEqual: any = {
      get: () => Promise.resolve({ updated_at: "2026-01-01" }),
    };
    expect(
      await isDatabaseStale(mockDbEqual, { recordings: "2026-01-01" }),
    ).toBe(false);

    const oldDate = new Date(Date.now() - 40 * 24 * 3600 * 1000).toISOString();
    const mockDbOld: any = {
      get: () => Promise.resolve({ updated_at: oldDate }),
    };
    expect(await isDatabaseStale(mockDbOld, { recordings: "2026-01-01" })).toBe(
      true,
    );
  });

  it.concurrent("toSyncResult generates formatted sync result and determines rebuildSearchIndex", async () => {
    const { toSyncResult } = await import("@/workers/utils");
    const mockDb: any = {
      get: () => Promise.resolve({ url_path: "spiritual_discourses" }),
    };

    const res = await toSyncResult(
      mockDb,
      {
        changedCategories: { 1: "spiritual_discourses" },
        bubbledChangeCategoryIds: new Set([1]),
        changedRecordings: {},
        bubbledChangeRecordingIds: new Set(),
      },
      { categories: [1], recordings: [], materials: [] },
      ["speakers"],
      {
        recordings: [],
        materials: [],
        categories: [1],
        replies: [],
        requests: [],
      },
      false,
      false,
      false,
    );

    expect(res.rebuildSearchIndex).toBe(true);
    expect(res.changedCategoryPaths).toEqual(["spiritual_discourses"]);
    expect(res.newAdditions.categories).toEqual([1]);
  });

  it.concurrent("syncPublicData, syncRoleData, and syncUserData execute full sync cycles", async () => {
    const { syncPublicData } = await import("@/workers/sync-public-helpers");
    const { syncRoleData } = await import("@/workers/sync-role-helpers");
    const { syncUserData } = await import("@/workers/sync-user-helpers");

    const mockDb = createMockDb({
      [`${STORE.SYNC_META}:${STORE.RECORDINGS}`]: {
        updated_at: "2026-01-01T00:00:00Z",
      },
      [`${STORE.SYNC_META}:${STORE.USERS}`]: {
        updated_at: "2026-01-01T00:00:00Z",
      },
    });

    // Mock global fetch for metadata & sync endpoints
    const originalFetch = globalThis.fetch;
    globalThis.fetch = ((url: string) => {
      if (url.includes("/api/sync/meta")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ recordings: "2026-01-01T00:00:00Z" }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ deltas: {}, sync_meta: {} }),
      });
    }) as any;

    const publicRes = await syncPublicData(mockDb, "https://test.site");
    expect(publicRes).toBeDefined();
    expect(publicRes.changedTables).toEqual([]);

    const roleRes = await syncRoleData(mockDb, "https://test.site", {
      roleId: 1,
      userId: "u123",
      accessToken: "token_abc",
    });
    expect(roleRes).toBeDefined();

    const userRes = await syncUserData(mockDb, "https://test.site", {
      userId: "u123",
      accessToken: "token_abc",
    });
    expect(userRes).toBeDefined();

    globalThis.fetch = originalFetch;
  });
});
