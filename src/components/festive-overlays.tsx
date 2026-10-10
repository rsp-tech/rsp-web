"use client";

import { FloatingGreetingPill } from "@/components/floating-greeting-pill";
import { CelestialDustOverlay } from "@/components/overlays/celestial-dust-overlay";
import { DeepotsavaOverlay } from "@/components/overlays/deepotsava-overlay";
import { PushpaVrishtiOverlay } from "@/components/overlays/pushpa-vrishti-overlay";
import { useHomepage } from "@/hooks/use-homepage";

export const FestiveOverlays = () => {
  const { data: homepageData } = useHomepage();
  const announcements = homepageData?.announcements;

  if (!announcements || announcements.length === 0) {
    return null;
  }

  const hasPushpaVrishti = announcements.some(
    (a) => a.is_active && a.ui_props?.overlay_theme === "pushpa_vrishti",
  );

  const hasDeepotsava = announcements.some(
    (a) => a.is_active && a.ui_props?.overlay_theme === "deepotsava",
  );

  const hasCelestialDust = announcements.some(
    (a) => a.is_active && a.ui_props?.overlay_theme === "celestial_dust",
  );

  const hasGreetingPill = announcements.some(
    (a) => a.is_active && a.ui_props?.floating_greeting?.enabled,
  );

  return (
    <>
      {hasPushpaVrishti && <PushpaVrishtiOverlay />}
      {hasDeepotsava && <DeepotsavaOverlay />}
      {hasCelestialDust && <CelestialDustOverlay />}
      {hasGreetingPill && (
        <FloatingGreetingPill announcements={announcements} />
      )}
    </>
  );
};
