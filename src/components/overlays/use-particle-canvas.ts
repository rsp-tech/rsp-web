"use client";

import { useEffect, useRef } from "react";

export interface ParticleCanvasConfig<T> {
  assetUrls: string[];
  durationMs?: number;
  fadeOutStartMs?: number;
  replayEvents?: string[];
  initParticles: (
    width: number,
    height: number,
    images: HTMLImageElement[],
  ) => T[];
  resetParticle?: (particle: T, width: number, height: number) => void;
  updateAndDraw: (
    ctx: CanvasRenderingContext2D,
    particle: T,
    images: HTMLImageElement[],
    fadeAlpha: number,
    now: number,
    width: number,
    height: number,
    elapsed: number,
    fadeOutStartMs: number,
  ) => void;
}

export interface SwayingParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  swayFreq: number;
  swayAmp: number;
  timeOffset: number;
}

export const updateSwayPosition = (p: SwayingParticle, now: number) => {
  p.y += p.vy;
  p.x += p.vx + Math.sin((now + p.timeOffset) * p.swayFreq) * p.swayAmp;
};

export const wrapHorizontal = (
  p: { x: number },
  width: number,
  margin = 40,
  resetOffset = 20,
) => {
  if (p.x < -margin) p.x = width + resetOffset;
  if (p.x > width + margin) p.x = -resetOffset;
};

export const drawParticleImage = (
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | undefined,
  x: number,
  y: number,
  size: number,
  opacity: number,
  rotation = 0,
) => {
  if (!img?.complete || img.naturalWidth === 0) return;
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.translate(x, y);
  if (rotation !== 0) {
    ctx.rotate(rotation);
  }
  ctx.drawImage(img, -size / 2, -size / 2, size, size);
  ctx.restore();
};

export const useParticleCanvas = <T>({
  assetUrls,
  durationMs = 8500,
  fadeOutStartMs = 6500,
  replayEvents = [],
  initParticles,
  resetParticle,
  updateAndDraw,
}: ParticleCanvasConfig<T>) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animFrameId: number;
    let isRunning = true;
    let startTime = performance.now();

    const images: HTMLImageElement[] = [];
    for (const src of assetUrls) {
      const img = new Image();
      img.src = src;
      images.push(img);
    }

    const resize = () => {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resize();
    window.addEventListener("resize", resize);

    const particles = initParticles(
      window.innerWidth,
      window.innerHeight,
      images,
    );

    const render = (now: number) => {
      const elapsed = now - startTime;
      if (!isRunning) return;

      if (elapsed > durationMs) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        isRunning = false;
        return;
      }

      let fadeAlpha = 1;
      if (elapsed > fadeOutStartMs) {
        fadeAlpha = Math.max(
          0,
          1 - (elapsed - fadeOutStartMs) / (durationMs - fadeOutStartMs),
        );
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const p of particles) {
        updateAndDraw(
          ctx,
          p,
          images,
          fadeAlpha,
          now,
          canvas.width,
          canvas.height,
          elapsed,
          fadeOutStartMs,
        );
      }

      animFrameId = requestAnimationFrame(render);
    };

    const timer = setTimeout(() => {
      startTime = performance.now();
      animFrameId = requestAnimationFrame(render);
    }, 150);

    const handleReplay = () => {
      cancelAnimationFrame(animFrameId);
      startTime = performance.now();
      isRunning = true;
      if (resetParticle) {
        for (const p of particles) {
          resetParticle(p, window.innerWidth, window.innerHeight);
        }
      }
      animFrameId = requestAnimationFrame(render);
    };

    for (const evt of replayEvents) {
      window.addEventListener(evt, handleReplay);
    }

    return () => {
      isRunning = false;
      clearTimeout(timer);
      cancelAnimationFrame(animFrameId);
      window.removeEventListener("resize", resize);
      for (const evt of replayEvents) {
        window.removeEventListener(evt, handleReplay);
      }
    };
  }, [
    assetUrls,
    durationMs,
    fadeOutStartMs,
    replayEvents,
    initParticles,
    resetParticle,
    updateAndDraw,
  ]);

  return canvasRef;
};
