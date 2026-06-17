import {
  create,
  insert,
  insertMultiple,
  type Orama,
  remove,
  search,
  type WhereCondition,
} from "@orama/orama";
import {
  SEARCH_BOOST_NAME,
  SEARCH_BOOST_SPEAKER,
  SEARCH_LIMIT,
  SEARCH_TOLERANCE,
  STORE,
  WORKER_MSG,
} from "@/constants";
import { getDB } from "@/lib/idb";
import { errorMessage } from "@/lib/utils";
import type {
  Category,
  CategorySearchDocument,
  Language,
  Material,
  MaterialSearchDocument,
  Recording,
  RecordingSearchDocument,
  SearchableTable,
  SearchPayload,
  SearchResult,
  Speaker,
  Venue,
} from "@/types";

const recordingsSchema = {
  id: "string",
  name: "string",
  speaker_names: "string",
  languages: "string",
  venue_name: "string",
  date: "number",
  speaker_ids: "enum[]",
  category_id: "number",
  lang_ids: "enum[]",
  venues_id: "number",
} as const;

const categoriesSchema = {
  id: "string",
  name: "string",
  url_path: "string",
} as const;

const materialsSchema = {
  id: "string",
  name: "string",
  recording_id: "number",
} as const;

type RecordingsDb = Orama<typeof recordingsSchema>;
type CategoriesDb = Orama<typeof categoriesSchema>;
type MaterialsDb = Orama<typeof materialsSchema>;
type RecordingWhere = WhereCondition<typeof recordingsSchema>;

interface LookupMaps {
  speakers: Map<number, string>;
  languages: Map<number, string>;
  venues: Map<number, string>;
}

interface SearchEngine {
  recordingsDb: RecordingsDb;
  categoriesDb: CategoriesDb;
  materialsDb: MaterialsDb;
}

type WorkerMessage =
  | { type: typeof WORKER_MSG.BUILD_INDEX }
  | {
      type: typeof WORKER_MSG.UPDATE_DOCS;
      table: SearchableTable;
      ids: number[];
    }
  | { type: typeof WORKER_MSG.SEARCH_ALL; payload: SearchPayload };

let engine: SearchEngine | null = null;
let buildPromise: Promise<SearchEngine> | null = null;

// --- MAPPERS ---
const compactNumbers = (value: number[] | null): number[] =>
  Array.isArray(value) ? value.filter(Number.isFinite) : [];

const mapRecording = (
  recording: Recording,
  maps: LookupMaps,
): RecordingSearchDocument => {
  const speakerIds = compactNumbers(recording.speaker_ids);
  const venueId = recording.venues_id ?? 0;
  const recordingTs = Date.parse(recording.recorded_at ?? "");
  return {
    id: String(recording.id),
    name: recording.name,
    speaker_names: speakerIds
      .map((id) => maps.speakers.get(id))
      .filter(Boolean)
      .join(", "),
    languages:
      recording.lang_ids?.map((id) => maps.languages.get(id)).join(", ") ?? "",
    venue_name: maps.venues.get(venueId) ?? "",
    date: Number.isFinite(recordingTs) ? recordingTs : 0,
    speaker_ids: speakerIds,
    category_id: recording.category_id,
    lang_ids: compactNumbers(recording.lang_ids),
    venues_id: venueId,
  };
};

const mapCategory = (category: Category): CategorySearchDocument => ({
  id: String(category.id),
  name: category.name,
  url_path: category.url_path,
});

const mapMaterial = (material: Material): MaterialSearchDocument => ({
  id: String(material.id),
  name: material.name,
  recording_id: material.recording_id,
});

