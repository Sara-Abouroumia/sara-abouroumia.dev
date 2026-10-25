export type Project = {
  name: string;
  /** Where it was done: a challenge, a course, a capstone. */
  context?: string;
  /** Live site, when there is one to link. */
  url?: string;
  /** Shown as the link text. Defaults to the bare host when omitted. */
  urlLabel?: string;
  /** Only what the work actually used; left out rather than padded. */
  stack?: string[];
  /** When it happened, for work whose dates carry the context. */
  period?: string;
  bullets: string[];
  /** Screenshot in public/projects/. Falls back to no image. */
  cover?: string;
};

/**
 * Newest first, following the CV's "Selected projects", with the one live
 * product (Kayseri Social Run) kept as its own entry.
 */
export const projects: Project[] = [
  {
    name: "Explainable AI for Network Intrusion Detection",
    context: "İTÜ Computer Networks course, paired paper project",
    period: "Fall 2026 · in progress",
    bullets: [
      "Studying explainability methods for traffic classification and intrusion detection models",
    ],
  },
  {
    name: "Security Gates for AI-Written Code",
    context: "micro1 Frontier Engineering Challenge",
    period: "Aug. 2026",
    bullets: [
      "Built a repository-onboarding agent and merge gates that check AI-generated code for security flaws, malicious content, insecure dependencies and regressions, ending in a sign-off report for a human reviewer",
      "Evaluated on Python and TypeScript test repositories",
    ],
  },
  {
    name: "Kayseri Social Run",
    url: "https://kayserisocialrun.com",
    urlLabel: "kayserisocialrun.com",
    stack: ["Next.js", "Postgres", "Better Auth", "Resend", "Vercel"],
    bullets: [
      "Co-founded a youth running community of more than 300 members in Kayseri, and built its web platform from the ground up: a public site, member authentication, and transactional email flows",
      "Designed and shipped the full product independently: architecture, database schema, auth, and deployment",
    ],
  },
  {
    name: "Medical Image Classification with CNNs",
    context: "AGÜ capstone project",
    stack: ["CNNs", "Transfer learning", "TPU"],
    period: "2023",
    bullets: [
      "Classified diabetic foot ulcer images with CNN transfer learning, trained using TPU acceleration",
    ],
  },
];
