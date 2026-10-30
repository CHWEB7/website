"use client";

import { useEffect, useRef } from "react";

type Dot = {
  ox: number;
  oy: number;
  phase: number;
  band: number;
  // Precomputed regional blob strength (static)
  blob: number;
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
    let spacing = 7;
    let logoMask: Uint8Array | null = null;
    let logoW = 0;
    let logoH = 0;
    // Compact mark so it reads as part of the field, not a stamp
    const LOGO_WORLD = 52;

    // Prebuilt fill styles — avoid per-dot string alloc
    const STYLES: string[] = [];
    for (let a = 0; a < 24; a++) {
      const alpha = (a / 23) * 0.88;
      STYLES.push(`rgba(196,178,224,${alpha.toFixed(3)})`);
    }
    // Soft brand tint close to field dots so the fox blends in
    const LOGO_STYLES: string[] = [];
    for (let a = 0; a < 24; a++) {
      const t = a / 23;
      const alpha = 0.14 + t * 0.42;
      const r = (186 + t * 28) | 0;
      const g = (162 + t * 18) | 0;
      const b = (214 + t * 20) | 0;
      LOGO_STYLES.push(`rgba(${r},${g},${b},${alpha.toFixed(3)})`);
    }

    // Cheap sin LUT for wave motion
    const LUT = 2048;
    const SIN = new Float32Array(LUT);
    for (let i = 0; i < LUT; i++) SIN[i] = Math.sin((i / LUT) * Math.PI * 2);
    const sinApprox = (x: number) => {
      const t = ((x / (Math.PI * 2)) % 1 + 1) % 1;
      return SIN[(t * LUT) | 0];
    };

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

      // Opaque black PNG — mask by luminance, not alpha
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
      // Cap density so continuous motion stays at ~60fps
      spacing = width < 900 ? 8 : 7;
      const next: Dot[] = [];
      const cols = Math.ceil(width / spacing) + 1;
      const rows = Math.ceil(height / spacing) + 1;
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const jx = ((col * 17 + row * 31) % 7) - 3;
          const jy = ((col * 13 + row * 23) % 7) - 3;
          const ox = col * spacing + spacing * 0.5 + jx * 0.18;
          const oy = row * spacing + spacing * 0.5 + jy * 0.18;
          const mx = ox / Math.max(width, 1);
          const my = oy / Math.max(height, 1);
          const blob =
            Math.exp(-((mx - 0.22) ** 2 * 5.5 + (my - 0.28) ** 2 * 4.5)) *
              0.72 +
            Math.exp(-((mx - 0.8) ** 2 * 6.5 + (my - 0.4) ** 2 * 5.5)) * 0.68 +
            Math.exp(-((mx - 0.52) ** 2 * 4.5 + (my - 0.78) ** 2 * 6.5)) *
              0.58;
          next.push({
            ox,
            oy,
            phase: ((col * 0.37 + row * 0.61) % 1) * Math.PI * 2,
            band: ((col / 14) | 0) + ((row / 10) | 0) * 5,
            blob,
          });
        }
      }
      dots = next;
    }

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
      time += reduceMotion ? 0 : 0.034;

      // Near-instant pointer — lag was soft ease + heavy per-frame work
      pointerX += (targetX - pointerX) * 0.92;
      pointerY += (targetY - pointerY) * 0.92;

      ctx!.clearRect(0, 0, width, height);
      if (washCanvas) ctx!.drawImage(washCanvas, 0, 0, width, height);

      const influence = Math.min(width, height) * 0.2;
      const influence2 = influence * influence;
      const halfLogo = LOGO_WORLD * 0.55;
      const logoReach2 = halfLogo * halfLogo * 4;

      const w1 = time * 1.3;
      const w2 = time * 0.95;
      const w3 = time * 1.6;
      const breathT = time * 0.4;

      for (let i = 0; i < dots.length; i++) {
        const dot = dots[i];
        const ox = dot.ox;
        const oy = dot.oy;

        const waveA = sinApprox(ox * 0.014 + w1 + dot.phase);
        const waveB = sinApprox(oy * 0.012 - w2 + dot.band * 0.35);
        const waveC = sinApprox((ox * 0.7 + oy) * 0.01 + w3);

        let density =
          0.1 +
          waveA * 0.34 +
          waveB * 0.28 +
          waveC * 0.24 +
          sinApprox(time * 0.75 + dot.band * 0.8) * 0.14;

        const breath = 0.82 + 0.18 * sinApprox(breathT + dot.band);
        density *= 0.32 + dot.blob * breath;

        let x = ox;
        let y = oy;
        if (!reduceMotion) {
          x += waveA * 3.4 + waveC * 1.1;
          y += waveB * 3.0 + waveA * 0.8;
        }

        let brand = 0;
        const dx = ox - pointerX;
        const dy = oy - pointerY;
        const d2 = dx * dx + dy * dy;

        if (hasPointer && d2 < influence2) {
          const near = 1 - Math.sqrt(d2) / influence;
          density += near * near * 0.95;
          const pull = near * 2.6;
          const inv = 1 / (Math.sqrt(d2) || 1);
          x -= dx * inv * pull;
          y -= dy * inv * pull;
        }

        if (d2 < logoReach2) {
          const lw = logoWeight(ox, oy);
          if (lw > 0.08) {
            brand = lw;
            // Mild density lift — silhouette, not a hard stamp
            density = Math.max(density, 0.28 + lw * 0.55);
          }
        }

        if (density < 0.09) continue;

        const size = 1.15 + density * 2.0;
        const alphaIdx = Math.min(23, (density * 18) | 0);

        if (brand > 0.08) {
          const bi = Math.min(23, ((0.25 + brand * 0.55) * 23) | 0);
          ctx!.fillStyle = LOGO_STYLES[bi];
          // Same scale as field dots so it dissolves into the dither
          const s = size * (0.95 + brand * 0.12);
          ctx!.fillRect(x - s * 0.5, y - s * 0.5, s, s);
        } else {
          ctx!.fillStyle = STYLES[alphaIdx];
          ctx!.fillRect(x - size * 0.5, y - size * 0.5, size, size);
        }
      }

      if (!reduceMotion) raf = requestAnimationFrame(frame);
    }

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerleave", onPointerLeave);

    if (reduceMotion) frame();
    else raf = requestAnimationFrame(frame);

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
