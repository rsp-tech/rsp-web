import fs from "node:fs/promises";
import path from "node:path";
import { zipSync } from "fflate";
import Papa from "papaparse";
import { BACKUP_BASE_URL, BACKUP_TOKEN, SYNC_COLUMNS } from "@/constants";

const PUBLIC_DIR = path.join(process.cwd(), "public");

interface SyncState {
  tables: Record<string, string>;
}

const runGenerateSyncJson = async () => {
  try {
    await fs.mkdir(PUBLIC_DIR, { recursive: true });
  } catch {}

  try {
    await fs.access(path.join(PUBLIC_DIR, "sync.zip"));
    console.log("sync.zip already exists");
    return;
  } catch {}

  // 1. Fetch and extract the sync_state tables field
  const syncStateRes = await fetch(`${BACKUP_BASE_URL}sync_state.json`, {
    headers: { Authorization: `token ${BACKUP_TOKEN}` },
  });
  if (!syncStateRes.ok) {
    throw new Error(
      `Failed to fetch sync_state.json: ${syncStateRes.statusText}`,
    );
  }
  const syncStateData = (await syncStateRes.json()) as SyncState;
  const tablesSyncState = syncStateData.tables || {};

  const zipFiles: Record<string, Uint8Array> = {};

  // 2. Fetch and process each table's CSV file in parallel
  await Promise.all(
    Object.entries(SYNC_COLUMNS).map(async ([key, query]) => {
      const csvUrl = `${BACKUP_BASE_URL}${key}.csv`;
      const res = await fetch(csvUrl, {
        headers: { Authorization: `token ${BACKUP_TOKEN}` },
      });
      if (!res.ok) {
        throw new Error(
          `Failed to fetch CSV for table ${key} from ${csvUrl}: ${res.statusText}`,
        );
      }
      const csvData = await res.text();

      const parsed = Papa.parse<string[]>(csvData, {
        skipEmptyLines: "greedy",
      });

      const csvRows = parsed.data;
      if (!csvRows?.length) {
        zipFiles[`${key}.csv`] = new TextEncoder().encode("");
        return;
      }

      const header = csvRows[0].map((h) => h.trim());
      const targetCols = query
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean)
        .toSorted();

      const colIndices = targetCols.map((col) => header.indexOf(col));

      const isRoleSyncedTable = [
        "categories",
        "materials",
        "recordings",
      ].includes(key);
      const allowedRolesIndex = header.indexOf("allowed_roles");

      const filteredRows: string[][] = [targetCols];

      for (let i = 1; i < csvRows.length; i++) {
        const row = csvRows[i];
        if (!row?.length || (row.length === 1 && row[0] === "")) {
          continue;
        }

        if (isRoleSyncedTable && allowedRolesIndex !== -1) {
          const allowedRolesVal = row[allowedRolesIndex] || "";
          // Check if allowed_roles contains 0
          const roles = allowedRolesVal
            .replace(/[{}[\]"]/g, "")
            .split(",")
            .map((r) => r.trim());
          if (!roles.includes("0")) {
            continue;
          }
        }

        const newRow = colIndices.map((idx) =>
          idx !== -1 && idx < row.length ? row[idx] : "",
        );
        filteredRows.push(newRow);
      }

      const unparsed = Papa.unparse(filteredRows);
      zipFiles[`${key}.csv`] = new TextEncoder().encode(unparsed);
    }),
  );

  // 3. Add sync_state.json to zipFiles (only keeping tables field keys/values)
  zipFiles["sync_state.json"] = new TextEncoder().encode(
    JSON.stringify(tablesSyncState, null, 2),
  );

  // 4. Compress all files in the ZIP archive
  const zipped = zipSync(zipFiles);

  // 5. Write to public/sync.zip
  await fs.writeFile(path.join(PUBLIC_DIR, "sync.zip"), zipped);
};

let syncPromise: Promise<void> | null = null;
export const generateSyncJson = async () => {
  if (!syncPromise) {
    syncPromise = (async () => {
      try {
        await runGenerateSyncJson();
      } catch (err) {
        console.error("Error generating sync JSON - ", err);
        syncPromise = null;
        throw err;
      }
    })();
  }
  return syncPromise;
};
