import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import BrandLogo from "@/components/BrandLogo";
import InsightCover from "@/components/insights/InsightCover";
import { allInsights, getInsight } from "@/lib/insights";

type InsightPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return allInsights.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: InsightPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getInsight(slug);
  if (!post) {
    return { title: "Insight — Kettu" };
  }
  return {
    title: `${post.title} — Kettu`,
    description: post.excerpt,
  };
}

export default async function InsightArticlePage({ params }: InsightPageProps) {
  const { slug } = await params;
  const post = getInsight(slug);
  if (!post) {
    notFound();
  }

  return (
    <article className="min-h-dvh bg-white text-[#202124]">
      <header className="bg-base text-ink">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 sm:px-10 lg:px-16">
          <BrandLogo />
          <Link href="/insights" className="text-sm font-semibold text-ink">
            Insights
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-10 sm:px-8 sm:py-14">
        <p className="text-sm font-medium tracking-wide text-[#5f6368]">
          {post.section}
          <span aria-hidden="true"> · </span>
          {post.topic}
        </p>
        <h1 className="mt-3 text-4xl leading-[1.08] font-semibold tracking-tight text-[#1a1826] sm:text-5xl">
          {post.title}
        </h1>
        <p className="mt-4 text-sm text-[#5f6368]">
          By {post.author}
          <span aria-hidden="true"> • </span>
          {post.minutes}-minute read
        </p>
        <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-xl">
          <InsightCover variant={post.cover} title={post.coverTitle} />
        </div>
        <p className="mt-8 text-lg leading-relaxed text-[#3c4043]">
          {post.excerpt}
        </p>
        <div className="mt-6 space-y-5 text-base leading-relaxed text-[#3c4043]">
          {post.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
        <p className="mt-10">
          <Link
            href="/insights"
            className="text-sm font-semibold text-[#1a1826] underline decoration-[#dadce0] underline-offset-4 hover:decoration-[#ab3bff]"
          >
            All insights
          </Link>
        </p>
      </div>
    </article>
  );
}
