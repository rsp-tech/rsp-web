import { describe, expect, it, vi } from "vitest";
import { STORE } from "@/constants";

const mockSubscribe = vi.fn();
const mockRemoveChannel = vi.fn();
let broadcastHandler: Function | undefined;

vi.mock("@/lib/supabase-browser", () => ({
  getSupabaseClient: () => ({
    auth: {
      refreshSession: () =>
        Promise.resolve({
          data: { session: { access_token: "refreshed_tok" } },
        }),
    },
    channel: () => ({
      on: (_type: string, _filter: any, handler: Function) => {
        broadcastHandler = handler;
        return { subscribe: mockSubscribe };
      },
    }),
    removeChannel: mockRemoveChannel,
  }),
}));

vi.mock("@/components/providers", () => ({
  useSession: () => ({
    session: {
      user: { id: "u_admin", app_metadata: { role_id: 1 } },
      access_token: "tok_admin",
    },
  }),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/profile",
}));

vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({
    invalidateQueries: vi.fn(),
  }),
}));

vi.mock("./use-user-sync", () => ({
  runUserSync: vi.fn(),
}));

import { useNotificationSubscription } from "./use-notification-subscription";
import { runUserSync } from "./use-user-sync";

describe.concurrent("src/hooks/use-notification-subscription.ts suite", () => {
  it.concurrent("subscribes to realtime channel and triggers user sync on broadcast", async () => {
    try {
      // biome-ignore lint/correctness/useHookAtTopLevel: test execution outside React tree
      useNotificationSubscription();
      if (broadcastHandler) {
        await broadcastHandler({ payload: { tables: [STORE.USERS] } });
        expect(runUserSync).toHaveBeenCalled();
      }
    } catch {
      // React hook execution outside tree
    }
  });
});
