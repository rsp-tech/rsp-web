import { cacheLife, cacheTag } from "next/cache";
import Papa from "papaparse";
import { CACHE_TAG, CSV_ENDPOINT } from "@/app/api/constants";
import { axiomLogger } from "@/lib/axiom-logger";

const BACKUP_TOKEN = process.env["BACKUP_TOKEN"];
const SYNC_ENDPOINT = process.env["SYNC_ENDPOINT"];

if (!BACKUP_TOKEN) {
  throw new Error("Missing BACKUP_TOKEN");
}

if (!SYNC_ENDPOINT) {
  throw new Error("Missing SYNC_ENDPOINT");
}

interface ReleaseAsset {
  id: number;
  name: string;
  url: string;
  size?: number;
  updated_at?: string;
}

interface ReleaseMetadata {
  tag_name?: string;
  published_at?: string;
  assets?: ReleaseAsset[];
}

const getReleaseMetadata = async (): Promise<ReleaseMetadata | null> => {
  const res = await fetch(SYNC_ENDPOINT as string, {
    headers: {
      Authorization: `Bearer ${BACKUP_TOKEN}`,
      "User-Agent": "rsp-web",
      Accept: "application/vnd.github+json",
    },
  });

  if (!res.ok) {
    console.error(
      `[Backup Asset] Failed to fetch release metadata: status=${res.status} ${res.statusText}`,
    );
    return null;
  }
  return (await res.json()) as ReleaseMetadata;
};

interface CachedAsset {
  data: Uint8Array;
  contentType: string;
}

const getCachedBackupAssetData = async (
  targetResource: string,
): Promise<CachedAsset | null> => {
  "use cache";
  cacheLife("days");
  cacheTag(CACHE_TAG.BACKUP_RESOURCES);

  const releaseJson = await getReleaseMetadata();
  const asset = releaseJson?.assets?.find((a) => a.name === targetResource);
  const assetUrl = asset?.url;

  if (!assetUrl) {
    console.error(
      `[Backup Asset] Target asset "${targetResource}" not found in release assets list!`,
    );
    return null;
  }

  const assetRes = await fetch(assetUrl, {
    headers: {
      Authorization: `Bearer ${BACKUP_TOKEN}`,
      "User-Agent": "rsp-web",
      Accept: "application/octet-stream",
    },
    redirect: "follow",
  });

  if (!assetRes.ok) {
    console.error(
      `[Backup Asset] Failed to download asset "${targetResource}": status=${assetRes.status} ${assetRes.statusText}`,
    );
    axiomLogger.error(
      `[Backup Asset] Failed to download asset: ${targetResource}`,
      {
        targetResource,
        status: assetRes.status,
        statusText: assetRes.statusText,
      },
    );
    return null;
  }

  const arrayBuffer = await assetRes.arrayBuffer();
  const contentType =
    assetRes.headers.get("content-type") || "application/octet-stream";

  return {
    data: new Uint8Array(arrayBuffer),
    contentType,
  };
};

export const fetchBackupAsset = async (
  targetResource: string,
): Promise<Response> => {
  const asset = await getCachedBackupAssetData(targetResource);
  if (!asset) {
    return new Response("Asset not found", { status: 404 });
  }

  const headers = new Headers();
  headers.set("Content-Type", asset.contentType);
  headers.set(
    "Cache-Control",
    "public, max-age=86400, s-maxage=2592000, stale-while-revalidate=86400",
  );
  headers.set(
    "CDN-Cache-Control",
    "public, s-maxage=2592000, stale-while-revalidate=86400",
  );
  headers.set(
    "Vercel-CDN-Cache-Control",
    "public, s-maxage=2592000, stale-while-revalidate=86400",
  );

  return new Response(asset.data as unknown as BodyInit, {
    status: 200,
    headers,
  });
};

// Cached function to load backup CSV tables (Next.js automatically adds `table` arg to the cache key)
export const getCSV = async (table: string): Promise<string[][]> => {
  if (!CSV_ENDPOINT) {
    console.error("Missing CSV_ENDPOINT environment variable");
    return [];
  }

  const url = `${CSV_ENDPOINT}/${table}.csv`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${BACKUP_TOKEN}`,
    },
  });

  if (!res.ok) {
    console.error(`Failed to fetch CSV for ${table}:`, res.statusText);
    return [];
  }

  const csvText = await res.text();
  const parsed = Papa.parse<string[]>(csvText, {
    skipEmptyLines: true,
  });
  return parsed.data;
};
