import type { BannerMediaProps } from "./banner-types";
import { getBannerMediaUrl, getBannerRawMediaUrl } from "./banner-utils";

export const BannerMedia = ({
  item,
  isActive,
  isAdjacent,
  prefersReducedMotion,
  desktopWebpUrl,
  focalPoint,
  altText,
}: BannerMediaProps) => {
  // Review Item 3: Do not mount or download media for slides outside active view
  if (!isActive && !isAdjacent) {
    return null;
  }

  const mediaPath = item.media_path;
  if (!mediaPath) return null;

  const isVideo = item.media_type === "video";
  const isGif = item.media_type === "gif";
  const imageLoading = isActive ? "eager" : "lazy";

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
      {/* Blurred background underlay for ultrawide / large screens */}
      <div
        className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none"
        aria-hidden="true"
      >
        <img
          src={desktopWebpUrl}
          alt=""
          loading={imageLoading}
          className="w-full h-full object-cover"
          style={{
            filter: "blur(20px)",
            transform: "scale(1.1)",
            opacity: 0.65,
          }}
        />
      </div>

      {/* Foreground Banner Media */}
      <div className="absolute inset-0 w-full h-full flex items-center justify-center pointer-events-none">
        {isVideo ? (
          // Review Item 4: Respect prefers-reduced-motion; do not autoplay video if reduced motion is requested
          !prefersReducedMotion && isActive ? (
            <video
              autoPlay
              loop
              muted
              playsInline
              poster={item.ui_props?.video_poster || undefined}
              className="w-full h-full object-cover"
              style={{
                objectPosition: focalPoint,
                maxWidth: "1440px",
                margin: "0 auto",
              }}
              src={getBannerRawMediaUrl(mediaPath)}
            />
          ) : (
            // Static poster fallback when reduced motion is preferred or slide is inactive
            <img
              src={
                item.ui_props?.video_poster ||
                getBannerMediaUrl(mediaPath, "d", "webp")
              }
              alt={altText}
              loading={imageLoading}
              className="w-full h-full object-cover"
              style={{
                objectPosition: focalPoint,
                maxWidth: "1440px",
                margin: "0 auto",
              }}
            />
          )
        ) : isGif ? (
          <img
            src={getBannerRawMediaUrl(mediaPath)}
            alt={altText}
            loading={imageLoading}
            className="w-full h-full object-cover"
            style={{
              objectPosition: focalPoint,
              maxWidth: "1440px",
              margin: "0 auto",
            }}
          />
        ) : (
          <picture className="w-full h-full flex items-center justify-center">
            <source
              media="(max-width: 640px)"
              srcSet={getBannerMediaUrl(mediaPath, "m", "avif")}
              type="image/avif"
            />
            <source
              media="(max-width: 640px)"
              srcSet={getBannerMediaUrl(mediaPath, "m", "webp")}
              type="image/webp"
            />
            <source
              srcSet={getBannerMediaUrl(mediaPath, "d", "avif")}
              type="image/avif"
            />
            <img
              src={desktopWebpUrl}
              alt={altText}
              loading={imageLoading}
              className="w-full h-full object-cover"
              style={{
                objectPosition: focalPoint,
                maxWidth: "1600px",
                margin: "0 auto",
              }}
            />
          </picture>
        )}
      </div>
    </div>
  );
};
