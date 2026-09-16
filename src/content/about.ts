/** The opening paragraph on the home page. */
export const bio = `I'm a software engineer working across backend systems, web, and mobile. Right now I'm building full-stack products at Nextarp, from ERP and training-management systems to the CI/CD pipelines and security tooling that ship them. I studied Computer Engineering at Abdullah Gul University and am now pursuing an M.S. in the same field at Istanbul Technical University alongside work. Outside of that I compete in Kaggle machine learning competitions and build small products end to end.`;

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
  updated: "2026-09",
  items: [
    {
      icon: "code",
      text: "Building Agentic Development-Lifecycle (ADLC) tooling at Nextarp B.V.",
    },
    {
      // İTÜ with the Turkish dotted capital İ (U+0130) and Ü (U+00DC).
      icon: "study",
      text: "Attending M.S. (thesis) in Computer Engineering at İTÜ",
    },
    {
      icon: "award",
      text: "Working toward Claude Academy certification in Agentic Development",
    },
  ] satisfies NowItem[],
};
