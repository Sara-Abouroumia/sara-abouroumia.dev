export type Project = {
  name: string;
  /** Live site, when there is one to link. */
  url?: string;
  /** Shown as the link text. Defaults to the bare host when omitted. */
  urlLabel?: string;
  stack: string[];
  /** Only for work with no live URL, where the dates carry the context. */
  period?: string;
  bullets: string[];
  /** Screenshot in public/projects/. Falls back to no image. */
  cover?: string;
};

export const projects: Project[] = [
  {
    name: "Kayseri Social Run",
    url: "https://kayserisocialrun.com",
    urlLabel: "kayserisocialrun.com",
    stack: ["Next.js", "Postgres", "Better Auth", "Resend", "Vercel"],
    bullets: [
      "Founded and built a community running club webapp from the ground up for a local Kayseri youth-led running community, including a public marketing site, authentication, and transactional email flows",
      "Designed and shipped the full product independently: architecture, database schema, auth, and deployment",
    ],
  },
];
