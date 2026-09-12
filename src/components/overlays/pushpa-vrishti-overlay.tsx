"use client";

import { useCallback } from "react";
import {
  drawParticleImage,
  updateSwayPosition,
  useParticleCanvas,
  wrapHorizontal,
} from "./use-particle-canvas";

interface PetalParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rotation: number;
  vRot: number;
  swayFreq: number;
  swayAmp: number;
  timeOffset: number;
  imageIndex: number;
  opacity: number;
}

const PETAL_ASSETS = [
  "/assets/overlays/petal-lotus.svg",
  "/assets/overlays/petal-marigold.svg",
  "/assets/overlays/petal-rose.svg",
  "/assets/overlays/petal-jasmine.svg",
];

export const PushpaVrishtiOverlay = () => {
  const initParticles = useCallback((w: number, h: number) => {
    const count = Math.min(200, Math.floor((w * h) / 2500));
    const list: PetalParticle[] = [];

    for (let i = 0; i < count; i++) {
      list.push({
        x: Math.random() * w,
        y: -50 + Math.random() * h * 0.8,
        vx: (Math.random() - 0.4) * 0.8,
        vy: 1.2 + Math.random() * 1.8,
        size: 14 + Math.random() * 12,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.04,
        swayFreq: 0.0015 + Math.random() * 0.002,
        swayAmp: 0.8 + Math.random() * 1.2,
        timeOffset: Math.random() * 1000,
        imageIndex: Math.floor(Math.random() * PETAL_ASSETS.length),
        opacity: 0.85 + Math.random() * 0.15,
      });
    }

    return list;
  }, []);

  const resetParticle = useCallback((p: PetalParticle, w: number) => {
    p.y = -20 - Math.random() * 100;
    p.x = Math.random() * w;
  }, []);

  const updateAndDraw = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      p: PetalParticle,
      images: HTMLImageElement[],
      fadeAlpha: number,
      now: number,
      width: number,
      height: number,
      elapsed: number,
      fadeOutStartMs: number,
    ) => {
      updateSwayPosition(p, now);
      p.rotation += p.vRot;
      wrapHorizontal(p, width, 40, 20);

      if (p.y > height + 40 && elapsed < fadeOutStartMs) {
        p.y = -20;
        p.x = Math.random() * width;
      }

      const img = images[p.imageIndex];
      drawParticleImage(
        ctx,
        img,
        p.x,
        p.y,
        p.size,
        p.opacity * fadeAlpha,
        p.rotation,
      );
    },
    [],
  );

  const canvasRef = useParticleCanvas({
    assetUrls: PETAL_ASSETS,
    durationMs: 8000,
    fadeOutStartMs: 6000,
    replayEvents: ["rsp:trigger-pushpa-vrishti", "rsp:trigger-festive-overlay"],
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
