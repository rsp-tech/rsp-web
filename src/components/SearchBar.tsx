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
import { INDEX, STORE } from "@/constants";
import { useSearch } from "@/hooks/useSearch";
import { getDB } from "@/lib/idb";
import type { Category, Material, Recording } from "@/types";

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
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Determine current category from URL pathname
  useEffect(() => {
    async function loadCurrentCategory() {
      const slug = pathname.split("/").filter(Boolean);
      if (slug.length === 0) {
        setCurrentCategory(null);
        setScope("full"); // Reset to full on home page
        return;
      }

      const db = await getDB();
      if (!db) return;

      const urlPath = slug.join(".");
      const cat = await db.getFromIndex(
        STORE.CATEGORIES,
        INDEX.BY_URL,
        urlPath,
      );
      setCurrentCategory(cat || null);
    }

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

        if (!db) {
          setSearching(false);
          return;
        }

        // Initialize lists
        let recHits: any[] = [];
        let catHits: any[] = [];
        let matHits: any[] = [];

        for (const res of rawResults) {
          if (res.target === STORE.RECORDINGS) recHits = res.hits;
          if (res.target === STORE.CATEGORIES) catHits = res.hits;
          if (res.target === STORE.MATERIALS) matHits = res.hits;
        }

        // Fetch full categories and recordings to enable hierarchy checks
        const allCategories = await db.getAll(STORE.CATEGORIES);

        // Pre-fetch recordings for materials
        const materialRecordings = new Map<number, Recording>();
        await Promise.all(
          matHits.map(async (m) => {
            const r = await db.get(STORE.RECORDINGS, m.recording_id);
            if (r) materialRecordings.set(m.id, r);
          }),
        );

        // Filter categories according to scope
        let filteredCats = catHits
          .map((h) => allCategories.find((c) => c.id === h.id))
          .filter(Boolean) as Category[];
        let filteredRecs = recHits as any as Recording[];
        let filteredMats = matHits.map((h) => ({
          ...h,
          recordingName: materialRecordings.get(h.id)?.name,
        })) as any[];

        if (currentCategory) {
          const currentUrl = currentCategory.url_path;

          if (scope === "current") {
            // Subcategories directly under current page (path starts with current category and has exactly one dot more)
            filteredCats = filteredCats.filter((cat) => {
              if (!cat.url_path.startsWith(`${currentUrl}.`)) return false;
              const subPart = cat.url_path.substring(currentUrl.length + 1);
              return !subPart.includes(".");
            });

            // Recordings exactly in current category
            filteredRecs = filteredRecs.filter(
              (rec) => rec.category_id === currentCategory.id,
            );

            // Materials belonging to recordings in current category
            filteredMats = filteredMats.filter((mat) => {
              const rec = materialRecordings.get(mat.id);
              return rec && rec.category_id === currentCategory.id;
            });
          } else if (scope === "sub") {
            // All descendant subcategories
            filteredCats = filteredCats.filter((cat) =>
              cat.url_path.startsWith(`${currentUrl}.`),
            );

            // Recordings in current or any descendant subcategories
            const subCatIds = new Set(
              allCategories
                .filter(
                  (c) =>
                    c.url_path === currentUrl ||
                    c.url_path.startsWith(`${currentUrl}.`),
                )
                .map((c) => c.id),
            );

            filteredRecs = filteredRecs.filter((rec) =>
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
          recordings: filteredRecs,
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
    const slugPath = cat.url_path.split(".").join("/");
    router.push(`/${slugPath}`);
    setTerm("");
    setShowDropdown(false);
  };

  const hasResults =
    results.categories.length > 0 ||
    results.recordings.length > 0 ||
    results.materials.length > 0;

  return (
    <div ref={containerRef} className="relative w-full max-w-lg flex flex-col">
      {/* Search Input Bar */}
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

      {/* Dropdown Results Overlay */}
      {showDropdown && (term.trim() !== "" || currentCategory) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border shadow-xl rounded-xl overflow-hidden z-50 flex flex-col max-h-[420px]">
          {/* Search Scopes Toggle (only visible on subcategory pages) */}
          {currentCategory && (
            <div className="flex border-b border-border bg-muted/40 p-1 gap-1 text-xs">
              <button
                onClick={() => setScope("full")}
                className={`flex-1 py-1.5 px-2 rounded-md font-medium transition-colors flex items-center justify-center gap-1 ${
                  scope === "full"
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Globe className="w-3.5 h-3.5" /> Full Search
              </button>
              <button
                onClick={() => setScope("current")}
                className={`flex-grow py-1.5 px-2 rounded-md font-medium transition-colors flex items-center justify-center gap-1 ${
                  scope === "current"
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title={`Search directly under ${currentCategory.name}`}
              >
                <Folder className="w-3.5 h-3.5" /> Current Page
              </button>
              <button
                onClick={() => setScope("sub")}
                className={`flex-grow py-1.5 px-2 rounded-md font-medium transition-colors flex items-center justify-center gap-1 ${
                  scope === "sub"
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title={`Search under ${currentCategory.name} and its sub-categories`}
              >
                <CornerDownRight className="w-3.5 h-3.5" /> Sub-categories
              </button>
            </div>
          )}

          {/* Results Lists */}
          <div className="overflow-y-auto flex-1 p-2 flex flex-col gap-3">
            {term.trim() === "" ? (
              <div className="py-4 text-center text-xs text-muted-foreground">
                Type something to search{" "}
                {currentCategory ? `within selected scope` : ""}
              </div>
            ) : !hasResults ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                No matching results found
              </div>
            ) : (
              <>
                {/* Categories */}
                {results.categories.length > 0 && (
                  <div>
                    <h4 className="px-2 pb-1 text-[10px] font-bold tracking-wider uppercase text-muted-foreground/80">
                      Categories
                    </h4>
                    <div className="flex flex-col gap-0.5">
                      {results.categories.slice(0, 4).map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => handleSelectCategory(cat)}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-muted text-sm text-foreground flex items-center gap-2 transition-colors cursor-pointer"
                        >
                          <Folder className="w-4 h-4 text-primary shrink-0" />
                          <span className="truncate">{cat.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recordings */}
                {results.recordings.length > 0 && (
                  <div>
                    <h4 className="px-2 pb-1 text-[10px] font-bold tracking-wider uppercase text-muted-foreground/80">
                      Recordings
                    </h4>
                    <div className="flex flex-col gap-0.5">
                      {results.recordings.slice(0, 6).map((rec) => (
                        <button
                          key={rec.id}
                          onClick={() => {
                            // Find the category path to route to it or scroll to it
                            router.push(
                              `/category-redirect-placeholder-${rec.category_id}`,
                            );
                            // Wait, category-redirect is a placeholder. Let's resolve the path of the recording's category
                            const loadCatAndRoute = async () => {
                              const db = await getDB();
                              if (db) {
                                const cat = await db.get(
                                  STORE.CATEGORIES,
                                  rec.category_id,
                                );
                                if (cat) {
                                  router.push(
                                    `/${cat.url_path.split(".").join("/")}`,
                                  );
                                }
                              }
                            };
                            loadCatAndRoute();
                            setTerm("");
                            setShowDropdown(false);
                          }}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-muted text-sm text-foreground flex flex-col gap-0.5 transition-colors cursor-pointer"
                        >
                          <span className="font-medium truncate">
                            {rec.name}
                          </span>
                          {rec.recorded_at && (
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(rec.recorded_at).toLocaleDateString()}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Materials */}
                {results.materials.length > 0 && (
                  <div>
                    <h4 className="px-2 pb-1 text-[10px] font-bold tracking-wider uppercase text-muted-foreground/80">
                      Materials
                    </h4>
                    <div className="flex flex-col gap-0.5">
                      {results.materials.slice(0, 4).map((mat) => (
                        <div
                          key={mat.id}
                          className="px-2.5 py-1.5 rounded-lg hover:bg-muted text-sm text-foreground flex flex-col gap-0.5 transition-colors"
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
