import type { Metadata } from "next";
import { site } from "@/content/site";

export const SITE_TITLE = `${site.name} · ${site.role}`;

export const SITE_DESCRIPTION =
  "Graduate researcher at Istanbul Technical University working on AI for cybersecurity: intrusion detection and LLM agent security. Full-stack and cloud engineer by background.";

/**
 * Per-page metadata: title, description, canonical URL and Open Graph.
 *
 * Every page has to call this rather than set these fields itself, because
 * Next merges a page's metadata into the layout's shallowly. Two consequences:
 *
 *   - A field the page leaves out is inherited whole. When the canonical lived
 *     only in the root layout, every page declared "/" as its canonical URL,
 *     which tells a search engine that /projects is a duplicate of the home
 *     page and should not be indexed on its own.
 *   - A nested object the page does set replaces the layout's entirely. A page
 *     setting `openGraph: { title }` would silently drop siteName, type and
 *     locale. So this rebuilds the whole object each time.
 *
 * Omit `title` for the home page, which uses the layout's default title rather
 * than the "Page · Sara Abouroumia" template.
 */
export function pageMetadata({
  title,
  description,
  path,
  publishedTime,
}: {
  title?: string;
  description: string;
  path: `/${string}`;
  /**
   * YYYY-MM-DD. Supplying it switches og:type from "website" to "article" and
   * adds og:article:published_time, which is what a preview card needs to
   * show a date. Passing a date is the only signal that something is an
   * article, so the two cannot get out of step.
   */
  publishedTime?: string;
}): Metadata {
  return {
    ...(title ? { title } : {}),
    description,
    alternates: { canonical: path },
    openGraph: {
      ...(publishedTime
        ? { type: "article" as const, publishedTime }
        : { type: "website" as const }),
      siteName: site.name,
      locale: "en_GB",
      // The template in the layout only applies to <title>, not to og:title,
      // so the full string is spelled out here.
      title: title ? `${title} · ${site.name}` : SITE_TITLE,
      description,
      url: path,
    },
  };
}
