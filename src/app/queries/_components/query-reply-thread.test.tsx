import { describe, expect, it, vi } from "vitest";

// Common UI and hook mocks to enable shallow/functional component execution
vi.mock("@/hooks/use-is-mobile", () => ({ useIsMobile: () => false }));
vi.mock("@/hooks/use-online-status", () => ({ useOnlineStatus: () => true }));
vi.mock("@/lib/supabase-browser", () => ({
  getSupabaseBrowserClient: () => ({
    auth: {
      getUser: () => Promise.resolve({ data: { user: null } }),
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe: () => {} } },
      }),
    },
    from: () => ({
      select: () => ({ eq: () => Promise.resolve({ data: [] }) }),
    }),
  }),
}));
vi.mock("@/lib/idb", () => ({ getDB: () => Promise.resolve(null) }));

describe.concurrent("src/app/queries/_components/query-reply-thread.tsx suite", () => {
  it.concurrent("renders empty and populated reply threads", async () => {
    const { QueryReplyThread } = await import("./query-reply-thread");

    const emptyTree = QueryReplyThread({ replies: [], currentUserId: "u1" });
    expect(emptyTree).toBeDefined();

    const populatedTree = QueryReplyThread({
      replies: [
        {
          id: "r1",
          query_id: "q1",
          user_id: "admin1",
          message: "We have checked the audio stream",
          updated_at: "2026-01-01T12:00:00Z",
          users: { name: "Admin Support" },
        } as any,
        {
          id: "r2",
          query_id: "q1",
          user_id: "u1",
          message: "Thank you!",
          updated_at: "2026-01-01T12:05:00Z",
          users: { name: "User 1" },
        } as any,
      ],
      currentUserId: "u1",
    });
    expect(populatedTree).toBeDefined();
  });
});
