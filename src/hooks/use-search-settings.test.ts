import { describe, expect, it } from "vitest";
import {
  DEFAULT_SEARCH_SETTINGS,
  getSearchSettings,
  saveSearchSettings,
  useSearchSettings,
} from "./use-search-settings";

describe("useSearchSettings suite", () => {
  it("returns default settings initially", () => {
    localStorage.clear();
    const settings = getSearchSettings();
    expect(settings).toEqual(DEFAULT_SEARCH_SETTINGS);
  });

  it("saves and retrieves tolerance updates", () => {
    localStorage.clear();
    saveSearchSettings({ tolerance: 0 });
    const settings = getSearchSettings();
    expect(settings.tolerance).toBe(0);

    saveSearchSettings({ tolerance: 2 });
    const updated = getSearchSettings();
    expect(updated.tolerance).toBe(2);
  });

  it("exports useSearchSettings hook as function", () => {
    expect(typeof useSearchSettings).toBe("function");
  });
});
