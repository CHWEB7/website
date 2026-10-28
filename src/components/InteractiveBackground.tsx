"use client";

import { useEffect, useRef } from "react";

type Node = {
  x: number;
  y: number;
  ox: number;
  oy: number;
  vx: number;
  vy: number;
  r: number;
};

/**
 * GitLab-inspired interactive field: soft gradient orbs + a geometric
 * node mesh that drifts toward the cursor with eased parallax.
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
    let nodes: Node[] = [];
    let raf = 0;
    let pointerX = 0.5;
    let pointerY = 0.5;
    let targetX = 0.5;
    let targetY = 0.5;
    let time = 0;

    const ACCENT_A = { r: 171, g: 59, b: 255 };
    const ACCENT_B = { r: 253, g: 128, b: 255 };

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas!.width = Math.floor(width * dpr);
      canvas!.height = Math.floor(height * dpr);
      canvas!.style.width = `${width}px`;
      canvas!.style.height = `${height}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildNodes();
    }

    function buildNodes() {
      const spacing = Math.max(48, Math.min(72, Math.floor(width / 20)));
      const cols = Math.ceil(width / spacing) + 1;
      const rows = Math.ceil(height / spacing) + 1;
      const next: Node[] = [];
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const jitterX = (Math.random() - 0.5) * spacing * 0.4;
          const jitterY = (Math.random() - 0.5) * spacing * 0.4;
          const x = col * spacing + jitterX;
          const y = row * spacing + jitterY;
          next.push({
            x,
            y,
            ox: x,
            oy: y,
            vx: 0,
            vy: 0,
            r: 1.4 + Math.random() * 1.8,
          });
        }
      }
      nodes = next;
    }

    function onPointerMove(e: PointerEvent) {
      targetX = e.clientX / Math.max(width, 1);
      targetY = e.clientY / Math.max(height, 1);
    }

    function onPointerLeave() {
      targetX = 0.5;
      targetY = 0.5;
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
        0.4,
        `rgba(${color.r},${color.g},${color.b},${alpha * 0.4})`,
      );
      gradient.addColorStop(1, `rgba(${color.r},${color.g},${color.b},0)`);
      ctx!.fillStyle = gradient;
      ctx!.beginPath();
      ctx!.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx!.fill();
    }

    function frame() {
      time += 0.01;
      pointerX += (targetX - pointerX) * 0.1;
      pointerY += (targetY - pointerY) * 0.1;

      ctx!.clearRect(0, 0, width, height);

      const px = pointerX * width;
      const py = pointerY * height;
      const parallaxX = (pointerX - 0.5) * 120;
      const parallaxY = (pointerY - 0.5) * 90;

      // Ambient orbs — clearly shift with the cursor
      drawOrb(
        width * 0.72 + parallaxX * 0.85,
        height * 0.26 + parallaxY * 0.85,
        Math.max(width, height) * 0.46,
        ACCENT_A,
        0.28,
      );
      drawOrb(
        width * 0.2 + parallaxX * 1.35,
        height * 0.7 + parallaxY * 1.35,
        Math.max(width, height) * 0.4,
        ACCENT_B,
        0.24,
      );

      // Cursor spotlight — strongest interactive cue
      drawOrb(px, py, Math.min(width, height) * 0.34, ACCENT_B, 0.32);
      drawOrb(px, py, Math.min(width, height) * 0.16, ACCENT_A, 0.4);

      const influence = Math.min(width, height) * 0.42;
      const linkDist = Math.min(width, height) * 0.13;

      for (const node of nodes) {
        const dx = px - node.ox;
        const dy = py - node.oy;
        const dist = Math.hypot(dx, dy) || 1;
        const force = Math.max(0, 1 - dist / influence);
        const pull = force * force * 56;
        const tx =
          node.ox +
          (dx / dist) * pull +
          Math.sin(time + node.ox * 0.012) * 2.2;
        const ty =
          node.oy +
          (dy / dist) * pull +
          Math.cos(time + node.oy * 0.012) * 2.2;
        node.vx += (tx - node.x) * 0.12;
        node.vy += (ty - node.y) * 0.12;
        node.vx *= 0.78;
        node.vy *= 0.78;
        node.x += node.vx;
        node.y += node.vy;
      }

      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.hypot(dx, dy);
          if (dist > linkDist) continue;
          const midDist = Math.hypot((a.x + b.x) / 2 - px, (a.y + b.y) / 2 - py);
          const near = Math.max(0, 1 - midDist / (influence * 1.15));
          const alpha = (1 - dist / linkDist) * (0.12 + near * 0.55);
          const t = (a.x + b.x) / (2 * width);
          const r = Math.round(ACCENT_A.r + (ACCENT_B.r - ACCENT_A.r) * t);
          const g = Math.round(ACCENT_A.g + (ACCENT_B.g - ACCENT_A.g) * t);
          const bl = Math.round(ACCENT_A.b + (ACCENT_B.b - ACCENT_A.b) * t);
          ctx!.strokeStyle = `rgba(${r},${g},${bl},${alpha})`;
          ctx!.lineWidth = 1 + near * 0.8;
          ctx!.beginPath();
          ctx!.moveTo(a.x, a.y);
          ctx!.lineTo(b.x, b.y);
          ctx!.stroke();
        }
      }

      for (const node of nodes) {
        const dist = Math.hypot(node.x - px, node.y - py);
        const near = Math.max(0, 1 - dist / influence);
        const t = node.x / width;
        const r = Math.round(ACCENT_A.r + (ACCENT_B.r - ACCENT_A.r) * t);
        const g = Math.round(ACCENT_A.g + (ACCENT_B.g - ACCENT_A.g) * t);
        const bl = Math.round(ACCENT_A.b + (ACCENT_B.b - ACCENT_A.b) * t);
        const alpha = 0.3 + near * 0.7;
        ctx!.fillStyle = `rgba(${r},${g},${bl},${alpha})`;
        ctx!.beginPath();
        ctx!.arc(node.x, node.y, node.r + near * 3.2, 0, Math.PI * 2);
        ctx!.fill();
      }

      if (!reduceMotion) {
        raf = requestAnimationFrame(frame);
      }
    }

    resize();
    pointerX = 0.55;
    pointerY = 0.4;
    targetX = 0.55;
    targetY = 0.4;

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
