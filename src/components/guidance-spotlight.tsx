"use client";

import { Compass, Lightbulb, MessageSquareQuote } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { Announcement } from "@/types";

interface GuidanceSpotlightProps {
  spotlights: Announcement[];
}

export const GuidanceSpotlight = ({ spotlights }: GuidanceSpotlightProps) => {
  if (!spotlights || spotlights.length === 0) return null;

  const item = spotlights[0];

  return (
    <section
      aria-label="Guidance & Philosophical Clarifications"
      className="relative rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-md overflow-hidden"
    >
      <div
        className="absolute pointer-events-none text-primary"
        style={{
          opacity: 0.05,
          transform: "translate(2rem, 2rem)",
          bottom: 0,
          right: 0,
        }}
      >
        <Compass style={{ width: "14rem", height: "14rem" }} />
      </div>

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
        <div className="flex flex-col gap-3 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs font-bold text-primary tracking-wider uppercase bg-muted px-3 py-1 rounded-full">
              <Lightbulb className="w-4 h-4" />
              {item.badge_text || "Timely Guidance & Clarifications"}
            </span>
          </div>

          <div className="flex items-start gap-3">
            <MessageSquareQuote className="w-6 h-6 text-muted-foreground shrink-0 mt-1 hidden sm:flex" />
            <div className="flex flex-col gap-1">
              <h3 className="text-xl sm:text-2xl font-bold font-heading tracking-tight text-foreground">
                {item.title}
              </h3>
              {item.subtitle && (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {item.subtitle}
                </p>
              )}
            </div>
          </div>
        </div>

        {item.cta_label && (
          <div className="shrink-0 self-start md:self-auto">
            <Button asChild className="font-bold shadow-md cursor-pointer">
              <Link href={item.cta_url || "#"}>{item.cta_label}</Link>
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};
