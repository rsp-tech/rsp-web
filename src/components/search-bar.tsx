"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { INDEX, STORE } from "@/constants";
import { useSearch } from "@/hooks/use-search";
import { getDB } from "@/lib/idb";
import { categoryPath } from "@/lib/utils";
import type {
  Category,
  CategorySearchDocument,
  Language,
  MaterialSearchDocument,
  Recording,
  RecordingSearchDocument,
  Speaker,
  Venue,
} from "@/types";
import { SearchInput } from "./search/search-input";
import {
  type EnrichedMaterialSearchResult,
  type EnrichedRecordingSearchResult,
  SearchResults,
} from "./search/search-results";
import { SearchScopeTabs } from "./search/search-scope-tabs";

export type SearchScope = "full" | "current" | "sub";

interface FilteredHits {
  categories: Category[];
  recordings: EnrichedRecordingSearchResult[];
  materials: EnrichedMaterialSearchResult[];
}

export function SearchBar() {
  const router = useRouter();
  const pathname = usePathname();
  const { searchAll } = useSearch();

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

  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Determine current category from URL pathname
  useEffect(() => {
    const loadCurrentCategory = async () => {
      const slug = pathname.split("/").filter(Boolean);
      if (slug.length === 0 || slug[0] === "services" || slug[0] === "about") {
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

  // Execute scoped search when term or scope changes
  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (!term.trim()) {
        setResults({ categories: [], recordings: [], materials: [] });
        return;
      }

      setSearching(true);
      try {
        const rawResults = await searchAll(term);
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

        const allCategories = await db.getAll(STORE.CATEGORIES);

        // Fetch category maps
        const catMap = new Map<number, Category>();
        for (const cat of allCategories) {
          catMap.set(cat.id, cat);
        }

        // Get matching recordings & search results categories
        let filteredCats = catHits
          .map((h) => catMap.get(Number(h.id)))
          .filter((c): c is Category => c !== undefined);

        const recIds = recHits.map((h) => Number(h.id));
        const fullRecs = (
          await Promise.all(recIds.map((id) => db.get(STORE.RECORDINGS, id)))
        ).filter((r): r is Recording => r !== undefined);

        // Gather unique speaker, venue, and language IDs from recordings to query metadata in batch
        const speakerIds = new Set<number>();
        const venueIds = new Set<number>();
        const langIds = new Set<number>();

        for (const rec of fullRecs) {
          rec.speaker_ids?.forEach(speakerIds.add);
          rec.lang_ids?.forEach(langIds.add);
          if (rec.venues_id) venueIds.add(rec.venues_id);
        }

        const speakerMap = new Map<number, Speaker>();
        const venueMap = new Map<number, Venue>();
        const langMap = new Map<number, Language>();

        await Promise.all([
          Promise.all(
            Array.from(speakerIds).map(async (id) => {
              const s = await db.get(STORE.SPEAKERS, id);
              if (s) speakerMap.set(id, s);
            }),
          ),
          Promise.all(
            Array.from(venueIds).map(async (id) => {
              const v = await db.get(STORE.VENUES, id);
              if (v) venueMap.set(id, v);
            }),
          ),
          Promise.all(
            Array.from(langIds).map(async (id) => {
              const l = await db.get(STORE.LANGUAGES, id);
              if (l) langMap.set(id, l);
            }),
          ),
        ]);

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
                  uri: "",
                  type: "",
                  created_at: null,
                  updated_at: null,
                  recording: null,
                  category: null,
                  allowed_roles: [],
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

        let filteredRecordings = enrichedRecordings;
        let filteredMats = enrichedMaterials;

        if (currentCategory) {
          const currentUrl = currentCategory.url_path;

          if (scope === "current") {
            filteredCats = filteredCats.filter((cat) => {
              if (!cat.url_path.startsWith(`${currentUrl}.`)) return false;
              return !cat.url_path
                .substring(currentUrl.length + 1)
                .includes(".");
            });
            filteredRecordings = filteredRecordings.filter(
              (rec) => rec.category_id === currentCategory.id,
            );
            filteredMats = filteredMats.filter(
              (mat) => mat.recording?.category_id === currentCategory.id,
            );
          } else if (scope === "sub") {
            filteredCats = filteredCats.filter((cat) =>
              cat.url_path.startsWith(`${currentUrl}.`),
            );
            const subCatIds = new Set(
              allCategories
                .filter(
                  (c) =>
                    c.url_path === currentUrl ||
                    c.url_path.startsWith(`${currentUrl}.`),
                )
                .map((c) => c.id),
            );
            filteredRecordings = filteredRecordings.filter((rec) =>
              subCatIds.has(rec.category_id),
            );
            filteredMats = filteredMats.filter(
              (mat) =>
                mat.recording && subCatIds.has(mat.recording.category_id),
            );
          }
        }

        setResults({
          categories: filteredCats,
          recordings: filteredRecordings,
          materials: filteredMats,
        });
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setSearching(false);
      }
    }, 250);

    return () => clearTimeout(delayDebounce);
  }, [term, scope, currentCategory, searchAll]);

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

  return (
    <div ref={containerRef} className="relative w-full max-w-lg flex flex-col">
      <SearchInput
        term={term}
        onChange={(val) => {
          setTerm(val);
          setShowDropdown(true);
        }}
        onFocus={() => setShowDropdown(true)}
        searching={searching}
      />

      {/* Dropdown */}
      {showDropdown && (term.trim() !== "" || currentCategory) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border shadow-xl rounded-xl overflow-hidden z-50 flex flex-col max-h-[420px]">
          {currentCategory && (
            <SearchScopeTabs
              scope={scope}
              setScope={setScope}
              currentCategory={currentCategory}
            />
          )}

          <SearchResults
            categories={results.categories}
            recordings={results.recordings}
            materials={results.materials}
            onSelectCategory={handleSelectCategory}
            onSelectRecording={handleSelectRecording}
            onSelectMaterial={handleSelectMaterial}
            term={term}
            hasCategoryContext={!!currentCategory}
          />
        </div>
      )}
    </div>
  );
}
