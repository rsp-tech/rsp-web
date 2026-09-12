"use client";

import { useCallback } from "react";
import {
  drawParticleImage,
  useParticleCanvas,
  wrapHorizontal,
} from "./use-particle-canvas";

interface CelestialParticle {
  type: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rotation: number;
  vRot: number;
  twinkleFreq: number;
  timeOffset: number;
  opacity: number;
}

const CELESTIAL_ASSETS = [
  "/assets/overlays/sparkle-star.svg",
  "/assets/overlays/star-twinkle.svg",
  "/assets/overlays/gold-orb.svg",
];

export const CelestialDustOverlay = () => {
  const initParticles = useCallback((w: number, h: number) => {
    const count = Math.min(55, Math.floor((w * h) / 20000));
    const list: CelestialParticle[] = [];
    for (let i = 0; i < count; i++) {
      list.push({
        type: Math.floor(Math.random() * CELESTIAL_ASSETS.length),
        x: Math.random() * w,
        y: Math.random() * h * 0.85,
        vx: (Math.random() - 0.5) * 0.5,
        vy: 0.8 + Math.random() * 1.4,
        size: 14 + Math.random() * 18,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.025,
        twinkleFreq: 0.003 + Math.random() * 0.004,
        timeOffset: Math.random() * 2000,
        opacity: 0.7 + Math.random() * 0.3,
      });
    }
    return list;
  }, []);

  const resetParticle = useCallback((p: CelestialParticle, w: number) => {
    p.y = -20 - Math.random() * 80;
    p.x = Math.random() * w;
  }, []);

  const updateAndDraw = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      p: CelestialParticle,
      images: HTMLImageElement[],
      fadeAlpha: number,
      now: number,
      width: number,
      height: number,
      elapsed: number,
      fadeOutStartMs: number,
    ) => {
      p.y += p.vy;
      p.x += p.vx;
      p.rotation += p.vRot;

      wrapHorizontal(p, width, 30, 20);

      if (p.y > height + 30 && elapsed < fadeOutStartMs) {
        p.y = -20;
        p.x = Math.random() * width;
      }

      const twinkle = 0.6 + Math.sin(now * p.twinkleFreq + p.timeOffset) * 0.4;
      const currentSize = p.size * (0.85 + twinkle * 0.3);

      const img = images[p.type];
      drawParticleImage(
        ctx,
        img,
        p.x,
        p.y,
        currentSize,
        p.opacity * twinkle * fadeAlpha,
        p.rotation,
      );
    },
    [],
  );

  const canvasRef = useParticleCanvas({
    assetUrls: CELESTIAL_ASSETS,
    durationMs: 8500,
    fadeOutStartMs: 6500,
    replayEvents: ["rsp:trigger-celestial-dust", "rsp:trigger-festive-overlay"],
    initParticles,
    resetParticle,
    updateAndDraw,
  });

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50 select-none"
    />
  );
};
