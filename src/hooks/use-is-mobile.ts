import { useSyncExternalStore } from "react";

const MOBILE_W_BREAKPOINT = 768;

export const useIsMobile = () =>
  useSyncExternalStore(
    (subscribe) => {
      const handleResize = () => subscribe();
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    },
    () => window.innerWidth < MOBILE_W_BREAKPOINT,
    () => true,
  );
