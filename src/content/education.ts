export type Education = {
  institution: string;
  degree: string;
  honors?: string;
  gpa?: string;
  start: string;
  end: string;
  location: string;
  /** Square logo in public/logos/. Falls back to a monogram when unset. */
  logo?: string;
};

/** Reverse-chronological: the current degree leads. */
export const education: Education[] = [
  {
    institution: "Istanbul Technical University",
    degree: "M.S. in Computer Engineering (with thesis)",
    logo: "/logos/itu.png",
    start: "Sep. 2026",
    end: "Present",
    location: "İstanbul, Türkiye",
  },
  {
    institution: "Abdullah Gul University",
    degree: "B.S. in Computer Engineering",
    logo: "/logos/agu.png",
    honors: "Honors",
    gpa: "3.45/4.00",
    start: "Sep. 2019",
    end: "Jun. 2024",
    location: "Kayseri, Turkey",
  },
];
