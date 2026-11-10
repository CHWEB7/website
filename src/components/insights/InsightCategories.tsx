import Link from "next/link";
import InsightCover from "@/components/insights/InsightCover";
import type { InsightSection } from "@/lib/insights";

type InsightCategoriesProps = {
  sections: InsightSection[];
};

export default function InsightCategories({ sections }: InsightCategoriesProps) {
  return (
    <section id="categories" className="scroll-mt-6 bg-white text-[#202124]">
      <div className="mx-auto max-w-7xl px-6 pt-12 pb-16 sm:px-10 sm:pt-14 lg:px-16 lg:pt-16 lg:pb-24">
        {sections.map((section, index) => (
          <div
            key={section.name}
            className={
              index === 0
                ? undefined
                : "mt-14 border-t border-[#e8eaed] pt-12 sm:mt-16 sm:pt-14"
            }
          >
            <h2 className="text-[1.75rem] leading-tight font-normal tracking-[-0.02em] text-[#202124] sm:text-[2rem]">
              {section.name}
            </h2>
            <div className="mt-8 grid gap-x-8 gap-y-12 sm:mt-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-10">
              {section.posts.map((post) => (
                <Link
                  key={post.slug}
                  href={`/insights/${post.slug}`}
                  className="group flex flex-col text-center focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#ab3bff]"
                >
                  <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl bg-[#eef3f8]">
                    <div className="h-full w-full motion-safe:transition motion-safe:duration-500 motion-safe:group-hover:scale-[1.03]">
                      <InsightCover
                        variant={post.cover}
                        title={post.coverTitle}
                      />
                    </div>
                  </div>
                  <span className="mx-auto mt-4 inline-flex rounded-full border border-[#dadce0] bg-white px-2.5 py-0.5 text-xs leading-5 text-[#3c4043]">
                    {post.topic}
                  </span>
                  <h3 className="mt-3 text-[1.05rem] leading-snug font-normal tracking-[-0.011em] text-[#202124] transition-colors group-hover:text-[#ab3bff]">
                    {post.title}
                  </h3>
                  <p className="mt-2 text-[13px] leading-5 text-[#5f6368]">
                    By {post.author}
                    <span aria-hidden="true"> • </span>
                    <span className="sr-only">, </span>
                    {post.minutes}-minute read
                  </p>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
