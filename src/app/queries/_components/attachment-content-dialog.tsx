"use client";

import {
  ChevronRight,
  Folder,
  Headphones,
  Loader2,
  Paperclip,
  Search,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { MaterialLineage } from "@/components/material-lineage";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { STORE } from "@/constants";
import { useCategories } from "@/hooks/use-categories";
import { useSearch } from "@/hooks/use-search";
import { getDB } from "@/lib/idb";
import { slugToLabel } from "@/lib/utils";
import type {
  CategorySearchDocument,
  EnrichedMaterialSearchResult,
  MaterialSearchDocument,
  QueryAttachment,
  RecordingSearchDocument,
} from "@/types";

interface AttachmentContentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (attachment: QueryAttachment) => void;
}

const getCategoryBreadcrumb = (cat: CategorySearchDocument) => {
  if (!cat.url_path) return null;
  const parts = cat.url_path
    .split(/[./]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map(slugToLabel);

  if (parts.length <= 1) return null;
  return parts.slice(0, -1).join(" / ");
};

export const AttachmentContentDialog = ({
  open,
  onOpenChange,
  onSelect,
}: AttachmentContentDialogProps) => {
  const { data: allCategories = [] } = useCategories();
  const catMap = useMemo(
    () => new Map(allCategories.map((c) => [c.id, c])),
    [allCategories],
  );

  const { searchAll } = useSearch();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterScope, setFilterScope] = useState<
    "all" | "recordings" | "categories" | "materials"
  >("all");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<{
    recordings: RecordingSearchDocument[];
    categories: CategorySearchDocument[];
    materials: EnrichedMaterialSearchResult[];
  }>({
    recordings: [],
    categories: [],
    materials: [],
  });

  useEffect(() => {
    if (!open) {
      setSearchTerm("");
      setSearchResults({ recordings: [], categories: [], materials: [] });
      setFilterScope("all");
    }
  }, [open]);

  useEffect(() => {
    const term = searchTerm.trim();
    if (!term) {
      setSearchResults({ recordings: [], categories: [], materials: [] });
      setSearching(false);
      return;
    }

    let isCancelled = false;
    setSearching(true);
    const timeoutId = setTimeout(async () => {
      try {
        const results = await searchAll(term);
        if (isCancelled) return;
        const recHits = (results.find((r) => r.target === STORE.RECORDINGS)
          ?.hits || []) as RecordingSearchDocument[];
        const catHits = (results.find((r) => r.target === STORE.CATEGORIES)
          ?.hits || []) as CategorySearchDocument[];
        const matHits = (results.find((r) => r.target === STORE.MATERIALS)
          ?.hits || []) as MaterialSearchDocument[];

        const db = await getDB();
        const enrichedMatHits: EnrichedMaterialSearchResult[] =
          await Promise.all(
            matHits.map(async (h) => {
              const mat = db
                ? await db.get(STORE.MATERIALS, Number(h.id))
                : null;
              if (!mat) {
                return {
                  id: Number(h.id),
                  name: h.name,
                  recording_id: h.recording_id,
                  allowed_roles: [],
                  type: "",
                  size: null,
                  uri: "",
                  recording: null,
                  category: catMap.get(h.category_id) ?? null,
                } as EnrichedMaterialSearchResult;
              }
              const rec = await db?.get(STORE.RECORDINGS, mat.recording_id);
              const cat = rec
                ? (catMap.get(rec.category_id) ?? null)
                : (catMap.get(mat.category_id) ?? null);
              return {
                ...mat,
                recording: rec ?? null,
                category: cat,
              };
            }),
          );

        setSearchResults({
          recordings: recHits,
          categories: catHits,
          materials: enrichedMatHits,
        });
      } catch (err) {
        console.error("Attachment Orama search error:", err);
      } finally {
        if (!isCancelled) setSearching(false);
      }
    }, 150);

    return () => {
      isCancelled = true;
      clearTimeout(timeoutId);
    };
  }, [searchTerm, searchAll, catMap]);

  const handleAttachRecording = (rec: RecordingSearchDocument) => {
    const cat = rec.category_id ? catMap.get(rec.category_id) : undefined;
    onSelect({
      type: "recording",
      id: Number(rec.id),
      name: rec.name,
      category_id: rec.category_id,
      category_path: cat?.url_path,
    });
    onOpenChange(false);
  };

  const handleAttachCategory = (cat: CategorySearchDocument) => {
    onSelect({
      type: "category",
      id: Number(cat.id),
      name: cat.name,
      url_path: cat.url_path,
    });
    onOpenChange(false);
  };

  const handleAttachMaterial = (mat: EnrichedMaterialSearchResult) => {
    onSelect({
      type: "material",
      id: Number(mat.id),
      name: mat.name,
      uri: mat.uri ?? undefined,
      material_type: mat.type ?? undefined,
      recording_id: mat.recording_id,
      category_id: mat.category?.id,
      category_path: mat.category?.url_path,
    });
    onOpenChange(false);
  };

  const filteredRecs =
    filterScope === "all" || filterScope === "recordings"
      ? searchResults.recordings
      : [];
  const filteredCats =
    filterScope === "all" || filterScope === "categories"
      ? searchResults.categories
      : [];
  const filteredMats =
    filterScope === "all" || filterScope === "materials"
      ? searchResults.materials
      : [];
  const totalMatches =
    filteredRecs.length + filteredCats.length + filteredMats.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent maxW="32rem" className="overflow-hidden">
        <DialogHeader>
          <DialogTitle>Select Content</DialogTitle>
        </DialogHeader>
        <div
          className="flex flex-col gap-3 py-2 overflow-hidden"
          style={{ minWidth: 0 }}
        >
          <div className="relative flex items-center">
            <Search className="absolute left-3 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search lectures, topics, materials..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
              autoFocus
            />
            {searching && (
              <Loader2 className="absolute right-3 w-4 h-4 animate-spin text-muted-foreground" />
            )}
          </div>

          <Tabs
            value={filterScope}
            onValueChange={(val) =>
              setFilterScope(
                val as "all" | "recordings" | "categories" | "materials",
              )
            }
          >
            <TabsList className="flex w-full">
              <TabsTrigger value="all" className="flex-1 text-xs">
                All
              </TabsTrigger>
              <TabsTrigger value="recordings" className="flex-1 text-xs">
                Recordings
              </TabsTrigger>
              <TabsTrigger value="categories" className="flex-1 text-xs">
                Categories
              </TabsTrigger>
              <TabsTrigger value="materials" className="flex-1 text-xs">
                Materials
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div
            className="flex flex-col gap-1 max-h-75 overflow-y-auto overflow-x-hidden"
            style={{ paddingRight: "0.25rem", minWidth: 0 }}
          >
            {!searchTerm.trim() ? (
              <p className="text-xs text-muted-foreground text-center py-6">
                Type in the box above to search content.
              </p>
            ) : searching ? (
              <div className="flex items-center justify-center py-6 text-xs text-muted-foreground gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Searching...</span>
              </div>
            ) : totalMatches === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">
                No matching content found.
              </p>
            ) : (
              <>
                {filteredRecs.map((rec) => (
                  <Button
                    key={`rec-${rec.id}`}
                    type="button"
                    variant="ghost"
                    onClick={() => handleAttachRecording(rec)}
                    className="w-full text-left flex flex-col items-start gap-1 p-2 rounded-lg cursor-pointer overflow-hidden"
                    style={{ height: "auto", minWidth: 0 }}
                  >
                    <div
                      className="flex items-center gap-2 w-full overflow-hidden"
                      style={{ minWidth: 0 }}
                    >
                      <Headphones className="w-4 h-4 text-primary shrink-0" />
                      <span className="font-semibold truncate text-xs">
                        {rec.name}
                      </span>
                    </div>
                    {rec.speaker_names && (
                      <div
                        className="text-xxs text-muted-foreground pl-6 flex items-center gap-1 font-medium truncate w-full"
                        style={{ minWidth: 0 }}
                      >
                        <span className="truncate">{rec.speaker_names}</span>
                      </div>
                    )}
                  </Button>
                ))}
                {filteredCats.map((cat) => {
                  const parentPath = getCategoryBreadcrumb(cat);

                  return (
                    <Button
                      key={`cat-${cat.id}`}
                      type="button"
                      variant="ghost"
                      onClick={() => handleAttachCategory(cat)}
                      className="w-full text-left flex flex-col items-start gap-1 p-2 rounded-lg cursor-pointer overflow-hidden"
                      style={{ height: "auto", minWidth: 0 }}
                    >
                      <div
                        className="flex items-center gap-2 w-full overflow-hidden"
                        style={{ minWidth: 0 }}
                      >
                        <Folder className="w-4 h-4 text-primary shrink-0" />
                        <span className="font-semibold truncate text-xs">
                          {cat.name}
                        </span>
                      </div>
                      {parentPath && (
                        <div
                          className="text-xxs text-muted-foreground pl-6 flex items-center gap-1 font-medium truncate w-full"
                          style={{ minWidth: 0 }}
                        >
                          <span className="shrink-0">{parentPath}</span>
                          <ChevronRight className="w-3 h-3 shrink-0" />
                          <span className="truncate">{cat.name}</span>
                        </div>
                      )}
                    </Button>
                  );
                })}
                {filteredMats.map((mat) => (
                  <Button
                    key={`mat-${mat.id}`}
                    type="button"
                    variant="ghost"
                    onClick={() => handleAttachMaterial(mat)}
                    className="w-full text-left flex flex-col items-start gap-1 p-2 rounded-lg cursor-pointer overflow-hidden"
                    style={{ height: "auto", minWidth: 0 }}
                  >
                    <div
                      className="flex items-center gap-2 w-full overflow-hidden"
                      style={{ minWidth: 0 }}
                    >
                      <Paperclip className="w-4 h-4 text-primary shrink-0" />
                      <span className="font-semibold truncate text-xs">
                        {mat.name}
                      </span>
                    </div>
                    <MaterialLineage
                      category={mat.category}
                      recording={mat.recording}
                      className="w-full"
                    />
                  </Button>
                ))}
              </>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
