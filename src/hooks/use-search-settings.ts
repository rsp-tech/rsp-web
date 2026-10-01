"use client";

import { useCallback, useEffect, useState } from "react";
import { SEARCH_TOLERANCE } from "@/constants";

export type SearchFieldKey =
  | "name"
  | "speaker_names"
  | "event_name"
  | "venue_name";

export const DEFAULT_SEARCH_FIELDS: SearchFieldKey[] = [
  "name",
  "speaker_names",
  "event_name",
  "venue_name",
];

export interface SearchSettings {
  tolerance: number; // 0: Strict, 1: Balanced (Default), 2: Loose
  searchFields: SearchFieldKey[];
  exactMatch: boolean;
}

export const DEFAULT_SEARCH_SETTINGS: SearchSettings = {
  tolerance: SEARCH_TOLERANCE,
  searchFields: DEFAULT_SEARCH_FIELDS,
  exactMatch: false,
};

const STORAGE_KEY = "rsp-search-settings";
const SEARCH_SETTINGS_EVENT = "rsp-search-settings-change";

export const getSearchSettings = (): SearchSettings => {
  if (typeof window === "undefined") return DEFAULT_SEARCH_SETTINGS;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return DEFAULT_SEARCH_SETTINGS;
    const parsed = JSON.parse(saved);

    const validFields = Array.isArray(parsed.searchFields)
      ? parsed.searchFields.filter((f: string) =>
          DEFAULT_SEARCH_FIELDS.includes(f as SearchFieldKey),
        )
      : DEFAULT_SEARCH_FIELDS;

    return {
      tolerance:
        typeof parsed.tolerance === "number" &&
        parsed.tolerance >= 0 &&
        parsed.tolerance <= 2
          ? parsed.tolerance
          : DEFAULT_SEARCH_SETTINGS.tolerance,
      searchFields:
        validFields.length > 0 ? validFields : DEFAULT_SEARCH_FIELDS,
      exactMatch:
        typeof parsed.exactMatch === "boolean"
          ? parsed.exactMatch
          : DEFAULT_SEARCH_SETTINGS.exactMatch,
    };
  } catch (e) {
    console.error("Failed to read search settings:", e);
    return DEFAULT_SEARCH_SETTINGS;
  }
};

export const saveSearchSettings = (
  settings: Partial<SearchSettings>,
): SearchSettings => {
  const current = getSearchSettings();
  const next: SearchSettings = {
    ...current,
    ...settings,
  };
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      window.dispatchEvent(
        new CustomEvent(SEARCH_SETTINGS_EVENT, { detail: next }),
      );
    } catch (e) {
      console.error("Failed to save search settings:", e);
    }
  }
  return next;
};

export const useSearchSettings = () => {
  const [settings, setSettings] = useState<SearchSettings>(getSearchSettings);

  useEffect(() => {
    setSettings(getSearchSettings());

    const handleSettingsChange = (e: Event) => {
      const customEvent = e as CustomEvent<SearchSettings>;
      if (customEvent.detail) {
        setSettings(customEvent.detail);
      } else {
        setSettings(getSearchSettings());
      }
    };

    window.addEventListener(SEARCH_SETTINGS_EVENT, handleSettingsChange);
    window.addEventListener("storage", handleSettingsChange);
    return () => {
      window.removeEventListener(SEARCH_SETTINGS_EVENT, handleSettingsChange);
      window.removeEventListener("storage", handleSettingsChange);
    };
  }, []);

  const updateSettings = useCallback((newSettings: Partial<SearchSettings>) => {
    const updated = saveSearchSettings(newSettings);
    setSettings(updated);
  }, []);

  const setTolerance = useCallback(
    (tol: number) => {
      updateSettings({ tolerance: tol });
    },
    [updateSettings],
  );

  const setExactMatch = useCallback(
    (exact: boolean) => {
      updateSettings({ exactMatch: exact });
    },
    [updateSettings],
  );

  const setSearchFields = useCallback(
    (fields: SearchFieldKey[]) => {
      updateSettings({
        searchFields: fields.length > 0 ? fields : ["name"],
      });
    },
    [updateSettings],
  );

  const toggleSearchField = useCallback(
    (field: SearchFieldKey) => {
      const current = settings.searchFields;
      if (current.includes(field)) {
        // Prevent unselecting all fields; ensure at least one field remains
        if (current.length > 1) {
          setSearchFields(current.filter((f) => f !== field));
        }
      } else {
        setSearchFields([...current, field]);
      }
    },
    [settings.searchFields, setSearchFields],
  );

  return {
    settings,
    updateSettings,
    tolerance: settings.tolerance,
    setTolerance,
    effectiveTolerance: settings.tolerance,
    searchFields: settings.searchFields,
    setSearchFields,
    toggleSearchField,
    exactMatch: settings.exactMatch,
    setExactMatch,
  };
};
