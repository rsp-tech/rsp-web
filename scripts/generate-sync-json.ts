import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Error: Supabase environment variables are missing.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  db: { schema: "prod" },
});

const PUBLIC_SYNC_DIR = path.join(process.cwd(), "public", "sync");
const CHUNK_SIZE = 2000;

interface DatabaseRow {
  id: number | string;
  [key: string]: unknown;
}

// Helper to fetch all rows for a table with pagination
async function fetchTableData(
  table: string,
  columns: string,
): Promise<DatabaseRow[]> {
  let allRows: DatabaseRow[] = [];
  let from = 0;
  const pageSize = 1000;

  console.log(`Fetching data for table: ${table}...`);

  while (true) {
    const { data, error } = await supabase
      .from(table)
      .select(columns)
      .order("id", { ascending: true })
      .range(from, from + pageSize - 1);

    if (error) {
      console.error(`Error fetching ${table}:`, error.message);
      throw error;
    }

    if (!data || data.length === 0) break;

    allRows = allRows.concat(data as unknown as DatabaseRow[]);
    if (data.length < pageSize) break;
    from += pageSize;
  }

  console.log(`Fetched ${allRows.length} rows for ${table}.`);
  return allRows;
}

async function main() {
  try {
    // Create directory if not exists
    if (!fs.existsSync(PUBLIC_SYNC_DIR)) {
      fs.mkdirSync(PUBLIC_SYNC_DIR, { recursive: true });
    }

    // 0. Fetch sync_meta watermarks from Supabase
    console.log("Fetching sync_meta watermarks from Supabase...");
    const { data: syncMetaRows, error: syncMetaError } = await supabase
      .from("sync_meta")
      .select("id, updated_at");

    if (syncMetaError) {
      throw new Error(`Failed to fetch sync_meta: ${syncMetaError.message}`);
    }

    const syncMetaMap = new Map<string, string>();
    for (const row of syncMetaRows || []) {
      syncMetaMap.set(row.id, row.updated_at);
    }
    console.log(`Loaded ${syncMetaMap.size} table watermarks from sync_meta.`);

    const manifest: {
      generated_at: string;
      files: {
        name: string;
        tables: {
          [table: string]: {
            count: number;
            max_updated_at: string | null;
          };
        };
      }[];
    } = {
      generated_at: new Date().toISOString(),
      files: [],
    };

    // 1. Categories
    const categories = await fetchTableData(
      "categories",
      "id, allowed_roles, img_id, name, order_ind, path, url_path",
    );
    const categoriesMaxUpdate = syncMetaMap.get("categories") || null;
    const categoriesFile = "categories.json";
    fs.writeFileSync(
      path.join(PUBLIC_SYNC_DIR, categoriesFile),
      JSON.stringify({
        table: "categories",
        updated_at: categoriesMaxUpdate,
        data: categories,
      }),
    );
    manifest.files.push({
      name: categoriesFile,
      tables: {
        categories: {
          count: categories.length,
          max_updated_at: categoriesMaxUpdate,
        },
      },
    });

    // 2. Recordings (Chunked)
    const recordings = await fetchTableData(
      "recordings",
      "id, allowed_roles, audio_id, category_id, event_id, lang_ids, name, order_ind, recorded_at, speaker_ids, type_id, venues_id, yt_id",
    );
    const recordingsMaxUpdate = syncMetaMap.get("recordings") || null;
    const totalRecordings = recordings.length;
    let chunkIndex = 1;

    for (let i = 0; i < totalRecordings; i += CHUNK_SIZE) {
      const chunk = recordings.slice(i, i + CHUNK_SIZE);
      const chunkFile = `recordings-${chunkIndex}.json`;
      fs.writeFileSync(
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

    // 3. Materials
    const materials = await fetchTableData(
      "materials",
      "id, allowed_roles, name, recording_id, uri, type",
    );
    const materialsMaxUpdate = syncMetaMap.get("materials") || null;
    const materialsFile = "materials.json";
    fs.writeFileSync(
      path.join(PUBLIC_SYNC_DIR, materialsFile),
      JSON.stringify({
        table: "materials",
        updated_at: materialsMaxUpdate,
        data: materials,
      }),
    );
    manifest.files.push({
      name: materialsFile,
      tables: {
        materials: {
          count: materials.length,
          max_updated_at: materialsMaxUpdate,
        },
      },
    });

    // 4. General Metadata (speakers, venues, languages, content_types, events, services, redirects, featured_sections, featured_items)
    const metadataTables = [
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

    const metadataData: { [table: string]: DatabaseRow[] } = {};
    const metadataMaxUpdates: { [table: string]: string | null } = {};
    const metadataTablesManifest: {
      [table: string]: { count: number; max_updated_at: string | null };
    } = {};

    for (const t of metadataTables) {
      const rows = await fetchTableData(t.name, t.columns);
      const maxUpdate = syncMetaMap.get(t.name) || null;
      metadataData[t.name] = rows;
      metadataMaxUpdates[t.name] = maxUpdate;
      metadataTablesManifest[t.name] = {
        count: rows.length,
        max_updated_at: maxUpdate,
      };
    }

    const metadataFile = "metadata.json";
    fs.writeFileSync(
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

    // 5. FAQs
    const faqCategories = await fetchTableData(
      "faq_categories",
      "id, name, order_ind, slug",
    );
    const faqs = await fetchTableData(
      "faqs",
      "id, category_id, answer, question, is_published, order_ind",
    );
    const faqCategoriesMaxUpdate = syncMetaMap.get("faq_categories") || null;
    const faqsMaxUpdate = syncMetaMap.get("faqs") || null;

    const faqsFile = "faqs.json";
    fs.writeFileSync(
      path.join(PUBLIC_SYNC_DIR, faqsFile),
      JSON.stringify({
        updated_at: {
          faq_categories: faqCategoriesMaxUpdate,
          faqs: faqsMaxUpdate,
        },
        data: {
          faq_categories: faqCategories,
          faqs: faqs,
        },
      }),
    );
    manifest.files.push({
      name: faqsFile,
      tables: {
        faq_categories: {
          count: faqCategories.length,
          max_updated_at: faqCategoriesMaxUpdate,
        },
        faqs: {
          count: faqs.length,
          max_updated_at: faqsMaxUpdate,
        },
      },
    });

    // 6. Write Manifest
    fs.writeFileSync(
      path.join(PUBLIC_SYNC_DIR, "manifest.json"),
      JSON.stringify(manifest, null, 2),
    );

    console.log(
      "Successfully generated all static sync JSON files and manifest!",
    );
  } catch (err) {
    console.error("Failed to generate sync JSON files:", err);
    process.exit(1);
  }
}

main();
