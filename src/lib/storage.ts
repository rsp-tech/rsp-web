import { getSupabaseClient } from "@/lib/supabase-browser";
import type { Category } from "@/types";

const getPublicUrl = (bucket: string, key: string) =>
  getSupabaseClient().storage.from(bucket).getPublicUrl(key).data.publicUrl;

export const getCategoryImageUrl = (cat: Category): string | null => {
  if (!cat.img_id) return null;
  return getPublicUrl("images", `${cat.img_id.toString(36)}.webp`);
};

export const getAudioUrl = (audioId: string): string =>
  audioId.startsWith("http") ? audioId : getPublicUrl("audio", audioId);

export const getMaterialUrl = (storageKey: string): string =>
  storageKey.startsWith("http") ? storageKey : getPublicUrl("materials", storageKey);
