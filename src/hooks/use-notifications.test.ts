import { describe, expect, it } from "vitest";
import { LOCAL_STORAGE } from "@/constants";
import {
  addSyncNotifications,
  clearNotificationStorage,
  useNotifications,
} from "./use-notifications";

describe.concurrent("use-notifications hook suite", () => {
  it.concurrent("exports valid useNotifications hook", () => {
    expect(typeof useNotifications).toBe("function");
  });

  it.concurrent("clearNotificationStorage removes notification local storage keys", () => {
    localStorage.setItem(LOCAL_STORAGE.READ_NOTIFICATIONS, "['1']");
    localStorage.setItem(`${LOCAL_STORAGE.NOTIFICATION_GROUPS}:u1`, "[]");

    clearNotificationStorage();

    expect(localStorage.getItem(LOCAL_STORAGE.READ_NOTIFICATIONS)).toBeNull();
    expect(
      localStorage.getItem(`${LOCAL_STORAGE.NOTIFICATION_GROUPS}:u1`),
    ).toBeNull();
  });

  it.concurrent("addSyncNotifications groups new additions into local storage", () => {
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
});
