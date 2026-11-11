export type InsightCover = "mesh" | "night" | "fold";

export type InsightPost = {
  slug: string;
  title: string;
  coverTitle: string;
  section: string;
  topic: string;
  author: string;
  minutes: number;
  excerpt: string;
  cover: InsightCover;
  paragraphs: string[];
};

export type InsightSection = {
  name: string;
  posts: InsightPost[];
};

const author = "Voltron Digital";

export const insightSections: InsightSection[] = [
  {
    name: "Design",
    posts: [
      {
        slug: "the-first-screen-has-to-do-the-selling",
        title: "The first screen has to do the selling",
        coverTitle: "First screen",
        section: "Design",
        topic: "Interface",
        author,
        minutes: 8,
        excerpt:
          "A homepage earns the next click in a few seconds. The first screen should name the offer, show the proof, and leave one obvious next step.",
        cover: "mesh",
        paragraphs: [
          "Most marketing sites open with a mood and a metaphor. The person who landed there still has to work out what the company does, who it is for, and what happens if they stay. That work belongs to the page, not the visitor.",
          "The first screen can carry a short name, one sentence of consequence, and a single action. Everything else — the case study, the process, the footnotes — can wait one scroll. If the opening cannot stand alone, the rest of the site is decorating a hesitation.",
        ],
      },
      {
        slug: "a-mark-that-still-reads-at-thirty-two-pixels",
        title: "A mark that still reads at thirty-two pixels",
        coverTitle: "Small marks",
        section: "Design",
        topic: "Brand",
        author,
        minutes: 5,
        excerpt:
          "A logo that only works on a pitch slide will fail in a browser tab, a footer, and a social preview. The small size is the real test.",
        cover: "night",
        paragraphs: [
          "Brand marks get designed at poster scale and then squeezed into a corner. At thirty-two pixels the fine lines disappear, the wordmark wraps, and the colour that looked rich on a dark board turns to mud on white.",
          "Draw the mark at the size it will actually ship. If the shape still reads, the colour still separates from the page, and the favicon is still recognisable, the larger versions will take care of themselves.",
        ],
      },
      {
        slug: "when-a-marketing-site-should-behave-like-a-product",
        title: "When a marketing site should behave like a product",
        coverTitle: "Product sites",
        section: "Design",
        topic: "Product",
        author,
        minutes: 6,
        excerpt:
          "Some sites are brochures. Others are the product: search, accounts, publishing, and a path that has to keep working after launch.",
        cover: "fold",
        paragraphs: [
          "A brochure can be a set of pages. A product site has state. People come back, filter, sign in, and expect the thing they saw yesterday to still be there. Treating that as a stack of landing pages is how launches stall.",
          "The shift is worth making when the site has to remember something: a catalogue, a booking, a published story, a logged-in view. Until then, a sharp set of pages will outperform a half-built application.",
        ],
      },
    ],
  },
  {
    name: "Engineering",
    posts: [
      {
        slug: "ship-the-page-before-the-platform-rewrite",
        title: "Ship the page before the platform rewrite",
        coverTitle: "Ship the page",
        section: "Engineering",
        topic: "Frontend",
        author,
        minutes: 7,
        excerpt:
          "A rewrite is a hypothesis. A published page is evidence. Put the page in front of people before rebuilding the system underneath it.",
        cover: "mesh",
        paragraphs: [
          "Teams often pause a launch because the platform is not ready. The platform is rarely what the visitor came to see. They came for a page that explains the offer and lets them act.",
          "Ship that page on the simplest stack that will hold it. Measure what people actually do. The rewrite, if it is still needed, can follow the evidence instead of the other way around.",
        ],
      },
      {
        slug: "motion-that-stays-smooth-when-the-pointer-moves",
        title: "Motion that stays smooth when the pointer moves",
        coverTitle: "Smooth motion",
        section: "Engineering",
        topic: "Motion",
        author,
        minutes: 4,
        excerpt:
          "Decorative motion should stay out of the way of reading. If the pointer makes the page hitch, the effect has already failed.",
        cover: "night",
        paragraphs: [
          "Cursor-reactive backgrounds are easy to overbuild. A canvas that recalculates the world on every move will stutter on a modest laptop, and the stutter is more memorable than the effect.",
          "Prefer a field that is already in motion and only swells near the pointer. Respect reduced-motion settings. The page should still make sense when the animation is still.",
        ],
      },
      {
        slug: "what-production-means-on-the-first-deploy",
        title: "What production means on the first deploy",
        coverTitle: "First deploy",
        section: "Engineering",
        topic: "Delivery",
        author,
        minutes: 5,
        excerpt:
          "Production is not a later phase. The first deploy should already have a real URL, a real build, and a way to roll forward without a ceremony.",
        cover: "fold",
        paragraphs: [
          "A site that only runs on one machine is a draft. The first useful version is the one a client can open on their phone, share in a meeting, and still find tomorrow.",
          "That means a hosted build, environment values set where the host expects them, and a path to ship the next change without repeating the setup. The polish can follow. The URL should not.",
        ],
      },
    ],
  },
  {
    name: "Studio",
    posts: [
      {
        slug: "notes-that-help-a-client-decide",
        title: "Notes that help a client decide what to do next",
        coverTitle: "Clear notes",
        section: "Studio",
        topic: "Writing",
        author,
        minutes: 6,
        excerpt:
          "An insight is useful when someone can finish it and know the next decision. Atmosphere is optional. The recommendation is not.",
        cover: "mesh",
        paragraphs: [
          "Long essays are easy to publish and hard to use. A client reading between meetings needs the situation, the choice, and the reason one option is safer than the other.",
          "Write the note as if the reader has to forward it. If the forwarded version still makes the decision clear, the piece is finished.",
        ],
      },
      {
        slug: "from-first-sketch-to-a-url-in-one-engagement",
        title: "From first sketch to a URL in one engagement",
        coverTitle: "One pass",
        section: "Studio",
        topic: "Process",
        author,
        minutes: 5,
        excerpt:
          "The work should end on a deployed site, not a folder of frames. One engagement can hold the sketch, the build, and the handoff.",
        cover: "night",
        paragraphs: [
          "Splitting design, build, and launch across three vendors adds weeks of translation. The sketch changes, the build simplifies it, and the launch reveals what neither side had written down.",
          "Keeping those steps in one pass does not mean skipping critique. It means the person who drew the first screen is still there when the page is live, and can change it while the reasoning is fresh.",
        ],
      },
      {
        slug: "how-to-brief-a-site-that-still-makes-sense-next-year",
        title: "How to brief a site that still makes sense next year",
        coverTitle: "Better briefs",
        section: "Studio",
        topic: "Briefs",
        author,
        minutes: 8,
        excerpt:
          "A useful brief names the decision the site has to support, the people who will use it, and what must still be true after the launch week.",
        cover: "fold",
        paragraphs: [
          "Briefs that list pages and adjectives age badly. 'Modern, premium, innovative' does not tell anyone what to cut when the schedule tightens. A decision does: who the site is for, what they need to do, and what the business needs them to understand.",
          "Add the constraints that will still exist next year. The team who will edit it. The things that must not be reinvented. A site briefed that way can be updated without starting over.",
        ],
      },
    ],
  },
];

export const allInsights: InsightPost[] = insightSections.flatMap(
  (section) => section.posts,
);

export function getInsight(slug: string): InsightPost | undefined {
  return allInsights.find((post) => post.slug === slug);
}

export const featuredInsight = allInsights[0];
