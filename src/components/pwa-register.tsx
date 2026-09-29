"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
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
              console.error("Service Worker registration failed:", err);
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
}