// --- ENGINE LIFECYCLE ---
const loadLookupMaps = async (): Promise<LookupMaps> => {
  const db = await getDB();
  if (!db) throw new Error("IndexedDB unavailable");

  const [speakers, venues, languages] = await Promise.all([
    db.getAll(STORE.SPEAKERS),
    db.getAll(STORE.VENUES),
    db.getAll(STORE.LANGUAGES),
  ]);

  return {
    speakers: new Map(speakers.map((s: Speaker) => [s.id, s.name])),
    venues: new Map(venues.map((v: Venue) => [v.id, v.name])),
    languages: new Map(
      languages.map((l: Language) => [
        l.id,
        l.name === l.native_name ? `${l.name} (${l.native_name})` : l.name,
      ]),
    ),
  };
};

const createSearchEngine = async (): Promise<SearchEngine> => {
  const db = await getDB();
  if (!db) throw new Error("IndexedDB unavailable");

  const [recordingsDb, categoriesDb, materialsDb] = await Promise.all([
    create({ schema: recordingsSchema }),
    create({ schema: categoriesSchema }),
    create({ schema: materialsSchema }),
  ]);

  const [recordings, categories, materials, lookupMaps] = await Promise.all([
    db.getAll(STORE.RECORDINGS),
    db.getAll(STORE.CATEGORIES),
    db.getAll(STORE.MATERIALS),
    loadLookupMaps(),
  ]);

  const recordingDocs = recordings.map((r) => mapRecording(r, lookupMaps));
  const categoryDocs = categories.map(mapCategory);
  const materialDocs = materials.map(mapMaterial);

  await Promise.all([
    recordingDocs.length && insertMultiple(recordingsDb, recordingDocs),
    categoryDocs.length && insertMultiple(categoriesDb, categoryDocs),
    materialDocs.length && insertMultiple(materialsDb, materialDocs),
  ]);

  postMessage({ type: WORKER_MSG.INDEX_READY, count: recordingDocs.length });
  return { recordingsDb, categoriesDb, materialsDb };
};

const rebuildSearchEngine = async (): Promise<SearchEngine> => {
  buildPromise = createSearchEngine();
  try {
    engine = await buildPromise;
    return engine;
  } finally {
    buildPromise = null;
  }
};

const getSearchEngine = async (): Promise<SearchEngine> => {
  if (engine) return engine;
  if (buildPromise) return buildPromise;
  return rebuildSearchEngine();
};

// --- DATA SYNC ---
const safeRemove = async (
  db: RecordingsDb | CategoriesDb | MaterialsDb,
  id: string,
) => {
  try {
    await remove(db, id);
  } catch {
    // Orama throws if document doesn't exist. Safely ignore during delta syncs.
  }
};

const updateDocs = async (
  table: SearchableTable,
  ids: number[],
): Promise<void> => {
  const currentEngine = await getSearchEngine();
  const db = await getDB();
  if (!db) throw new Error("IndexedDB unavailable");

  const lookupMaps =
    table === STORE.RECORDINGS
      ? await loadLookupMaps()
      : { speakers: new Map(), venues: new Map(), languages: new Map() };

  await Promise.all(
    Array.from(new Set(ids)).map(async (id) => {
      const stringId = String(id);
      const doc = await db.get(table, id);

      if (table === STORE.RECORDINGS) {
        await safeRemove(currentEngine.recordingsDb, stringId);
        if (doc)
          await insert(
            currentEngine.recordingsDb,
            mapRecording(doc, lookupMaps),
          );
      } else if (table === STORE.CATEGORIES) {
        await safeRemove(currentEngine.categoriesDb, stringId);
        if (doc) await insert(currentEngine.categoriesDb, mapCategory(doc));
      } else if (table === STORE.MATERIALS) {
        await safeRemove(currentEngine.materialsDb, stringId);
        if (doc) await insert(currentEngine.materialsDb, mapMaterial(doc));
      }
    }),
  );
};

