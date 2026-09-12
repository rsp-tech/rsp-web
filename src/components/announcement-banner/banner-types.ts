import type { Announcement } from "@/types";

export interface AnnouncementBannerProps {
  announcements: Announcement[];
}

export interface BannerSlideProps {
  item: Announcement;
  index: number;
  total: number;
  isActive: boolean;
  isAdjacent: boolean;
  prefersReducedMotion: boolean;
}

export interface BannerMediaProps {
  item: Announcement;
  isActive: boolean;
  isAdjacent: boolean;
  prefersReducedMotion: boolean;
  desktopWebpUrl: string;
  focalPoint: string;
  altText: string;
}

export interface BannerContentProps {
  item: Announcement;
}

export interface BannerControlsProps {
  total: number;
  currentIndex: number;
  onPrev: () => void;
  onNext: () => void;
  onSelect: (index: number) => void;
  onDismiss: () => void;
}
