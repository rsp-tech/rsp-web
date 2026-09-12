import { BannerControls } from "./banner-controls";
import { BannerSlide } from "./banner-slide";
import type { AnnouncementBannerProps } from "./banner-types";
import { normalizeBannerHeights } from "./banner-utils";
import { useAnnouncementCarousel } from "./use-announcement-carousel";

export const AnnouncementBanner = ({
  announcements,
}: AnnouncementBannerProps) => {
  const total = announcements.length;

  const {
    currentIndex,
    isDismissed,
    prefersReducedMotion,
    handlePrev,
    handleNext,
    handleSelect,
    handleDismiss,
    handleMouseEnter,
    handleMouseLeave,
    handleTouchStart,
    handleTouchEnd,
    handleTouchCancel,
  } = useAnnouncementCarousel({ total });

  // Review Item 7 Fix: !announcements was redundant since announcements is typed as Announcement[]
  if (isDismissed || total === 0) {
    return null;
  }

  // Review Item 8 Fix: No need for fallback || announcements[0] since total === 0 returned early
  const activeItem = announcements[currentIndex];
  const activeHeights = normalizeBannerHeights(
    activeItem?.ui_props?.banner_height,
  );

  return (
    // Review Item 2 Fix: Expose as carousel with roledescription and accessible label
    <section
      data-announcement-section
      aria-roledescription="carousel"
      className="relative w-full overflow-hidden border-b border-border group flex flex-col justify-center"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      // Review Item 1 Fix: Reset touch state on touch cancel
      onTouchCancel={handleTouchCancel}
      aria-label="Announcements & Highlights"
    >
      <style>{`
        [data-announcement-section] { min-height: ${activeHeights.mobile}px; }
        @media (min-width: 768px) { [data-announcement-section] { min-height: ${activeHeights.tablet}px; } }
        @media (min-width: 1024px) { [data-announcement-section] { min-height: ${activeHeights.desktop}px; } }
        @media (min-width: 1920px) { [data-announcement-section] { min-height: ${activeHeights.ultrawide}px; } }
        ${announcements
          .map((item) => {
            const h = normalizeBannerHeights(item.ui_props?.banner_height);
            return `[data-slide="${item.id}"] { min-height: ${h.mobile}px; }
@media (min-width: 768px) { [data-slide="${item.id}"] { min-height: ${h.tablet}px; } }
@media (min-width: 1024px) { [data-slide="${item.id}"] { min-height: ${h.desktop}px; } }
@media (min-width: 1920px) { [data-slide="${item.id}"] { min-height: ${h.ultrawide}px; } }`;
          })
          .join("\n")}
      `}</style>
      {/* Review Item 2 Fix: Live region for assistive technologies to announce slide changes */}
      <div
        aria-live="polite"
        aria-atomic="true"
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: "hidden",
          clip: "rect(0, 0, 0, 0)",
          whiteSpace: "nowrap",
          border: 0,
        }}
      >
        {`Slide ${currentIndex + 1} of ${total}${activeItem?.title ? `: ${activeItem.title}` : ""}`}
      </div>

      {/* Sliding Carousel Track */}
      {/* Review Item 5 Fix: Use explicit transform transition via inline style without broad transition-all or new utility bloat */}
      <div
        className="flex w-full h-full flex-1"
        style={{
          transform: `translateX(-${currentIndex * 100}%)`,
          transition: prefersReducedMotion
            ? "none"
            : "transform 500ms ease-out",
        }}
      >
        {announcements.map((item, idx) => {
          const isActive = idx === currentIndex;
          const isAdjacent =
            Math.abs(idx - currentIndex) === 1 ||
            (currentIndex === 0 && idx === total - 1) ||
            (currentIndex === total - 1 && idx === 0);

          return (
            <BannerSlide
              key={item.id}
              item={item}
              index={idx}
              total={total}
              isActive={isActive}
              isAdjacent={isAdjacent}
              prefersReducedMotion={prefersReducedMotion}
            />
          );
        })}
      </div>

      {/* Multi-banner Navigation Chevrons, Dots & Dismiss Control */}
      <BannerControls
        total={total}
        currentIndex={currentIndex}
        onPrev={handlePrev}
        onNext={handleNext}
        onSelect={handleSelect}
        onDismiss={handleDismiss}
      />
    </section>
  );
};
