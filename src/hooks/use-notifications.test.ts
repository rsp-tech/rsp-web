import { describe, expect, it } from "vitest";
import { LOCAL_STORAGE } from "@/constants";
import { clearNotificationStorage, useNotifications } from "./use-notifications";

describe.concurrent("use-notifications hook suite", () => {
  it.concurrent("exports valid useNotifications hook", () => {
    expect(typeof useNotifications).toBe("function");
  });

  it.concurrent("clearNotificationStorage removes notification local storage keys", () => {
    localStorage.setItem(LOCAL_STORAGE.READ_NOTIFICATIONS, "['1']");
    localStorage.setItem(`${LOCAL_STORAGE.NOTIFICATION_GROUPS}:u1`, "[]");

    clearNotificationStorage();

    expect(localStorage.getItem(LOCAL_STORAGE.READ_NOTIFICATIONS)).toBeNull();
    expect(localStorage.getItem(`${LOCAL_STORAGE.NOTIFICATION_GROUPS}:u1`)).toBeNull();
  });
});

