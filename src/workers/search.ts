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
  SEARCH_BOOST_EVENT,
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
  Event,
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
  event_name: "string",
  date: "number",
  speaker_ids: "enum[]",
  category_id: "number",
  lang_ids: "enum[]",
  venues_id: "number",
  event_id: "number",
} as const;

const categoriesSchema = {
  id: "enum",
  name: "string",
  url_path: "string",
  path: "enum",
} as const;

const materialsSchema = {
  id: "string",
  name: "string",
  recording_id: "number",
  category_id: "number",
} as const;

type RecordingsDb = Orama<typeof recordingsSchema>;
type CategoriesDb = Orama<typeof categoriesSchema>;
type CategoryWhere = WhereCondition<typeof categoriesSchema>;
type MaterialsDb = Orama<typeof materialsSchema>;
type MaterialWhere = WhereCondition<typeof materialsSchema>;
type RecordingWhere = WhereCondition<typeof recordingsSchema>;

interface LookupMaps {
  speakers: Map<number, string>;
  languages: Map<number, string>;
  venues: Map<number, string>;
  events: Map<number, string>;
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
  const eventId = recording.event_id ?? 0;
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
    event_name: maps.events.get(eventId) ?? "",
    date: Number.isFinite(recordingTs) ? recordingTs : 0,
    speaker_ids: speakerIds,
    category_id: recording.category_id,
    lang_ids: compactNumbers(recording.lang_ids),
    venues_id: venueId,
    event_id: eventId,
  };
};

const mapCategory = (category: Category): CategorySearchDocument => ({
  id: String(category.id),
  name: category.name,
  url_path: category.url_path,
  path: category.path,
});

const mapMaterial = (
  material: Material,
  recCatIdMap: Record<number, number>,
): MaterialSearchDocument => ({
  id: String(material.id),
  name: material.name,
  recording_id: material.recording_id,
  category_id: recCatIdMap[material.recording_id] ?? 0,
});

// --- ENGINE LIFECYCLE ---
const loadLookupMaps = async (): Promise<LookupMaps> => {
  const db = await getDB();
  if (!db) throw new Error("IndexedDB unavailable");

  const [speakers, venues, languages, events] = await Promise.all([
    db.getAll(STORE.SPEAKERS),
    db.getAll(STORE.VENUES),
    db.getAll(STORE.LANGUAGES),
    db.getAll(STORE.EVENTS),
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
    events: new Map(
      events.map((e: Event) => [e.id, `${e.short_name} ${e.name}`]),
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

  const recCatIdMap = Object.fromEntries(
    recordings.map((r) => [r.id, r.category_id]),
  );
  const recordingDocs = recordings.map((r) => mapRecording(r, lookupMaps));
  const categoryDocs = categories.map(mapCategory);
  const materialDocs = materials.map((m) => mapMaterial(m, recCatIdMap));

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
      : {
          speakers: new Map(),
          venues: new Map(),
          languages: new Map(),
          events: new Map(),
        };

  const recCatIdMap =
    table === STORE.MATERIALS
      ? Object.fromEntries(
          (await db.getAll(STORE.RECORDINGS)).map((r) => [r.id, r.category_id]),
        )
      : {};

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
        if (doc)
          await insert(
            currentEngine.materialsDb,
            mapMaterial(doc, recCatIdMap),
          );
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

  if (filters.category_ids?.length) {
    clauses.push({
      or: filters.category_ids.map((id) => ({
        category_id: { eq: id },
      })),
    });
  }

  if (filters.venues_id !== undefined)
    clauses.push({ venues_id: { eq: filters.venues_id } });

  if (filters.event_id !== undefined)
    clauses.push({ event_id: { eq: filters.event_id } });

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

const VALID_REC_PROPS = [
  "name",
  "speaker_names",
  "venue_name",
  "event_name",
  "languages",
];

const runSearchAll = async (payload: SearchPayload): Promise<void> => {
  const { term, targets, reqId, filters, tolerance, exact, searchFields } =
    payload;
  const searchTolerance =
    typeof tolerance === "number" ? tolerance : SEARCH_TOLERANCE;
  const isExact = Boolean(exact);

  const activeRecProps =
    searchFields && searchFields.length > 0
      ? searchFields.filter((f) => VALID_REC_PROPS.includes(f))
      : VALID_REC_PROPS;

  const recordingProperties =
    activeRecProps.length > 0 ? activeRecProps : ["name"];

  const shouldSearchNamedStores =
    !searchFields || searchFields.includes("name");

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
              exact: isExact,
              properties: recordingProperties as Array<
                keyof RecordingSearchDocument
              >,
              boost: {
                name: SEARCH_BOOST_NAME,
                speaker_names: SEARCH_BOOST_SPEAKER,
                event_name: SEARCH_BOOST_EVENT,
              },
              where: recordingWhere,
              limit: recordingLimit,
              tolerance: searchTolerance,
            },
          );

          return {
            target,
            hits: result.hits.map((hit) => hit.document),
          };
        }

        if (target === STORE.CATEGORIES) {
          if (!shouldSearchNamedStores) {
            return { target, hits: [] };
          }
          const clauses: CategoryWhere[] = [];
          if (filters?.category_path !== undefined) {
            clauses.push({ path: { eq: filters.category_path } });
          }
          if (filters?.category_ids?.length) {
            clauses.push({
              or: filters.category_ids.map((id) => ({
                id: { eq: String(id) },
              })),
            });
          }
          const categoryWhere =
            clauses.length === 0
              ? undefined
              : clauses.length === 1
                ? clauses[0]
                : { and: clauses };

          const result = await search<CategoriesDb, CategorySearchDocument>(
            currentEngine.categoriesDb,
            {
              term,
              exact: isExact,
              properties: ["name"],
              boost: { name: SEARCH_BOOST_NAME },
              where: categoryWhere,
              limit: SEARCH_LIMIT,
              tolerance: searchTolerance,
            },
          );
          return { target, hits: result.hits.map((hit) => hit.document) };
        }

        if (!shouldSearchNamedStores) {
          return { target, hits: [] };
        }

        const clauses: MaterialWhere[] = [];

        if (filters?.category_id !== undefined)
          clauses.push({ category_id: { eq: filters.category_id } });

        if (filters?.category_ids?.length) {
          clauses.push({
            or: filters.category_ids.map((id) => ({
              category_id: { eq: id },
            })),
          });
        }

        const materialWhere =
          clauses.length === 0
            ? undefined
            : clauses.length === 1
              ? clauses[0]
              : { and: clauses };

        const result = await search<MaterialsDb, MaterialSearchDocument>(
          currentEngine.materialsDb,
          {
            term,
            exact: isExact,
            properties: ["name"],
            limit: SEARCH_LIMIT,
            tolerance: searchTolerance,
            where: materialWhere,
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
