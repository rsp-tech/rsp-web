import { unstable_cache } from "next/cache";
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

export const fetchBackupAsset = async (targetResource: string) => {
  const assetUrl = await fetch(SYNC_ENDPOINT, {
    headers: {
      Authorization: `Bearer ${BACKUP_TOKEN}`,
    },
    next: {
      tags: [CACHE_TAG.BACKUP_RESOURCES],
      revalidate: REVALIDATE_24_HOURS,
    },
  })
    .then((res) => res.json())
    .then(
      ({ assets }) =>
        assets?.find(
          (a: { id: number; name: string }) => a.name === targetResource,
        ).url,
    );

  const assetRes = await fetch(assetUrl, {
    headers: {
      Authorization: `Bearer ${BACKUP_TOKEN}`,
      Accept: "application/octet-stream",
    },
    next: {
      tags: [CACHE_TAG.BACKUP_RESOURCES],
      revalidate: REVALIDATE_24_HOURS,
    },
    redirect: "follow",
  });

  if (!assetRes.ok) {
    console.error(await assetRes.text());
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
export const getCachedCSV = unstable_cache(
  async (table: string): Promise<string[][]> => {
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
  },
  [CACHE_TAG.BACKUP_RESOURCES],
  {
    revalidate: REVALIDATE_24_HOURS,
    tags: [CACHE_TAG.BACKUP_RESOURCES],
  },
);
