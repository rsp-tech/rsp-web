import { describe, expect, it, vi } from "vitest";
import { STORE } from "@/constants";

vi.mock("@/lib/idb", () => ({
  getDB: () =>
    Promise.resolve({
      getAll: (store: string) => {
        if (store === STORE.USER_QUERIES) {
          return Promise.resolve([
            { id: "q1", user_id: "user_1", question: "How to chant?" },
          ]);
        }
        if (store === STORE.QUERY_REPLIES) {
          return Promise.resolve([
            {
              id: "rep2",
              query_id: "q1",
              message: "Later reply",
              updated_at: "2026-09-21T12:00:00Z",
            },
            {
              id: "rep1",
              query_id: "q1",
              message: "Earlier reply",
              updated_at: "2026-09-21T10:00:00Z",
            },
          ]);
        }
        return Promise.resolve([]);
      },
    }),
}));

vi.mock("@tanstack/react-query", () => ({
  useQuery: ({ queryFn }: any) => ({
    data: queryFn ? queryFn() : undefined,
  }),
}));

import { useUserQueriesAndReplies } from "./use-user-queries-and-replies";

describe.concurrent("use-user-queries-and-replies suite", () => {
  it.concurrent("useUserQueriesAndReplies fetches queries and replies for user sorted by updated_at", async () => {
    const res = useUserQueriesAndReplies("user_1");
    const data = await res.data;
    expect(data?.queries.length).toBe(1);
    expect(data?.replies["q1"]?.length).toBe(2);
    expect(data?.replies["q1"]?.[0]?.message).toBe("Earlier reply");
    expect(data?.replies["q1"]?.[1]?.message).toBe("Later reply");
  });
});
