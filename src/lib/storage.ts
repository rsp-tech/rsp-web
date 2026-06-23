import { ASSET_BAE_URL, ASSET_DOWNLOAD_BASE_URL } from "@/constants";
import type { Category } from "@/types";

export const getCategoryImageUrl = (cat: Category): string | null => {
  if (!cat.img_id) return null;
  return `/img/${cat.img_id.toString(36)}.webp`;
};

export const getAssetUrl = (id: string): string =>
  id.startsWith("http") ? id : `${ASSET_BAE_URL}${id}`;

export const getAssetDownloadUrl = (id: string): string =>
  id.startsWith("http") ? id : `${ASSET_DOWNLOAD_BASE_URL}${id}`;
