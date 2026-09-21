import { revalidateTag } from "next/cache";
import Papa from "papaparse";
import {
  CACHE_TAG,
  CSV_ENDPOINT,
  REVALIDATE_24_HOURS,
} from "@/app/api/constants";

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

const getReleaseMetadata = async (
  forceFresh = false,
): Promise<ReleaseMetadata | null> => {
  const fetchOptions: RequestInit = {
    headers: {
      Authorization: `Bearer ${BACKUP_TOKEN}`,
      "User-Agent": "rsp-web",
      Accept: "application/vnd.github+json",
    },
    ...(forceFresh
      ? { cache: "no-store" }
      : {
          next: {
            tags: [CACHE_TAG.BACKUP_RESOURCES],
            revalidate: REVALIDATE_24_HOURS,
          },
        }),
  };

  const res = await fetch(SYNC_ENDPOINT as string, fetchOptions);
  if (!res.ok) {
    console.error(
      `[Backup Asset] Failed to fetch release metadata (fresh=${forceFresh}): status=${res.status} ${res.statusText}`,
    );
    return null;
  }
  return (await res.json()) as ReleaseMetadata;
};

export const fetchBackupAsset = async (
  targetResource: string,
): Promise<Response> => {
  let releaseJson = await getReleaseMetadata(false);
  let asset = releaseJson?.assets?.find((a) => a.name === targetResource);
  let assetUrl = asset?.url;

  // If not found in cached metadata, retry with fresh metadata and invalidate backup cache
  if (!assetUrl) {
    console.warn(
      `[Backup Asset] Target asset "${targetResource}" not found in cached release. Invalidating backup cache and refetching fresh metadata...`,
    );
    try {
      revalidateTag(CACHE_TAG.BACKUP_RESOURCES, {});
    } catch (e) {
      console.warn("[Backup Asset] Failed to revalidate backup tag:", e);
    }
    releaseJson = await getReleaseMetadata(true);
    asset = releaseJson?.assets?.find((a) => a.name === targetResource);
    assetUrl = asset?.url;
  }

  if (!assetUrl) {
    console.error(
      `[Backup Asset] Target asset "${targetResource}" not found in release assets list!`,
    );
    return new Response("Asset not found", { status: 404 });
  }

  let assetRes = await fetch(assetUrl, {
    headers: {
      Authorization: `Bearer ${BACKUP_TOKEN}`,
      "User-Agent": "rsp-web",
      Accept: "application/octet-stream",
    },
    next: {
      tags: [CACHE_TAG.BACKUP_RESOURCES],
      revalidate: REVALIDATE_24_HOURS,
    },
    redirect: "follow",
  });

  // Self-healing fallback on 404: If the asset ID was stale/deleted, invalidate cache and retry with fresh metadata
  if (assetRes.status === 404) {
    console.warn(
      `[Backup Asset] Asset fetch for "${targetResource}" returned 404 (stale asset ID). Invalidating backup cache and refetching fresh metadata...`,
    );
    try {
      revalidateTag(CACHE_TAG.BACKUP_RESOURCES, {});
    } catch (e) {
      console.warn("[Backup Asset] Failed to revalidate backup tag:", e);
    }
    const freshReleaseJson = await getReleaseMetadata(true);
    const freshAsset = freshReleaseJson?.assets?.find(
      (a) => a.name === targetResource,
    );
    const freshAssetUrl = freshAsset?.url;

    if (freshAssetUrl && freshAssetUrl !== assetUrl) {
      assetRes = await fetch(freshAssetUrl, {
        headers: {
          Authorization: `Bearer ${BACKUP_TOKEN}`,
          "User-Agent": "rsp-web",
          Accept: "application/octet-stream",
        },
        next: {
          tags: [CACHE_TAG.BACKUP_RESOURCES],
          revalidate: REVALIDATE_24_HOURS,
        },
        redirect: "follow",
      });
    }
  }

  if (!assetRes.ok) {
    console.error(
      `[Backup Asset] Failed to download asset "${targetResource}": status=${assetRes.status} ${assetRes.statusText}`,
    );
    return new Response("Failed to download seed", {
      status: assetRes.status,
    });
  }

  const headers = new Headers(assetRes.headers);
  return new Response(assetRes.body, {
    status: assetRes.status,
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
