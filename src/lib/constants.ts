export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
export const SUPABASE_PUBLISHABLE_KEY = process.env
  .NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY as string;
export const SYNC_INTERVAL = Number.parseInt(
  process.env.NEXT_PUBLIC_SYNC_INTERVAL || "300000",
  10,
); // 5 min default
