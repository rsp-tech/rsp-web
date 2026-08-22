import Papa from "papaparse";
import { STRING_KEY_TABLES } from "@/constants";

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
  if (!rows || rows.length <= 1) return [];

  const header = rows[0].map((h) => h.trim());
  const dataRows = rows.slice(1);

  const results: T[] = [];
  for (const row of dataRows) {
    if (!row || row.length === 0 || (row.length === 1 && row[0] === "")) {
      continue;
    }

    const record: Record<string, CastValueType> = {};
    for (let i = 0; i < header.length; i++) {
      const fieldName = header[i];
      if (i < row.length) {
        record[fieldName] = castValue(tableName, fieldName, row[i]);
      } else {
        record[fieldName] = null;
      }
    }
    results.push(record as T);
  }

  return results;
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
