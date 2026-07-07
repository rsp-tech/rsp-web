import fs from "node:fs/promises";
import path from "node:path";
import { BACKUP_TOKEN, SYNC_ZIP_URL } from "@/constants";

const PUBLIC_DIR = path.join(process.cwd(), "public");

const runGenerateSyncZip = async () => {
  try {
    await fs.mkdir(PUBLIC_DIR, { recursive: true });
  } catch {}

  try {
    await fs.access(path.join(PUBLIC_DIR, "sync.zip"));
    console.info("sync.zip already exists");
    return;
  } catch {}

  // 1. Fetch and extract the sync_state tables field
  const zipped = await fetch(SYNC_ZIP_URL, {
    headers: { Authorization: `token ${BACKUP_TOKEN}` },
  }).then((res) => res.arrayBuffer());

  // 5. Write to public/sync.zip
  await fs.writeFile(path.join(PUBLIC_DIR, "sync.zip"), Buffer.from(zipped));
};

let syncPromise: Promise<void> | null = null;
export const generateSyncZip = async () => {
  if (!syncPromise) {
    syncPromise = (async () => {
      try {
        await runGenerateSyncZip();
      } catch (err) {
        console.error("Error generating sync JSON - ", err);
        syncPromise = null;
        throw err;
      }
    })();
  }
  return syncPromise;
};
