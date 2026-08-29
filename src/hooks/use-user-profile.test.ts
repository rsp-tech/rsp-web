import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/providers", () => ({
  useSession: () => ({
    session: { user: { id: "u_101", email: "user@test.org" } },
    isLoading: false,
  }),
}));

vi.mock("@/hooks/use-user-profile-idb", () => ({
  useUserProfileIdb: () => ({
    data: { user_id: "u_101", name: "Radha Raman" },
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

vi.mock("@/hooks/use-user-pending-request-idb", () => ({
  useUserPendingRequestIdb: () => ({
    data: { id: "req_1", status: "pending" },
    isLoading: false,
  }),
}));

vi.mock("@/lib/idb", () => ({
  getDB: () =>
    Promise.resolve({
      put: vi.fn().mockResolvedValue("req_1"),
    }),
}));

vi.mock("@/lib/realtime-utils", () => ({
  sendRealtimeBroadcast: vi.fn(),
}));

vi.mock("@tanstack/react-query", () => ({
  useMutation: ({ mutationFn, onSuccess }: any) => ({
    mutateAsync: async (args: any) => {
      const res = await mutationFn(args);
      onSuccess?.(res);
      return res;
    },
  }),
  useQueryClient: () => ({
    invalidateQueries: vi.fn(),
  }),
}));

import { useSubmitProfileUpdate, useUserProfile } from "./use-user-profile";

describe.concurrent("use-user-profile hook suite", () => {
  it.concurrent("useUserProfile returns combined profile and pending request queries", () => {
    const profile = useUserProfile();
    expect(profile.profile?.name).toBe("Radha Raman");
    expect(profile.pendingRequest?.id).toBe("req_1");
    expect(profile.isLoading).toBe(false);
  });

  it.concurrent("useSubmitProfileUpdate posts edit request and persists to IDB", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          data: { id: "req_1", name: "Radha Raman Updated", status: "pending" },
        }),
    });
    globalThis.fetch = mockFetch;

    const mut = useSubmitProfileUpdate();
    const result = await mut.mutateAsync({
      name: "Radha Raman Updated",
      phone: "+919876543210",
      temple: "Pune",
      ashram: "Brahmachari",
      purpose: "Service",
      authority_name: "HG Prema Das",
      authority_email: "prema@test.org",
      authority_relationship: "Mentor",
    });

    expect(result.id).toBe("req_1");
    expect(mockFetch).toHaveBeenCalled();
  });
});
