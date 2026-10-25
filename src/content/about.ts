/**
 * The intro on the home page, one string per paragraph.
 *
 * Ordered by what a reader should take away first: the research direction
 * leads, the engineering background explains where it came from, and the
 * home page shows only the first BIO_LINES lines before "… more". Keep the
 * opening sentence able to stand alone, since many visitors never expand.
 */
export const bio = [
  "I'm a thesis-track M.S. student in Computer Engineering at Istanbul Technical University, working with Prof. Dr. Abdul Halim Zaim on using AI to deal with cybersecurity threats. My thesis focuses on intrusion detection and network security, and I'm especially interested in models that can explain their decisions and hold up when someone is trying to fool them.",
  "I'm also a graduate researcher on the MRGuardAI project, where we're looking at how to catch unsafe behavior in LLM agents by watching what happens inside the JVM and .NET runtimes. Right now I'm building the agent behavior datasets for our first prototype.",
  "Before grad school I spent over two years as a full-stack and cloud engineer at Nextarp B.V., a startup based in the Netherlands. I owned systems from design to production: Spring Boot backends, React and React Native apps, CI/CD on GCP and Azure, and releases to the app stores. The project I liked most there was an agentic development pipeline with automated code review, testing, and a security gate (SAST, secrets scanning, dependency checks). It's a big part of why I moved toward security research.",
  "I'm looking for R&D, research engineer, and applied ML or security roles where I can keep researching alongside my thesis. I'm also open to software engineering roles that touch AI, security, or cloud infrastructure.",
  "Outside of work, I co-founded Kayseri Social Run, a youth running community of 300+ members, and built its web platform.",
] as const;

/**
 * Lines of `bio` shown before "… more". Four carries the thesis sentence on
 * any screen and cuts mid-paragraph, which is what makes "… more" read as a
 * continuation. Retune this whenever the bio's type size or first paragraph
 * changes: at 18px the first paragraph is exactly five lines on desktop, so a
 * clamp of five ended on a full stop and "… more" read as an afterthought.
 */
export const BIO_LINES = 4;

export type NowItem = {
  /** Which mark leads the line. See NOW_ICONS in <NowPanel />. */
  icon: "code" | "study" | "award";
  text: string;
};

/**
 * The "Now" note: what is actually true this month, in present tense.
 *
 * Separate lines rather than one sentence. Two or three icon-led items scan in
 * a glance where a paragraph has to be read, and adding a fourth thing later
 * means appending an entry instead of rewriting prose around it.
 *
 * `updated` is load-bearing, not decoration. A now note with no date is
 * indistinguishable from one nobody has touched in two years, which is exactly
 * the doubt it exists to remove, so bump it whenever the items change, and if
 * it ever drifts more than a couple of months behind, that is the signal to
 * rewrite the items rather than the date.
 *
 * ISO year-month, formatted for display by formatMonth(). The footer's "Last
 * updated" reads this same value, so there is one date to bump, not two that
 * can disagree.
 */
export const now = {
  updated: "2026-10",
  items: [
    {
      icon: "code",
      text: "Building agent behavior datasets for MRGuardAI, catching unsafe LLM agents from inside the JVM and .NET runtimes",
    },
    {
      // İTÜ with the Turkish dotted capital İ (U+0130) and Ü (U+00DC).
      icon: "study",
      text: "Writing my M.S. thesis at İTÜ on AI for intrusion detection and network security",
    },
    {
      icon: "award",
      text: "Working toward Claude Academy certification in Agentic Development",
    },
  ] satisfies NowItem[],
};
