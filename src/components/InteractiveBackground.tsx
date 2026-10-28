"use client";

import { useEffect, useRef } from "react";

type FieldPixel = {
  x: number;
  y: number;
  ox: number;
  oy: number;
  size: number;
  phase: number;
  speed: number;
  drift: number;
  color: string;
  baseAlpha: number;
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
 * GitLab-style drifting pixel field + logo cursor that fades in while
 * moving (pixelated), then fades out when idle.
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
    let moving = false;
    let idleMs = 0;
    let cursorAlpha = 0;
    let lastMoveAt = 0;
    const field: FieldPixel[] = [];
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

    const COLORS = ["#AB3BFF", "#D15BFF", "#FD80FF", "#C084FC", "#A78BFA"];
    const ACCENT_A = { r: 171, g: 59, b: 255 };
    const ACCENT_B = { r: 253, g: 128, b: 255 };
    const LOGO_SIZE = 64;
    const DUST_MAX = 100;
    function buildField() {
      field.length = 0;
      const spacing = Math.max(22, Math.min(34, Math.floor(width / 42)));
      const cols = Math.ceil(width / spacing) + 2;
      const rows = Math.ceil(height / spacing) + 2;
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          // Keep most of the grid — readable GitLab-style pixel dust
          if (Math.random() > 0.72) continue;
          const x = col * spacing + (Math.random() - 0.5) * spacing * 0.55;
          const y = row * spacing + (Math.random() - 0.5) * spacing * 0.55;
          field.push({
            x,
            y,
            ox: x,
            oy: y,
            size: 1.8 + Math.random() * 2.8,
            phase: Math.random() * Math.PI * 2,
            speed: 0.4 + Math.random() * 1.1,
            drift: 6 + Math.random() * 14,
            color: COLORS[(Math.random() * COLORS.length) | 0],
            baseAlpha: 0.28 + Math.random() * 0.4,
          });
        }
      }
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas!.width = Math.floor(width * dpr);
      canvas!.height = Math.floor(height * dpr);
      canvas!.style.width = `${width}px`;
      canvas!.style.height = `${height}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildField();

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
      lastMoveAt = performance.now();
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

      const px = Math.max(2, Math.round(pixelSize));
      const cells = Math.max(4, Math.round(size / px));
      pixelBuf.width = cells;
      pixelBuf.height = cells;
      pixelCtx.clearRect(0, 0, cells, cells);
      pixelCtx.imageSmoothingEnabled = true;
      pixelCtx.drawImage(logo, 0, 0, cells, cells);

      const sample = pixelCtx.getImageData(0, 0, cells, cells).data;
      const cell = size / cells;
      ctx!.save();
      ctx!.imageSmoothingEnabled = false;
      for (let row = 0; row < cells; row++) {
        for (let col = 0; col < cells; col++) {
          const i = (row * cells + col) * 4;
          const a = sample[i + 3] / 255;
          if (a < 0.18) continue;
          ctx!.globalAlpha = Math.min(1, alpha * (0.6 + a * 0.4));
          ctx!.fillStyle = `rgb(${sample[i]},${sample[i + 1]},${sample[i + 2]})`;
          ctx!.fillRect(
            x - size / 2 + col * cell,
            y - size / 2 + row * cell,
            Math.ceil(cell) + 0.6,
            Math.ceil(cell) + 0.6,
          );
        }
      }
      ctx!.restore();
    }

    function spawnDust(x: number, y: number, speed: number) {
      const count = Math.min(7, 2 + Math.floor(speed / 10));
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const mag = 0.35 + Math.random() * (0.7 + speed * 0.035);
        dust.push({
          x: x + (Math.random() - 0.5) * 16,
          y: y + (Math.random() - 0.5) * 16,
          vx: Math.cos(angle) * mag,
          vy: Math.sin(angle) * mag,
          life: 1,
          size: 2 + Math.random() * (2.5 + Math.min(5, speed * 0.06)),
          color: COLORS[(Math.random() * COLORS.length) | 0],
        });
      }
      while (dust.length > DUST_MAX) dust.shift();
    }

    function frame(now: number) {
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

      // Still "moving" briefly after the last pointer event so fade-out isn't jumpy
      moving = hasPointer && (instant > 0.3 || now - lastMoveAt < 120);
      if (moving) {
        idleMs = 0;
        // Fade in on first / continued movement
        cursorAlpha += (1 - cursorAlpha) * 0.22;
      } else {
        idleMs += 16;
        if (idleMs > 180) {
          // Hold briefly, then fade out when the pointer rests
          cursorAlpha += (0 - cursorAlpha) * 0.08;
        }
        if (cursorAlpha < 0.02) cursorAlpha = 0;
      }

      if (!reduceMotion && moving && instant > 0.2) {
        const steps = Math.min(5, 1 + Math.floor(instant / 14));
        for (let s = 1; s <= steps; s++) {
          const t = s / steps;
          spawnDust(fromX + dx * t, fromY + dy * t, velocity);
        }
      }

      for (const p of dust) {
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.96;
        p.vy *= 0.96;
        p.life -= 0.022;
      }
      while (dust.length && dust[0].life <= 0) dust.shift();

      ctx!.clearRect(0, 0, width, height);

      const driftX = Math.sin(time * 0.35) * 24;
      const driftY = Math.cos(time * 0.28) * 18;
      const followX = hasPointer ? (pointerX - width / 2) * 0.03 : 0;
      const followY = hasPointer ? (pointerY - height / 2) * 0.03 : 0;

      drawOrb(
        width * 0.75 + driftX + followX,
        height * 0.28 + driftY + followY,
        Math.max(width, height) * 0.4,
        ACCENT_A,
        0.12,
      );
      drawOrb(
        width * 0.22 - driftX * 0.6 + followX,
        height * 0.72 - driftY * 0.6 + followY,
        Math.max(width, height) * 0.34,
        ACCENT_B,
        0.1,
      );

      // Ambient moving pixel field (GitLab-like)
      for (const pixel of field) {
        const twinkle =
          0.55 +
          0.45 *
            Math.sin(time * pixel.speed + pixel.phase) *
            Math.sin(time * 0.7 + pixel.phase * 0.5);
        if (!reduceMotion) {
          pixel.x =
            pixel.ox +
            Math.sin(time * pixel.speed * 0.55 + pixel.phase) * pixel.drift;
          pixel.y =
            pixel.oy +
            Math.cos(time * pixel.speed * 0.4 + pixel.phase * 1.3) *
              pixel.drift *
              0.7;
        }

        // Slight brighten near cursor
        let near = 0;
        if (hasPointer) {
          const dist = Math.hypot(pixel.x - pointerX, pixel.y - pointerY);
          near = Math.max(0, 1 - dist / 180);
        }

        const alpha = pixel.baseAlpha * twinkle * (0.85 + near * 0.85);
        const size = pixel.size * (0.9 + near * 0.8 + twinkle * 0.2);
        ctx!.globalAlpha = Math.min(0.85, alpha);
        ctx!.fillStyle = pixel.color;
        ctx!.fillRect(pixel.x - size / 2, pixel.y - size / 2, size, size);
      }
      ctx!.globalAlpha = 1;

      // Motion dust from the logo cursor
      for (const p of dust) {
        ctx!.globalAlpha = Math.max(0, p.life) * cursorAlpha * 0.95;
        ctx!.fillStyle = p.color;
        const s = p.size * (0.55 + p.life * 0.45);
        ctx!.fillRect(p.x - s / 2, p.y - s / 2, s, s);
      }
      ctx!.globalAlpha = 1;

      // Logo cursor: fade in on move, stay pixelated while visible, fade out when idle
      if (logoReady && cursorAlpha > 0.02) {
        const pixelAmount = reduceMotion
          ? 4
          : 5 + Math.min(14, 4 + velocity * 0.55);
        drawPixelLogo(
          pointerX,
          pointerY,
          LOGO_SIZE,
          pixelAmount,
          cursorAlpha,
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
      frame(performance.now());
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
