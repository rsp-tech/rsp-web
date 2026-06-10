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
import type {
  Category,
  CategorySearchDocument,
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
  id: "number",
  name: "string",
  speaker_names: "string",
  venue_name: "string",
  date: "string",
  speaker_ids: "number[]",
  category_id: "number",
  lang_ids: "number[]",
  venues_id: "number",
} as const;

const categoriesSchema = {
  id: "number",
  name: "string",
  url_path: "string",
} as const;

const materialsSchema = {
  id: "number",
  name: "string",
  recording_id: "number",
} as const;

type RecordingsDb = Orama<typeof recordingsSchema>;
type CategoriesDb = Orama<typeof categoriesSchema>;
type MaterialsDb = Orama<typeof materialsSchema>;
type RecordingWhere = WhereCondition<typeof recordingsSchema>;

interface LookupMaps {
  speakers: Map<number, string>;
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

const compactNumbers = (value: number[] | null): number[] =>
  Array.isArray(value) ? value.filter((item) => Number.isFinite(item)) : [];

const mapRecording = (
  recording: Recording,
  maps: LookupMaps,
): RecordingSearchDocument => {
  const speakerIds = compactNumbers(recording.speaker_ids);
  const venueId = recording.venues_id ?? 0;

  return {
    id: recording.id,
    name: recording.name,
    speaker_names: speakerIds
      .map((id) => maps.speakers.get(id))
      .filter((name): name is string => Boolean(name))
      .join(", "),
    venue_name: maps.venues.get(venueId) ?? "",
    date: recording.recorded_at ?? "",
    speaker_ids: speakerIds,
    category_id: recording.category_id,
    lang_ids: compactNumbers(recording.lang_ids),
    venues_id: venueId,
  };
};

const mapCategory = (category: Category): CategorySearchDocument => ({
  id: category.id,
  name: category.name,
  url_path: category.url_path,
});

const mapMaterial = (material: Material): MaterialSearchDocument => ({
  id: material.id,
  name: material.name,
  recording_id: material.recording_id,
});

const loadLookupMaps = async (): Promise<LookupMaps> => {
  const db = await getDB();
  if (!db) throw new Error("IndexedDB unavailable");

  const [speakers, venues] = await Promise.all([
    db.getAll(STORE.SPEAKERS),
    db.getAll(STORE.VENUES),
  ]);

  return {
    speakers: new Map(
      speakers.map((speaker: Speaker) => [speaker.id, speaker.name]),
    ),
    venues: new Map(venues.map((venue: Venue) => [venue.id, venue.name])),
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

  const recordingDocs = recordings.map((recording) =>
    mapRecording(recording, lookupMaps),
  );
  const categoryDocs = categories.map(mapCategory);
  const materialDocs = materials.map(mapMaterial);

  await Promise.all([
    recordingDocs.length > 0
      ? insertMultiple(recordingsDb, recordingDocs)
      : Promise.resolve(),
    categoryDocs.length > 0
      ? insertMultiple(categoriesDb, categoryDocs)
      : Promise.resolve(),
    materialDocs.length > 0
      ? insertMultiple(materialsDb, materialDocs)
      : Promise.resolve(),
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

const removeMatchingDocs = async (
  db: RecordingsDb | CategoriesDb | MaterialsDb,
  targetId: number,
): Promise<void> => {
  const result = await search(db, {
    where: { id: { eq: targetId } },
    limit: 1000,
  });

  await Promise.all(result.hits.map((hit) => remove(db, hit.id)));
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
          speakers: new Map<number, string>(),
          venues: new Map<number, string>(),
        };

  for (const id of new Set(ids)) {
    const doc = await db.get(table, id);

    if (table === STORE.RECORDINGS) {
      await removeMatchingDocs(currentEngine.recordingsDb, id);
      if (doc) {
        await insert(currentEngine.recordingsDb, mapRecording(doc, lookupMaps));
      }
      continue;
    }

    if (table === STORE.CATEGORIES) {
      await removeMatchingDocs(currentEngine.categoriesDb, id);
      if (doc) {
        await insert(currentEngine.categoriesDb, mapCategory(doc));
      }
      continue;
    }

    await removeMatchingDocs(currentEngine.materialsDb, id);
    if (doc) {
      await insert(currentEngine.materialsDb, mapMaterial(doc));
    }
  }
};

const toRecordingWhere = (
  filters: SearchPayload["filters"],
): RecordingWhere | undefined => {
  if (!filters) return undefined;

  const clauses: RecordingWhere[] = [];

  if (filters.category_id !== undefined) {
    clauses.push({ category_id: { eq: filters.category_id } });
  }
  if (filters.venues_id !== undefined) {
    clauses.push({ venues_id: { eq: filters.venues_id } });
  }

  if (clauses.length === 0) return undefined;
  return clauses.length === 1 ? clauses[0] : { and: clauses };
};

const includesEvery = (values: number[], required?: number[]): boolean =>
  !required?.length || required.every((value) => values.includes(value));

const matchesRecordingFilters = (
  document: RecordingSearchDocument,
  filters: SearchPayload["filters"],
): boolean => {
  if (!filters) return true;

  return (
    includesEvery(document.speaker_ids, filters.speaker_ids) &&
    includesEvery(document.lang_ids, filters.lang_ids)
  );
};

const runSearchAll = async (payload: SearchPayload): Promise<void> => {
  const currentEngine = await getSearchEngine();
  const { term, targets, reqId, filters } = payload;
  const recordingWhere = toRecordingWhere(filters);
  const recordingLimit =
    filters?.speaker_ids?.length || filters?.lang_ids?.length
      ? SEARCH_LIMIT * 20
      : SEARCH_LIMIT;

  try {
    const results = await Promise.all(
      targets.map(async (target): Promise<SearchResult> => {
        if (target === STORE.RECORDINGS) {
          const result = await search<RecordingsDb, RecordingSearchDocument>(
            currentEngine.recordingsDb,
            {
              term,
              properties: ["name", "speaker_names", "venue_name", "date"],
              boost: {
                name: SEARCH_BOOST_NAME,
                speaker_names: SEARCH_BOOST_SPEAKER,
              },
              where: recordingWhere,
              limit: recordingLimit,
              tolerance: SEARCH_TOLERANCE,
            },
          );

          const hits = result.hits
            .map((hit) => hit.document)
            .filter((document) => matchesRecordingFilters(document, filters))
            .slice(0, SEARCH_LIMIT);

          return {
            target,
            hits,
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

          return {
            target,
            hits: result.hits.map((hit) => hit.document),
          };
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

        return {
          target,
          hits: result.hits.map((hit) => hit.document),
        };
      }),
    );

    postMessage({
      type: WORKER_MSG.SEARCH_RESULT,
      reqId,
      results: results.filter((result) => result.hits.length > 0),
    });
  } catch (err) {
    postMessage({
      type: WORKER_MSG.SEARCH_RESULT,
      reqId,
      results: [],
      error: err instanceof Error ? err.message : String(err),
    });
  }
};

self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const message = event.data;

  try {
    if (message.type === WORKER_MSG.BUILD_INDEX) {
      await rebuildSearchEngine();
      return;
    }

    if (message.type === WORKER_MSG.UPDATE_DOCS) {
      await updateDocs(message.table, message.ids);
      return;
    }

    if (message.type === WORKER_MSG.SEARCH_ALL) {
      await runSearchAll(message.payload);
    }
  } catch (err) {
    postMessage({
      type:
        message.type === WORKER_MSG.BUILD_INDEX
          ? WORKER_MSG.INDEX_ERROR
          : WORKER_MSG.ERROR,
      message: err instanceof Error ? err.message : String(err),
    });
  }
};
