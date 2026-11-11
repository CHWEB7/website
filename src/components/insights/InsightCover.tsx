import { useId } from "react";
import Image from "next/image";
import type { InsightCover as InsightCoverVariant } from "@/lib/insights";

type InsightCoverProps = {
  variant: InsightCoverVariant;
  title: string;
};

function waveDots(
  key: string,
  yBase: number,
  amplitude: number,
  phase: number,
  color: string,
  opacity: number,
) {
  return Array.from({ length: 72 }, (_, index) => {
    const t = index / 11;
    const x = -16 + index * 10;
    const y =
      yBase +
      Math.sin(t + phase) * amplitude +
      Math.sin(t * 0.42 + phase * 1.4) * amplitude * 0.38;
    const radius = index % 8 === 0 ? 2.6 : 1.25;
    return (
      <circle
        key={`${key}-${index}`}
        cx={x}
        cy={y}
        r={radius}
        fill={color}
        opacity={opacity}
      />
    );
  });
}

function MeshField({ id }: { id: string }) {
  return (
    <svg
      viewBox="0 0 680 380"
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 h-full w-full"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`${id}-wash`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f4f8fc" />
          <stop offset="55%" stopColor="#e7f1fb" />
          <stop offset="100%" stopColor="#d5e6f6" />
        </linearGradient>
      </defs>
      <rect width="680" height="380" fill={`url(#${id}-wash)`} />
      <ellipse cx="520" cy="40" rx="220" ry="120" fill="#ffffff" opacity="0.55" />
      <ellipse cx="80" cy="340" rx="180" ry="90" fill="#c5ddf3" opacity="0.45" />
      {waveDots("a", 150, 28, 0.4, "#8eb7de", 0.85)}
      {waveDots("b", 188, 36, 1.3, "#f7fbff", 0.95)}
      {waveDots("c", 230, 24, 2.1, "#6aa4d6", 0.55)}
      {waveDots("d", 268, 32, 0.2, "#d7e8f7", 0.8)}
    </svg>
  );
}

function FoldField({ id }: { id: string }) {
  return (
    <svg
      viewBox="0 0 680 380"
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 h-full w-full"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`${id}-wash`} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#f7f4fb" />
          <stop offset="100%" stopColor="#e4eef8" />
        </linearGradient>
      </defs>
      <rect width="680" height="380" fill={`url(#${id}-wash)`} />
      <path
        d="M-20 250 C 120 120, 220 300, 360 170 S 560 60, 720 210"
        fill="none"
        stroke="#ffffff"
        strokeWidth="46"
        opacity="0.7"
      />
      <ellipse cx="140" cy="60" rx="160" ry="80" fill="#efe4fb" opacity="0.9" />
      {waveDots("e", 140, 22, 0.8, "#b9cbe4", 0.7)}
      {waveDots("f", 196, 34, 1.8, "#ffffff", 0.9)}
      {waveDots("g", 246, 26, 0.3, "#9eb6d8", 0.5)}
    </svg>
  );
}

function NightField() {
  return (
    <svg
      viewBox="0 0 680 380"
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 h-full w-full"
      aria-hidden="true"
    >
      <rect width="680" height="380" fill="#14171d" />
      <path
        d="M250 290 C 340 110, 430 330, 530 150 S 660 30, 790 190"
        fill="none"
        stroke="#3d7dff"
        strokeWidth="22"
        strokeLinecap="round"
      />
      <path
        d="M280 340 C 390 170, 470 360, 580 200 S 700 70, 820 230"
        fill="none"
        stroke="#f0b429"
        strokeWidth="16"
        strokeLinecap="round"
      />
      <path
        d="M340 70 C 450 150, 540 40, 680 130"
        fill="none"
        stroke="#2ec4b6"
        strokeWidth="10"
        strokeLinecap="round"
        opacity="0.9"
      />
      <polygon points="500,148 546,172 546,230 500,206" fill="#2f6fe8" />
      <polygon points="546,172 592,148 592,206 546,230" fill="#f2c14e" />
      <polygon points="500,206 546,230 592,206 546,182" fill="#17356f" />
    </svg>
  );
}

export default function InsightCover({ variant, title }: InsightCoverProps) {
  const titleClass = variant === "night" ? "text-white" : "text-[#1c1c1c]";
  const fieldId = useId().replace(/:/g, "");

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#eef3f8]">
      {variant === "mesh" ? <MeshField id={fieldId} /> : null}
      {variant === "fold" ? <FoldField id={fieldId} /> : null}
      {variant === "night" ? <NightField /> : null}
      {variant === "night" ? (
        <div
          aria-hidden="true"
          className="absolute inset-y-0 left-0 w-[62%] bg-gradient-to-r from-[#14171d] via-[#14171d]/88 to-transparent"
        />
      ) : null}
      <Image
        src="/logo-mark.png"
        alt=""
        width={36}
        height={36}
        className="absolute top-3.5 left-3.5 h-7 w-7 object-contain sm:top-4 sm:left-4 sm:h-8 sm:w-8"
      />
      <div className="absolute inset-0 flex items-center px-5 sm:px-6">
        <p
          className={`max-w-[8.5ch] text-[1.65rem] leading-[1.02] font-medium tracking-[-0.03em] sm:text-[1.9rem] ${titleClass}`}
        >
          {title}
        </p>
      </div>
    </div>
  );
}
