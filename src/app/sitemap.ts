import type { MetadataRoute } from "next";
import { navItems, site } from "@/content/site";
import { getPosts } from "@/lib/research";

/**
 * Generated from navItems rather than a hand-kept list, so a page added to the
 * nav cannot be missing from the sitemap. Routes that should never be indexed
 * (the reference flow, /admin, the Keystatic editor in later phases) stay out
 * of navItems by definition and so stay out of here too.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const pages: MetadataRoute.Sitemap = navItems.map((item) => ({
    url: new URL(item.href, site.url).toString(),
    lastModified: new Date(),
    changeFrequency: item.href === "/" ? "monthly" : "yearly",
    priority: item.href === "/" ? 1 : 0.7,
  }));

  /**
   * Research posts, which navItems cannot know about: they are files, not nav
   * entries.
   *
   * Drafts are filtered unconditionally rather than relying on getPosts()'s
   * environment rule. That rule exists so drafts are readable on a preview
   * deployment, and a preview deployment still generates a sitemap; an
   * unfinished post does not belong in one anywhere.
   *
   * lastModified is the post's own date, so it means something. The pages
   * above use `new Date()`, which claims on every deploy that every page
   * changed today, and a crawler that learns the field is noise stops reading
   * it. Worth fixing separately, from git history rather than a literal.
   */
  const posts: MetadataRoute.Sitemap = getPosts()
    .filter((post) => !post.draft)
    .map((post) => ({
      url: new URL(`/research/${post.slug}`, site.url).toString(),
      lastModified: new Date(`${post.date}T00:00:00Z`),
      changeFrequency: "yearly",
      priority: 0.6,
    }));

  return [...pages, ...posts];
}
