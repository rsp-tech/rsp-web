import { useEffect, useMemo, useState } from "react";
import { STORE } from "@/constants";
import { useSearch } from "@/hooks/use-search";
import { getDB } from "@/lib/idb";
import { categoryPath } from "@/lib/utils";
import type {
  Category,
  CategorySearchDocument,
  MaterialSearchDocument,
  Recording,
  RecordingSearchDocument,
} from "@/types";

export interface MentionEntity {
  id: string;
  name: string;
  type: "recording" | "category" | "material";
  subtitle: string;
  url: string;
}

export type MentionFilterScope =
  | "all"
  | "recordings"
  | "categories"
  | "materials";

export type MentionSearchFieldKey =
  | "speaker_names"
  | "event_name"
  | "venue_name";

export const MENTION_SEARCH_FIELDS: {
  id: MentionSearchFieldKey;
  label: string;
}[] = [
  { id: "speaker_names", label: "Speakers" },
  { id: "event_name", label: "Events" },
  { id: "venue_name", label: "Venues" },
];

export const useMentionSearch = (isOpen: boolean) => {
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionResults, setMentionResults] = useState<MentionEntity[]>([]);
  const [searchingMentions, setSearchingMentions] = useState(false);
  const [mentionFilterScope, setMentionFilterScope] =
    useState<MentionFilterScope>("all");
  const [searchFields, setSearchFields] = useState<MentionSearchFieldKey[]>([
    "speaker_names",
    "event_name",
    "venue_name",
  ]);

  const { searchAll } = useSearch();

  const toggleSearchField = (field: MentionSearchFieldKey) => {
    setSearchFields((prev) =>
      prev.includes(field) ? prev.filter((f) => f !== field) : [...prev, field],
    );
  };

  // Reset state when closed
  useEffect(() => {
    if (!isOpen) {
      setMentionQuery("");
      setMentionFilterScope("all");
      setMentionResults([]);
      setSearchingMentions(false);
    }
  }, [isOpen]);

  // Debounced search for mentions using Orama Web Worker
  useEffect(() => {
    if (!isOpen) return;

    const trimmed = mentionQuery.trim();
    if (!trimmed) {
      setMentionResults([]);
      setSearchingMentions(false);
      return;
    }

    let isMounted = true;
    setSearchingMentions(true);

    const timer = setTimeout(async () => {
      try {
        const activeSearchFields = ["name", ...searchFields];
        const rawResults = await searchAll(
          trimmed,
          undefined,
          undefined,
          undefined,
          activeSearchFields,
        );
        if (!isMounted) return;

        const db = await getDB();
        if (!db) {
          if (isMounted) setMentionResults([]);
          return;
        }

        let recHits: RecordingSearchDocument[] = [];
        let catHits: CategorySearchDocument[] = [];
        let matHits: MaterialSearchDocument[] = [];

        for (const res of rawResults) {
          if (res.target === STORE.RECORDINGS) {
            recHits = res.hits as RecordingSearchDocument[];
          }
          if (res.target === STORE.CATEGORIES) {
            catHits = res.hits as CategorySearchDocument[];
          }
          if (res.target === STORE.MATERIALS) {
            matHits = res.hits as MaterialSearchDocument[];
          }
        }

        const [categories, recordings] = await Promise.all([
          db.getAll(STORE.CATEGORIES) as Promise<Category[]>,
          db.getAll(STORE.RECORDINGS) as Promise<Recording[]>,
        ]);

        const catMap = new Map<number, Category>(
          categories.map((c) => [c.id, c]),
        );
        const recMap = new Map<number, Recording>(
          recordings.map((r) => [r.id, r]),
        );

        const entities: MentionEntity[] = [];

        // Categories
        for (const h of catHits) {
          const cat = catMap.get(Number(h.id));
          if (cat) {
            const pathUrl = categoryPath(cat.url_path);
            entities.push({
              id: `cat-${cat.id}`,
              name: cat.name || `Category #${cat.id}`,
              type: "category",
              subtitle: pathUrl,
              url: pathUrl,
            });
          }
        }

        // Recordings
        for (const h of recHits) {
          const rec = recMap.get(Number(h.id));
          if (rec) {
            const cat = rec.category_id
              ? catMap.get(rec.category_id)
              : undefined;
            const pathUrl = categoryPath(cat?.url_path);
            entities.push({
              id: `rec-${rec.id}`,
              name: rec.name || `Lecture #${rec.id}`,
              type: "recording",
              subtitle: cat ? cat.name : "Lecture",
              url: `${pathUrl}?q=${rec.id}`,
            });
          }
        }

        // Materials
        for (const h of matHits) {
          const mat = await db.get(STORE.MATERIALS, Number(h.id));
          if (mat) {
            const rec = mat.recording_id
              ? recMap.get(mat.recording_id)
              : undefined;
            const cat = rec?.category_id
              ? catMap.get(rec.category_id)
              : undefined;
            const pathUrl = categoryPath(cat?.url_path);
            const recName = rec ? rec.name : `Lecture #${mat.recording_id}`;
            entities.push({
              id: `mat-${mat.id}`,
              name: mat.name || `Material #${mat.id}`,
              type: "material",
              subtitle: cat ? `${cat.name} > ${recName}` : recName,
              url: `${pathUrl}?q=${mat.recording_id}&m=${mat.id}`,
            });
          }
        }

        if (isMounted) {
          setMentionResults(entities);
        }
      } catch (err) {
        console.error("Failed to search mentions:", err);
      } finally {
        if (isMounted) setSearchingMentions(false);
      }
    }, 150);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [mentionQuery, isOpen, searchAll, searchFields]);

  const filteredMentionResults = useMemo(() => {
    if (mentionFilterScope === "all") return mentionResults;
    if (mentionFilterScope === "recordings") {
      return mentionResults.filter((r) => r.type === "recording");
    }
    if (mentionFilterScope === "categories") {
      return mentionResults.filter((r) => r.type === "category");
    }
    if (mentionFilterScope === "materials") {
      return mentionResults.filter((r) => r.type === "material");
    }
    return mentionResults;
  }, [mentionResults, mentionFilterScope]);

  const recCount = useMemo(
    () => mentionResults.filter((r) => r.type === "recording").length,
    [mentionResults],
  );
  const catCount = useMemo(
    () => mentionResults.filter((r) => r.type === "category").length,
    [mentionResults],
  );
  const matCount = useMemo(
    () => mentionResults.filter((r) => r.type === "material").length,
    [mentionResults],
  );

  return {
    mentionQuery,
    setMentionQuery,
    mentionFilterScope,
    setMentionFilterScope,
    searchingMentions,
    filteredMentionResults,
    recCount,
    catCount,
    matCount,
    totalCount: mentionResults.length,
    searchFields,
    toggleSearchField,
  };
};
