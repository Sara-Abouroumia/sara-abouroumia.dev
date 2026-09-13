import type { MetadataRoute } from "next";
import { navItems, site } from "@/content/site";

/**
 * Generated from navItems rather than a hand-kept list, so a page added to the
 * nav cannot be missing from the sitemap. Routes that should never be indexed
 * (the reference flow, /admin, the Keystatic editor in later phases) stay out
 * of navItems by definition and so stay out of here too.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return navItems.map((item) => ({
    url: new URL(item.href, site.url).toString(),
    lastModified: new Date(),
    changeFrequency: item.href === "/" ? "monthly" : "yearly",
    priority: item.href === "/" ? 1 : 0.7,
  }));
}
