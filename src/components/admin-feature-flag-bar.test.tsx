import { describe, expect, it, vi } from "vitest";
import { AdminFeatureFlagBar } from "./admin-feature-flag-bar";

let mockSession: any = null;
vi.mock("@/components/providers", () => ({
  useSession: () => ({ session: mockSession }),
}));

const mockInvalidateQueries = vi.fn();
vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({
    invalidateQueries: mockInvalidateQueries,
  }),
}));

const mockToggleAdminBypass = vi.fn();
let mockIsBypassed = false;
vi.mock("@/hooks/use-admin-bypass", () => ({
  useAdminBypass: () => ({
    isBypassed: mockIsBypassed,
    toggleAdminBypass: mockToggleAdminBypass,
  }),
}));

describe.concurrent("AdminFeatureFlagBar suite", () => {
  it.concurrent("returns null when user is not admin", () => {
    mockSession = { user: { app_metadata: { role_id: 2 } } };
    const tree = AdminFeatureFlagBar();
    expect(tree).toBeNull();
    mockSession = null;
  });

  it.concurrent("renders toggle button when user is admin", () => {
    mockSession = { user: { app_metadata: { role_id: 1 } } };
    mockIsBypassed = false;
    const tree = AdminFeatureFlagBar();
    expect(tree).not.toBeNull();
    expect((tree as any)?.props?.children).toBeDefined();
    mockSession = null;
  });

  it.concurrent("triggers toggleAdminBypass and invalidates query cache when clicked", () => {
    mockSession = { user: { app_metadata: { role_id: 1 } } };
    const tree: any = AdminFeatureFlagBar();
    expect(tree).toBeDefined();

    tree.props.onClick();
    expect(mockToggleAdminBypass).toHaveBeenCalled();
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ["feature-config"],
    });
    mockSession = null;
  });
});
