"use client";

import { Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { getAssetById } from "@/lib/asset-registry";
import type { BannerContentProps } from "./banner-types";

export const BannerContent = ({ item }: BannerContentProps) => {
  const motif = getAssetById(item.ui_props?.motif_id);
  const isMobile = useIsMobile();
  const motifPlacement = item.ui_props?.motif_placement || "badge_prefix";
  const layout = item.ui_props?.layout;
  const isStacked = layout?.stack ?? false;
  const hAlign = layout?.align ?? "left";
  const vAlign = layout?.valign ?? "center";
  const ctaPos = layout?.cta ?? "auto";
  const maxW = layout?.maxWidth ?? "full";

  const maxWStyle =
    maxW === "sm"
      ? "420px"
      : maxW === "md"
        ? "600px"
        : maxW === "lg"
          ? "840px"
          : "100%";

  const isCtaRight = ctaPos === "right";
  const isCtaBelow = ctaPos === "below";
  const isCtaBottomRight = ctaPos === "bottom_right";

  const ctaButtonNode = item.cta_label ? (
    <div
      className={
        isCtaBottomRight
          ? "absolute shrink-0"
          : isCtaRight
            ? "shrink-0 ml-auto"
            : "shrink-0"
      }
      style={
        isCtaBottomRight
          ? {
              right: "0.5rem",
              bottom: "0.5rem",
              zIndex: 10,
            }
          : isCtaBelow
            ? { paddingTop: "0.375rem" }
            : undefined
      }
    >
      <Button asChild size="sm">
        <Link href={item.cta_url || "#"}>
          <span>{item.cta_label}</span>
        </Link>
      </Button>
    </div>
  ) : null;

  return (
    <div
      className="z-10 flex flex-col w-full h-full flex-1 justify-center"
      style={{
        maxWidth: isMobile ? "calc(100% - 0.5rem)" : "1600px",
        margin: "0 auto",
      }}
    >
      <div
        className={`flex w-full h-full flex-1 gap-2 text-white ${
          isStacked || isCtaBelow
            ? "flex-col"
            : "flex-col sm:flex-row sm:items-center justify-between"
        }`}
        style={{
          justifyContent:
            isStacked || isCtaBelow
              ? vAlign === "top"
                ? "flex-start"
                : vAlign === "bottom"
                  ? "flex-end"
                  : "center"
              : undefined,
          alignItems:
            isStacked || isCtaBelow
              ? hAlign === "center"
                ? "center"
                : hAlign === "right"
                  ? "flex-end"
                  : "flex-start"
              : vAlign === "top"
                ? "flex-start"
                : vAlign === "bottom"
                  ? "flex-end"
                  : "center",
          textAlign: hAlign,
        }}
      >
        <div
          className="flex flex-col gap-1"
          style={{
            maxWidth: maxWStyle,
            width: isStacked ? "100%" : undefined,
          }}
        >
          {/* Top line: Badge + Title + Subtitle */}
          <div
            className={`flex flex-wrap items-center gap-2 ${
              hAlign === "center"
                ? "justify-center"
                : hAlign === "right"
                  ? "justify-end"
                  : "justify-start"
            }`}
          >
            {item.badge_text ? (
              <span
                className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full backdrop-blur-xs"
                style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
              >
                {motif && motifPlacement === "badge_prefix" ? (
                  <img
                    src={motif.assetPath}
                    alt=""
                    className="h-3 w-3 shrink-0"
                    style={{ objectFit: "contain" }}
                    aria-hidden="true"
                  />
                ) : (
                  <Sparkles className="h-3 w-3 text-primary" />
                )}
                {item.badge_text}
              </span>
            ) : motif && motifPlacement === "badge_prefix" ? (
              <span className="inline-flex items-center shrink-0">
                <img
                  src={motif.assetPath}
                  alt=""
                  className="h-4 w-4"
                  style={{ objectFit: "contain" }}
                  aria-hidden="true"
                />
              </span>
            ) : null}

            {item.title ? (
              <span className="text-xs sm:text-sm font-bold font-heading tracking-tight truncate">
                {item.title}
              </span>
            ) : null}

            {!isStacked && item.subtitle && (
              <span
                className="text-xs truncate"
                style={{ color: "rgba(255,255,255,0.85)" }}
              >
                • {item.subtitle}
              </span>
            )}
          </div>

          {/* Stacked Description (New Line) */}
          {isStacked && item.subtitle && (
            <p
              className="text-xs sm:text-sm leading-relaxed"
              style={{
                color: "rgba(255,255,255,0.9)",
                textAlign: hAlign,
              }}
            >
              {item.subtitle}
            </p>
          )}

          {/* CTA when positioned below text */}
          {isCtaBelow && ctaButtonNode && (
            <div
              className={`flex ${
                hAlign === "center"
                  ? "justify-center"
                  : hAlign === "right"
                    ? "justify-end"
                    : "justify-start"
              }`}
              style={{ paddingTop: "0.25rem" }}
            >
              {ctaButtonNode}
            </div>
          )}
        </div>

        {/* Standard Opposite / Right CTA */}
        {!isCtaBelow && !isCtaBottomRight && ctaButtonNode}
      </div>

      {/* Bottom-Right CTA positioned relative to banner */}
      {isCtaBottomRight && ctaButtonNode}
    </div>
  );
};
