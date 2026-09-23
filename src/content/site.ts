export const site = {
  name: "Sara Abouroumia",
  role: "Software Engineer",
  location: "İstanbul, Türkiye",
  /**
   * Türkiye has stayed on UTC+3 all year since 2016, with no daylight
   * saving, so this is right in every month and never needs a seasonal
   * edit.
   */
  timezone: "GMT+3",
  /**
   * Canonical origin, no trailing slash. Single source for metadataBase,
   * canonical URLs, the sitemap, JSON-LD, and the contact email footer.
   *
   * .dev is on the HSTS preload list, so https is not a preference here:
   * browsers refuse http for this TLD outright.
   */
  url: "https://sara-abouroumia.dev",
  email: "saraabouroumia@gmail.com",
  linkedin: "https://linkedin.com/in/sara-abouroumia-7b5665210",
  github: "https://github.com/Sara-Abouroumia",
  resume: "/Sara_Abouroumia_Resume.pdf",
  /** Shown in the preview dialog header and used as the download filename. */
  resumeFileName: "Sara_Abouroumia_Resume.pdf",
  /** Drop a square photo in public/ and set the path here (e.g. "/sara.png").
   *  Until then <Avatar /> renders initials. */
  avatar: "/sara.png" as string | null, // null as string | null
} as const;

/**
 * Experience is deliberately absent. It had its own route, but the About page
 * carries the same timeline with every bullet already in the DOM, so the page
 * was a second copy of content the reader had just scrolled past. Leadership &
 * Service, which used to live only there, moved onto About with it, and is
 * currently commented out there pending References and Certifications.
 */
/**
 * The nav label is "Research" while the page itself is headed "Research &
 * Development". That is not drift: the full name is ~175px at 15px, and at the
 * 941px breakpoint the desktop row has roughly 130px of slack once the
 * wordmark, Resume chip and theme toggle take their share. The short label is
 * what keeps the nav on one line at its tightest width.
 */
export const navItems = [
  { href: "/", label: "About" },
  { href: "/projects", label: "Projects" },
  { href: "/products", label: "Products" },
  { href: "/research", label: "Research" },
  { href: "/contact", label: "Contact" },
] as const;

// Deliberately a subset, matching the design's footer, which omits Contact.
export const footerPages = navItems.filter((i) =>
  ["/", "/projects", "/products", "/research"].includes(i.href),
);
