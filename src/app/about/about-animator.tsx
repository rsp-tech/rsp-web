"use client";

import { useEffect } from "react";

export const AboutAnimator = () => {
  useEffect(() => {
    // 1. Enter/Exit Scroll Reveal with IntersectionObserver
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-revealed");
          } else {
            // Remove on exit so animations re-trigger every time you scroll past
            entry.target.classList.remove("is-revealed");
          }
        }
      },
      {
        threshold: 0.15,
        rootMargin: "0px 0px -40px 0px",
      },
    );

    const elements = document.querySelectorAll(
      ".reveal-on-scroll, .reveal-3d, .reveal-blur, .reveal-left, .reveal-right, .reveal-stagger",
    );
    for (const el of elements) {
      observer.observe(el);
    }

    // 2. High-Performance 3D Hover Tilt & Light Flare (Event Delegated)
    const handleMouseMove = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest(
        ".about-tilt-card",
      ) as HTMLElement | null;
      if (!target) return;

      const rect = target.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      // Rotations (-12deg to +12deg)
      const rotateX = Number((((y - centerY) / centerY) * -12).toFixed(2));
      const rotateY = Number((((x - centerX) / centerX) * 12).toFixed(2));

      target.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.04, 1.04, 1.04)`;

      // Dynamic lighting reflection
      const percentX = Math.round((x / rect.width) * 100);
      const percentY = Math.round((y / rect.height) * 100);
      target.style.setProperty("--tilt-glow-x", `${percentX}%`);
      target.style.setProperty("--tilt-glow-y", `${percentY}%`);
      target.classList.add("is-tilting");
    };

    const handleMouseOut = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest(
        ".about-tilt-card",
      ) as HTMLElement | null;
      if (!target) return;

      const related = e.relatedTarget as HTMLElement | null;
      if (related && target.contains(related)) return;

      target.style.transform =
        "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)";
      target.classList.remove("is-tilting");
    };

    document.addEventListener("mousemove", handleMouseMove, { passive: true });
    document.addEventListener("mouseout", handleMouseOut, { passive: true });

    return () => {
      observer.disconnect();
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseout", handleMouseOut);
    };
  }, []);

  return null;
};
