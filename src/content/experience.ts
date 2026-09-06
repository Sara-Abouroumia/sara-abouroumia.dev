export type Role = {
  title: string;
  org: string;
  start: string;
  end: string;
  location: string;
  bullets: string[];
};

export type Service = {
  title: string;
  org: string;
  start: string;
  end: string;
  summary: string;
};

export const roles: Role[] = [
  {
    title: "Software Engineer",
    org: "Nextarp",
    start: "Jun. 2024",
    end: "Present",
    location: "Remote · Netherlands",
    bullets: [
      "Architected and deployed full-stack web and mobile applications using Spring Boot, React, and React Native, serving production traffic for training management and ERP systems",
      "Engineered backend microservices with Spring Boot integrating MySQL, Redis caching, and Stripe payment processing, improving response times through efficient data access patterns",
      "Built an agentic development lifecycle (ADLC) system of automated bots managing code review, testing, and a multi-stage security gate (SAST, secrets scanning, SCA), authenticating into GCP without stored keys via Workload Identity Federation",
      "Established CI/CD pipelines using Docker and GitHub Actions, automating zero-downtime deployments to GCP and Azure, and managed distribution through Microsoft Partner Center",
      "Extended ERPNext/Frappe functionality through custom modules and REST API integrations",
      "Developed Microsoft Word add-ins on .NET, onboarding onto an unfamiliar stack to meet project needs",
    ],
  },
  {
    title: "Web Developer (Part-Time) / Intern",
    org: "Mazaka Yazilim",
    start: "Jul. 2022",
    end: "Dec. 2023",
    location: "Kayseri, Turkey",
    bullets: [
      "Developed responsive React-based user interfaces and modernized legacy codebases, collaborating with cross-functional teams to deliver client-aligned features",
      "Built a full-stack authentication system using React, Node.js, and JWT, implementing secure login workflows",
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
