export const site = {
  name: "Sara Abouroumia",
  /**
   * Short on purpose. It is the second half of every <title>, the og:title on
   * link previews, the footer, and the photo's alt text, so it has to survive
   * truncation in a browser tab. The long LinkedIn-style headline lives in the
   * bio instead, where there is room for it.
   */
  role: "AI Security R&D Engineer",
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
 * Mind the width when adding an item: at the 941px breakpoint the desktop row
 * has roughly 130px of slack once the wordmark, Resume chip and theme toggle
 * take their share, and five items is about what fits on one line.
 */
export const navItems = [
  { href: "/", label: "About" },
  /*
   * Projects and Products are PARKED (Phase 5 in docs/BUILD_PLAN.md). Their
   * routes live in src/app/_projects and src/app/_products: the underscore
   * makes them Next "private folders", opted out of routing but still
   * type-checked. To bring one back, rename its folder without the underscore
   * and uncomment its line here (and in footerPages below). The sitemap is
   * built from this list, so it follows on its own.
   */
  // { href: "/projects", label: "Projects" },
  // { href: "/products", label: "Products" },
  // Was /research ("Research") until 2026-10; next.config.ts redirects it.
  { href: "/notes", label: "Notes" },
  { href: "/contact", label: "Contact" },
] as const;

// Deliberately a subset, matching the design's footer, which omits Contact.
// Typed as string[] so the parked hrefs can stay listed without TypeScript
// objecting that no nav item has them.
const FOOTER_HREFS: string[] = ["/", /* "/projects", "/products", */ "/notes"];
export const footerPages = navItems.filter((i) =>
  FOOTER_HREFS.includes(i.href),
);
