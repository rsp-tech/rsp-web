import { getSupabaseClient } from "./supabase-browser";

/**
 * Safely broadcasts a message to a Supabase Realtime channel and cleans up the subscription afterward.
 * Adds a small delay before teardown to avoid connection race conditions.
 */
export function sendRealtimeBroadcast(
  channelName: string,
  event: string,
  payload: Record<string, unknown>,
): void {
  const supabase = getSupabaseClient();
  const channel = supabase.channel(channelName);

  channel.subscribe(async (status) => {
    if (status === "SUBSCRIBED") {
      try {
        await channel.send({
          type: "broadcast",
          event,
          payload,
        });
      } catch (err) {
        console.error(
          `Failed to send broadcast on channel ${channelName}:`,
          err,
        );
      } finally {
        // Wait 200ms before removing the channel to ensure the WebSocket frame is fully sent
        setTimeout(() => {
          supabase.removeChannel(channel);
        }, 200);
      }
    } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
      supabase.removeChannel(channel);
    }
  });
}
