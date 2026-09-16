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
  start: string;
  end: string;
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

export const service: Service[] = [
  {
    title: "Head of Event Management",
    org: "AGU International Association Club",
    start: "Sep. 2019",
    end: "May 2023",
    summary:
      "Led a team coordinating campus-wide cultural and social events for the international student community.",
  },
  {
    title: "Orientation Program Coordinator (Volunteer)",
    org: "AGU International Office",
    start: "Sep. 2020",
    end: "Jun. 2024",
    summary:
      "Organized onboarding programs for incoming international students, facilitating their integration into university life.",
  },
];
