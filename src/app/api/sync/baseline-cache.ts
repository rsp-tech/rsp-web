import { unzipSync } from "fflate";
import { unstable_cache } from "next/cache";
import { CACHE_TAG, REVALIDATE_24_HOURS } from "@/app/api/constants";
import { MAX_SYNC_STALE_DAYS, ONE_DAY_MS, STORE } from "@/constants";
import {
  findFirstIndexAfter,
  parseCSVTable,
  toCSVRows,
} from "@/lib/sync-utils";
import { sortByDate } from "@/lib/utils";
import type { SyncTable } from "@/types";
import { fetchBackupAsset, getCSV } from "./utils";

const SYNC_RESOURCE = process.env["SYNC_RESOURCE"] || "sync.zip";

export const MAX_BASELINE_CACHE_ROWS = 1000;

const getUnzippedArchive = async (
  targetResource: string,
): Promise<Record<string, Uint8Array> | null> => {
  const res = await fetchBackupAsset(targetResource);
  if (!res.ok) return null;
  const bytes = new Uint8Array(await res.arrayBuffer());
  return unzipSync(bytes);
};

const parseAndSortTableRows = (
  unzipped: Record<string, Uint8Array> | null,
  table: SyncTable,
  limitToMaxRows = true,
): Array<Record<string, unknown>> => {
  if (!unzipped) return [];

  const rawRows = toCSVRows(unzipped, table);
  if (!rawRows?.length) return [];

  const rows = parseCSVTable<Record<string, unknown>>(rawRows, table);
  rows.sort(sortByDate());

  let processedRows = rows;

  if (table === STORE.RECORDINGS) {
    const currentDay = Math.floor(Date.now() / ONE_DAY_MS);
    const cutoffDay = currentDay - MAX_SYNC_STALE_DAYS;
    const cutoffIso = new Date(cutoffDay * ONE_DAY_MS).toISOString();

    const idx = findFirstIndexAfter(rows, cutoffIso);
    processedRows = idx !== -1 ? rows.slice(idx) : [];
  }

  if (limitToMaxRows && processedRows.length > MAX_BASELINE_CACHE_ROWS) {
    return processedRows.slice(-MAX_BASELINE_CACHE_ROWS);
  }

  return processedRows;
};

// Full baseline table fallback (un-cached, for clients behind the 1,000-row cache window)
export const getFullPublicTable = async (
  table: SyncTable,
): Promise<Array<Record<string, unknown>>> => {
  const unzipped = await getUnzippedArchive(SYNC_RESOURCE);
  return parseAndSortTableRows(unzipped, table, false);
};

// Cached public baseline table (safely limited to top 1,000 recent rows to stay under 2MB)
export const getCachedPublicTable = unstable_cache(
  async (table: SyncTable): Promise<Array<Record<string, unknown>>> => {
    const unzipped = await getUnzippedArchive(SYNC_RESOURCE);
    return parseAndSortTableRows(unzipped, table, true);
  },
  [CACHE_TAG.BACKUP_RESOURCES, "public"],
  {
    revalidate: REVALIDATE_24_HOURS,
    tags: [CACHE_TAG.BACKUP_RESOURCES],
  },
);

// Cached role extra baseline table (sorted ascending by updated_at)
export const getCachedRoleExtraTable = unstable_cache(
  async (
    table: SyncTable,
    roleId: number,
  ): Promise<Array<Record<string, unknown>>> => {
    const roleResource = SYNC_RESOURCE.replace(".zip", `-${roleId}.zip`);
    const unzipped = await getUnzippedArchive(roleResource);
    return parseAndSortTableRows(unzipped, table);
  },
  [CACHE_TAG.BACKUP_RESOURCES, "role"],
  {
    revalidate: REVALIDATE_24_HOURS,
    tags: [CACHE_TAG.BACKUP_RESOURCES],
  },
);

// Cached user baseline table (parsed and sorted ascending by updated_at)
export const getCachedUserTable = unstable_cache(
  async (table: SyncTable): Promise<Array<Record<string, unknown>>> =>
    parseCSVTable<Record<string, unknown>>(await getCSV(table), table).sort(
      sortByDate(),
    ),
  [CACHE_TAG.BACKUP_RESOURCES, "user-table"],
  {
    revalidate: REVALIDATE_24_HOURS,
    tags: [CACHE_TAG.BACKUP_RESOURCES],
  },
);
