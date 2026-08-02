"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/components/providers";
import { LOCAL_STORAGE, STORE } from "@/constants";
import { getDB } from "@/lib/idb";

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

const READ_IDS_KEY = LOCAL_STORAGE.READ_NOTIFICATIONS;

const getReadIds = (): string[] => {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(READ_IDS_KEY) || "[]");
  } catch {
    return [];
  }
};

const addReadId = (id: string) => {
  if (typeof window === "undefined") return;
  const ids = getReadIds();
  if (!ids.includes(id)) {
    localStorage.setItem(READ_IDS_KEY, JSON.stringify([...ids, id]));
  }
};

const fetchNotifications = async (
  sessionUserId: string | undefined,
): Promise<AppNotification[]> => {
  const db = await getDB();
  if (!db) return [];

  const list: AppNotification[] = [];
  const readIds = getReadIds();

  // 1. Check user queries & replies for "Query Replied"
  if (sessionUserId) {
    const queries = await db.getAll(STORE.USER_QUERIES);
    const userQueries = queries.filter((q) => q.user_id === sessionUserId);
    const queryIds = userQueries.map((q) => q.id);

    if (queryIds.length > 0) {
      const allReplies = await db.getAll(STORE.QUERY_REPLIES);
      const userReplies = allReplies.filter(
        (r) => queryIds.includes(r.query_id) && r.user_id !== sessionUserId,
      );

      for (const reply of userReplies) {
        const notifId = `reply-${reply.id}`;
        const querySubject =
          userQueries.find((q) => q.id === reply.query_id)?.subject || "";
        list.push({
          id: notifId,
          title: "New Reply on Ticket",
          message: `A new reply has been posted on your ticket "${querySubject}".`,
          read: readIds.includes(notifId),
          created_at: reply.updated_at || new Date().toISOString(),
        });
      }
    }

    // 2. Check profile update request status for "Profile Approved/Rejected"
    const requests = await db.getAll(STORE.USER_EDIT_REQUESTS);
    const userRequests = requests.filter(
      (r) => r.user_id === sessionUserId && r.status !== "pending",
    );

    for (const req of userRequests) {
      const notifId = `profile-${req.id}-${req.status}`;
      const msg =
        req.status === "approved"
          ? "Your profile update request has been approved."
          : `Your profile update request has been rejected.${req.review_comment ? ` Reason: ${req.review_comment}` : ""}`;
      list.push({
        id: notifId,
        title: "Profile Request Update",
        message: msg,
        read: readIds.includes(notifId),
        created_at:
          req.reviewed_at || req.updated_at || new Date().toISOString(),
      });
    }
  }

  // 3. Check recordings for "New Content Added" (last 7 days)
  const recordings = await db.getAll(STORE.RECORDINGS);
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const newRecordings = recordings.filter((rec) => {
    if (!rec.recorded_at) return false;
    return new Date(rec.recorded_at) >= sevenDaysAgo;
  });

  for (const rec of newRecordings) {
    const notifId = `recording-${rec.id}`;
    list.push({
      id: notifId,
      title: "New Recording Added",
      message: `"${rec.name}" has been added recently.`,
      read: readIds.includes(notifId),
      created_at: rec.recorded_at || new Date().toISOString(),
    });
  }

  // Sort by date descending
  list.sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  return list;
};

export const useNotifications = () => {
  const { session, isLoading: sessionLoading } = useSession();
  const queryClient = useQueryClient();
  const userId = session?.user?.id;

  const query = useQuery({
    queryKey: [STORE.USERS, "notifications"],
    queryFn: () => fetchNotifications(userId),
    enabled: !sessionLoading,
  });

  const markAsRead = useMutation({
    mutationFn: async (id: string) => {
      addReadId(id);
    },
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: [STORE.USERS, userId, "notifications"],
      }),
  });

  return {
    notifications: query.data ?? [],
    isLoading: query.isLoading,
    markAsRead: markAsRead.mutate,
  };
};
