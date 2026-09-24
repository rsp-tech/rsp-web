import { ASSET_BASE_URL, ASSET_PROXY } from "@/constants";
import type { Category } from "@/types";

export const getCategoryImageUrl = (cat: Category): string | null => {
  if (!cat.img_id) return null;
  return `/img/${cat.img_id.toString(36)}.webp`;
};

export const getAssetUrl = (id: string): string =>
  id.startsWith("http") ? id : `${ASSET_BASE_URL}${id}`;

export const getAssetProxyUrl = (id: string) => `${ASSET_PROXY}${id}`;
