import { ASSET_BAE_URL, ASSET_DOWNLOAD_BASE_URL } from "@/constants";
import { getSupabaseClient } from "@/lib/supabase-browser";
import type { Category } from "@/types";

const getPublicUrl = (bucket: string, key: string) =>
  getSupabaseClient().storage.from(bucket).getPublicUrl(key).data.publicUrl;

export const getCategoryImageUrl = (cat: Category): string | null => {
  if (!cat.img_id) return null;
  return getPublicUrl("images", `${cat.img_id.toString(36)}.webp`);
};

export const getAssetUrl = (id: string): string =>
  id.startsWith("http") ? id : `${ASSET_BAE_URL}${id}`;

export const getAssetDownloadUrl = (id: string): string =>
  id.startsWith("http") ? id : `${ASSET_DOWNLOAD_BASE_URL}${id}`;
