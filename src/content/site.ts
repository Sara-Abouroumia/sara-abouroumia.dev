export const site = {
  name: "Sara Abouroumia",
  role: "Software Engineer",
  location: "İstanbul, Türkiye",
  email: "saraabouroumia@gmail.com",
  linkedin: "https://linkedin.com/in/sara-abouroumia-7b5665210",
  resume: "/Sara_Abouroumia_Resume.pdf",
} as const;

export const navItems = [
  { href: "/", label: "About" },
  { href: "/experience", label: "Experience" },
  { href: "/projects", label: "Projects" },
  { href: "/products", label: "Products" },
  { href: "/research", label: "Research" },
  { href: "/blog", label: "Blog" },
  { href: "/contact", label: "Contact" },
] as const;

// Deliberately a subset — matches the design's footer, which omits
// Research and Contact.
export const footerPages = navItems.filter((i) =>
  ["/", "/experience", "/projects", "/products", "/blog"].includes(i.href),
);
