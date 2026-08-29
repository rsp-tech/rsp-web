import { describe, expect, it, vi } from "vitest";
import { STORE } from "@/constants";

vi.mock("@/lib/idb", () => ({
  getDB: () =>
    Promise.resolve({
      getAll: (store: string) =>
        Promise.resolve([
          { id: "req_1", user_id: "user_1", status: "pending", new_data: {} },
        ]),
    }),
}));

vi.mock("@tanstack/react-query", () => ({
  useQuery: ({ queryFn }: any) => ({
    data: queryFn ? queryFn() : undefined,
  }),
}));

import { useUserPendingRequestIdb } from "./use-user-pending-request-idb";

describe.concurrent("use-user-pending-request-idb suite", () => {
  it.concurrent("useUserPendingRequestIdb returns pending request", async () => {
    const res = useUserPendingRequestIdb("user_1");
    const req = await res.data;
    expect(req?.id).toBe("req_1");
    expect(req?.status).toBe("pending");
  });
});

