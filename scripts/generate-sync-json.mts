import fs from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/database.types";
import type { SyncManifest } from "../src/workers/utils";

// Initialize Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Error: Supabase environment variables are missing.");
  process.exit(1);
}

const supabase = createClient<Database, "prod">(supabaseUrl, supabaseKey, {
  db: { schema: "prod" },
});

const PUBLIC_SYNC_DIR = path.join(process.cwd(), "public", "sync");
const CHUNK_SIZE = 2000;

type TableName = keyof Database["prod"]["Tables"];
interface DatabaseRow {
  id: number | string;
  [key: string]: unknown;
}

interface MetadataJson {
  updated_at: Record<string, string | null>;
  data: Record<string, DatabaseRow[]>;
}

interface FaqsJson {
  updated_at: {
    faq_categories: string | null;
    faqs: string | null;
  };
  data: {
    faq_categories: DatabaseRow[];
    faqs: DatabaseRow[];
  };
}

// Helper to fetch all rows for a table with pagination and incremental filter
async function fetchTableData<T extends TableName>(
  table: T,
  columns: string,
  lastSync: string | null,
  watermark: string | null,
): Promise<DatabaseRow[]> {
  const allRows: DatabaseRow[] = [];
  let from = 0;
  const pageSize = 1000;

  console.log(
    `Fetching data for table: ${table} from lastSync: ${lastSync} up to watermark: ${watermark}...`,
  );

  while (true) {
    let query = supabase
      .from(table)
      .select(columns)
      .order("updated_at", { ascending: true })
      .order("id", { ascending: true })
      .range(from, from + pageSize - 1);

    if (watermark) {
      query = query.not("updated_at", "is", null).lte("updated_at", watermark);
    }
    if (lastSync) {
      query = query.gt("updated_at", lastSync);
    }

    const { data, error } = await query;

    if (error) {
      console.error(`Error fetching ${table}:`, error.message);
      throw error;
    }

    if (!data?.length) break;

    data.forEach((row) => {
      allRows.push(row as unknown as DatabaseRow);
    });

    if (data.length < pageSize) break;
    from += pageSize;
  }

  console.log(`Fetched ${allRows.length} incremental rows for ${table}.`);
  return allRows;
}

// Helper to merge existing rows and newly fetched incoming rows
function mergeRows(
  existing: DatabaseRow[],
  incoming: DatabaseRow[],
): DatabaseRow[] {
  const map = new Map<string | number, DatabaseRow>();
  for (const row of existing) {
    map.set(row.id, row);
  }
  for (const row of incoming) {
    map.set(row.id, row);
  }
  return Array.from(map.values()).sort((a, b) => {
    if (typeof a.id === "number" && typeof b.id === "number") {
      return a.id - b.id;
    }
    return String(a.id).localeCompare(String(b.id));
  });
}

