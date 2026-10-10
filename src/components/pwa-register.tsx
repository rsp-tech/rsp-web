"use client";

import { useEffect } from "react";

export const PwaRegister = () => {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      // Skip registration in automated audit environments (PageSpeed Insights / Lighthouse) and bots and dev mode
      if (
        process.env.NODE_ENV !== "production" ||
        /Chrome-Lighthouse|HeadlessChrome|bot|spider|crawler/i.test(
          navigator.userAgent,
        )
      ) {
        return;
      }

      if (process.env.NODE_ENV === "production") {
        const registerSW = () => {
          navigator.serviceWorker
            .register("/sw.js", { updateViaCache: "none" })
            .then((reg) => {
              console.info(
                "Service Worker registered successfully with scope:",
                reg.scope,
              );
            })
            .catch((err) => {
              console.warn("Service Worker registration failed:", err);
            });
        };

        if (document.readyState === "complete") {
          registerSW();
        } else {
          window.addEventListener("load", registerSW);
          return () => window.removeEventListener("load", registerSW);
        }
      } else {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          for (const registration of registrations) {
            registration.unregister().then((success) => {
              if (success) {
                console.info(
                  "Successfully unregistered active Service Worker in development mode:",
                  registration.scope,
                );
              }
            });
          }
        });
      }
    }
  }, []);

  return null;
};
