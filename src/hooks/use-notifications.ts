"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/components/providers";
import { LOCAL_STORAGE, STORE } from "@/constants";
import { getDB } from "@/lib/idb";
import { categoryPath } from "@/lib/utils";
import type {
  Category,
  Material,
  NotificationGroup,
  QueryReply,
  Recording,
  ResolvedNotificationGroup,
  ResolvedNotificationItem,
  SyncNewAdditions,
  UserEditRequest,
  UserQuery,
} from "@/types";

const getGroupsStorageKey = (userId?: string | null) =>
  `${LOCAL_STORAGE.NOTIFICATION_GROUPS}:${userId || ":public"}`;

const getStoredGroups = (userId?: string | null): NotificationGroup[] => {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(
      localStorage.getItem(getGroupsStorageKey(userId)) || "[]",
    );
  } catch {
    return [];
  }
};

const saveStoredGroups = (
  groups: NotificationGroup[],
  userId?: string | null,
) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(getGroupsStorageKey(userId), JSON.stringify(groups));
};

export const clearNotificationStorage = () => {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(LOCAL_STORAGE.READ_NOTIFICATIONS);
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(LOCAL_STORAGE.NOTIFICATION_GROUPS)) {
        keysToRemove.push(key);
      }
    }
    for (const key of keysToRemove) {
      localStorage.removeItem(key);
    }
  } catch (err) {
    console.error("Failed to clear notification storage:", err);
  }
};

export const addSyncNotifications = (
  newAdditions: SyncNewAdditions,
  userId?: string | null,
) => {
  const { recordings, materials, categories, replies, requests } = newAdditions;
  const now = new Date().toISOString();
  const timestampNum = Date.now();
  const existingGroups = getStoredGroups(userId);
  const newGroups: NotificationGroup[] = [];

  if (recordings?.length) {
    newGroups.push({
      id: `recordings-${timestampNum}`,
      type: "recordings",
      timestamp: now,
      itemIds: recordings,
      readItemIds: [],
    });
  }

  if (materials?.length) {
    newGroups.push({
      id: `materials-${timestampNum}`,
      type: "materials",
      timestamp: now,
      itemIds: materials,
      readItemIds: [],
    });
  }

  if (categories?.length) {
    newGroups.push({
      id: `categories-${timestampNum}`,
      type: "categories",
      timestamp: now,
      itemIds: categories,
      readItemIds: [],
    });
  }

  if (replies?.length) {
    newGroups.push({
      id: `replies-${timestampNum}`,
      type: "replies",
      timestamp: now,
      itemIds: replies,
      readItemIds: [],
    });
  }

  if (requests?.length) {
    newGroups.push({
      id: `requests-${timestampNum}`,
      type: "requests",
      timestamp: now,
      itemIds: requests,
      readItemIds: [],
    });
  }

  if (newGroups.length > 0) {
    // Keep maximum 50 recent notification groups
    const combined = [...newGroups, ...existingGroups].slice(0, 50);
    saveStoredGroups(combined, userId);
  }
};

