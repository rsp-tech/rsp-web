"use client";

import {
  CornerDownRight,
  FileText,
  Folder,
  Globe,
  Loader2,
  Search,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { INDEX, STORE } from "@/constants";
import { useSearch } from "@/hooks/use-search";
import { getDB } from "@/lib/idb";
import type {
  Category,
  CategorySearchDocument,
  Material,
  MaterialSearchDocument,
  Recording,
  RecordingSearchDocument,
} from "@/types";

export type SearchScope = "full" | "current" | "sub";

interface FilteredHits {
  categories: Category[];
  recordings: Recording[];
  materials: (Material & { recordingName?: string })[];
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
      if (slug.length === 0) {
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

        const materialRecordings = new Map<number, Recording>();
        await Promise.all(
          matHits.map(async (m) => {
            const r = await db.get(STORE.RECORDINGS, m.recording_id);
            if (r) materialRecordings.set(Number(m.id), r);
          }),
        );

        let filteredCats = catHits
          .map((h) => allCategories.find((c) => c.id === Number(h.id)))
          .filter((c): c is Category => c !== undefined);

        const filteredRecs = recHits
          .map((h) => allCategories.find((c) => c.id === h.category_id))
          .filter(Boolean) as Category[]; // narrowing to get category_ids; actual recordings fetched below

        // Re-fetch actual Recording objects by id
        const recIds = recHits.map((h) => Number(h.id));
        const fullRecs = (
          await Promise.all(recIds.map((id) => db.get(STORE.RECORDINGS, id)))
        ).filter((r): r is Recording => r !== undefined);

        let filteredRecordings = fullRecs;

        const matWithName = matHits.map((h) => {
          const rec = materialRecordings.get(Number(h.id));
          return {
            id: Number(h.id),
            name: h.name,
            recording_id: h.recording_id,
            recordingName: rec?.name,
          } as Material & { recordingName?: string };
        });
        let filteredMats = matWithName;

        // suppress unused variable warning — filteredRecs was intermediate
        void filteredRecs;

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
            filteredMats = filteredMats.filter((mat) => {
              const rec = materialRecordings.get(mat.id);
              return rec?.category_id === currentCategory.id;
            });
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
            filteredMats = filteredMats.filter((mat) => {
              const rec = materialRecordings.get(mat.id);
              return rec && subCatIds.has(rec.category_id);
            });
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
    router.push(`/${cat.url_path.split(".").join("/")}`);
    setTerm("");
    setShowDropdown(false);
  };

  const handleSelectRecording = async (rec: Recording) => {
    const db = await getDB();
    if (db) {
      const cat = await db.get(STORE.CATEGORIES, rec.category_id);
      if (cat) router.push(`/${cat.url_path.split(".").join("/")}`);
    }
    setTerm("");
    setShowDropdown(false);
  };

  const hasResults =
    results.categories.length > 0 ||
    results.recordings.length > 0 ||
    results.materials.length > 0;

  return (
    <div ref={containerRef} className="relative w-full max-w-lg flex flex-col">
      {/* Search Input */}
      <div className="relative flex items-center bg-muted border border-border rounded-xl px-3 py-1.5 focus-within:ring-1 focus-within:ring-primary focus-within:border-primary transition-all">
        <Search className="w-4 h-4 text-muted-foreground mr-2 shrink-0" />
        <input
          type="text"
          value={term}
          onChange={(e) => {
            setTerm(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          placeholder="Search discourses, recordings, categories..."
          className="w-full bg-transparent border-none outline-none text-sm text-foreground placeholder-muted-foreground"
        />
        {searching && (
          <Loader2 className="w-4 h-4 text-primary animate-spin shrink-0 ml-1" />
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && (term.trim() !== "" || currentCategory) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border shadow-xl rounded-xl overflow-hidden z-50 flex flex-col max-h-[420px]">
          {/* Scope Tabs */}
          {currentCategory && (
            <div className="flex border-b border-border bg-muted/40 p-1 gap-1 text-xs">
              <Button
                type="button"
                variant={scope === "full" ? "secondary" : "ghost"}
                size="xs"
                onClick={() => setScope("full")}
                className="flex-1"
              >
                <Globe className="w-3.5 h-3.5" /> Full Search
              </Button>
              <Button
                type="button"
                variant={scope === "current" ? "secondary" : "ghost"}
                size="xs"
                onClick={() => setScope("current")}
                className="flex-grow"
                title={`Search directly under ${currentCategory.name}`}
              >
                <Folder className="w-3.5 h-3.5" /> Current Page
              </Button>
              <Button
                type="button"
                variant={scope === "sub" ? "secondary" : "ghost"}
                size="xs"
                onClick={() => setScope("sub")}
                className="flex-grow"
                title={`Search under ${currentCategory.name} and its sub-categories`}
              >
                <CornerDownRight className="w-3.5 h-3.5" /> Sub-categories
              </Button>
            </div>
          )}

          <div className="overflow-y-auto flex-1 p-2 flex flex-col gap-3">
            {term.trim() === "" ? (
              <p className="py-4 text-center text-xs text-muted-foreground">
                Type something to search{" "}
                {currentCategory ? "within selected scope" : ""}
              </p>
            ) : !hasResults ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No matching results found
              </p>
            ) : (
              <>
                {results.categories.length > 0 && (
                  <div>
                    <h4 className="px-2 pb-1 text-[10px] font-bold tracking-wider uppercase text-muted-foreground/80">
                      Categories
                    </h4>
                    <div className="flex flex-col gap-0.5">
                      {results.categories.slice(0, 4).map((cat) => (
                        <Button
                          key={cat.id}
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSelectCategory(cat)}
                          className="w-full justify-start gap-2"
                        >
                          <Folder className="w-4 h-4 text-primary shrink-0" />
                          <span className="truncate">{cat.name}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {results.recordings.length > 0 && (
                  <div>
                    <h4 className="px-2 pb-1 text-[10px] font-bold tracking-wider uppercase text-muted-foreground/80">
                      Recordings
                    </h4>
                    <div className="flex flex-col gap-0.5">
                      {results.recordings.slice(0, 6).map((rec) => (
                        <Button
                          key={rec.id}
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSelectRecording(rec)}
                          className="w-full justify-start flex-col items-start h-auto py-1.5 gap-0.5"
                        >
                          <span className="font-medium truncate">
                            {rec.name}
                          </span>
                          {rec.recorded_at && (
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(rec.recorded_at).toLocaleDateString()}
                            </span>
                          )}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {results.materials.length > 0 && (
                  <div>
                    <h4 className="px-2 pb-1 text-[10px] font-bold tracking-wider uppercase text-muted-foreground/80">
                      Materials
                    </h4>
                    <div className="flex flex-col gap-0.5">
                      {results.materials.slice(0, 4).map((mat) => (
                        <div
                          key={mat.id}
                          className="px-2.5 py-1.5 rounded-lg text-sm text-foreground flex flex-col gap-0.5"
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-amber-500 shrink-0" />
                            <span className="font-medium truncate">
                              {mat.name}
                            </span>
                          </div>
                          {mat.recordingName && (
                            <span className="text-[10px] text-muted-foreground pl-6 truncate">
                              Record: {mat.recordingName}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
