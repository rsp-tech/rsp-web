import { describe, expect, it, vi } from "vitest";
import { STORE } from "@/constants";

vi.mock("@/lib/idb", () => ({
  getDB: () =>
    Promise.resolve({
      getAll: (store: string) =>
        Promise.resolve([
          { id: "int_1", user_id: "user_1", service_id: 10 },
          { id: "int_2", user_id: "user_2", service_id: 20 },
        ]),
    }),
}));

vi.mock("@tanstack/react-query", () => ({
  useQuery: ({ queryFn }: any) => ({
    data: queryFn ? queryFn() : undefined,
  }),
}));

import { useUserServiceInterests } from "./use-user-service-interests";

describe.concurrent("use-user-service-interests suite", () => {
  it.concurrent("useUserServiceInterests filters interests by userId", async () => {
    const res = useUserServiceInterests("user_1");
    const list = await res.data;
    expect(list?.length).toBe(1);
    expect(list?.[0]?.service_id).toBe(10);
  });
});

