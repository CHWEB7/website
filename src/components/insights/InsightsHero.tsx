import Image from "next/image";
import Link from "next/link";
import type { InsightPost } from "@/lib/insights";

const contactHref = "https://media-livid-pi.vercel.app";

type InsightsHeroProps = {
  featured: InsightPost;
};

export default function InsightsHero({ featured }: InsightsHeroProps) {
  return (
    <section className="relative overflow-hidden bg-base text-ink">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-80"
        style={{
          backgroundImage:
            "radial-gradient(ellipse at 12% 0%, rgba(171,59,255,0.28), transparent 46%), radial-gradient(ellipse at 88% 100%, rgba(253,128,255,0.16), transparent 42%)",
        }}
      />
      <div className="relative mx-auto max-w-7xl px-6 pt-5 pb-14 sm:px-10 sm:pt-6 sm:pb-16 lg:px-16 lg:pt-7 lg:pb-20">
        <header className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center"
            aria-label="Voltron Digital home"
          >
            <Image
              src="/logo.png"
              alt=""
              width={44}
              height={44}
              priority
              className="h-10 w-10 object-contain sm:h-11 sm:w-11"
            />
          </Link>
          <Link
            href="/insights"
            aria-current="page"
            className="text-sm font-semibold text-ink"
          >
            Insights
          </Link>
        </header>

        <nav aria-label="Breadcrumb" className="mt-8 mb-8 text-sm sm:mt-10 sm:mb-10">
          <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <li className="flex items-center gap-x-2">
              <Link
                href="/"
                className="text-ink transition hover:text-white"
              >
                Home
              </Link>
            </li>
            <li className="flex items-center gap-x-2">
              <span aria-hidden="true" className="text-ink-muted">
                ›
              </span>
              <span aria-current="page" className="text-ink-muted">
                Insights
              </span>
            </li>
          </ol>
        </nav>

        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,0.85fr)] lg:gap-12 xl:grid-cols-[minmax(0,1.45fr)_minmax(0,0.8fr)] xl:gap-14">
          <div className="max-w-2xl xl:max-w-3xl">
            <h1 className="text-5xl leading-[1.05] font-semibold tracking-tight text-balance text-ink sm:text-6xl lg:text-7xl">
              Insights
            </h1>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink-muted sm:text-xl">
              Notes on designing, building, and shipping web products — written
              for people who have to decide what to make next.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4 sm:gap-5">
              <a
                href={contactHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex rounded-lg bg-[#f4f0ff] px-5 py-3 text-sm font-semibold text-[#1a1826] transition hover:bg-white"
              >
                Get in touch
              </a>
              <a
                href="#categories"
                className="group inline-flex items-center gap-1 text-sm font-semibold text-ink transition hover:text-white"
              >
                Browse categories
                <span
                  aria-hidden="true"
                  className="transition group-hover:translate-x-0.5"
                >
                  ›
                </span>
              </a>
            </div>
          </div>

          <Link
            href={`/insights/${featured.slug}`}
            className="group relative isolate mx-auto flex min-h-64 w-full max-w-md overflow-hidden rounded-tl-2xl rounded-tr-2xl rounded-bl-2xl rounded-br-[3rem] text-white shadow-[0_18px_50px_rgba(0,0,0,0.28)] motion-safe:transition motion-safe:duration-300 motion-safe:hover:-translate-y-1.5 motion-safe:hover:scale-[1.015] sm:min-h-72 lg:mx-0 lg:ml-auto lg:min-h-80 lg:max-w-[26rem] xl:max-w-[28rem]"
            style={{
              backgroundImage:
                "linear-gradient(145deg, #241833 0%, #6a2ad4 48%, #fd80ff 100%)",
            }}
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 opacity-40 mix-blend-soft-light"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 18% 20%, rgba(255,255,255,0.45), transparent 42%), radial-gradient(circle at 80% 75%, rgba(253,128,255,0.45), transparent 40%)",
              }}
            />
            <div className="relative z-10 flex w-full flex-col justify-start p-7 sm:p-8 lg:p-9">
              <p className="text-sm font-medium tracking-wide text-white/70">
                Voltron View
              </p>
              <h2 className="mt-3 max-w-[12ch] text-3xl leading-[1.08] font-semibold tracking-tight text-white sm:text-4xl lg:text-[2.75rem]">
                Built with intent
              </h2>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}
