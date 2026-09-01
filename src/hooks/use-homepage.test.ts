import { describe, expect, it } from "vitest";
import type { Announcement } from "@/types";
import { isAnnouncementCurrentlyActive } from "./use-homepage";

describe("isAnnouncementCurrentlyActive", () => {
  it("returns false if is_active is false", () => {
    const item: Announcement = {
      id: 1,
      title: "Test Banner",
      is_active: false,
    };
    expect(isAnnouncementCurrentlyActive(item)).toBe(false);
  });

  it("returns true if no dates are specified and is_active is true", () => {
    const item: Announcement = {
      id: 1,
      title: "Test Banner",
      is_active: true,
    };
    expect(isAnnouncementCurrentlyActive(item)).toBe(true);
  });

  it("evaluates standard date range correctly", () => {
    const item: Announcement = {
      id: 1,
      title: "Summer Retreat",
      start_date: "2026-06-01",
      end_date: "2026-06-10",
      is_active: true,
    };

    expect(isAnnouncementCurrentlyActive(item, new Date("2026-06-05"))).toBe(
      true,
    );
    expect(isAnnouncementCurrentlyActive(item, new Date("2026-05-31"))).toBe(
      false,
    );
    expect(isAnnouncementCurrentlyActive(item, new Date("2026-06-11"))).toBe(
      false,
    );
  });

  it("evaluates annual recurring dates correctly across different years (e.g. Makar Sankranti / Uttarayan Jan 14-16)", () => {
    const item: Announcement = {
      id: 1,
      title: "Uttarayan Maha Mahotsav",
      start_date: "2020-01-14",
      end_date: "2020-01-16",
      is_annual_recurring: true,
      is_active: true,
    };

    // In 2026
    expect(isAnnouncementCurrentlyActive(item, new Date("2026-01-14"))).toBe(
      true,
    );
    expect(isAnnouncementCurrentlyActive(item, new Date("2026-01-15"))).toBe(
      true,
    );
    expect(isAnnouncementCurrentlyActive(item, new Date("2026-01-16"))).toBe(
      true,
    );
    expect(isAnnouncementCurrentlyActive(item, new Date("2026-01-17"))).toBe(
      false,
    );
    expect(isAnnouncementCurrentlyActive(item, new Date("2026-01-13"))).toBe(
      false,
    );

    // In 2030
    expect(isAnnouncementCurrentlyActive(item, new Date("2030-01-15"))).toBe(
      true,
    );
  });
});
