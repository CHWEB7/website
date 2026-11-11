"use client";

import Link from "next/link";
import BrandLogo from "./BrandLogo";
import InteractiveBackground from "./InteractiveBackground";

export default function Hero() {
  return (
    <section className="hero-stage relative isolate flex min-h-dvh flex-col overflow-hidden bg-base text-ink">
      <InteractiveBackground />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(26,24,38,0.28)_50%,rgba(26,24,38,0.88)_100%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-base to-transparent"
      />

      <header className="relative z-10 flex items-center justify-between px-5 pt-5 sm:px-8 sm:pt-7">
        <BrandLogo priority />
        <Link
          href="/insights"
          className="text-sm font-semibold text-ink-muted transition hover:text-ink"
        >
          Insights
        </Link>
      </header>

      <main className="relative z-10 flex flex-1 flex-col justify-center px-5 pb-20 pt-10 sm:px-8 sm:pb-24 lg:px-16">
        <div className="hero-enter max-w-3xl">
          <h1 className="font-display text-[clamp(2.75rem,7.5vw,5.5rem)] font-semibold leading-[0.98] tracking-[-0.035em]">
            <span className="text-gradient">GRSC</span>
          </h1>

          <p className="mt-5 max-w-2xl font-display text-[clamp(1.25rem,2.6vw,1.85rem)] font-medium leading-snug tracking-[-0.02em] text-ink">
            Governance, Risk, Security & compliance professional
          </p>

          <p className="mt-5 max-w-xl text-base leading-relaxed text-ink-muted sm:text-lg">
            I design and ship marketing sites, applications, and media systems
            for brands that need to look sharp and move fast — from first sketch
            to production deploy.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-4">
            <a
              href="https://media-livid-pi.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
            >
              Get in touch
            </a>
            <a
              href="https://github.com/CHWEB7"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-ghost"
            >
              View work
            </a>
          </div>
        </div>
      </main>
    </section>
  );
}
