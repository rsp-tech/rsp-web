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

describe.concurrent("src/app/queries/_components/query-list.tsx suite", () => {
  it.concurrent("renders QueryList component with empty state and queries list", async () => {
    const { QueryList } = await import("./query-list");

    const emptyTree = QueryList({
      queries: [],
      replies: {},
      currentUserId: "u1",
      replyTexts: {},
      onReplyTextChange: vi.fn(),
      onSendReply: vi.fn(),
      sendingReply: null,
      getStatusBadge: () => <span>Pending</span>,
      onResetFilters: vi.fn(),
      onSubmitQueryClick: vi.fn(),
    });
    expect(emptyTree).toBeDefined();

    const populatedTree = QueryList({
      queries: [
        {
          id: "q1",
          subject: "Audio issue",
          description: "Cannot play",
          status: "pending",
          created_at: "2026-01-01",
          user_id: "u1",
        } as any,
      ],
      replies: {},
      currentUserId: "u1",
      replyTexts: {},
      onReplyTextChange: vi.fn(),
      onSendReply: vi.fn(),
      sendingReply: null,
      getStatusBadge: () => <span>Pending</span>,
      onResetFilters: vi.fn(),
      onSubmitQueryClick: vi.fn(),
    });
    expect(populatedTree).toBeDefined();
  });
});
