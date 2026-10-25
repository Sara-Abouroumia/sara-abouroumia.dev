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
  /**
   * The facts that are not courses: thesis, supervisor, capstone, a GPA
   * breakdown. Rendered as bullets, the same as an experience entry.
   */
  details?: string[];
  /**
   * The courses worth naming, not the transcript. Picked for the direction the
   * site argues for (AI, security, systems), because a reader scans this line
   * for keywords, and every course that is not one dilutes the ones that are.
   */
  coursework?: string[];
};

/** Reverse-chronological: the current degree leads. */
export const education: Education[] = [
  {
    institution: "Istanbul Technical University",
    degree: "M.S. in Computer Engineering (with thesis)",
    logo: "/logos/itu.png",
    start: "Jul. 2026",
    end: "Present",
    location: "İstanbul, Türkiye",
    details: [
      "Thesis on using AI to address cybersecurity threats, with an emphasis on intrusion detection and network security",
      "Supervised by Prof. Dr. Abdul Halim Zaim",
    ],
    coursework: [
      "Deep Learning",
      "Machine Learning",
      "Computer Networks",
      "Special Topics in Computer Engineering",
    ],
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
    details: [
      "3.74/4.00 GPA over the final two academic years",
      "Capstone (A): Diabetic Foot Ulcer Classification Using CNN Transfer Learning and TPU Acceleration",
    ],
    coursework: [
      "Network Security (A)",
      "Computer Networks (A-)",
      "Machine Learning in Python (A-)",
      "Probability and Statistics (A)",
      "Operating Systems (A)",
      "Analysis of Algorithms (B+)",
    ],
  },
];
