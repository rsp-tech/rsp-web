import { Info, Sliders } from "lucide-react";
import { useMetadata } from "@/hooks/use-metadata";
import type { useSearchBar } from "@/hooks/use-search-bar";
import { cn } from "@/lib/utils";
import { DateRangePicker } from "./search/date-picker";
import { SearchResults } from "./search/search-results";
import { SearchScopeTabs } from "./search/search-scope-tabs";
import { SearchableSelect } from "./search/searchable-select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { PopoverContent } from "./ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

interface SearchBarDropdownContentProps
  extends ReturnType<typeof useSearchBar> {
  showFilters: boolean;
  hasActiveFilters: boolean;
}

export const SearchBarDropdownContent = ({
  showFilters,
  hasActiveFilters,
  term,
  scope,
  setScope,
  currentCategory,
  results,
  filters,
  setFilters,
  tolerance,
  setTolerance,
  exactMatch,
  setExactMatch,
  searchFields = ["name", "speaker_names", "event_name", "venue_name"],
  toggleSearchField,
  handleSelectCategory,
  handleSelectRecording,
  handleSelectMaterial,
}: SearchBarDropdownContentProps) => {
  const { speakers, languages, venues } = useMetadata();
  const handleResetFilters = () => {
    setFilters({
      speaker_ids: [],
      lang_ids: [],
      venues_id: undefined,
      date_start: "",
      date_end: "",
    });
  };

  const speakerOptions = speakers.map((s) => ({
    value: String(s.id),
    label: s.name,
  }));

  const languageOptions = languages.map((l) => ({
    value: String(l.id),
    label: l.name === l.native_name ? l.name : `${l.name} (${l.native_name})`,
  }));

  const venueOptions = venues.map((v) => ({
    value: String(v.id),
    label: v.name,
  }));

  const toleranceOptions = [
    { value: "0", label: "Strict (0 typo tolerance)" },
    { value: "1", label: "Balanced (1 typo / variation) — Default" },
    { value: "2", label: "Loose (2 typos / variations)" },
  ];

  const isSpeakerActive = searchFields.includes("speaker_names");
  const isVenueActive = searchFields.includes("venue_name");

  return (
    <PopoverContent
      className="p-0 bg-card border border-border shadow-md rounded-xl overflow-hidden z-50 flex flex-col"
      style={{
        width: "var(--radix-popover-trigger-width)",
        maxHeight: "min(38rem, 85vh)",
      }}
      align="start"
      onOpenAutoFocus={(e) => e.preventDefault()}
      onInteractOutside={(e) => {
        const target = e.target as HTMLElement;
        if (
          target.closest("#search-filters-toggle") ||
          target.closest("#search-input-container")
        ) {
          e.preventDefault();
        }
      }}
    >
      {currentCategory && (
        <SearchScopeTabs
          scope={scope}
          setScope={setScope}
          currentCategory={currentCategory}
        />
      )}
      {/* Collapsible Filters & Config Panel */}
      {showFilters && (
        <div className="bg-muted/40 p-3 border-b border-border flex flex-col gap-3 text-xs">
          <div className="flex items-center justify-between pb-1 border-b border-border/40">
            <div className="flex items-center gap-1.5">
              <span className="font-bold">
                Advanced Search Filters & Config
              </span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-primary cursor-pointer p-1 rounded-md focus:outline-none transition-all"
                    aria-label="Filter scope information"
                  >
                    <Info className="size-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs text-xs">
                  These filters and engine tuning options apply specifically to
                  discourse recordings.
                </TooltipContent>
              </Tooltip>
            </div>
            {hasActiveFilters && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="text-xxs text-primary hover:bg-accent rounded-md font-bold cursor-pointer h-8 px-2"
              >
                Reset Filters
              </Button>
            )}
          </div>

          {/* Unified Accordion: only one section open at a time */}
          <Accordion
            type="single"
            defaultValue="filters"
            collapsible
            className="w-full"
          >
            <AccordionItem value="filters">
              <AccordionTrigger className="py-1 text-xxs font-semibold text-muted-foreground hover:text-primary hover:no-underline cursor-pointer">
                <span className="flex items-center gap-1.5">
                  <Sliders className="w-3 h-3 text-primary" />
                  <span>Filter by Metadata</span>
                </span>
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-1">
                <div
                  className="grid gap-3"
                  style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}
                >
                  {/* Speaker select */}
                  <div className="flex flex-col gap-1">
                    <Label
                      className={cn(
                        "text-xxs font-bold uppercase",
                        isSpeakerActive
                          ? "text-muted-foreground"
                          : "text-muted-foreground opacity-60",
                      )}
                    >
                      Speaker {!isSpeakerActive && "(disabled)"}
                    </Label>
                    <SearchableSelect
                      options={speakerOptions}
                      value={
                        filters.speaker_ids?.[0]
                          ? String(filters.speaker_ids[0])
                          : ""
                      }
                      onChange={(val) => {
                        setFilters({
                          ...filters,
                          speaker_ids: val ? [Number(val)] : [],
                        });
                      }}
                      placeholder={
                        isSpeakerActive
                          ? "All Speakers"
                          : "Speaker search disabled"
                      }
                      disabled={!isSpeakerActive}
                    />
                  </div>

                  {/* Language select */}
                  <div className="flex flex-col gap-1">
                    <Label className="text-xxs font-bold text-muted-foreground uppercase">
                      Language
                    </Label>
                    <SearchableSelect
                      options={languageOptions}
                      value={
                        filters.lang_ids?.[0] ? String(filters.lang_ids[0]) : ""
                      }
                      onChange={(val) => {
                        setFilters({
                          ...filters,
                          lang_ids: val ? [Number(val)] : [],
                        });
                      }}
                      placeholder="All Languages"
                    />
                  </div>

                  {/* Venue select */}
                  <div className="flex flex-col gap-1">
                    <Label
                      className={cn(
                        "text-xxs font-bold uppercase",
                        isVenueActive
                          ? "text-muted-foreground"
                          : "text-muted-foreground opacity-60",
                      )}
                    >
                      Venue {!isVenueActive && "(disabled)"}
                    </Label>
                    <SearchableSelect
                      options={venueOptions}
                      value={filters.venues_id ? String(filters.venues_id) : ""}
                      onChange={(val) => {
                        setFilters({
                          ...filters,
                          venues_id: val ? Number(val) : undefined,
                        });
                      }}
                      placeholder={
                        isVenueActive ? "All Venues" : "Venue search disabled"
                      }
                      disabled={!isVenueActive}
                    />
                  </div>

                  {/* Date range inputs */}
                  <div className="flex flex-col gap-1">
                    <Label className="text-xxs font-bold text-muted-foreground uppercase">
                      Recorded Date Range
                    </Label>
                    <DateRangePicker
                      startDate={filters.date_start || ""}
                      endDate={filters.date_end || ""}
                      onChange={(start, end) => {
                        setFilters({
                          ...filters,
                          date_start: start,
                        });
                        // Only update end date if start is also present (or both empty)
                        if (start || (!start && !end)) {
                          setFilters((prev) => ({
                            ...prev,
                            date_start: start,
                            date_end: end,
                          }));
                        }
                      }}
                      placeholder="Select range"
                    />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="engine-tuning">
              <AccordionTrigger className="py-1 text-xxs font-semibold text-muted-foreground hover:text-primary hover:no-underline cursor-pointer">
                <span className="flex items-center gap-1.5">
                  <Sliders className="w-3 h-3 text-primary" />
                  <span>Advanced Engine Tuning</span>
                </span>
              </AccordionTrigger>
              <AccordionContent className="flex flex-col gap-2.5 pt-2 pb-1">
                {/* Typo Tolerance */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 rounded-lg bg-card border border-border">
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="font-semibold text-xs text-foreground">
                      Typo Tolerance
                    </span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="text-muted-foreground hover:text-primary cursor-pointer p-1 rounded-md focus:outline-none transition-all"
                          aria-label="Typo tolerance information"
                        >
                          <Info className="size-3.5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs text-xs">
                        Allows finding discourses even with spelling mistakes or
                        transliteration differences.
                      </TooltipContent>
                    </Tooltip>
                  </div>

                  <div className="w-full md:w-72 shrink-0">
                    <SearchableSelect
                      options={toleranceOptions}
                      value={String(tolerance ?? 1)}
                      onChange={(val) => setTolerance(val ? Number(val) : 1)}
                      placeholder="Select typo tolerance"
                    />
                  </div>
                </div>

                {/* Match Precision */}
                <div className="flex items-center justify-between p-2 rounded-lg bg-card border border-border text-xs">
                  <div className="flex flex-col gap-1">
                    <span className="font-semibold text-xs text-foreground">
                      Match Precision
                    </span>
                    <span className="text-xxs text-muted-foreground">
                      {exactMatch
                        ? "Whole words only (disables autocomplete prefix matching)"
                        : "Partial & prefix matching (finds words as you type)"}
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant={exactMatch ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => setExactMatch?.(!exactMatch)}
                    className="h-8 text-xs font-semibold px-3 cursor-pointer shrink-0"
                  >
                    {exactMatch ? "Whole Word Only" : "Prefix / Autocomplete"}
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
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
        searchFields={searchFields}
        toggleSearchField={toggleSearchField}
      />
    </PopoverContent>
  );
};