// --- SEARCH LOGIC ---
const MAX_DATE = new Date("9999-12-31").getTime();
const toRecordingWhere = (
  filters: SearchPayload["filters"],
): RecordingWhere | undefined => {
  if (!filters) return undefined;
  const clauses: RecordingWhere[] = [];

  if (filters.category_id !== undefined)
    clauses.push({ category_id: { eq: filters.category_id } });
  if (filters.venues_id !== undefined)
    clauses.push({ venues_id: { eq: filters.venues_id } });

  if (filters.speaker_ids?.length) {
    clauses.push({ speaker_ids: { containsAll: filters.speaker_ids } });
  }

  if (filters.lang_ids?.length) {
    clauses.push({ lang_ids: { containsAll: filters.lang_ids } });
  }

  if (filters.date_start || filters.date_end) {
    const startTs = filters.date_start ? Date.parse(filters.date_start) : 0;
    const endTs = filters.date_end ? Date.parse(filters.date_end) : MAX_DATE;
    clauses.push({
      date: {
        between: [startTs, endTs],
      },
    });
  }

  if (!clauses.length) return undefined;
  return clauses.length === 1 ? clauses[0] : { and: clauses };
};

const runSearchAll = async (payload: SearchPayload): Promise<void> => {
  const { term, targets, reqId, filters } = payload;

  try {
    const currentEngine = await getSearchEngine();
    const recordingWhere = toRecordingWhere(filters);
    // Inflate limit if doing client-side array intersections
    const recordingLimit = SEARCH_LIMIT;

    const results = await Promise.all(
      targets.map(async (target): Promise<SearchResult> => {
        if (target === STORE.RECORDINGS) {
          const result = await search<RecordingsDb, RecordingSearchDocument>(
            currentEngine.recordingsDb,
            {
              term,
              properties: ["name", "speaker_names", "venue_name", "languages"],
              boost: {
                name: SEARCH_BOOST_NAME,
                speaker_names: SEARCH_BOOST_SPEAKER,
              },
              where: recordingWhere,
              limit: recordingLimit,
              tolerance: SEARCH_TOLERANCE,
            },
          );

          return {
            target,
            hits: result.hits.map((hit) => hit.document),
          };
        }

        if (target === STORE.CATEGORIES) {
          const result = await search<CategoriesDb, CategorySearchDocument>(
            currentEngine.categoriesDb,
            {
              term,
              properties: ["name"],
              boost: { name: SEARCH_BOOST_NAME },
              limit: SEARCH_LIMIT,
              tolerance: SEARCH_TOLERANCE,
            },
          );
          return { target, hits: result.hits.map((hit) => hit.document) };
        }

        const result = await search<MaterialsDb, MaterialSearchDocument>(
          currentEngine.materialsDb,
          {
            term,
            properties: ["name"],
            limit: SEARCH_LIMIT,
            tolerance: SEARCH_TOLERANCE,
          },
        );
        return { target, hits: result.hits.map((hit) => hit.document) };
      }),
    );

    postMessage({
      type: WORKER_MSG.SEARCH_RESULT,
      reqId,
      results: results.filter((r) => r.hits.length > 0),
    });
  } catch (err) {
    // Crucial: Catch inner errors to ensure the reqId is resolved on the main thread
    postMessage({
      type: WORKER_MSG.SEARCH_RESULT,
      reqId,
      results: [],
      error: err instanceof Error ? err.message : String(err),
    });
  }
};

// --- WORKER ENTRY ---
self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const message = event.data;
  try {
    if (message.type === WORKER_MSG.BUILD_INDEX) await rebuildSearchEngine();
    else if (message.type === WORKER_MSG.UPDATE_DOCS)
      await updateDocs(message.table, message.ids);
    else if (message.type === WORKER_MSG.SEARCH_ALL)
      await runSearchAll(message.payload);
  } catch (err) {
    postMessage({
      type:
        message.type === WORKER_MSG.BUILD_INDEX
          ? WORKER_MSG.INDEX_ERROR
          : WORKER_MSG.ERROR,
      message: errorMessage(err),
    });
  }
};
