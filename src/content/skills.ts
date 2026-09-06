export type SkillGroup = {
  /** Not rendered on the About page today, but keeps the data queryable
   *  for search facets later (see BUILD_PLAN "Search and palette"). */
  label: string;
  items: string[];
};

export const skillGroups: SkillGroup[] = [
  {
    label: "Languages",
    items: ["Java", "Python", "JavaScript", "C", "C#", "Dart", "SQL"],
  },
  {
    label: "Backend",
    items: ["Spring Boot", ".NET", "Node.js", "Express", "REST APIs", "JWT"],
  },
  {
    label: "Frontend",
    items: [
      "React",
      "Next.js",
      "HTML/CSS",
      "Bootstrap",
      "Ant Design",
      "Blazor WebAssembly",
    ],
  },
  { label: "Mobile", items: ["React Native", "Flutter"] },
  { label: "Machine learning", items: ["TensorFlow", "Scikit-learn"] },
  {
    label: "DevOps",
    items: ["Docker", "Linux", "GitHub Actions", "CI/CD", "GCP", "Azure"],
  },
  {
    label: "Tools & data",
    items: [
      "Git",
      "ERPNext/Frappe",
      "Figma",
      "MySQL",
      "PostgreSQL",
      "Redis",
      "Stripe API",
    ],
  },
];
