export type Position = {
  title: string;
  /** "Full-time", "Part-time", "Internship". Omitted when it adds nothing. */
  employmentType?: string;
  start: string;
  end: string;
  /** Only when it differs from the company's own location. */
  location?: string;
  bullets: string[];
};

/**
 * Grouped by employer rather than by role, so a company someone held several
 * positions at renders once with its tenure nested underneath, the shape
 * LinkedIn uses, and the only way a promotion or a transition from intern to
 * staff reads as continuity instead of two unrelated jobs.
 */
export type Company = {
  org: string;
  /** Square logo in public/logos/. Falls back to a monogram when unset. */
  logo?: string;
  location?: string;
  positions: Position[];
};

export type Service = {
  title: string;
  org: string;
  /** The org's own site, when it has one worth sending people to. */
  orgHref?: string;
  /**
   * `start` alone is a one-off, and renders as a single date. Both make a
   * range. Neither renders no date line at all.
   */
  start?: string;
  end?: string;
  summary: string;
};

/**
 * Research and professional experience in one timeline, in the CV's order.
 * Bullet text follows the CV (public/Sara_Abouroumia_Resume.pdf), which is
 * the source of truth.
 */
export const companies: Company[] = [
  /*
   * PARKED until the MRGuardAI position is confirmed. To restore, delete this
   * comment's opening and closing lines; the entry is complete and leads the
   * timeline, since it is the current role. It also becomes the "current
   * employer" again for the header and the JSON-LD (both read end: "Present"),
   * and <CurrentAffiliations /> already shows İTÜ once, not twice, when the
   * job and the degree are at the same place.
  {
    org: "Istanbul Technical University",
    logo: "/logos/itu.png",
    location: "İstanbul, Türkiye",
    positions: [
      {
        title: "Graduate Researcher, MRGuardAI project",
        employmentType: "Research",
        start: "Oct. 2026",
        end: "Present",
        bullets: [
          "Researching managed-runtime security for LLM agents with Doç. Dr. Mehmet Ali Ertürk: detecting unsafe agent behavior by instrumenting the JVM and .NET runtimes",
          "Reviewed recent work on agent security, from tool-call guards to kernel-level monitors (eBPF), and narrowed the project's novelty to the managed-runtime layer between them",
          "Drafted the 12-month research plan, with reference stacks on Spring AI (JDK 25) and Microsoft Agent Framework (.NET 10), targeting venues including IEEE ICC 2027 workshops and IEEE PIMRC 2027",
          "Preparing agent behavior datasets for the first milestone, a JVM-based detection prototype",
        ],
      },
    ],
  },
  */
  {
    org: "Nextarp B.V.",
    logo: "/logos/nextarp.png",
    location: "Netherlands · Remote",
    positions: [
      {
        title: "Full Stack Software Engineer (Cloud & DevOps)",
        employmentType: "Full-time",
        start: "Jul. 2024",
        end: "Oct. 2026",
        bullets: [
          "Architected, deployed and maintained full-stack web and mobile applications (Spring Boot, React, React Native) serving production traffic for training management and ERP systems, owning each system from design to production",
          "Built an agentic development lifecycle (ADLC) system of automated bots that handle code review, testing and a multi-stage security gate covering static analysis (SAST), secrets scanning and dependency vulnerability checks (SCA), authenticating to GCP without stored keys through Workload Identity Federation",
          "Engineered Spring Boot backend services and RESTful APIs integrating MySQL, Redis caching and Stripe payments, using efficient data access patterns for low latency under real load",
          "Set up CI/CD pipelines with Docker and GitHub Actions for zero-downtime deployments to GCP and Azure, and managed releases through Microsoft Partner Center, Google Play and the App Store",
          "Extended ERPNext/Frappe with custom modules and REST integrations, and developed Microsoft Word add-ins on .NET, onboarding quickly onto an unfamiliar stack",
        ],
      },
    ],
  },
  {
    org: "Outlier",
    logo: "/logos/outlier.png",
    location: "Remote",
    positions: [
      {
        title: "AI Model Evaluator",
        employmentType: "Freelance",
        // Year only, as on the CV. The timeline renders a matching start and
        // end as one date rather than "2025 – 2025".
        start: "2025",
        end: "2025",
        bullets: [
          "Evaluated and wrote training data for large language models, including function-calling and code reasoning tasks; designed an original competitive programming problem for an evaluation assessment",
        ],
      },
    ],
  },
  {
    org: "Mazaka Yazilim",
    logo: "/logos/mazaka.png",
    location: "Kayseri, Türkiye",
    positions: [
      {
        title: "React Web Development",
        employmentType: "Part-time",
        start: "Sep. 2022",
        end: "Dec. 2023",
        bullets: [
          "Developed responsive React-based user interfaces and modernized legacy codebases, collaborating with cross-functional teams to deliver client-aligned features",
        ],
      },
      {
        title: "Web Development",
        employmentType: "Internship",
        start: "Jun. 2022",
        end: "Aug. 2022",
        bullets: [
          "Built a full-stack authentication system using React, Node.js, and JWT, implementing secure login workflows",
        ],
      },
    ],
  },
];

/**
 * The standfirst under the masthead. First person, because the section is
 * about what she did rather than what the roles were called.
 */
export const serviceIntro =
  "For five years, much of my time outside class went into AGU's international student community. I helped create the events that gave each year its rhythm, represented Egypt at the university's International Fest, and spent four years helping new international students navigate the transition to AGU, often starting before they arrived in Türkiye.";

/** Oldest first: the front page reads left to right, then down. */
export const service: Service[] = [
  {
    title: "Head of Event Management",
    org: "AGU International Association Club",
    start: "Sep. 2019",
    end: "May 2023",
    summary:
      "Led the volunteer team behind the club's cultural nights and campus-wide social events, setting the calendar each term, dividing responsibilities across the team, and running events that helped international students find their way into campus life.",
  },
  {
    title: "Welcome Program Coordinator (Volunteer)",
    org: "Abdullah Gül University International Office",
    start: "Jul. 2020",
    end: "Sep. 2024",
    summary:
      "Coordinated the volunteer team for AGU's Newcomers Welcome Program, distributing responsibilities and helping incoming international students before and after arrival. Supported university and dormitory registration, course selection, IT, payments, insurance, immigration, transportation, and other practical processes; welcomed students arriving late at night; organized trips around Kayseri; and designed and led a campus tour for groups of about 50 students.",
  },
  {
    title: "International Fest, Egypt Representative",
    org: "Abdullah Gül University",
    // A single-day role: it has a start and no end, and renders as one date.
    start: "May 2022",
    summary:
      "Represented Egypt at AGU's International Fest, introducing visitors to the country's history and tourism through interactive activities and challenges organized with the International Office.",
  },
  {
    title: "Developer & Pacer",
    org: "Kayseri Social Run",
    orgHref: "https://kayserisocialrun.com",
    start: "Jan. 2026",
    end: "Present",
    summary:
      "Built and maintain the club's web app end to end, while also pacing community runs around Kayseri.",
  },
];
