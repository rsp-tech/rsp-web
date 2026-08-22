import { fetchBackupAsset } from "./utils";

export const revalidate = 86400; // 24 hours

const SYNC_RESOURCE = process.env["SYNC_RESOURCE"];

if (!SYNC_RESOURCE) {
  throw new Error("Missing SYNC_RESOURCE");
}

export const GET = async () => fetchBackupAsset(SYNC_RESOURCE);
