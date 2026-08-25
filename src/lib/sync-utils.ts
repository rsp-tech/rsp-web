import Papa from "papaparse";
import {
  ROLE_SYNCED_TABLES,
  STRING_KEY_TABLES,
  SYNC_COLUMNS,
} from "@/constants";

export const NUMERIC_FIELDS = [
  "id",
  "img_id",
  "category_id",
  "event_id",
  "venues_id",
  "type_id",
  "recording_id",
  "section_id",
  "entity_id",
  "order_ind",
  "role_id",
  "service_id",
  "requested_role_id",
];

export type CastValueType = number | boolean | number[] | string | null;

export const getSyncColumnList = (table: string): string[] => {
  const cols = SYNC_COLUMNS[table as keyof typeof SYNC_COLUMNS];
  if (!cols) return [];
  return cols
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);
};

export const pickSyncColumns = <T extends Record<string, unknown>>(
  row: T,
  table: string,
): Partial<T> => {
  const allowed = getSyncColumnList(table);
  if (!allowed.length) return row;
  const picked: Record<string, unknown> = {};
  for (const col of allowed) {
    if (row[col] !== undefined) {
      picked[col] = row[col];
    }
  }
  return picked as Partial<T>;
};

export const castValue = (
  tableName: string,
  fieldName: string,
  val: string | null | undefined,
): CastValueType => {
  if (val === undefined || val === null) return null;

  // Special case: string IDs for redirects and user tables
  if (STRING_KEY_TABLES.has(tableName) && fieldName === "id") {
    return val;
  }

  // Boolean fields
  if (["is_public", "is_published", "is_active"].includes(fieldName)) {
    if (val === "") return null;
    return val === "true" || val === "t" || val === "1";
  }

  // Array fields (like allowed_roles, lang_ids, speaker_ids)
  if (fieldName === "allowed_roles" || fieldName.endsWith("_ids")) {
    if (val === "" || val === "{}" || val === "[]") return [];
    // Remove quotes, brackets, braces
    const clean = val.replace(/[{}[\]"]/g, "");
    if (clean === "") return [];
    return clean
      .split(",")
      .map((x) => Number.parseInt(x.trim(), 10))
      .filter((x) => !Number.isNaN(x));
  }

  // Numeric fields (id, or ending with _id, _ind)
  if (NUMERIC_FIELDS.includes(fieldName)) {
    if (val === "") return null;
    const num = Number.parseInt(val, 10);
    return Number.isNaN(num) ? null : num;
  }

  return val;
};

export const toCSVRows = (
  unzipped: Record<string, Uint8Array>,
  tableName: string,
): string[][] => {
  const fileBytes = unzipped[`${tableName}.csv`];
  if (!fileBytes) return [];

  const csvStr = new TextDecoder().decode(fileBytes);
  const parsed = Papa.parse<string[]>(csvStr, { skipEmptyLines: "greedy" });
  return parsed.data;
};

export const parseCSVTable = <T>(rows: string[][], tableName: string): T[] => {
  if (!rows || rows.length < 2) return [];

  const headers = rows[0].map((header) => header.trim());

  return rows
    .slice(1)
    .filter((row) => row.some((value) => value.trim() !== ""))
    .map((row) => {
      const record: Record<string, CastValueType> = {};

      headers.forEach((fieldName, index) => {
        record[fieldName] =
          index < row.length
            ? castValue(tableName, fieldName, row[index])
            : null;
      });

      return record as T;
    });
};

export const toUpdatedAtMap = (
  rows: Array<{ id: string; updated_at?: string | null }>,
): Record<string, string> => {
  const map: Record<string, string> = {};
  for (const item of rows) {
    if (item.id && item.updated_at) {
      map[item.id] = item.updated_at;
    }
  }
  return map;
};

export const isRoleTable = (table: string): boolean =>
  (ROLE_SYNCED_TABLES as readonly string[]).includes(table);

export const stripUpdatedAt = <T extends { updated_at?: unknown }>(
  rows: T[],
): Array<Omit<T, "updated_at">> => {
  return rows.map((row) => {
    const { updated_at: _, ...rest } = row;
    return rest;
  });
};

export const findFirstIndexAfter = <T extends Record<string, unknown>>(
  rows: T[],
  threshold: string,
): number => {
  let low = 0;
  let high = rows.length - 1;
  let result = -1;

  while (low <= high) {
    const mid = (low + high) >> 1;
    const rowTime = (rows[mid]["updated_at"] as string) || "";
    if (rowTime > threshold) {
      result = mid;
      high = mid - 1;
    } else {
      low = mid + 1;
    }
  }

  return result;
};

export const sliceAfterWatermark = <T extends Record<string, unknown>>(
  rows: T[],
  watermark: string,
  baselineMax: string | null,
): T[] => {
  if (!baselineMax || watermark >= baselineMax) return [];
  const idx = findFirstIndexAfter(rows, watermark);
  return idx !== -1 ? rows.slice(idx) : [];
};
