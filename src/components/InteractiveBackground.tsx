"use client";

import { useEffect, useRef } from "react";

type Dot = {
  ox: number;
  oy: number;
  phase: number;
  band: number;
};

/**
 * GitLab-style dither field: continuous density waves, snappy cursor swell,
 * and the brand logo formed from denser dots under the pointer.
 */
export default function InteractiveBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", {
      alpha: true,
      desynchronized: true,
    });
    if (!ctx) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let raf = 0;
    let time = 0;
    let pointerX = 0;
    let pointerY = 0;
    let targetX = 0;
    let targetY = 0;
    let hasPointer = false;
    let dots: Dot[] = [];
    let spacing = 6;
    let logoMask: Uint8Array | null = null;
    let logoW = 0;
    let logoH = 0;
    // World-space size of the logo silhouette (px)
    const LOGO_WORLD = 140;

    // Prebuilt fill styles — avoid per-dot string alloc
    const STYLES: string[] = [];
    for (let a = 0; a < 32; a++) {
      const alpha = (a / 31) * 0.9;
      STYLES.push(`rgba(196,178,224,${alpha.toFixed(3)})`);
    }
    const LOGO_STYLES: string[] = [];
    for (let a = 0; a < 32; a++) {
      const t = a / 31;
      const alpha = 0.2 + t * 0.75;
      // Brand tint #AB3BFF → #FD80FF
      const r = (171 + t * 82) | 0;
      const g = (59 + t * 69) | 0;
      const b = (255 - t * 0) | 0;
      LOGO_STYLES.push(`rgba(${r},${g},${b},${alpha.toFixed(3)})`);
    }

    const logoImg = new Image();
    logoImg.decoding = "async";
    logoImg.src = "/logo.png";
    logoImg.onload = () => bakeLogoMask();

    function bakeLogoMask() {
      const srcW = logoImg.naturalWidth || 256;
      const srcH = logoImg.naturalHeight || 256;
      const scan = document.createElement("canvas");
      scan.width = srcW;
      scan.height = srcH;
      const sctx = scan.getContext("2d", { willReadFrequently: true });
      if (!sctx) return;
      sctx.drawImage(logoImg, 0, 0);
      const { data } = sctx.getImageData(0, 0, srcW, srcH);

      // PNG is opaque black behind the mark — mask by luminance, not alpha
      let minX = srcW;
      let minY = srcH;
      let maxX = 0;
      let maxY = 0;
      const raw = new Uint8Array(srcW * srcH);
      for (let y = 0; y < srcH; y++) {
        for (let x = 0; x < srcW; x++) {
          const i = (y * srcW + x) * 4;
          const bright = Math.max(data[i], data[i + 1], data[i + 2]);
          if (bright > 28 && data[i + 3] > 20) {
            raw[y * srcW + x] = bright;
            if (x < minX) minX = x;
            if (y < minY) minY = y;
            if (x > maxX) maxX = x;
            if (y > maxY) maxY = y;
          }
        }
      }
      if (maxX <= minX || maxY <= minY) return;

      // Pad crop so ears/base aren't clipped
      const pad = Math.max(4, ((maxX - minX) * 0.04) | 0);
      minX = Math.max(0, minX - pad);
      minY = Math.max(0, minY - pad);
      maxX = Math.min(srcW - 1, maxX + pad);
      maxY = Math.min(srcH - 1, maxY + pad);

      logoW = maxX - minX + 1;
      logoH = maxY - minY + 1;
      const mask = new Uint8Array(logoW * logoH);
      for (let y = 0; y < logoH; y++) {
        for (let x = 0; x < logoW; x++) {
          mask[y * logoW + x] = raw[(minY + y) * srcW + (minX + x)];
        }
      }
      logoMask = mask;
    }

    if (logoImg.complete && logoImg.naturalWidth > 0) bakeLogoMask();

    function logoWeight(wx: number, wy: number) {
      if (!logoMask || logoW === 0) return 0;
      const u = Math.floor(((wx - pointerX) / LOGO_WORLD + 0.5) * logoW);
      const v = Math.floor(((wy - pointerY) / LOGO_WORLD + 0.5) * logoH);
      if (u < 0 || v < 0 || u >= logoW || v >= logoH) return 0;
      return logoMask[v * logoW + u] / 255;
    }

    function buildDots() {
      // Keep density GitLab-fine but bounded for 60fps
      spacing = width < 700 ? 7 : 6;
      const next: Dot[] = [];
      const cols = Math.ceil(width / spacing) + 1;
      const rows = Math.ceil(height / spacing) + 1;
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          // Slight jitter so the grid feels organic, not a rigid lattice
          const jx = ((col * 17 + row * 31) % 7) - 3;
          const jy = ((col * 13 + row * 23) % 7) - 3;
          next.push({
            ox: col * spacing + spacing * 0.5 + jx * 0.15,
            oy: row * spacing + spacing * 0.5 + jy * 0.15,
            phase: ((col * 0.37 + row * 0.61) % 1) * Math.PI * 2,
            band: ((col / 14) | 0) + ((row / 10) | 0) * 5,
          });
        }
      }
      dots = next;
    }

    // Soft washes drawn once into an offscreen layer, refreshed on resize
    let washCanvas: HTMLCanvasElement | null = null;
    function bakeWashes() {
      washCanvas = document.createElement("canvas");
      washCanvas.width = Math.max(1, Math.floor(width * dpr));
      washCanvas.height = Math.max(1, Math.floor(height * dpr));
      const wctx = washCanvas.getContext("2d");
      if (!wctx) return;
      wctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const wash = wctx.createRadialGradient(
        width * 0.5,
        height * 0.42,
        0,
        width * 0.5,
        height * 0.42,
        Math.max(width, height) * 0.72,
      );
      wash.addColorStop(0, "rgba(255,255,255,0.035)");
      wash.addColorStop(0.6, "rgba(255,255,255,0)");
      wctx.fillStyle = wash;
      wctx.fillRect(0, 0, width, height);

      const g1 = wctx.createRadialGradient(
        width * 0.78,
        height * 0.26,
        0,
        width * 0.78,
        height * 0.26,
        Math.max(width, height) * 0.34,
      );
      g1.addColorStop(0, "rgba(171,59,255,0.14)");
      g1.addColorStop(1, "rgba(171,59,255,0)");
      wctx.fillStyle = g1;
      wctx.fillRect(0, 0, width, height);

      const g2 = wctx.createRadialGradient(
        width * 0.2,
        height * 0.74,
        0,
        width * 0.2,
        height * 0.74,
        Math.max(width, height) * 0.3,
      );
      g2.addColorStop(0, "rgba(253,128,255,0.1)");
      g2.addColorStop(1, "rgba(253,128,255,0)");
      wctx.fillStyle = g2;
      wctx.fillRect(0, 0, width, height);

      wctx.strokeStyle = "rgba(255,255,255,0.05)";
      wctx.lineWidth = 1;
      for (let i = 1; i < 3; i++) {
        const x = (width / 3) * i;
        wctx.beginPath();
        wctx.moveTo(x, 0);
        wctx.lineTo(x, height);
        wctx.stroke();
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
      buildDots();
      bakeWashes();
      if (!hasPointer) {
        pointerX = width * 0.68;
        pointerY = height * 0.48;
        targetX = pointerX;
        targetY = pointerY;
      }
    }

    function onPointerMove(e: PointerEvent) {
      if (e.pointerType === "touch") return;
      hasPointer = true;
      targetX = e.clientX;
      targetY = e.clientY;
    }

    function onPointerLeave() {
      hasPointer = false;
    }

    function frame() {
      // Continuous wave clock — denser clouds drift and pulse like GitLab
      time += reduceMotion ? 0 : 0.032;

      // Near-instant pointer follow (lag was from soft ease + heavy draws)
      pointerX += (targetX - pointerX) * 0.88;
      pointerY += (targetY - pointerY) * 0.88;

      ctx!.clearRect(0, 0, width, height);
      if (washCanvas) {
        ctx!.drawImage(washCanvas, 0, 0, width, height);
      }

      const influence = Math.min(width, height) * 0.2;
      const influence2 = influence * influence;
      const halfLogo = LOGO_WORLD * 0.55;
      const logoReach2 = halfLogo * halfLogo * 4;

      // Traveling density fronts
      const w1 = time * 1.25;
      const w2 = time * 0.92;
      const w3 = time * 1.55;
      const w4 = time * 0.48;

      // Show logo silhouette even at rest (GitLab watermark feel),
      // snapped to pointer when the mouse is over the stage.
      const showLogo = true;

      for (let i = 0; i < dots.length; i++) {
        const dot = dots[i];
        const ox = dot.ox;
        const oy = dot.oy;

        // Multi-axis density waves — this is the “living field” motion
        const waveA = Math.sin(ox * 0.014 + w1 + dot.phase);
        const waveB = Math.sin(oy * 0.012 - w2 + dot.band * 0.35);
        const waveC = Math.sin((ox * 0.7 + oy) * 0.01 + w3);
        const waveD = Math.sin(ox * 0.008 - oy * 0.009 + w4 + dot.phase);

        let density =
          0.12 +
          waveA * 0.32 +
          waveB * 0.26 +
          waveC * 0.22 +
          waveD * 0.16 +
          Math.sin(time * 0.7 + dot.band * 0.8) * 0.14;

        // Regional cloud blobs that slowly breathe
        const mx = ox / width;
        const my = oy / height;
        const breath = 0.85 + 0.15 * Math.sin(time * 0.35 + dot.band);
        const blob =
          (Math.exp(-((mx - 0.22) ** 2 * 5.5 + (my - 0.28) ** 2 * 4.5)) *
            0.7 +
            Math.exp(-((mx - 0.8) ** 2 * 6.5 + (my - 0.4) ** 2 * 5.5)) *
              0.65 +
            Math.exp(-((mx - 0.52) ** 2 * 4.5 + (my - 0.78) ** 2 * 6.5)) *
              0.55) *
          breath;
        density *= 0.35 + blob;

        // Subtle physical drift so the field feels unbound from the grid
        let x = ox;
        let y = oy;
        if (!reduceMotion) {
          x += waveA * 3.2 + waveD * 1.4;
          y += waveB * 2.8 + waveC * 1.2;
        }

        let brand = 0;
        if (showLogo) {
          const dx = ox - pointerX;
          const dy = oy - pointerY;
          const d2 = dx * dx + dy * dy;

          if (hasPointer && d2 < influence2) {
            const near = 1 - Math.sqrt(d2) / influence;
            density += near * near * 0.95;
            const pull = near * 2.8;
            const inv = 1 / (Math.sqrt(d2) || 1);
            x -= dx * inv * pull;
            y -= dy * inv * pull;
          }

          if (d2 < logoReach2) {
            const lw = logoWeight(ox, oy);
            if (lw > 0.04) {
              brand = lw;
              // Hard silhouette: logo dots always render brightly
              density = Math.max(density, 0.55 + lw * 1.4);
            }
          }
        }

        if (density < 0.08) continue;

        const size = Math.max(1.15, 1.15 + density * 2.1);
        const alphaIdx = Math.min(31, (density * 22) | 0);

        if (brand > 0.05) {
          const bi = Math.min(31, ((0.35 + brand * 0.65) * 31) | 0);
          ctx!.fillStyle = LOGO_STYLES[bi];
          // Slightly larger mark dots so the silhouette reads
          const s = size * (1.05 + brand * 0.35);
          ctx!.fillRect(x - s * 0.5, y - s * 0.5, s, s);
        } else {
          ctx!.fillStyle = STYLES[alphaIdx];
          ctx!.fillRect(x - size * 0.5, y - size * 0.5, size, size);
        }
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
      data-logo-cursor="true"
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 h-full w-full"
    />
  );
}
