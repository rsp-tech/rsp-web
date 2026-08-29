import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/idb", () => ({
  getDB: () =>
    Promise.resolve({
      get: (_store: string, id: string) =>
        Promise.resolve({
          id,
          full_name: "Radheshyam",
          email: "user@test.com",
        }),
    }),
}));

vi.mock("@tanstack/react-query", () => ({
  useQuery: ({ queryFn }: any) => ({
    data: queryFn ? queryFn() : undefined,
  }),
}));

import { useUserProfileIdb } from "./use-user-profile-idb";

describe.concurrent("use-user-profile-idb suite", () => {
  it.concurrent("useUserProfileIdb returns profile from IDB", async () => {
    const res = useUserProfileIdb("user_1");
    const profile = await res.data;
    expect((profile as any)?.full_name).toBe("Radheshyam");
    expect(profile?.id).toBe("user_1");
  });
});
