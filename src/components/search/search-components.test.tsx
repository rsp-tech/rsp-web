import { describe, expect, it } from "vitest";
import { DateRangePicker } from "./date-picker";
import { SearchInput } from "./search-input";
import { SearchResults } from "./search-results";
import { SearchScopeTabs } from "./search-scope-tabs";
import { SearchableSelect } from "./searchable-select";

describe.concurrent("search components suite", () => {
  it.concurrent("exports search input and filter components", () => {
    expect(typeof DateRangePicker).toBe("function");
    expect(typeof SearchInput).toBe("function");
    expect(typeof SearchResults).toBe("function");
    expect(typeof SearchScopeTabs).toBe("function");
    expect(typeof SearchableSelect).toBe("function");
  });
});
