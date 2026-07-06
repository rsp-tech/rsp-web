import { useMetadata } from "@/hooks/use-metadata";
import type { useSearchBar } from "@/hooks/use-search-bar";
import { DateRangePicker } from "./search/date-picker";
import { SearchResults } from "./search/search-results";
import { SearchScopeTabs } from "./search/search-scope-tabs";
import { SearchableSelect } from "./search/searchable-select";
import { Label } from "./ui/label";
import { PopoverContent } from "./ui/popover";

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
  return (
    <PopoverContent
      className="p-0 bg-card border border-border shadow-md rounded-xl overflow-hidden z-50 flex flex-col"
      style={{
        width: "var(--radix-popover-trigger-width)",
        maxHeight: "28.75rem",
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
      {/* Collapsible Filters Panel */}
      {showFilters && (
        <div className="bg-muted/40 p-3 border-b border-border flex flex-col gap-3 text-xs">
          <div className="flex items-center justify-between pb-1 border-b border-border/40">
            <span className="font-bold ">Advanced Search Filters</span>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xxs text-primary hover:bg-accent rounded-md font-bold cursor-pointer p-2"
              >
                Reset Filters
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Speaker select */}
            <div className="flex flex-col gap-1">
              <Label className="text-xxs font-bold text-muted-foreground uppercase">
                Speaker
              </Label>
              <SearchableSelect
                options={speakerOptions}
                value={
                  filters.speaker_ids?.[0] ? String(filters.speaker_ids[0]) : ""
                }
                onChange={(val) => {
                  setFilters({
                    ...filters,
                    speaker_ids: val ? [Number(val)] : [],
                  });
                }}
                placeholder="All Speakers"
              />
            </div>

            {/* Language select */}
            <div className="flex flex-col gap-1">
              <Label className="text-xxs font-bold text-muted-foreground uppercase">
                Language
              </Label>
              <SearchableSelect
                options={languageOptions}
                value={filters.lang_ids?.[0] ? String(filters.lang_ids[0]) : ""}
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
              <Label className="text-xxs font-bold text-muted-foreground uppercase">
                Venue
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
                placeholder="All Venues"
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
      />
    </PopoverContent>
  );
};
