import { describe, expect, it, vi } from "vitest";
import { META_KEY, STORE } from "@/constants";
import { createMockDb } from "@/test-utils/mock-idb";
import {
  getPersistedFeatureFlags,
  useFeatureFlag,
  useFeatureFlags,
} from "./use-feature-flags";

const mockPublicFlags = ["ga_flag", "youtube_marquee"];
const mockUserFlags = ["beta_user_flag"];
const allAllowed = ["ga_flag", "youtube_marquee", "beta_user_flag"];

vi.mock("@/lib/idb", () => ({
  getDB: () =>
    Promise.resolve(
      createMockDb({
        [`${STORE.ROLE_META}:${META_KEY.PUBLIC_FEATURES}`]:
          JSON.stringify(mockPublicFlags),
        [`${STORE.ROLE_META}:${META_KEY.USER_FEATURES}`]:
          JSON.stringify(mockUserFlags),
      }),
    ),
}));

let mockSession: any = null;
vi.mock("@/components/providers", () => ({
  useSession: () => ({ session: mockSession, isLoading: false }),
}));

let mockIsBypassed = false;
vi.mock("./use-admin-bypass", () => ({
  useAdminBypass: () => ({
    isBypassed: mockIsBypassed,
    setIsBypassed: (val: boolean) => {
      mockIsBypassed = val;
    },
    toggleAdminBypass: () => {
      mockIsBypassed = !mockIsBypassed;
    },
  }),
}));

vi.mock("@tanstack/react-query", () => ({
  useQuery: () => ({
    data: allAllowed,
    isLoading: false,
  }),
}));

describe.concurrent("use-feature-flags suite", () => {
  it.concurrent("useFeatureFlag returns true for allowed flag", () => {
    expect(useFeatureFlag("beta_user_flag")).toBe(true);
    expect(useFeatureFlag("youtube_marquee")).toBe(true);
  });

  it.concurrent("useFeatureFlag returns false for unallowed flag", () => {
    expect(useFeatureFlag("disabled_flag")).toBe(false);
    expect(useFeatureFlag("non_existent")).toBe(false);
  });

  it.concurrent("useFeatureFlags alias matches useAllowedFeatureFlags", () => {
    const res = useFeatureFlags();
    expect(res.data).toEqual(allAllowed);
  });

  it.concurrent("getPersistedFeatureFlags reads and merges public and user features from IDB", async () => {
    const flags = await getPersistedFeatureFlags();
    expect(flags).toContain("ga_flag");
    expect(flags).toContain("youtube_marquee");
    expect(flags).toContain("beta_user_flag");
  });

  it("admin with useAdminBypass active can bypass unallowed flags", () => {
    mockSession = { user: { app_metadata: { role_id: 1 } } };
    mockIsBypassed = true;
    expect(useFeatureFlag("completely_disabled_flag")).toBe(true);
    mockIsBypassed = false;
    mockSession = null;
  });

  it("non-admin with useAdminBypass active cannot bypass flags", () => {
    mockSession = { user: { app_metadata: { role_id: 2 } } };
    mockIsBypassed = true;
    expect(useFeatureFlag("completely_disabled_flag")).toBe(false);
    mockIsBypassed = false;
    mockSession = null;
  });

  it("admin with useAdminBypass inactive cannot bypass unallowed flags", () => {
    mockSession = { user: { app_metadata: { role_id: 1 } } };
    mockIsBypassed = false;
    expect(useFeatureFlag("completely_disabled_flag")).toBe(false);
    mockSession = null;
  });
});
