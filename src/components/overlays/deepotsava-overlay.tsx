"use client";

import { useCallback } from "react";
import {
  drawParticleImage,
  updateSwayPosition,
  useParticleCanvas,
  wrapHorizontal,
} from "./use-particle-canvas";

interface DiyaParticle {
  type: "diya" | "ember";
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  swayFreq: number;
  swayAmp: number;
  timeOffset: number;
  opacity: number;
  pulseSpeed: number;
}

const DIYA_ASSET = "/assets/overlays/diya-glow.svg";
const EMBER_ASSET = "/assets/overlays/ember-spark.svg";

export const DeepotsavaOverlay = () => {
  const initParticles = useCallback((w: number, h: number) => {
    const particles: DiyaParticle[] = [];
    const diyaCount = Math.min(18, Math.max(6, Math.floor(w / 90)));
    const emberCount = Math.min(35, Math.max(12, Math.floor(w / 45)));

    for (let i = 0; i < diyaCount; i++) {
      particles.push({
        type: "diya",
        x: Math.random() * w,
        y: h + 20 + Math.random() * 80,
        vx: (Math.random() - 0.5) * 0.4,
        vy: -(0.5 + Math.random() * 0.7),
        size: 38 + Math.random() * 18,
        swayFreq: 0.0012 + Math.random() * 0.0015,
        swayAmp: 1.2 + Math.random() * 1.5,
        timeOffset: Math.random() * 2000,
        opacity: 0.85 + Math.random() * 0.15,
        pulseSpeed: 0.003 + Math.random() * 0.003,
      });
    }

    for (let i = 0; i < emberCount; i++) {
      particles.push({
        type: "ember",
        x: Math.random() * w,
        y: h * 0.4 + Math.random() * (h * 0.6),
        vx: (Math.random() - 0.5) * 0.6,
        vy: -(1.2 + Math.random() * 1.8),
        size: 8 + Math.random() * 12,
        swayFreq: 0.002 + Math.random() * 0.003,
        swayAmp: 0.8 + Math.random() * 1.4,
        timeOffset: Math.random() * 2000,
        opacity: 0.6 + Math.random() * 0.4,
        pulseSpeed: 0.004 + Math.random() * 0.004,
      });
    }

    return particles;
  }, []);

  const resetParticle = useCallback((p: DiyaParticle, w: number, h: number) => {
    if (p.type === "diya") {
      p.y = h + 20 + Math.random() * 60;
    } else {
      p.y = h * 0.6 + Math.random() * (h * 0.4);
    }
    p.x = Math.random() * w;
  }, []);

  const updateAndDraw = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      p: DiyaParticle,
      images: HTMLImageElement[],
      fadeAlpha: number,
      now: number,
      width: number,
      height: number,
      elapsed: number,
      fadeOutStartMs: number,
    ) => {
      updateSwayPosition(p, now);
      wrapHorizontal(p, width, 50, 30);

      if (p.y < -60 && elapsed < fadeOutStartMs) {
        p.y = height + 20 + Math.random() * 40;
        p.x = Math.random() * width;
      }

      const pulse = 1 + Math.sin(now * p.pulseSpeed + p.timeOffset) * 0.12;
      const currentSize = p.size * pulse;
      const img = p.type === "diya" ? images[0] : images[1];

      drawParticleImage(ctx, img, p.x, p.y, currentSize, p.opacity * fadeAlpha);
    },
    [],
  );

  const canvasRef = useParticleCanvas({
    assetUrls: [DIYA_ASSET, EMBER_ASSET],
    durationMs: 8500,
    fadeOutStartMs: 6500,
    replayEvents: ["rsp:trigger-deepotsava", "rsp:trigger-festive-overlay"],
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
