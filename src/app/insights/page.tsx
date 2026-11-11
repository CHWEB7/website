import type { Metadata } from "next";
import InsightCategories from "@/components/insights/InsightCategories";
import InsightsClose from "@/components/insights/InsightsClose";
import InsightsHero from "@/components/insights/InsightsHero";
import { featuredInsight, insightSections } from "@/lib/insights";

export const metadata: Metadata = {
  title: "Insights — Kettu",
  description:
    "Notes on designing, building, and shipping web products, grouped by design, engineering, and studio practice.",
};

export default function InsightsPage() {
  return (
    <>
      <InsightsHero featured={featuredInsight} />
      <InsightCategories sections={insightSections} />
      <InsightsClose />
    </>
  );
}
