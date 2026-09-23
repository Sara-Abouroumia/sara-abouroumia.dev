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

export const companies: Company[] = [
  {
    org: "Nextarp B.V.",
    logo: "/logos/nextarp.png",
    location: "Netherlands · Remote",
    positions: [
      {
        title: "Software Engineer",
        employmentType: "Full-time",
        start: "Jun. 2024",
        end: "Present",
        bullets: [
          "Architected and deployed full-stack web and mobile applications using Spring Boot, React, and React Native, serving production traffic for training management and ERP systems",
          "Engineered backend microservices with Spring Boot integrating MySQL, Redis caching, and Stripe payment processing, improving response times through efficient data access patterns",
          "Built an agentic development lifecycle (ADLC) system of automated bots managing code review, testing, and a multi-stage security gate (SAST, secrets scanning, SCA), authenticating into GCP without stored keys via Workload Identity Federation",
          "Established CI/CD pipelines using Docker and GitHub Actions, automating zero-downtime deployments to GCP and Azure, and managed distribution through Microsoft Partner Center",
          "Extended ERPNext/Frappe functionality through custom modules and REST API integrations",
          "Developed Microsoft Word add-ins on .NET, onboarding onto an unfamiliar stack to meet project needs",
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
