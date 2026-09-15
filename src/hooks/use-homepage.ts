import { useQuery } from "@tanstack/react-query";
import { QUERY_KEY, STORE } from "@/constants";
import { getDB } from "@/lib/idb";
import { sortByOrderInd } from "@/lib/utils";
import type {
  Announcement,
  Category,
  EnrichedFeaturedItem,
  EnrichedFeaturedSection,
  EnrichedRecording,
  FeaturedItem,
  FeaturedSection,
  Material,
  Recording,
} from "@/types";

export const isAnnouncementCurrentlyActive = (
  item: Announcement,
  now = new Date(),
): boolean => {
  if (item.is_active === false) return false;
  if (!item.start_date && !item.end_date) return true;

  const currentYear = now.getFullYear();
  const currentMonth = String(now.getMonth() + 1).padStart(2, "0");
  const currentDay = String(now.getDate()).padStart(2, "0");
  const currentMMDD = `${currentMonth}-${currentDay}`;
  const currentYYYYMMDD = `${currentYear}-${currentMMDD}`;

  if (item.is_annual_recurring) {
    const extractMMDD = (dateStr?: string | null) => {
      if (!dateStr) return "";
      const parts = dateStr.split("-");
      if (parts.length >= 3) {
        return `${parts[1].padStart(2, "0")}-${parts[2].padStart(2, "0")}`;
      }
      if (parts.length === 2) {
        return `${parts[0].padStart(2, "0")}-${parts[1].padStart(2, "0")}`;
      }
      return dateStr;
    };

    const startMMDD = extractMMDD(item.start_date);
    const endMMDD = extractMMDD(item.end_date);

    if (startMMDD && endMMDD) {
      if (startMMDD <= endMMDD) {
        return currentMMDD >= startMMDD && currentMMDD <= endMMDD;
      }
      // Spanning across year boundary (e.g. Dec to Jan)
      return currentMMDD >= startMMDD || currentMMDD <= endMMDD;
    }
    if (startMMDD) return currentMMDD >= startMMDD;
    if (endMMDD) return currentMMDD <= endMMDD;
    return true;
  }

  // Exact date range
  if (item.start_date && currentYYYYMMDD < item.start_date) return false;
  if (item.end_date && currentYYYYMMDD > item.end_date) return false;

  return true;
};

export const useHomepage = () =>
  useQuery({
    queryKey: [QUERY_KEY.HOMEPAGE],
    queryFn: async () => {
      const db = await getDB();
      if (!db) {
        return {
          announcements: [],
          featuredSections: [],
          spotlights: [],
        };
      }

      const [
        announcementsRaw,
        sectionsRaw,
        itemsRaw,
        categoriesRaw,
        recordingsRaw,
        materialsRaw,
      ] = await Promise.all([
        db.getAll(STORE.ANNOUNCEMENTS) as Promise<Announcement[]>,
        db.getAll(STORE.FEATURED_SECTIONS) as Promise<FeaturedSection[]>,
        db.getAll(STORE.FEATURED_ITEMS) as Promise<FeaturedItem[]>,
        db.getAll(STORE.CATEGORIES) as Promise<Category[]>,
        db.getAll(STORE.RECORDINGS) as Promise<Recording[]>,
        db.getAll(STORE.MATERIALS) as Promise<Material[]>,
      ]);

      const now = new Date();

      // Lookup maps for fast entity enrichment
      const categoryMap = new Map<number, Category>(
        categoriesRaw.map((c) => [c.id, c]),
      );

      const materialsByRecordingId = new Map<number, Material[]>();
      for (const m of materialsRaw) {
        const list = materialsByRecordingId.get(m.recording_id) || [];
        list.push(m);
        materialsByRecordingId.set(m.recording_id, list);
      }

      const recordingMap = new Map<number, EnrichedRecording>(
        recordingsRaw.map((r) => [
          r.id,
          {
            ...r,
            materials: materialsByRecordingId.get(r.id) || [],
            category: r.category_id
              ? categoryMap.get(r.category_id) || null
              : null,
          },
        ]),
      );

      // 1. Filter active announcements
      const activeAnnouncements = announcementsRaw
        .map((a) => {
          if (typeof a.ui_props === "string") {
            try {
              let parsed = JSON.parse(a.ui_props);
              if (typeof parsed === "string") {
                try {
                  parsed = JSON.parse(parsed);
                } catch {
                  // ignore
                }
              }
              return { ...a, ui_props: parsed };
            } catch {
              return { ...a, ui_props: null };
            }
          }
          return a;
        })
        .filter((a) => isAnnouncementCurrentlyActive(a, now))
        .sort(sortByOrderInd());

      const spotlights = activeAnnouncements.filter(
        (a) => a.category === "guidance_spotlight",
      );
      const banners = activeAnnouncements.filter(
        (a) => a.category !== "guidance_spotlight",
      );

      // 2. Build enriched active featured sections
      const activeSections = sectionsRaw
        .filter((s) => s.is_active !== false)
        .sort(sortByOrderInd());

      const enrichedSections: EnrichedFeaturedSection[] = activeSections.map(
        (section) => {
          const sectionItems = itemsRaw
            .filter((item) => item.section_id === section.id)
            .sort(sortByOrderInd())
            .map((item): EnrichedFeaturedItem => {
              if (item.entity_type === "category") {
                return {
                  ...item,
                  category: categoryMap.get(item.entity_id) || null,
                };
              }
              return {
                ...item,
                recording: recordingMap.get(item.entity_id) || null,
              };
            })
            .filter((item) => !!item.category || !!item.recording);

          return {
            ...section,
            items: sectionItems,
          };
        },
      );

      return {
        announcements: banners,
        spotlights,
        featuredSections: enrichedSections.filter((s) => s.items.length > 0),
      };
    },
  });