const resolveGroups = async (
  userId?: string | null,
): Promise<ResolvedNotificationGroup[]> => {
  const storedGroups = getStoredGroups(userId);
  if (!storedGroups.length) return [];

  const db = await getDB();
  if (!db) return [];

  const hasReplies = storedGroups.some((g) => g.type === "replies");
  const hasRequests = storedGroups.some((g) => g.type === "requests");

  let queriesMap: Map<string, UserQuery> | null = null;
  let repliesMap: Map<string, QueryReply> | null = null;
  if (hasReplies) {
    const [queries, replies] = await Promise.all([
      db.getAll(STORE.USER_QUERIES) as Promise<UserQuery[]>,
      db.getAll(STORE.QUERY_REPLIES) as Promise<QueryReply[]>,
    ]);
    queriesMap = new Map(queries.map((q) => [q.id, q]));
    repliesMap = new Map(replies.map((r) => [r.id, r]));
  }

  let requestsMap: Map<string, UserEditRequest> | null = null;
  if (hasRequests) {
    const requests = (await db.getAll(
      STORE.USER_EDIT_REQUESTS,
    )) as UserEditRequest[];
    requestsMap = new Map(requests.map((r) => [r.id, r]));
  }

  const categoryCache = new Map<number, Category | null>();
  const recordingCache = new Map<number, Recording | null>();

  const getCategory = async (id: number): Promise<Category | null> => {
    if (categoryCache.has(id)) return categoryCache.get(id) as Category;
    const cat = ((await db.get(STORE.CATEGORIES, id)) as Category) || null;
    categoryCache.set(id, cat);
    return cat;
  };

  const getRecording = async (id: number): Promise<Recording | null> => {
    if (recordingCache.has(id)) return recordingCache.get(id) as Recording;
    const rec = ((await db.get(STORE.RECORDINGS, id)) as Recording) || null;
    recordingCache.set(id, rec);
    return rec;
  };

  const resolvedGroups: ResolvedNotificationGroup[] = [];

  for (const group of storedGroups) {
    const items: ResolvedNotificationItem[] = [];
    const readSet = new Set(group.readItemIds.map(String));

    switch (group.type) {
      case "recordings": {
        for (const id of group.itemIds) {
          const rec = await getRecording(Number(id));
          if (!rec) continue;

          let url = "/";
          let categoryName = "";
          if (rec.category_id) {
            const cat = await getCategory(rec.category_id);
            if (cat && cat.url_path !== "trash") {
              url = `/${categoryPath(cat.url_path)}?q=${rec.id}`;
              categoryName = cat.name || "";
            }
          }

          const subtitles = [
            categoryName,
            rec.recorded_at
              ? new Date(rec.recorded_at).toLocaleDateString()
              : undefined,
          ].filter(Boolean);

          items.push({
            id: rec.id,
            title: rec.name || "Untitled Recording",
            subtitle: subtitles.join(" • "),
            url,
            timestamp: rec.recorded_at || group.timestamp,
            read: readSet.has(String(rec.id)),
          });
        }
        break;
      }

      case "materials": {
        for (const id of group.itemIds) {
          const mat = (await db.get(STORE.MATERIALS, Number(id))) as
            | Material
            | undefined;
          if (!mat) continue;

          let url = "/";
          let parentName = "";
          if (mat.recording_id) {
            const rec = await getRecording(mat.recording_id);
            if (rec?.category_id) {
              const cat = await getCategory(rec.category_id);
              if (cat && cat.url_path !== "trash") {
                url = `/${categoryPath(cat.url_path)}?q=${rec.id}&m=${mat.id}`;
                parentName = rec.name || cat.name || "";
              }
            }
          }

          items.push({
            id: mat.id,
            title: mat.name || "Study Material",
            subtitle: parentName ? `In: ${parentName}` : mat.type || "Document",
            url,
            timestamp: group.timestamp,
            read: readSet.has(String(mat.id)),
          });
        }
        break;
      }

      case "categories": {
        for (const id of group.itemIds) {
          const cat = await getCategory(Number(id));
          if (!cat || cat.url_path === "trash") continue;

          items.push({
            id: cat.id,
            title: cat.name || "New Category",
            subtitle: "Category added",
            url: `/${categoryPath(cat.url_path)}`,
            timestamp: group.timestamp,
            read: readSet.has(String(cat.id)),
          });
        }
        break;
      }

      case "replies": {
        for (const id of group.itemIds) {
          const reply = repliesMap?.get(String(id));
          const query = reply?.query_id
            ? queriesMap?.get(reply.query_id)
            : undefined;

          items.push({
            id,
            title: "New Reply on Ticket",
            subtitle: query?.subject
              ? `Ticket: "${query.subject}"`
              : "Query updated",
            url: query ? `/queries?id=${query.id}` : "/queries",
            timestamp: reply?.updated_at || group.timestamp,
            read: readSet.has(String(id)),
          });
        }
        break;
      }

      case "requests": {
        for (const id of group.itemIds) {
          const req = requestsMap?.get(String(id));

          items.push({
            id,
            title: "Profile Request Update",
            subtitle: req?.status
              ? `Status: ${req.status}`
              : "Profile request reviewed",
            url: "/profile",
            timestamp: req?.updated_at || group.timestamp,
            read: readSet.has(String(id)),
          });
        }
        break;
      }
    }

    if (items.length > 0) {
      const unreadCount = items.filter((i) => !i.read).length;
      let groupTitle = "";
      switch (group.type) {
        case "recordings":
          groupTitle = `${items.length} New ${items.length === 1 ? "Recording" : "Recordings"} Added`;
          break;
        case "materials":
          groupTitle = `${items.length} New ${items.length === 1 ? "Study Material" : "Study Materials"} Added`;
          break;
        case "categories":
          groupTitle = `${items.length} New ${items.length === 1 ? "Category" : "Categories"} Added`;
          break;
        case "replies":
          groupTitle = `${items.length} New ${items.length === 1 ? "Ticket Reply" : "Ticket Replies"}`;
          break;
        case "requests":
          groupTitle = "Profile Request Updates";
          break;
      }

      resolvedGroups.push({
        id: group.id,
        type: group.type,
        title: groupTitle,
        timestamp: group.timestamp,
        unreadCount,
        items,
      });
    }
  }

  return resolvedGroups;
};

