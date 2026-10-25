import type { MetadataRoute } from "next";
import { now } from "@/content/about";
import { navItems, site } from "@/content/site";
import { getPosts } from "@/lib/research";

/**
 * Generated from navItems rather than a hand-kept list, so a page added to the
 * nav cannot be missing from the sitemap. Routes that should never be indexed
 * (the reference flow, /admin, the Keystatic editor in later phases) stay out
 * of navItems by definition and so stay out of here too.
 *
 * lastModified is set only where it is TRUE, and left out everywhere else.
 * Search engines use it only from sites where it has proved accurate, and a
 * `new Date()` on every page (what this used to do) claims on every deploy that
 * everything changed today, which teaches a crawler to ignore the field for
 * the whole site. So:
 *
 *   - Home carries the Now panel's date: that stamp is bumped whenever the
 *     page's content is, and it is the same date the footer shows.
 *   - Posts carry their own publish date (below).
 *   - Other pages carry none. Git history was the alternative, but Vercel
 *     builds from a shallow clone, where `git log` can report the clone's
 *     cut-off instead of the real last edit: wrong in a new way.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const pages: MetadataRoute.Sitemap = navItems.map((item) => ({
    url: new URL(item.href, site.url).toString(),
    ...(item.href === "/"
      ? { lastModified: new Date(`${now.updated}-01T00:00:00Z`) }
      : {}),
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
   * lastModified is the post's own date, so it means something.
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
