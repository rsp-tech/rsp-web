"use client";

import dynamic from "next/dynamic";
import { FloatingGreetingPill } from "@/components/floating-greeting-pill";
import { useHomepage } from "@/hooks/use-homepage";

const PushpaVrishtiOverlay = dynamic(
  () =>
    import("@/components/overlays/pushpa-vrishti-overlay").then(
      (mod) => mod.PushpaVrishtiOverlay,
    ),
  { ssr: false },
);

const DeepotsavaOverlay = dynamic(
  () =>
    import("@/components/overlays/deepotsava-overlay").then(
      (mod) => mod.DeepotsavaOverlay,
    ),
  { ssr: false },
);

const CelestialDustOverlay = dynamic(
  () =>
    import("@/components/overlays/celestial-dust-overlay").then(
      (mod) => mod.CelestialDustOverlay,
    ),
  { ssr: false },
);

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
