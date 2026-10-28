"use client";

import { useEffect, useRef } from "react";

type TrailPoint = {
  x: number;
  y: number;
  life: number;
  pixel: number;
};

type Dust = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  size: number;
  color: string;
};

/**
 * Soft atmosphere + logo cursor that pixelates in motion and leaves
 * a digital dust / pixel tail (transparent-PNG-safe).
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
    const dust: Dust[] = [];

    const logo = new Image();
    logo.decoding = "async";
    logo.src = "/logo.png";
    let logoReady = logo.complete && logo.naturalWidth > 0;
    logo.onload = () => {
      logoReady = true;
    };

    const pixelBuf = document.createElement("canvas");
    const pixelCtx = pixelBuf.getContext("2d");

    const COLORS = ["#AB3BFF", "#D15BFF", "#FD80FF", "#C084FC"];
    const ACCENT_A = { r: 171, g: 59, b: 255 };
    const ACCENT_B = { r: 253, g: 128, b: 255 };
    const LOGO_SIZE = 68;
    const TRAIL_MAX = 40;
    const DUST_MAX = 120;

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
      if (!logoReady || !pixelCtx || alpha <= 0.02) return;

      const px = Math.max(1, Math.round(pixelSize));
      ctx!.save();
      ctx!.globalAlpha = Math.min(1, alpha);

      if (px <= 1.5) {
        ctx!.imageSmoothingEnabled = true;
        ctx!.drawImage(logo, x - size / 2, y - size / 2, size, size);
        ctx!.restore();
        return;
      }

      const cells = Math.max(4, Math.round(size / px));
      pixelBuf.width = cells;
      pixelBuf.height = cells;
      pixelCtx.clearRect(0, 0, cells, cells);
      pixelCtx.imageSmoothingEnabled = true;
      pixelCtx.drawImage(logo, 0, 0, cells, cells);

      // Rebuild opaque mosaic so transparency does not wash the trail out
      const sample = pixelCtx.getImageData(0, 0, cells, cells).data;
      const cell = size / cells;
      ctx!.imageSmoothingEnabled = false;
      for (let row = 0; row < cells; row++) {
        for (let col = 0; col < cells; col++) {
          const i = (row * cells + col) * 4;
          const a = sample[i + 3] / 255;
          if (a < 0.2) continue;
          ctx!.globalAlpha = Math.min(1, alpha * (0.55 + a * 0.45));
          ctx!.fillStyle = `rgb(${sample[i]},${sample[i + 1]},${sample[i + 2]})`;
          ctx!.fillRect(
            x - size / 2 + col * cell,
            y - size / 2 + row * cell,
            Math.ceil(cell) + 0.5,
            Math.ceil(cell) + 0.5,
          );
        }
      }
      ctx!.restore();
    }

    function spawnDust(x: number, y: number, speed: number) {
      const count = Math.min(8, 2 + Math.floor(speed / 8));
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const mag = 0.4 + Math.random() * (0.8 + speed * 0.04);
        dust.push({
          x: x + (Math.random() - 0.5) * 18,
          y: y + (Math.random() - 0.5) * 18,
          vx: Math.cos(angle) * mag,
          vy: Math.sin(angle) * mag,
          life: 1,
          size: 2 + Math.random() * (3 + Math.min(6, speed * 0.08)),
          color: COLORS[(Math.random() * COLORS.length) | 0],
        });
      }
      while (dust.length > DUST_MAX) dust.shift();
    }

    function frame() {
      time += 0.012;

      const ease = hasPointer ? 0.3 : 0.05;
      pointerX += (targetX - pointerX) * ease;
      pointerY += (targetY - pointerY) * ease;

      const fromX = prevX;
      const fromY = prevY;
      const dx = pointerX - fromX;
      const dy = pointerY - fromY;
      const instant = Math.hypot(dx, dy);
      velocity += (instant - velocity) * 0.3;
      prevX = pointerX;
      prevY = pointerY;

      if (!reduceMotion && hasPointer && instant > 0.2) {
        const steps = Math.min(7, 1 + Math.floor(instant / 10));
        for (let s = 1; s <= steps; s++) {
          const t = s / steps;
          const x = fromX + dx * t;
          const y = fromY + dy * t;
          trail.push({
            x,
            y,
            life: 1,
            pixel: 3 + Math.min(22, velocity * 0.9),
          });
          spawnDust(x, y, velocity);
        }
        while (trail.length > TRAIL_MAX) trail.shift();
      }

      for (const point of trail) {
        point.life -= 0.016;
        point.pixel += 0.4;
      }
      while (trail.length && trail[0].life <= 0) trail.shift();

      for (const p of dust) {
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.96;
        p.vy *= 0.96;
        p.life -= 0.02;
      }
      while (dust.length && dust[0].life <= 0) dust.shift();

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
        0.14,
      );
      drawOrb(
        width * 0.22 - driftX * 0.6 + followX,
        height * 0.72 - driftY * 0.6 + followY,
        Math.max(width, height) * 0.36,
        ACCENT_B,
        0.12,
      );

      if (hasPointer) {
        drawOrb(
          pointerX,
          pointerY,
          100 + velocity * 2,
          ACCENT_B,
          0.12 + Math.min(0.14, velocity * 0.006),
        );
      }

      // Pixel dust tail (opaque squares)
      for (const p of dust) {
        ctx!.globalAlpha = Math.max(0, p.life) * 0.9;
        ctx!.fillStyle = p.color;
        const s = p.size * (0.6 + p.life * 0.4);
        ctx!.fillRect(p.x - s / 2, p.y - s / 2, s, s);
      }
      ctx!.globalAlpha = 1;

      // Pixelated logo ghosts along the path
      for (let i = 0; i < trail.length; i++) {
        const point = trail[i];
        const t = i / Math.max(trail.length - 1, 1);
        const size = LOGO_SIZE * (0.5 + t * 0.4);
        const alpha = point.life * (0.35 + t * 0.45);
        drawPixelLogo(point.x, point.y, size, point.pixel, alpha);
      }

      if (logoReady) {
        const headPixel = reduceMotion
          ? 1
          : hasPointer
            ? 1 + Math.min(16, velocity * 0.7)
            : 1;
        drawPixelLogo(
          pointerX,
          pointerY,
          LOGO_SIZE,
          headPixel,
          hasPointer ? 1 : 0.5,
        );
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
