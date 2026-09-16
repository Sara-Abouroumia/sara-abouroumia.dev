export type Skill = {
  name: string;
  /**
   * simple-icons slug, without the `si` prefix. Omitted where no mark exists,
   * Microsoft and Apple had theirs removed from the set over trademark policy,
   * and concepts like CI/CD were never going to have one. Those fall back to a
   * lettered tile, the same way <OrgLogo /> handles a missing company logo.
   */
  icon?: string;
  /**
   * A real image in public/logos/skills/, for marks that are multi-colour in
   * life and lose their identity as a one-colour silhouette (Python's two
   * snakes, Google Cloud's four-colour hexagon). Takes precedence over `icon`.
   */
  image?: string;
  /** Brand hex to glow in when using `image`, since there is no slug to read it from. */
  color?: string;
  /**
   * A drawn mark from the house set, for the things that are concepts rather
   * than products and so have no logo to find. Rendered in the site accent,
   * which is the point: they are visibly ours, not a brand mark invented for
   * something that doesn't have one.
   */
  glyph?: "database" | "api" | "pipeline" | "shield";
};

export type SkillGroup = {
  /** Kept as a discrete field so the same groups can back search facets later
   *  (see BUILD_PLAN "Search and palette"), even though the Skills section now
   *  renders one flat strip. */
  label: string;
  items: Skill[];
};

export const skillGroups: SkillGroup[] = [
  {
    label: "Languages",
    items: [
      { name: "TypeScript", icon: "typescript" },
      // Real file rather than the simple-icons silhouette: at 1.21:1 on the
      // cream ground the flat yellow had to be darkened to be visible at all,
      // which turned it olive. The two-colour original needs no correction.
      {
        name: "JavaScript",
        image: "/logos/skills/javascript.svg",
        color: "#F7DF1E",
      },
      { name: "Java", image: "/logos/skills/java.svg", color: "#0074BD" },
      { name: "Python", image: "/logos/skills/python.svg", color: "#3776AB" },
      { name: "SQL", glyph: "database" },
      { name: "C#", image: "/logos/skills/csharp.svg", color: "#68217A" },
    ],
  },
  {
    label: "Frontend",
    items: [
      { name: "React.js", image: "/logos/skills/react.svg", color: "#61DAFB" },
      { name: "Next.js", icon: "nextdotjs" },
      { name: "HTML", icon: "html5" },
      { name: "CSS", icon: "css" },
      { name: "Ant Design", icon: "antdesign" },
      { name: "Bootstrap", icon: "bootstrap" },
    ],
  },
  {
    label: "Backend & APIs",
    items: [
      { name: "Node.js", icon: "nodedotjs" },
      { name: "Express.js", icon: "express" },
      { name: "Spring Boot", icon: "springboot" },
      { name: "REST APIs", glyph: "api" },
      { name: "JWT", icon: "jsonwebtokens" },
      { name: "Stripe", icon: "stripe" },
    ],
  },
  {
    label: "Databases & Caching",
    items: [
      { name: "PostgreSQL", icon: "postgresql" },
      { name: "Neon", icon: "neon" },
      { name: "MySQL", image: "/logos/skills/mysql.svg", color: "#00758F" },
      { name: "Redis", icon: "redis" },
    ],
  },
  {
    label: "DevOps & Cloud",
    items: [
      { name: "Docker", icon: "docker" },
      { name: "GitHub Actions", icon: "githubactions" },
      { name: "CI/CD", glyph: "pipeline" },
      { name: "GCP", image: "/logos/skills/googlecloud.svg", color: "#4285F4" },
      { name: "Azure", image: "/logos/skills/azure.svg", color: "#0078D4" },
      { name: "EAS Build", icon: "expo" },
      { name: "Linux", image: "/logos/skills/linux.png", color: "#FCC624" },
      { name: "SAST/SCA", glyph: "shield" },
    ],
  },
  {
    label: "Other",
    items: [
      {
        name: "React Native",
        image: "/logos/skills/react.svg",
        color: "#61DAFB",
      },
      { name: "App Store Connect", icon: "appstore" },
      {
        name: "Google Play Console",
        image: "/logos/skills/googleplay.svg",
        color: "#00A0FF",
      },
      { name: "ERPNext/Frappe", icon: "frappe" },
      { name: "Git", icon: "git" },
      { name: "GitHub", icon: "github" },
      { name: "Postman", icon: "postman" },
      { name: "Figma", image: "/logos/skills/figma.svg", color: "#A259FF" },
    ],
  },
];

/** The strip renders one flat run; groups only survive for future faceting. */
export const allSkills: Skill[] = skillGroups.flatMap((g) => g.items);
