"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type {
  EnrichedMaterialSearchResult,
  EnrichedRecordingSearchResult,
} from "@/components/search/search-results";
import type { SearchScope } from "@/components/search-bar";
import { INDEX, STORE } from "@/constants";
import { useSearch } from "@/hooks/use-search";
import { trackEvent } from "@/lib/analytics";
import { getDB } from "@/lib/idb";
import { categoryPath } from "@/lib/utils";
import type {
  Category,
  CategorySearchDocument,
  Language,
  MaterialSearchDocument,
  Recording,
  RecordingSearchDocument,
  RecordingSearchFilters,
  Speaker,
  Venue,
} from "@/types";
import { useCategories } from "./use-categories";
import { useMetadata } from "./use-metadata";

interface FilteredHits {
  categories: Category[];
  recordings: EnrichedRecordingSearchResult[];
  materials: EnrichedMaterialSearchResult[];
}

export function useSearchBar() {
  const router = useRouter();
  const pathname = usePathname();
  const { searchAll } = useSearch();
  const { data: allCategories = [] } = useCategories();
  const {
    speakers: availableSpeakers,
    languages: availableLanguages,
    venues: availableVenues,
  } = useMetadata();

  const [term, setTerm] = useState("");
  const [scope, setScope] = useState<SearchScope>("full");
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);
  const [results, setResults] = useState<FilteredHits>({
    categories: [],
    recordings: [],
    materials: [],
  });
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Filter States
  const [filters, setFilters] = useState<RecordingSearchFilters>({
    speaker_ids: [],
    lang_ids: [],
    venues_id: undefined,
    date_start: "",
    date_end: "",
  });

  // Determine current category from URL pathname
  useEffect(() => {
    const loadCurrentCategory = async () => {
      const slug = pathname.split("/").filter(Boolean);
      if (
        slug.length === 0 ||
        slug[0] === "services" ||
        slug[0] === "about" ||
        slug[0] === "contact-us"
      ) {
        setCurrentCategory(null);
        setScope("full");
        return;
      }
      const db = await getDB();
      if (!db) return;
      const cat = await db.getFromIndex(
        STORE.CATEGORIES,
        INDEX.BY_URL,
        slug.join("."),
      );
      setCurrentCategory(cat ?? null);
    };
    loadCurrentCategory();
  }, [pathname]);

  // Execute scoped search when term, scope, or filters change
  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (!term.trim()) {
        setResults({ categories: [], recordings: [], materials: [] });
        return;
      }

      setSearching(true);
      try {
        const activeFilters: RecordingSearchFilters = { ...filters };
        if (currentCategory) {
          if (scope === "current") {
            activeFilters.category_id = currentCategory.id;
            activeFilters.category_path =
              `${currentCategory.path}.${currentCategory.id}`.replace(
                /^\./,
                "",
              );
          } else if (scope === "sub") {
            const currentUrl = currentCategory.url_path;
            const subCatIds = allCategories
              .filter(
                (c) =>
                  c.url_path === currentUrl ||
                  c.url_path.startsWith(`${currentUrl}.`),
              )
              .map((c) => c.id);
            activeFilters.category_ids = subCatIds;
          }
        }

        const rawResults = await searchAll(term, activeFilters);
        const db = await getDB();
        if (!db) return;

        let recHits: RecordingSearchDocument[] = [];
        let catHits: CategorySearchDocument[] = [];
        let matHits: MaterialSearchDocument[] = [];

        for (const res of rawResults) {
          if (res.target === STORE.RECORDINGS)
            recHits = res.hits as RecordingSearchDocument[];
          if (res.target === STORE.CATEGORIES)
            catHits = res.hits as CategorySearchDocument[];
          if (res.target === STORE.MATERIALS)
            matHits = res.hits as MaterialSearchDocument[];
        }

        // Fetch category maps using allCategories from query cache
        const catMap = new Map<number, Category>();
        for (const cat of allCategories) {
          catMap.set(cat.id, cat);
        }

        // Get matching recordings & search results categories
        const filteredCats = catHits
          .map((h) => catMap.get(Number(h.id)))
          .filter((c): c is Category => c !== undefined);

        const recIds = recHits.map((h) => Number(h.id));
        const fullRecs = (
          await Promise.all(recIds.map((id) => db.get(STORE.RECORDINGS, id)))
        ).filter((r): r is Recording => r !== undefined);

        const speakerMap = new Map<number, Speaker>(
          availableSpeakers.map((s) => [s.id, s]),
        );
        const venueMap = new Map<number, Venue>(
          availableVenues.map((v) => [v.id, v]),
        );
        const langMap = new Map<number, Language>(
          availableLanguages.map((l) => [l.id, l]),
        );

        const enrichedRecordings: EnrichedRecordingSearchResult[] =
          fullRecs.map((rec) => ({
            ...rec,
            speakers: (rec.speaker_ids ?? [])
              .map((id) => speakerMap.get(id))
              .filter((s): s is Speaker => !!s),
            venue: rec.venues_id ? (venueMap.get(rec.venues_id) ?? null) : null,
            languages: (rec.lang_ids ?? [])
              .map((id) => langMap.get(id))
              .filter((l): l is Language => !!l),
            category: catMap.get(rec.category_id) ?? null,
          }));

        // Fetch materials with associated recording and category details
        const enrichedMaterials: EnrichedMaterialSearchResult[] =
          await Promise.all(
            matHits.map(async (h) => {
              const mat = await db.get(STORE.MATERIALS, Number(h.id));
              if (!mat) {
                return {
                  id: Number(h.id),
                  name: h.name,
                  recording_id: h.recording_id,
                  allowed_roles: [],
                  type: "",
                  uri: "",
                  recording: null,
                  category: null,
                } as EnrichedMaterialSearchResult;
              }
              const rec = await db.get(STORE.RECORDINGS, mat.recording_id);
              const cat = rec ? (catMap.get(rec.category_id) ?? null) : null;
              return {
                ...mat,
                recording: rec ?? null,
                category: cat,
              };
            }),
          );

        let filteredMats = enrichedMaterials;

        if (currentCategory) {
          const currentUrl = currentCategory.url_path;

          if (scope === "current") {
            filteredMats = filteredMats.filter(
              (mat) => mat.recording?.category_id === currentCategory.id,
            );
          } else if (scope === "sub") {
            const subCatIds = new Set(
              allCategories
                .filter(
                  (c) =>
                    c.url_path === currentUrl ||
                    c.url_path.startsWith(`${currentUrl}.`),
                )
                .map((c) => c.id),
            );
            filteredMats = filteredMats.filter(
              (mat) =>
                mat.recording && subCatIds.has(mat.recording.category_id),
            );
          }
        }

        setResults({
          categories: filteredCats,
          recordings: enrichedRecordings,
          materials: filteredMats,
        });

        trackEvent("search_performed", {
          query_term: term,
          results_count:
            filteredCats.length +
            enrichedRecordings.length +
            filteredMats.length,
        });
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setSearching(false);
      }
    }, 250);

    return () => clearTimeout(delayDebounce);
  }, [
    term,
    scope,
    currentCategory,
    filters,
    searchAll,
    allCategories,
    availableSpeakers,
    availableLanguages,
    availableVenues,
  ]);

  const handleSelectCategory = (cat: Category) => {
    router.push(`/${categoryPath(cat.url_path)}`);
    setTerm("");
    setShowDropdown(false);
  };

  const handleSelectRecording = (rec: Recording) => {
    if (rec.category_id) {
      getDB()?.then((db) => {
        if (db) {
          db.get(STORE.CATEGORIES, rec.category_id).then((cat) => {
            if (cat) {
              router.push(`/${categoryPath(cat.url_path)}?q=${rec.id}`);
            }
          });
        }
      });
    }
    setTerm("");
    setShowDropdown(false);
  };

  const handleSelectMaterial = (mat: EnrichedMaterialSearchResult) => {
    if (mat.recording && mat.category) {
      router.push(
        `/${categoryPath(mat.category.url_path)}?q=${mat.recording_id}&m=${mat.id}`,
      );
    }
    setTerm("");
    setShowDropdown(false);
  };

  return {
    term,
    setTerm,
    scope,
    setScope,
    currentCategory,
    results,
    searching,
    showDropdown,
    setShowDropdown,
    filters,
    setFilters,
    availableSpeakers,
    availableLanguages,
    availableVenues,
    handleSelectCategory,
    handleSelectRecording,
    handleSelectMaterial,
  };
}