export const useNotifications = () => {
  const { session, isLoading: sessionLoading } = useSession();
  const userId = session?.user?.id ?? null;
  const queryClient = useQueryClient();

  const queryKey = [STORE.USERS, "notifications", userId];

  const query = useQuery({
    queryKey,
    queryFn: () => resolveGroups(userId),
    enabled: !sessionLoading,
  });

  const markItemAsRead = useMutation({
    mutationFn: async ({
      groupId,
      itemId,
    }: {
      groupId: string;
      itemId: number | string;
    }) => {
      const groups = getStoredGroups(userId);
      const targetGroup = groups.find((g) => g.id === groupId);
      if (targetGroup) {
        const strId = String(itemId);
        if (!targetGroup.readItemIds.map(String).includes(strId)) {
          targetGroup.readItemIds.push(itemId);
          saveStoredGroups(groups, userId);
        }
      }
    },
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey,
      }),
  });

  const markGroupAsRead = useMutation({
    mutationFn: async (groupId: string) => {
      const groups = getStoredGroups(userId);
      const targetGroup = groups.find((g) => g.id === groupId);
      if (targetGroup) {
        targetGroup.readItemIds = [...targetGroup.itemIds];
        saveStoredGroups(groups, userId);
      }
    },
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey,
      }),
  });

  const markAllAsRead = useMutation({
    mutationFn: async () => {
      const groups = getStoredGroups(userId);
      for (const group of groups) {
        group.readItemIds = [...group.itemIds];
      }
      saveStoredGroups(groups, userId);
    },
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey,
      }),
  });

  const clearAll = useMutation({
    mutationFn: async () => {
      if (typeof window !== "undefined") {
        localStorage.removeItem(getGroupsStorageKey(userId));
      }
    },
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey,
      }),
  });

  const groups = query.data ?? [];
  const totalUnreadCount = groups.reduce(
    (sum, group) => sum + group.unreadCount,
    0,
  );

  return {
    groups,
    unreadCount: totalUnreadCount,
    isLoading: query.isLoading,
    markItemAsRead: (groupId: string, itemId: number | string) =>
      markItemAsRead.mutate({ groupId, itemId }),
    markGroupAsRead: (groupId: string) => markGroupAsRead.mutate(groupId),
    markAllAsRead: () => markAllAsRead.mutate(),
    clearAll: () => clearAll.mutate(),
  };
};
