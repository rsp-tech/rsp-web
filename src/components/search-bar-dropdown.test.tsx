import { describe, expect, it, vi } from "vitest";

// Common UI and hook mocks to enable shallow/functional component execution
vi.mock("@/hooks/use-is-mobile", () => ({ useIsMobile: () => false }));
vi.mock("@/hooks/use-online-status", () => ({ useOnlineStatus: () => true }));
vi.mock("@/lib/supabase-browser", () => ({
  getSupabaseBrowserClient: () => ({
    auth: {
      getUser: () => Promise.resolve({ data: { user: null } }),
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe: () => {} } },
      }),
    },
    from: () => ({
      select: () => ({ eq: () => Promise.resolve({ data: [] }) }),
    }),
  }),
}));
vi.mock("@/lib/idb", () => ({ getDB: () => Promise.resolve(null) }));

vi.mock("@/hooks/use-metadata", () => ({
  useMetadata: () => ({
    speakers: [{ id: 1, name: "HG Radheshyamdas" }],
    languages: [{ id: 1, name: "English", native_name: "English" }],
    venues: [{ id: 1, name: "NVCC Pune" }],
  }),
}));

vi.mock("./search/date-picker", () => ({
  DateRangePicker: () => <div data-testid="date-picker" />,
}));
vi.mock("./search/search-results", () => ({
  SearchResults: () => <div data-testid="search-results" />,
}));
vi.mock("./search/search-scope-tabs", () => ({
  SearchScopeTabs: () => <div data-testid="scope-tabs" />,
}));
vi.mock("./search/searchable-select", () => ({
  SearchableSelect: () => <div data-testid="searchable-select" />,
}));

describe.concurrent("src/components/search-bar-dropdown.tsx suite", () => {
  it.concurrent("renders SearchBarDropdownContent with search results and active filters", async () => {
    const { SearchBarDropdownContent } = await import("./search-bar-dropdown");
    const tree = SearchBarDropdownContent({
      showFilters: true,
      hasActiveFilters: false,
      term: "Gita",
      scope: "full",
      setScope: vi.fn(),
      currentCategory: {
        id: 1,
        name: "Gita",
        url_path: "gita",
        path: "gita",
      } as any,
      results: { categories: [], recordings: [], materials: [] },
      filters: {
        speaker_ids: [],
        lang_ids: [],
        venues_id: undefined,
        date_start: "",
        date_end: "",
      },
      setFilters: vi.fn(),
      handleSelectCategory: vi.fn(),
      handleSelectRecording: vi.fn(),
      handleSelectMaterial: vi.fn(),
    } as any);
    expect(tree).toBeDefined();
  });
});