async function main() {
  try {
    // Create directory if not exists
    try {
      await fs.access(PUBLIC_SYNC_DIR);
    } catch {
      await fs.mkdir(PUBLIC_SYNC_DIR, { recursive: true });
    }

    // 0. Fetch sync_meta watermarks from Supabase
    console.log("Fetching sync_meta watermarks from Supabase...");
    const { data: syncMetaRows, error: syncMetaError } = await supabase
      .from("sync_meta")
      .select("id, updated_at");

    if (syncMetaError) {
      throw new Error(`Failed to fetch sync_meta: ${syncMetaError.message}`);
    }

    const syncMetaMap = Object.fromEntries(
      syncMetaRows.map((row) => [row.id, row.updated_at] as const),
    );
    console.log(
      `Loaded ${Object.keys(syncMetaMap).length} table watermarks from sync_meta.`,
    );

    // Load existing manifest if it exists
    const manifestPath = path.join(PUBLIC_SYNC_DIR, "manifest.json");
    let existingManifest: SyncManifest | null = null;
    try {
      const manifestContent = await fs.readFile(manifestPath, "utf-8");
      existingManifest = JSON.parse(manifestContent);
      console.log("Loaded existing sync manifest for incremental check.");
    } catch {
      console.log(
        "No valid existing manifest found. Performing full seed generation.",
      );
    }

    const manifest: SyncManifest = {
      generated_at: new Date().toISOString(),
      files: [],
    };

    // Helper to check if a file can be reused
    const isFileUpToDate = async (
      fileName: string,
      tablesToCheck: string[],
    ) => {
      if (!existingManifest) return false;
      try {
        await fs.access(path.join(PUBLIC_SYNC_DIR, fileName));
      } catch {
        return false;
      }
      const fileEntry = existingManifest.files?.find(
        (f) => f.name === fileName,
      );
      if (!fileEntry?.tables) return false;

      for (const table of tablesToCheck) {
        const tableMeta = fileEntry.tables[table];
        if (!tableMeta) return false;
        const currentWatermark = syncMetaMap[table] || null;
        if (tableMeta.max_updated_at !== currentWatermark) {
          return false;
        }
      }
      return true;
    };

    // 1. Categories
    const categoriesFile = "categories.json";
    const categoriesMaxUpdate = syncMetaMap.categories || null;
    const existingCategoriesEntry = existingManifest?.files.find(
      (f) => f.name === categoriesFile,
    );
    const categoriesLastSync =
      existingCategoriesEntry?.tables?.categories?.max_updated_at || null;

    if (await isFileUpToDate(categoriesFile, ["categories"])) {
      console.log(`categories.json is up-to-date. Skipping generation.`);
      if (existingCategoriesEntry) {
        manifest.files.push(existingCategoriesEntry);
      }
    } else {
      let existingCategories: DatabaseRow[] = [];
      if (categoriesLastSync) {
        try {
          const content = await fs.readFile(
            path.join(PUBLIC_SYNC_DIR, categoriesFile),
            "utf-8",
          );
          existingCategories = JSON.parse(content).data || [];
        } catch {
          console.log(
            `Could not load existing categories.json, doing full fetch.`,
          );
        }
      }

      const incoming = await fetchTableData(
        "categories",
        "id, allowed_roles, img_id, name, order_ind, path, url_path",
        existingCategories.length > 0 ? categoriesLastSync : null,
        categoriesMaxUpdate,
      );

      const merged = mergeRows(existingCategories, incoming);

      await fs.writeFile(
        path.join(PUBLIC_SYNC_DIR, categoriesFile),
        JSON.stringify({
          table: "categories",
          updated_at: categoriesMaxUpdate,
          data: merged,
        }),
      );
      manifest.files.push({
        name: categoriesFile,
        tables: {
          categories: {
            count: merged.length,
            max_updated_at: categoriesMaxUpdate,
          },
        },
      });
    }

    // 2. Recordings (Chunked)
    const recordingsMaxUpdate = syncMetaMap.recordings || null;
    const existingRecordingFiles =
      existingManifest?.files?.filter((f) =>
        f.name.startsWith("recordings-"),
      ) || [];
    // Sort them by chunk index to keep order
    existingRecordingFiles.sort((a, b) => {
      const idxA = parseInt(
        a.name.replace("recordings-", "").replace(".json", ""),
        10,
      );
      const idxB = parseInt(
        b.name.replace("recordings-", "").replace(".json", ""),
        10,
      );
      return idxA - idxB;
    });

    const recordingsLastSync =
      existingRecordingFiles[0]?.tables?.recordings?.max_updated_at || null;
    let recordingsUpToDate = false;

    if (existingRecordingFiles.length > 0) {
      let allChunksValid = true;
      for (const fileEntry of existingRecordingFiles) {
        try {
          await fs.access(path.join(PUBLIC_SYNC_DIR, fileEntry.name));
          const tableMeta = fileEntry.tables?.recordings;
          if (!tableMeta || tableMeta.max_updated_at !== recordingsMaxUpdate) {
            allChunksValid = false;
            break;
          }
        } catch {
          allChunksValid = false;
          break;
        }
      }
      if (allChunksValid) {
        recordingsUpToDate = true;
      }
    }

    if (recordingsUpToDate) {
      console.log("All recordings chunks are up-to-date. Skipping generation.");
      manifest.files.push(...existingRecordingFiles);
    } else {
      let existingRecordings: DatabaseRow[] = [];
      if (recordingsLastSync) {
        try {
          for (const fileEntry of existingRecordingFiles) {
            const content = await fs.readFile(
              path.join(PUBLIC_SYNC_DIR, fileEntry.name),
              "utf-8",
            );
            const chunkData = JSON.parse(content).data || [];
            existingRecordings = existingRecordings.concat(chunkData);
          }
        } catch {
          console.log(
            `Could not load all existing recordings chunks, doing full fetch.`,
          );
          existingRecordings = [];
        }
      }

      const incoming = await fetchTableData(
        "recordings",
        "id, allowed_roles, audio_id, category_id, event_id, lang_ids, name, order_ind, recorded_at, speaker_ids, type_id, venues_id, yt_id",
        existingRecordings.length > 0 ? recordingsLastSync : null,
        recordingsMaxUpdate,
      );

      const merged = mergeRows(existingRecordings, incoming);
      const totalRecordings = merged.length;
      let chunkIndex = 1;

      // Delete old recording chunk files first to avoid orphaned files
      for (const fileEntry of existingRecordingFiles) {
        try {
          await fs.unlink(path.join(PUBLIC_SYNC_DIR, fileEntry.name));
        } catch {}
      }

      for (let i = 0; i < totalRecordings; i += CHUNK_SIZE) {
        const chunk = merged.slice(i, i + CHUNK_SIZE);
        const chunkFile = `recordings-${chunkIndex}.json`;
        await fs.writeFile(
          path.join(PUBLIC_SYNC_DIR, chunkFile),
          JSON.stringify({
            table: "recordings",
            updated_at: recordingsMaxUpdate,
            data: chunk,
          }),
        );
        manifest.files.push({
          name: chunkFile,
          tables: {
            recordings: {
              count: chunk.length,
              max_updated_at: recordingsMaxUpdate,
            },
          },
        });
        chunkIndex++;
      }
    }

    // 3. Materials
    const materialsFile = "materials.json";
    const materialsMaxUpdate = syncMetaMap.materials || null;
    const existingMaterialsEntry = existingManifest?.files?.find(
      (f) => f.name === materialsFile,
    );
    const materialsLastSync =
      existingMaterialsEntry?.tables?.materials?.max_updated_at || null;

    if (await isFileUpToDate(materialsFile, ["materials"])) {
      console.log(`materials.json is up-to-date. Skipping generation.`);
      if (existingMaterialsEntry) {
        manifest.files.push(existingMaterialsEntry);
      }
    } else {
      let existingMaterials: DatabaseRow[] = [];
      if (materialsLastSync) {
        try {
          const content = await fs.readFile(
            path.join(PUBLIC_SYNC_DIR, materialsFile),
            "utf-8",
          );
          existingMaterials = JSON.parse(content).data || [];
        } catch {
          console.log(
            `Could not load existing materials.json, doing full fetch.`,
          );
        }
      }

      const incoming = await fetchTableData(
        "materials",
        "id, allowed_roles, name, recording_id, uri, type",
        existingMaterials.length > 0 ? materialsLastSync : null,
        materialsMaxUpdate,
      );

      const merged = mergeRows(existingMaterials, incoming);

      await fs.writeFile(
        path.join(PUBLIC_SYNC_DIR, materialsFile),
        JSON.stringify({
          table: "materials",
          updated_at: materialsMaxUpdate,
          data: merged,
        }),
      );
      manifest.files.push({
        name: materialsFile,
        tables: {
          materials: {
            count: merged.length,
            max_updated_at: materialsMaxUpdate,
          },
        },
      });
    }

    // 4. General Metadata
    const metadataTables: { name: TableName; columns: string }[] = [
      { name: "speakers", columns: "id, name" },
      { name: "venues", columns: "id, name" },
      { name: "languages", columns: "id, name, native_name" },
      { name: "content_types", columns: "id, name" },
      { name: "events", columns: "id, name, short_name" },
      {
        name: "services",
        columns:
          "id, created_at, description, is_public, name, order_ind, type",
      },
      { name: "redirects", columns: "id, to_path" },
      {
        name: "featured_sections",
        columns: "id, title, layout, is_active, order_ind",
      },
      {
        name: "featured_items",
        columns: "id, entity_id, entity_type, order_ind, section_id",
      },
    ];

    const metadataTablesList = metadataTables.map((t) => t.name);
    const metadataFile = "metadata.json";
    const existingMetadataEntry = existingManifest?.files?.find(
      (f) => f.name === metadataFile,
    );

    if (await isFileUpToDate(metadataFile, metadataTablesList)) {
      console.log("metadata.json is up-to-date. Skipping generation.");
      if (existingMetadataEntry) {
        manifest.files.push(existingMetadataEntry);
      }
    } else {
      let existingMetadataContent: MetadataJson | null = null;
      try {
        const content = await fs.readFile(
          path.join(PUBLIC_SYNC_DIR, metadataFile),
          "utf-8",
        );
        existingMetadataContent = JSON.parse(content);
      } catch {
        console.log(
          `Could not load existing metadata.json, will fetch full tables where needed.`,
        );
      }

      const metadataData: { [table: string]: DatabaseRow[] } = {};
      const metadataMaxUpdates: { [table: string]: string | null } = {};
      const metadataTablesManifest: {
        [table: string]: { count: number; max_updated_at: string | null };
      } = {};

      for (const t of metadataTables) {
        const maxUpdate = syncMetaMap[t.name] || null;
        const lastSync =
          existingMetadataEntry?.tables?.[t.name]?.max_updated_at || null;
        let existingTableRows: DatabaseRow[] = [];

        if (lastSync && existingMetadataContent?.data?.[t.name]) {
          existingTableRows = existingMetadataContent.data[t.name];
        }

        const incoming = await fetchTableData(
          t.name,
          t.columns,
          existingTableRows.length > 0 ? lastSync : null,
          maxUpdate,
        );

        const merged = mergeRows(existingTableRows, incoming);
        metadataData[t.name] = merged;
        metadataMaxUpdates[t.name] = maxUpdate;
        metadataTablesManifest[t.name] = {
          count: merged.length,
          max_updated_at: maxUpdate,
        };
      }

      await fs.writeFile(
        path.join(PUBLIC_SYNC_DIR, metadataFile),
        JSON.stringify({
          updated_at: metadataMaxUpdates,
          data: metadataData,
        }),
      );
      manifest.files.push({
        name: metadataFile,
        tables: metadataTablesManifest,
      });
    }

    // 5. FAQs
    const faqsFile = "faqs.json";
    const existingFaqsEntry = existingManifest?.files?.find(
      (f) => f.name === faqsFile,
    );

    if (await isFileUpToDate(faqsFile, ["faq_categories", "faqs"])) {
      console.log("faqs.json is up-to-date. Skipping generation.");
      if (existingFaqsEntry) {
        manifest.files.push(existingFaqsEntry);
      }
    } else {
      let existingFaqsContent: FaqsJson | null = null;
      try {
        const content = await fs.readFile(
          path.join(PUBLIC_SYNC_DIR, faqsFile),
          "utf-8",
        );
        existingFaqsContent = JSON.parse(content);
      } catch {
        console.log(
          `Could not load existing faqs.json, will fetch full tables where needed.`,
        );
      }

      const faqCategoriesMaxUpdate = syncMetaMap.faq_categories || null;
      const faqsMaxUpdate = syncMetaMap.faqs || null;

      const faqCategoriesLastSync =
        existingFaqsEntry?.tables?.faq_categories?.max_updated_at || null;
      const faqsLastSync =
        existingFaqsEntry?.tables?.faqs?.max_updated_at || null;

      let existingFaqCategories: DatabaseRow[] = [];
      let existingFaqs: DatabaseRow[] = [];

      if (faqCategoriesLastSync && existingFaqsContent?.data?.faq_categories) {
        existingFaqCategories = existingFaqsContent.data.faq_categories;
      }
      if (faqsLastSync && existingFaqsContent?.data?.faqs) {
        existingFaqs = existingFaqsContent.data.faqs;
      }

      const faqCategoriesIncoming = await fetchTableData(
        "faq_categories",
        "id, name, order_ind, slug",
        existingFaqCategories.length > 0 ? faqCategoriesLastSync : null,
        faqCategoriesMaxUpdate,
      );

      const faqsIncoming = await fetchTableData(
        "faqs",
        "id, category_id, answer, question, is_published, order_ind",
        existingFaqs.length > 0 ? faqsLastSync : null,
        faqsMaxUpdate,
      );

      const mergedFaqCategories = mergeRows(
        existingFaqCategories,
        faqCategoriesIncoming,
      );
      const mergedFaqs = mergeRows(existingFaqs, faqsIncoming);

      await fs.writeFile(
        path.join(PUBLIC_SYNC_DIR, faqsFile),
        JSON.stringify({
          updated_at: {
            faq_categories: faqCategoriesMaxUpdate,
            faqs: faqsMaxUpdate,
          },
          data: {
            faq_categories: mergedFaqCategories,
            faqs: mergedFaqs,
          },
        }),
      );
      manifest.files.push({
        name: faqsFile,
        tables: {
          faq_categories: {
            count: mergedFaqCategories.length,
            max_updated_at: faqCategoriesMaxUpdate,
          },
          faqs: {
            count: mergedFaqs.length,
            max_updated_at: faqsMaxUpdate,
          },
        },
      });
    }

    // 6. Write Manifest
    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));

    console.log(
      "Successfully checked and updated static sync JSON files and manifest!",
    );
  } catch (err) {
    console.error("Failed to generate sync JSON files:", err);
    process.exit(1);
  }
}

main();
