import Link from "next/link";
import { BannerElementRenderer } from "@/components/banner-element-renderer";
import { getAssetById } from "@/lib/asset-registry";
import { BannerContent } from "./banner-content";
import { BannerMedia } from "./banner-media";
import type { BannerSlideProps } from "./banner-types";
import {
  GRADIENT_STYLES,
  getBannerMediaUrl,
  getBannerRawMediaUrl,
} from "./banner-utils";

export const BannerSlide = ({
  item,
  index,
  total,
  isActive,
  isAdjacent,
  prefersReducedMotion,
}: BannerSlideProps) => {
  const gradient = item.bg_gradient;
  const motif = getAssetById(item.ui_props?.motif_id);
  const motifPlacement = item.ui_props?.motif_placement || "badge_prefix";
  const focal = item.ui_props?.focal_point;
  const focalPoint = focal ? `${focal.x}% ${focal.y}%` : "center";
  const altText = item.ui_props?.alt_text || item.title || "Announcement";
  const isWholeBannerLink = Boolean(item.cta_url && !item.cta_label);

  const desktopWebpUrl =
    item.media_type === "video" || item.media_type === "gif"
      ? getBannerRawMediaUrl(item.media_path || "")
      : getBannerMediaUrl(item.media_path || "", "d", "webp");

  return (
    // biome-ignore lint/a11y/useSemanticElements: W3C WAI-ARIA carousel pattern requires role="group" for slide containers
    <div
      role="group"
      aria-roledescription="slide"
      aria-label={`Announcement ${index + 1} of ${total}${item.title ? `: ${item.title}` : ""}`}
      aria-hidden={!isActive}
      // Review Item 2 Fix: Inactive slides are removed from tab order & assistive tree via inert
      inert={!isActive ? true : undefined}
      data-slide={item.id}
      className="relative w-full shrink-0 flex flex-col justify-center px-4 py-2 pr-10 overflow-hidden h-full flex-1"
    >
      {/* Background Media */}
      <BannerMedia
        item={item}
        isActive={isActive}
        isAdjacent={isAdjacent}
        prefersReducedMotion={prefersReducedMotion}
        desktopWebpUrl={desktopWebpUrl}
        focalPoint={focalPoint}
        altText={altText}
      />

      {/* Color Gradient Overlay */}
      {gradient === "black_vignette" ? (
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to right, rgba(0,0,0,0.85), rgba(0,0,0,0.5), rgba(0,0,0,0.2))",
            opacity: 1,
            transitionDuration: "500ms",
          }}
        />
      ) : gradient && gradient !== "none" ? (
        <div
          className="absolute inset-0"
          style={{
            background:
              GRADIENT_STYLES[gradient] ||
              "linear-gradient(to right, rgba(0,0,0,0.85), rgba(0,0,0,0.4), rgba(0,0,0,0.1))",
            opacity: 0.85,
            mixBlendMode: "multiply",
            transitionDuration: "500ms",
          }}
        />
      ) : null}

      {/* Shimmer Light Sweep Effect (Disabled if prefers-reduced-motion) */}
      {!prefersReducedMotion && (
        <div className="absolute inset-0 animate-shimmer pointer-events-none" />
      )}

      {/* Dynamic Additive Elements / Motif */}
      {(isActive || isAdjacent) &&
        (item.ui_props?.elements && item.ui_props.elements.length > 0 ? (
          <BannerElementRenderer elements={item.ui_props.elements} />
        ) : motif && motifPlacement === "banner_right" ? (
          <div
            className="absolute top-1/2 -translate-y-1/2 pointer-events-none hidden sm:flex items-center"
            style={{ right: "3rem", opacity: 0.3 }}
            aria-hidden="true"
          >
            <img
              src={motif.assetPath}
              alt=""
              className="w-10 h-10"
              style={{ objectFit: "contain" }}
            />
          </div>
        ) : null)}

      {/* Full Banner Clickable Overlay when CTA URL is provided without CTA label */}
      {isWholeBannerLink && item.cta_url ? (
        <Link
          href={item.cta_url}
          className="absolute inset-0 z-10"
          aria-label={altText}
        />
      ) : null}

      {/* Slide Content */}
      <BannerContent item={item} />
    </div>
  );
};
