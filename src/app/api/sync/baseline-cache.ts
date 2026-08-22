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
import { fetchBackupAsset } from "./utils";

const SYNC_RESOURCE = process.env["SYNC_RESOURCE"] || "sync.zip";

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
): Array<Record<string, unknown>> => {
  if (!unzipped) return [];

  const rows = parseCSVTable<Record<string, unknown>>(
    toCSVRows(unzipped, table),
    table,
  );

  rows.sort(sortByDate());

  if (table === STORE.RECORDINGS) {
    const currentDay = Math.floor(Date.now() / ONE_DAY_MS);
    const cutoffDay = currentDay - MAX_SYNC_STALE_DAYS;
    const cutoffIso = new Date(cutoffDay * ONE_DAY_MS).toISOString();

    const idx = findFirstIndexAfter(rows, cutoffIso);
    return idx !== -1 ? rows.slice(idx) : [];
  }

  return rows;
};

// Cached public baseline table (sorted ascending by updated_at)
export const getCachedPublicTable = unstable_cache(
  async (table: SyncTable): Promise<Array<Record<string, unknown>>> => {
    const unzipped = await getUnzippedArchive(SYNC_RESOURCE);
    return parseAndSortTableRows(unzipped, table);
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
