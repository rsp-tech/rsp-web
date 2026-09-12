import type { ResponsiveBannerHeights } from "@/types";

export const isExternalUrl = (url: string): boolean =>
  /^https?:\/\//i.test(url);

export const normalizeBannerHeights = (
  height?: number | ResponsiveBannerHeights | null,
): ResponsiveBannerHeights => {
  if (!height) {
    return { mobile: 64, tablet: 56, desktop: 56, ultrawide: 64 };
  }
  if (typeof height === "number") {
    return {
      mobile: Math.max(48, Math.round(height * 1.15)),
      tablet: height,
      desktop: height,
      ultrawide: Math.round(height * 1.15),
    };
  }
  return {
    mobile: height.mobile ?? 64,
    tablet: height.tablet ?? 56,
    desktop: height.desktop ?? 56,
    ultrawide: height.ultrawide ?? 64,
  };
};

export const getBannerMediaUrl = (
  mediaPath: string,
  variant: "d" | "m",
  ext: "webp" | "avif",
): string => {
  if (isExternalUrl(mediaPath)) return mediaPath;
  const cleanPath = mediaPath.startsWith("bnr-")
    ? mediaPath
    : `bnr-${mediaPath}`;
  return `/img/${cleanPath}-${variant}.${ext}`;
};

export const getBannerRawMediaUrl = (mediaPath: string): string => {
  if (isExternalUrl(mediaPath)) return mediaPath;
  const cleanPath = mediaPath.startsWith("bnr-")
    ? mediaPath
    : `bnr-${mediaPath}`;
  return `/img/${cleanPath}`;
};

export const GRADIENT_STYLES: Record<string, string> = {
  black_vignette:
    "linear-gradient(to right, rgba(0,0,0,0.85), rgba(0,0,0,0.5), rgba(0,0,0,0.2))",
  "from-amber-600/90 via-orange-600/80 to-amber-700/90":
    "linear-gradient(to right, rgba(217,119,6,0.9), rgba(234,88,12,0.8), rgba(180,83,9,0.9))",
  "from-indigo-700/90 via-purple-700/80 to-indigo-900/90":
    "linear-gradient(to right, rgba(67,56,202,0.9), rgba(126,34,206,0.8), rgba(49,46,129,0.9))",
  "from-emerald-700/90 via-teal-700/80 to-green-900/90":
    "linear-gradient(to right, rgba(4,120,87,0.9), rgba(15,118,110,0.8), rgba(20,83,45,0.9))",
  "from-rose-700/90 via-amber-600/80 to-red-800/90":
    "linear-gradient(to right, rgba(190,18,60,0.9), rgba(217,119,6,0.8), rgba(153,27,27,0.9))",
  "from-blue-900/90 via-slate-800/90 to-blue-950/90":
    "linear-gradient(to right, rgba(30,58,138,0.9), rgba(30,41,59,0.9), rgba(23,37,84,0.9))",
};
