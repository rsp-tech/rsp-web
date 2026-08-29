import { describe, expect, it, vi } from "vitest";

const mockSend = vi.fn().mockResolvedValue({});
const mockRemoveChannel = vi.fn();
let subCallback: ((status: string) => void) | undefined;

const mockChannel = {
  subscribe: vi.fn().mockImplementation((cb) => {
    subCallback = cb;
    return mockChannel;
  }),
  send: mockSend,
};

const mockSupabase = {
  channel: vi.fn().mockReturnValue(mockChannel),
  removeChannel: mockRemoveChannel,
};

vi.mock("./supabase-browser", () => ({
  getSupabaseClient: () => mockSupabase,
}));

describe("realtime-utils suite", () => {
  it("subscribes and sends realtime broadcast message", async () => {
    const { sendRealtimeBroadcast } = await import("./realtime-utils");

    sendRealtimeBroadcast("updates", "ping", { timestamp: 12345 });
    expect(mockSupabase.channel).toHaveBeenCalledWith("updates");

    subCallback?.("SUBSCRIBED");
    expect(mockSend).toHaveBeenCalledWith({
      type: "broadcast",
      event: "ping",
      payload: { timestamp: 12345 },
    });
  });

  it("removes channel on error or timeout", async () => {
    const { sendRealtimeBroadcast } = await import("./realtime-utils");

    sendRealtimeBroadcast("errors", "ping", {});
    subCallback?.("CHANNEL_ERROR");
    expect(mockSupabase.removeChannel).toHaveBeenCalled();

    sendRealtimeBroadcast("timeouts", "ping", {});
    subCallback?.("TIMED_OUT");
    expect(mockSupabase.removeChannel).toHaveBeenCalled();
  });
});
