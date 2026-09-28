import { describe, expect, it } from "vitest";
import { LOCAL_STORAGE } from "@/constants";
import {
  addSyncNotifications,
  clearNotificationStorage,
  getAllStoredGroups,
  useNotifications,
} from "./use-notifications";

describe("use-notifications hook suite", () => {
  it("exports valid useNotifications hook", () => {
    expect(typeof useNotifications).toBe("function");
  });

  it("clearNotificationStorage removes notification local storage keys including cleared_at", () => {
    localStorage.setItem(LOCAL_STORAGE.READ_NOTIFICATIONS, "['1']");
    localStorage.setItem(
      LOCAL_STORAGE.NOTIFICATIONS_CLEARED_AT,
      "2026-09-28T00:00:00.000Z",
    );
    localStorage.setItem(`${LOCAL_STORAGE.NOTIFICATION_GROUPS}:u1`, "[]");
    localStorage.setItem(`${LOCAL_STORAGE.NOTIFICATION_GROUPS}::public`, "[]");

    clearNotificationStorage();

    expect(localStorage.getItem(LOCAL_STORAGE.READ_NOTIFICATIONS)).toBeNull();
    expect(
      localStorage.getItem(LOCAL_STORAGE.NOTIFICATIONS_CLEARED_AT),
    ).toBeNull();
    expect(
      localStorage.getItem(`${LOCAL_STORAGE.NOTIFICATION_GROUPS}:u1`),
    ).toBeNull();
    expect(
      localStorage.getItem(`${LOCAL_STORAGE.NOTIFICATION_GROUPS}::public`),
    ).toBeNull();
  });

  it("addSyncNotifications groups new additions into local storage", () => {
    addSyncNotifications(
      {
        recordings: [101],
        materials: [201],
        categories: [301],
        replies: ["rep1"],
        requests: ["req1"],
      },
      "user_123",
    );

    const stored = JSON.parse(
      localStorage.getItem(`${LOCAL_STORAGE.NOTIFICATION_GROUPS}:user_123`) ||
        "[]",
    );

    expect(stored.length).toBe(5);
    expect(stored.some((g: any) => g.type === "recordings")).toBe(true);
    expect(stored.some((g: any) => g.type === "materials")).toBe(true);
    expect(stored.some((g: any) => g.type === "categories")).toBe(true);
    expect(stored.some((g: any) => g.type === "replies")).toBe(true);
    expect(stored.some((g: any) => g.type === "requests")).toBe(true);
  });

  it("getAllStoredGroups merges public groups with user groups for logged-in users", () => {
    // 1. Simulate public sync saving recordings to :public
    addSyncNotifications(
      {
        recordings: [5001, 5002],
        materials: [],
        categories: [],
        replies: [],
        requests: [],
      },
      undefined,
    );

    // 2. Simulate user sync saving replies to user_xyz
    addSyncNotifications(
      {
        recordings: [],
        materials: [],
        categories: [],
        replies: ["reply_99"],
        requests: [],
      },
      "user_xyz",
    );

    // Anonymous visitor gets public groups
    const anonGroups = getAllStoredGroups(null);
    expect(anonGroups.some((g) => g.type === "recordings")).toBe(true);
    expect(anonGroups.some((g) => g.type === "replies")).toBe(false);

    // Logged-in user gets BOTH public recordings AND user replies
    const userGroups = getAllStoredGroups("user_xyz");
    expect(userGroups.some((g) => g.type === "recordings")).toBe(true);
    expect(userGroups.some((g) => g.type === "replies")).toBe(true);
  });
});
