"use client";

import { useEffect, useRef } from "react";

type TrailPoint = {
  x: number;
  y: number;
  life: number;
  pixel: number;
};

/**
 * Soft atmospheric field + logo cursor with a pixelating motion tail.
 * Inspired by premium interactive heroes (e.g. about.gitlab.com motion language).
 */
export default function InteractiveBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const finePointer = window.matchMedia("(pointer: fine)").matches;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let raf = 0;
    let pointerX = width * 0.55 || 0;
    let pointerY = height * 0.4 || 0;
    let targetX = pointerX;
    let targetY = pointerY;
    let prevX = pointerX;
    let prevY = pointerY;
    let velocity = 0;
    let time = 0;
    let active = false;
    const trail: TrailPoint[] = [];

    const logo = new Image();
    logo.src = "/logo.png";
    let logoReady = false;
    logo.onload = () => {
      logoReady = true;
    };

    const pixelBuf = document.createElement("canvas");
    const pixelCtx = pixelBuf.getContext("2d", { willReadFrequently: false });

    const ACCENT_A = { r: 171, g: 59, b: 255 };
    const ACCENT_B = { r: 253, g: 128, b: 255 };
    const LOGO_SIZE = 56;
    const TRAIL_MAX = 28;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas!.width = Math.floor(width * dpr);
      canvas!.height = Math.floor(height * dpr);
      canvas!.style.width = `${width}px`;
      canvas!.style.height = `${height}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (!active) {
        targetX = width * 0.62;
        targetY = height * 0.42;
        pointerX = targetX;
        pointerY = targetY;
        prevX = targetX;
        prevY = targetY;
      }
    }

    function onPointerMove(e: PointerEvent) {
      if (!finePointer) return;
      active = true;
      targetX = e.clientX;
      targetY = e.clientY;
    }

    function onPointerLeave() {
      active = false;
    }

    function drawOrb(
      cx: number,
      cy: number,
      radius: number,
      color: { r: number; g: number; b: number },
      alpha: number,
    ) {
      const gradient = ctx!.createRadialGradient(cx, cy, 0, cx, cy, radius);
      gradient.addColorStop(0, `rgba(${color.r},${color.g},${color.b},${alpha})`);
      gradient.addColorStop(
        0.45,
        `rgba(${color.r},${color.g},${color.b},${alpha * 0.32})`,
      );
      gradient.addColorStop(1, `rgba(${color.r},${color.g},${color.b},0)`);
      ctx!.fillStyle = gradient;
      ctx!.beginPath();
      ctx!.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx!.fill();
    }

    function drawPixelLogo(
      x: number,
      y: number,
      size: number,
      pixelSize: number,
      alpha: number,
    ) {
      if (!logoReady || !pixelCtx || alpha <= 0.01) return;

      const px = Math.max(1, Math.round(pixelSize));
      ctx!.save();
      ctx!.globalAlpha = alpha;

      if (px <= 1.5) {
        ctx!.imageSmoothingEnabled = true;
        ctx!.drawImage(logo, x - size / 2, y - size / 2, size, size);
        ctx!.restore();
        return;
      }

      // Downscale then nearest-neighbor upscale = chunky pixel dissolve
      const cells = Math.max(3, Math.round(size / px));
      pixelBuf.width = cells;
      pixelBuf.height = cells;
      pixelCtx.clearRect(0, 0, cells, cells);
      pixelCtx.imageSmoothingEnabled = true;
      pixelCtx.drawImage(logo, 0, 0, cells, cells);

      ctx!.imageSmoothingEnabled = false;
      ctx!.drawImage(pixelBuf, x - size / 2, y - size / 2, size, size);
      ctx!.restore();
    }

    function frame() {
      time += 0.012;

      const ease = active ? 0.22 : 0.06;
      pointerX += (targetX - pointerX) * ease;
      pointerY += (targetY - pointerY) * ease;

      const dx = pointerX - prevX;
      const dy = pointerY - prevY;
      const instant = Math.hypot(dx, dy);
      velocity += (instant - velocity) * 0.25;
      prevX = pointerX;
      prevY = pointerY;

      // Seed trail while moving
      if (finePointer && !reduceMotion && instant > 0.4) {
        const pixel = 1 + Math.min(14, velocity * 0.55);
        trail.push({
          x: pointerX,
          y: pointerY,
          life: 1,
          pixel,
        });
        while (trail.length > TRAIL_MAX) trail.shift();
      }

      for (const point of trail) {
        point.life -= 0.028;
        point.pixel += 0.18;
      }
      while (trail.length && trail[0].life <= 0) trail.shift();

      ctx!.clearRect(0, 0, width, height);

      // Quiet atmosphere — no geometric mesh
      const driftX = Math.sin(time * 0.35) * 30;
      const driftY = Math.cos(time * 0.28) * 24;
      const followX = finePointer ? (pointerX - width / 2) * 0.04 : 0;
      const followY = finePointer ? (pointerY - height / 2) * 0.04 : 0;

      drawOrb(
        width * 0.75 + driftX + followX,
        height * 0.28 + driftY + followY,
        Math.max(width, height) * 0.42,
        ACCENT_A,
        0.16,
      );
      drawOrb(
        width * 0.22 - driftX * 0.6 + followX,
        height * 0.72 - driftY * 0.6 + followY,
        Math.max(width, height) * 0.36,
        ACCENT_B,
        0.14,
      );

      // Soft bloom under the living cursor
      if (finePointer) {
        const bloom = 0.1 + Math.min(0.18, velocity * 0.01);
        drawOrb(pointerX, pointerY, 120 + velocity * 2, ACCENT_B, bloom);
      }

      // Tail: oldest (most pixelated) first
      for (let i = 0; i < trail.length; i++) {
        const point = trail[i];
        const t = i / Math.max(trail.length - 1, 1);
        const size = LOGO_SIZE * (0.45 + t * 0.35);
        const alpha = point.life * (0.15 + t * 0.35);
        drawPixelLogo(point.x, point.y, size, point.pixel, alpha);
      }

      // Head: crisp when still, pixelates while moving
      if (finePointer && logoReady) {
        const headPixel = reduceMotion
          ? 1
          : 1 + Math.min(10, velocity * 0.42);
        const headAlpha = active ? 0.95 : 0.55;
        drawPixelLogo(pointerX, pointerY, LOGO_SIZE, headPixel, headAlpha);
      }

      if (!reduceMotion) {
        raf = requestAnimationFrame(frame);
      }
    }

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerleave", onPointerLeave);

    if (reduceMotion) {
      frame();
    } else {
      raf = requestAnimationFrame(frame);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerleave", onPointerLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
}
