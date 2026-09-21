"use client";

import { usePathname } from "next/navigation";
import { useHomepage } from "@/hooks/use-homepage";
import { AnnouncementBanner } from "./announcement-banner/announcement-banner-carousel";

export { AnnouncementBanner } from "./announcement-banner/announcement-banner-carousel";
export {
  GRADIENT_STYLES,
  getBannerMediaUrl,
  getBannerRawMediaUrl,
  isExternalUrl,
  normalizeBannerHeights,
} from "./announcement-banner/banner-utils";
export { useAnnouncementCarousel } from "./announcement-banner/use-announcement-carousel";

export const TopAnnouncementBanner = () => {
  const pathname = usePathname();
  const { data: homepageData } = useHomepage();

  if (pathname === "/queries" || !homepageData?.announcements?.length) {
    return null;
  }

  return <AnnouncementBanner announcements={homepageData.announcements} />;
};
