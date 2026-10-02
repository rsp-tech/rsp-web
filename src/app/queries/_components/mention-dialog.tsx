"use client";

import {
  AtSign,
  FileText,
  Folder,
  Headphones,
  Loader2,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { useState } from "react";
import { RecordingMeta } from "@/components/recording-meta";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MENTION_SEARCH_FIELDS,
  type MentionEntity,
  type MentionFilterScope,
  useMentionSearch,
} from "@/hooks/use-mention-search";
import { cn } from "@/lib/utils";

interface MentionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectMention: (entity: MentionEntity) => void;
  onDismissLiteralAt?: () => void;
  onDismissSpaceAt?: () => void;
  onCancel?: () => void;
  isOpenViaAt?: boolean;
}

export const MentionDialog = ({
  open,
  onOpenChange,
  onSelectMention,
  onDismissLiteralAt,
  onDismissSpaceAt,
  onCancel,
  isOpenViaAt,
}: MentionDialogProps) => {
  const {
    mentionQuery,
    setMentionQuery,
    mentionFilterScope,
    setMentionFilterScope,
    searchingMentions,
    filteredMentionResults,
    recCount,
    catCount,
    matCount,
    totalCount,
    searchFields,
    toggleSearchField,
  } = useMentionSearch(open);

  const [showFieldFilters, setShowFieldFilters] = useState(false);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      if (onDismissLiteralAt) {
        onDismissLiteralAt();
      } else {
        onOpenChange(false);
      }
    } else {
      onOpenChange(true);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        maxW="32rem"
        className="max-w-lg p-0 overflow-hidden"
        style={{ gap: 0 }}
      >
        <DialogHeader className="p-4 border-b border-border/40 bg-muted/20 flex flex-row items-center justify-between">
          <DialogTitle className="text-sm font-bold flex items-center gap-2">
            <AtSign className="h-4 w-4 text-primary" />
            <span>Mention Content Reference</span>
          </DialogTitle>
          {onDismissLiteralAt && isOpenViaAt && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onDismissLiteralAt}
              className="h-8 px-2 text-xxs text-muted-foreground hover:text-primary cursor-pointer"
              title="Press Esc to dismiss and insert literal '@'"
            >
              Insert literal &apos;@&apos; (Esc)
            </Button>
          )}
        </DialogHeader>

        <div className="p-3 border-b border-border/40 flex flex-col gap-2.5">
          <div className="relative flex items-center">
            {searchingMentions ? (
              <Loader2 className="absolute left-3 top-3 h-4 w-4 animate-spin text-primary" />
            ) : (
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground opacity-60" />
            )}
            <Input
              type="text"
              placeholder={`Search lectures, categories, materials...${isOpenViaAt ? " (Esc to dismiss and insert literal @)" : ""}`}
              value={mentionQuery}
              onChange={(e) => setMentionQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  e.preventDefault();
                  onDismissLiteralAt?.();
                  return;
                }
                if (e.key === " " && !mentionQuery.trim()) {
                  e.preventDefault();
                  onDismissSpaceAt?.();
                  return;
                }
                if (e.key === "Backspace" && !mentionQuery) {
                  e.preventDefault();
                  onCancel?.();
                  return;
                }
              }}
              className="pl-9 pr-10 text-xs h-8"
              autoFocus
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              className={cn(
                "absolute right-3 h-5 w-5 p-0 cursor-pointer transition-all",
                showFieldFilters || searchFields.length < 3
                  ? "text-primary hover:text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
              onClick={() => setShowFieldFilters((prev) => !prev)}
              title="Toggle search fields (Speakers, Events, Venues)"
              aria-expanded={showFieldFilters}
            >
              <SlidersHorizontal className="size-3.5" />
            </Button>
          </div>

          {showFieldFilters && (
            <div
              className="flex flex-wrap items-center gap-2.5 px-1 py-0.5 text-xxs text-muted-foreground"
              style={{ justifyContent: "flex-end" }}
            >
              <span className="font-semibold text-muted-foreground whitespace-nowrap">
                Search in:
              </span>
              {MENTION_SEARCH_FIELDS.map((field) => {
                const isChecked = searchFields.includes(field.id);
                return (
                  <label
                    key={field.id}
                    htmlFor={`mention-field-${field.id}`}
                    className="flex items-center gap-1 cursor-pointer select-none text-xxs text-foreground font-medium"
                  >
                    <Checkbox
                      id={`mention-field-${field.id}`}
                      checked={isChecked}
                      onCheckedChange={() => toggleSearchField(field.id)}
                      className="size-3.5"
                    />
                    <span>{field.label}</span>
                  </label>
                );
              })}
            </div>
          )}

          <Tabs
            value={mentionFilterScope}
            onValueChange={(val) =>
              setMentionFilterScope(val as MentionFilterScope)
            }
          >
            <TabsList className="flex w-full h-8">
              <TabsTrigger
                value="all"
                className="flex-1 text-xs cursor-pointer gap-1"
              >
                <span>All</span>
                {totalCount > 0 && (
                  <span className="text-xxs px-1 py-0.5 rounded-md bg-muted text-muted-foreground font-semibold">
                    {totalCount}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="recordings"
                className="flex-1 text-xs cursor-pointer gap-1"
              >
                <span>Lectures</span>
                {recCount > 0 && (
                  <span className="text-xxs px-1 py-0.5 rounded-md bg-primary/10 text-primary font-bold">
                    {recCount}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="categories"
                className="flex-1 text-xs cursor-pointer gap-1"
              >
                <span>Categories</span>
                {catCount > 0 && (
                  <span className="text-xxs px-1 py-0.5 rounded-md bg-muted text-muted-foreground font-semibold">
                    {catCount}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="materials"
                className="flex-1 text-xs cursor-pointer gap-1"
              >
                <span>Materials</span>
                {matCount > 0 && (
                  <span className="text-xxs px-1 py-0.5 rounded-md bg-muted text-muted-foreground font-semibold">
                    {matCount}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="max-h-75 overflow-y-auto divide-y divide-border/40">
          {searchingMentions ? (
            <div className="p-6 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span>Searching content index...</span>
            </div>
          ) : filteredMentionResults.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground">
              {mentionQuery.trim()
                ? "No matching content found for this filter."
                : "Type above to search lectures, categories, or study materials."}
            </div>
          ) : (
            filteredMentionResults.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectMention(item)}
                className="w-full text-left p-3 hover:bg-muted transition-all flex items-start justify-between gap-3 cursor-pointer group"
              >
                {item.type === "recording" && item.recording ? (
                  <div className="flex items-start gap-2.5 flex-1 overflow-hidden">
                    <Headphones className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <RecordingMeta rec={item.recording} sm />
                  </div>
                ) : (
                  <div className="flex items-center gap-2.5 flex-1 overflow-hidden">
                    {item.type === "category" && (
                      <Folder className="h-4 w-4 text-primary shrink-0" />
                    )}
                    {item.type === "material" && (
                      <FileText className="h-4 w-4 text-warning shrink-0" />
                    )}
                    <div className="flex flex-col flex-1 overflow-hidden">
                      <span className="text-xs font-semibold truncate group-hover:text-primary transition-all">
                        {item.name}
                      </span>
                      {item.subtitle && (
                        <span className="text-xxs text-muted-foreground truncate">
                          {item.subtitle}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <Badge variant="outline" className="text-xxs shrink-0 mt-0.5">
                  {item.type === "recording"
                    ? "Lecture"
                    : item.type === "category"
                      ? "Category"
                      : "Material"}
                </Badge>
              </button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
