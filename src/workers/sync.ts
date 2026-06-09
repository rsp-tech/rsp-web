import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { IDBPDatabase } from "idb";
import type { RSPDatabase } from "@/lib/idb";
import { getDB } from "@/lib/idb";
import { createLimiter } from "@/lib/utils";

const PAGE_SIZE = 1000;

type SyncTable = keyof Omit<RSPDatabase, "metadata">;

const strip = (item: Record<string, unknown>): Record<string, unknown> => {
  // biome-ignore lint/correctness/noUnusedVariables: stripping out
  const { created_at, metadata, ...rest } = item;
  return rest;
};

const fetchPage = async (
  supabase: SupabaseClient,
  table: string,
  offset: number,
  since?: string,
) => {
  let query = supabase
    .schema("prod")
    .from(table)
    .select("*")
    .order("id", { ascending: true });

  if (since) {
    query = query.gt("updated_at", since);
  }
  return query.range(offset, offset + PAGE_SIZE - 1);
};

const syncTable = async (
  supabase: SupabaseClient,
  db: IDBPDatabase<RSPDatabase>,
  table: SyncTable,
  changedCategoryPaths: Set<string>,
) => {
  const metaKey = `last_sync_${table}`;
  const localLastSync = (await db.get("metadata", metaKey)) as
    | string
    | undefined;

  const { data: latest, error: latestErr } = await supabase
    .schema("prod")
    .from(table)
    .select("updated_at")
    .order("updated_at", { ascending: false })
    .limit(1);

  if (latestErr) throw new Error(`${table}: ${latestErr.message}`);
  if (!latest?.length || !latest[0].updated_at) return;

  const globalMax: string = latest[0].updated_at;
  if (localLastSync && new Date(localLastSync) >= new Date(globalMax)) return;

  let offset = 0;
  while (true) {
    const { data, error } = await fetchPage(
      supabase,
      table,
      offset,
      localLastSync,
    );
    if (error) throw new Error(`${table}: ${error.message}`);
    if (!data?.length) break;

    const tx = db.transaction(table, "readwrite");

    // Relying on SQL trigger: Child updates bubble up to categories table automatically.
    // We only need to catch direct updates/inserts landing on the categories table.
    const isCategories = table === "categories";
    for (const item of data) {
      if (isCategories) changedCategoryPaths.add(item.url_path as string);
      tx.store.put(strip(item));
    }
    await tx.done;

    postMessage({ type: "PROGRESS", message: `Syncing ${table}...` });

    offset += PAGE_SIZE;
    if (data.length < PAGE_SIZE) break;
  }

  await db.put("metadata", globalMax, metaKey);
  if (table === "categories") {
    await db.put("metadata", globalMax, "categories_last_updated");
  }
};

const ALL_TABLES: SyncTable[] = [
  "recordings",
  "categories",
  "materials",
  "speakers",
  "services",
  "languages",
  "redirects",
  "content_types",
  "venues",
  "events",
  "faq_categories",
  "faqs",
  "featured_sections",
  "featured_items",
];

self.onmessage = async (event: MessageEvent) => {
  const { type, supabaseUrl, supabaseKey, accessToken } = event.data;
  if (type !== "START_SYNC") return;

  try {
    const db = await getDB();
    if (!db) {
      postMessage({ type: "ERROR", message: "IndexedDB not available" });
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    });

    postMessage({ type: "PROGRESS", message: "Syncing..." });

    const limit = createLimiter(4);
    const changedCategoryPaths = new Set<string>();

    await Promise.all(
      ALL_TABLES.map((t) =>
        limit(() => syncTable(supabase, db, t, changedCategoryPaths)),
      ),
    );

    postMessage({
      type: "SUCCESS",
      changedCategoryPaths,
    });
  } catch (err) {
    postMessage({
      type: "ERROR",
      message: err instanceof Error ? err.message : String(err),
    });
  }
};
