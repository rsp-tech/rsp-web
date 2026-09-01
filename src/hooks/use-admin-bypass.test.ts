import { describe, expect, it } from "vitest";
import { useAdminBypass } from "./use-admin-bypass";

describe.concurrent("use-admin-bypass suite", () => {
  it.concurrent("manages admin bypass state with setIsBypassed and toggleAdminBypass", () => {
    useAdminBypass.getState()?.setIsBypassed(false);
    expect(useAdminBypass.getState()?.isBypassed).toBe(false);

    useAdminBypass.getState()?.setIsBypassed(true);
    expect(useAdminBypass.getState()?.isBypassed).toBe(true);

    useAdminBypass.getState()?.toggleAdminBypass();
    expect(useAdminBypass.getState()?.isBypassed).toBe(false);

    useAdminBypass.getState()?.toggleAdminBypass();
    expect(useAdminBypass.getState()?.isBypassed).toBe(true);

    useAdminBypass.getState()?.setIsBypassed(false);
  });
});
