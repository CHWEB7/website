"use client";

import { useEffect, useRef } from "react";

type Dot = {
  x: number;
  y: number;
  ox: number;
  oy: number;
  phase: number;
  band: number;
};

/**
 * GitLab-style dither field:
 * - dense tiny dots on a tight grid
 * - continuous drifting density clouds (no mouse required)
 * - cursor creates a local density / brightness swell
 * - system cursor stays visible
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
    let time = 0;
    let pointerX = -9999;
    let pointerY = -9999;
    let targetX = -9999;
    let targetY = -9999;
    let hasPointer = false;
    let dots: Dot[] = [];
    let spacing = 5;

    // Soft brand tint over GitLab-like cool grey dots
    const DOT_RGB = { r: 180, g: 150, b: 220 };

    function buildDots() {
      spacing = Math.max(4, Math.min(6, Math.round(width / 280)));
      const next: Dot[] = [];
      const cols = Math.ceil(width / spacing) + 2;
      const rows = Math.ceil(height / spacing) + 2;
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const x = col * spacing;
          const y = row * spacing;
          next.push({
            x,
            y,
            ox: x,
            oy: y,
            phase: Math.random() * Math.PI * 2,
            // Which density “band/cell” — varies by coarse grid like GitLab sectors
            band: ((col / 18) | 0) + ((row / 14) | 0) * 3,
          });
        }
      }
      dots = next;
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
      buildDots();
    }

    function onPointerMove(e: PointerEvent) {
      if (e.pointerType === "touch") return;
      hasPointer = true;
      targetX = e.clientX;
      targetY = e.clientY;
    }

    function onPointerLeave() {
      hasPointer = false;
      targetX = -9999;
      targetY = -9999;
    }

    // Cheap value-noise-ish field for continuous cloud motion
    function fieldNoise(x: number, y: number, t: number) {
      const n1 = Math.sin(x * 0.0042 + t * 0.31) * Math.cos(y * 0.0036 - t * 0.27);
      const n2 = Math.sin((x + y) * 0.0028 - t * 0.19) * 0.65;
      const n3 = Math.cos(x * 0.0015 - y * 0.0021 + t * 0.14) * 0.45;
      return (n1 + n2 + n3) / 2.1;
    }

    function frame() {
      time += reduceMotion ? 0 : 0.016;
      pointerX += (targetX - pointerX) * 0.18;
      pointerY += (targetY - pointerY) * 0.18;

      ctx!.clearRect(0, 0, width, height);

      // Soft vignette wash (matches GitLab dither-field radial)
      const wash = ctx!.createRadialGradient(
        width * 0.5,
        height * 0.45,
        0,
        width * 0.5,
        height * 0.45,
        Math.max(width, height) * 0.7,
      );
      wash.addColorStop(0, "rgba(255,255,255,0.045)");
      wash.addColorStop(0.55, "rgba(255,255,255,0)");
      ctx!.fillStyle = wash;
      ctx!.fillRect(0, 0, width, height);

      // Brand-tinted ambient glow pockets
      const g1 = ctx!.createRadialGradient(
        width * 0.78,
        height * 0.3,
        0,
        width * 0.78,
        height * 0.3,
        Math.max(width, height) * 0.35,
      );
      g1.addColorStop(0, "rgba(171,59,255,0.10)");
      g1.addColorStop(1, "rgba(171,59,255,0)");
      ctx!.fillStyle = g1;
      ctx!.fillRect(0, 0, width, height);

      const g2 = ctx!.createRadialGradient(
        width * 0.2,
        height * 0.75,
        0,
        width * 0.2,
        height * 0.75,
        Math.max(width, height) * 0.3,
      );
      g2.addColorStop(0, "rgba(253,128,255,0.08)");
      g2.addColorStop(1, "rgba(253,128,255,0)");
      ctx!.fillStyle = g2;
      ctx!.fillRect(0, 0, width, height);

      // Column rules like GitLab hero (3-column feel)
      ctx!.strokeStyle = "rgba(255,255,255,0.06)";
      ctx!.lineWidth = 1;
      for (let i = 1; i < 3; i++) {
        const x = (width / 3) * i;
        ctx!.beginPath();
        ctx!.moveTo(x, 0);
        ctx!.lineTo(x, height);
        ctx!.stroke();
      }

      const influence = Math.min(width, height) * 0.16;
      const r = Math.max(0.7, spacing * 0.18);

      for (const dot of dots) {
        // Continuous cloud density — animates forever without mouse
        const cloud = fieldNoise(dot.ox, dot.oy, time);
        const bandWave =
          Math.sin(time * 0.22 + dot.band * 0.85 + dot.phase * 0.2) * 0.25;
        let density = 0.22 + cloud * 0.55 + bandWave;

        // Sector masks (GitLab-like uneven blobs of density)
        const mx = dot.ox / width;
        const my = dot.oy / height;
        const blobA = Math.exp(
          -(((mx - 0.22) * 2.2) ** 2 + ((my - 0.22) * 1.7) ** 2) * 2.2,
        );
        const blobB = Math.exp(
          -(((mx - 0.78) * 2.4) ** 2 + ((my - 0.44) * 2.0) ** 2) * 2.4,
        );
        const blobC = Math.exp(
          -(((mx - 0.46) * 1.8) ** 2 + ((my - 0.86) * 2.3) ** 2) * 2.1,
        );
        density *= 0.35 + blobA * 0.9 + blobB * 0.75 + blobC * 0.8;

        // Cursor swell — denser / brighter near pointer
        if (hasPointer) {
          const dx = dot.ox - pointerX;
          const dy = dot.oy - pointerY;
          const dist = Math.hypot(dx, dy);
          const near = Math.max(0, 1 - dist / influence);
          density += near * near * 0.95;
          // Tiny pull toward cursor (subtle, not a particle trail)
          if (!reduceMotion && near > 0) {
            dot.x = dot.ox + (dx / (dist || 1)) * -near * 2.2;
            dot.y = dot.oy + (dy / (dist || 1)) * -near * 2.2;
          } else {
            dot.x = dot.ox;
            dot.y = dot.oy;
          }
        } else {
          dot.x = dot.ox;
          dot.y = dot.oy;
        }

        density = Math.max(0, Math.min(1.35, density));
        if (density < 0.08) continue;

        const alpha = Math.min(0.72, 0.1 + density * 0.5);
        const size = r * (0.7 + density * 1.1);
        ctx!.fillStyle = `rgba(${DOT_RGB.r},${DOT_RGB.g},${DOT_RGB.b},${alpha})`;
        ctx!.beginPath();
        ctx!.arc(dot.x, dot.y, size, 0, Math.PI * 2);
        ctx!.fill();
      }

      if (!reduceMotion) {
        raf = requestAnimationFrame(frame);
      }
    }

    resize();
    // Start pointer offscreen until first move
    pointerX = width * 0.5;
    pointerY = height * 0.5;

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
      data-logo-cursor="true"
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 h-full w-full"
    />
  );
}
