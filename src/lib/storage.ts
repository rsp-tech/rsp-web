import { ASSET_BASE_URL, ASSET_PROXY } from "@/constants";
import type { Category } from "@/types";

export const getCategoryImageUrl = (
  cat: Category | undefined,
  format: "avif" | "webp",
): string | undefined => {
  if (!cat?.img_id) return undefined;
  return `${ASSET_PROXY}/img/${cat.img_id}/${format}?v2`;
};

export const getAssetUrl = (id: string): string =>
  id.startsWith("http") ? id : `${ASSET_BASE_URL}${id}`;

export const getAssetProxyUrl = (id: string) => `${ASSET_PROXY}/${id}`;
