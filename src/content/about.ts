/**
 * The intro on the home page, one string per paragraph.
 *
 * Ordered by what a reader should take away first: the research direction
 * leads, the engineering background explains where it came from, and the
 * home page shows only the first BIO_LINES lines before "… more". Keep the
 * opening sentence able to stand alone, since many visitors never expand.
 *
 * Voice: first person, as a personal site should be (third person on your
 * own homepage reads as a press release). But the WORK is the grammatical
 * subject wherever it can be, and no two paragraphs open the same way. A run
 * of sentences starting "I'm…" is what makes a bio sound self-focused, far
 * more than the number of times "I" appears.
 */
export const bio = [
  "I'm a thesis-track M.S. student in Computer Engineering at Istanbul Technical University, working with Prof. Dr. Abdul Halim Zaim on AI for cybersecurity. My thesis focuses on intrusion detection and network security, and in particular on models that can explain their decisions and hold up when someone is trying to fool them.",
  // Describes the work, not a title: the MRGuardAI position is not confirmed
  // yet (its Experience entry is parked in experience.ts). "Scoping phase" is
  // the standard term for a project still defining its question, so this
  // stays true whichever way the position goes. Said once: "early-stage",
  // "initial stages" and "scoping" all name the same thing.
  "Alongside the thesis, I'm exploring MRGuardAI, an İTÜ research project on detecting unsafe behavior in LLM agents by monitoring what happens inside the JVM and .NET runtimes. The project is in its scoping phase: reviewing the literature on agent security and shaping the research plan.",
  "Before grad school, I spent over two years as a full-stack and cloud engineer at Nextarp B.V., a startup based in the Netherlands, owning systems from design to production: Spring Boot backends, React and React Native apps, CI/CD on GCP and Azure, and releases to the app stores. The highlight was an agentic development pipeline with automated code review, testing, and a security gate (SAST, secrets scanning, dependency checks), and it's a big part of what drew me to security research.",
  // An invitation, not a search: "welcome" says the door is open without
  // saying anyone is waiting at it. Collaborations lead; roles are implied by
  // "R&D work" and "security engineering", so it stays true whether or not
  // offers are already on the table.
  "Research collaborations and R&D work where AI meets security are always welcome, from joint papers to applied ML and security engineering. If your work touches any of that, I'd be glad to talk.",
  "Outside of work, I co-founded Kayseri Social Run, a youth running community of 300+ members, and built its web platform.",
] as const;

/**
 * Lines of `bio` shown before "… more". Four carries the thesis sentence on
 * any screen. If the cut ever lands on a paragraph's last line, <ClampMore />
 * shows one more on its own, so this does not need retuning when the copy or
 * the type size changes.
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
      // Matches the bio: the project is in scoping, so the line names that
      // stage rather than prototype work that has not started.
      text: "Scoping MRGuardAI, an early-stage İTÜ project on runtime security for LLM agents",
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
