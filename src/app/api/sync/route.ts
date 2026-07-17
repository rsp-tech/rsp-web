import { fetchBackupAsset } from "./utils";

export const revalidate = 14400; // 4 hours

const SYNC_RESOURCE = process.env["SYNC_RESOURCE"];

if (!SYNC_RESOURCE) {
  throw new Error("Missing BACKUP_FILE");
}

export const GET = async () => fetchBackupAsset(SYNC_RESOURCE);
