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

    let width = 0;
    let height = 0;
    let dpr = 1;
    let raf = 0;
    let pointerX = 0;
    let pointerY = 0;
    let targetX = 0;
    let targetY = 0;
    let prevX = 0;
    let prevY = 0;
    let velocity = 0;
    let time = 0;
    let hasPointer = false;
    const trail: TrailPoint[] = [];

    const logo = new Image();
    logo.decoding = "async";
    logo.src = "/logo.png";
    let logoReady = logo.complete && logo.naturalWidth > 0;
    logo.onload = () => {
      logoReady = true;
    };

    const pixelBuf = document.createElement("canvas");
    const pixelCtx = pixelBuf.getContext("2d");

    const ACCENT_A = { r: 171, g: 59, b: 255 };
    const ACCENT_B = { r: 253, g: 128, b: 255 };
    const LOGO_SIZE = 72;
    const TRAIL_MAX = 48;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas!.width = Math.floor(width * dpr);
      canvas!.height = Math.floor(height * dpr);
      canvas!.style.width = `${width}px`;
      canvas!.style.height = `${height}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (!hasPointer) {
        targetX = width * 0.62;
        targetY = height * 0.42;
        pointerX = targetX;
        pointerY = targetY;
        prevX = targetX;
        prevY = targetY;
      }
    }

    function onPointerMove(e: PointerEvent) {
      // Touch keeps the native finger affordance; mouse/pen drive the logo cursor
      if (e.pointerType === "touch") return;
      hasPointer = true;
      targetX = e.clientX;
      targetY = e.clientY;
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
      ctx!.globalAlpha = Math.min(1, alpha);

      if (px <= 1.5) {
        ctx!.imageSmoothingEnabled = true;
        ctx!.drawImage(logo, x - size / 2, y - size / 2, size, size);
        ctx!.restore();
        return;
      }

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

      const ease = hasPointer ? 0.28 : 0.05;
      pointerX += (targetX - pointerX) * ease;
      pointerY += (targetY - pointerY) * ease;

      const fromX = prevX;
      const fromY = prevY;
      const dx = pointerX - fromX;
      const dy = pointerY - fromY;
      const instant = Math.hypot(dx, dy);
      velocity += (instant - velocity) * 0.28;
      prevX = pointerX;
      prevY = pointerY;

      if (!reduceMotion && hasPointer && instant > 0.25) {
        // Densify trail on fast moves so the pixelated tail reads clearly
        const steps = Math.min(6, 1 + Math.floor(instant / 12));
        for (let s = 1; s <= steps; s++) {
          const t = s / steps;
          trail.push({
            x: fromX + dx * t,
            y: fromY + dy * t,
            life: 1,
            pixel: 2 + Math.min(20, velocity * 0.85),
          });
        }
        while (trail.length > TRAIL_MAX) trail.shift();
      }

      for (const point of trail) {
        point.life -= 0.018;
        point.pixel += 0.35;
      }
      while (trail.length && trail[0].life <= 0) trail.shift();

      ctx!.clearRect(0, 0, width, height);

      const driftX = Math.sin(time * 0.35) * 28;
      const driftY = Math.cos(time * 0.28) * 22;
      const followX = hasPointer ? (pointerX - width / 2) * 0.035 : 0;
      const followY = hasPointer ? (pointerY - height / 2) * 0.035 : 0;

      drawOrb(
        width * 0.75 + driftX + followX,
        height * 0.28 + driftY + followY,
        Math.max(width, height) * 0.42,
        ACCENT_A,
        0.15,
      );
      drawOrb(
        width * 0.22 - driftX * 0.6 + followX,
        height * 0.72 - driftY * 0.6 + followY,
        Math.max(width, height) * 0.36,
        ACCENT_B,
        0.13,
      );

      if (hasPointer) {
        drawOrb(
          pointerX,
          pointerY,
          110 + velocity * 2.2,
          ACCENT_B,
          0.1 + Math.min(0.16, velocity * 0.008),
        );
      }

      for (let i = 0; i < trail.length; i++) {
        const point = trail[i];
        const t = i / Math.max(trail.length - 1, 1);
        const size = LOGO_SIZE * (0.55 + t * 0.4);
        const alpha = point.life * (0.28 + t * 0.5);
        drawPixelLogo(point.x, point.y, size, point.pixel, alpha);
      }

      // Idle mark before first move; live cursor after
      if (logoReady) {
        const headPixel = reduceMotion
          ? 1
          : hasPointer
            ? 1 + Math.min(14, velocity * 0.6)
            : 1;
        const headAlpha = hasPointer ? 1 : 0.5;
        drawPixelLogo(pointerX, pointerY, LOGO_SIZE, headPixel, headAlpha);
      }

      if (!reduceMotion) {
        raf = requestAnimationFrame(frame);
      }
    }

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onPointerMove, { passive: true });

    if (reduceMotion) {
      frame();
    } else {
      raf = requestAnimationFrame(frame);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      data-logo-cursor="true"
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 h-full w-full"
    />
  );
}
