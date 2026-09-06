export type Education = {
  institution: string;
  degree: string;
  honors?: string;
  gpa?: string;
  start: string;
  end: string;
  location: string;
};

export const education: Education[] = [
  {
    institution: "Abdullah Gul University",
    degree: "B.S. in Computer Engineering",
    honors: "Honors",
    gpa: "3.45/4.00",
    start: "Sep. 2019",
    end: "Jun. 2024",
    location: "Kayseri, Turkey",
  },
];
