const contactHref = "https://media-livid-pi.vercel.app";

export default function InsightsClose() {
  return (
    <section className="bg-base text-ink">
      <div className="relative overflow-hidden px-6 py-16 sm:py-20 lg:py-24">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(145deg, #1a1826 0%, #3a2260 52%, #fd80ff 140%)",
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.12),transparent_50%)]"
        />
        <div className="relative mx-auto max-w-3xl text-center">
          <h2 className="text-4xl leading-[1.08] font-semibold tracking-tight text-balance text-white sm:text-5xl lg:text-6xl">
            Ready to build the next one?
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-white/75 sm:text-xl">
            Tell me about the site, product, or media system in front of you.
            We will start from the decision, not a generic pitch.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4 sm:gap-5">
            <a
              href={contactHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex rounded-full border border-white/70 px-6 py-3.5 text-sm font-semibold text-white transition hover:border-white hover:bg-white/10"
            >
              Get in touch
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
