import type { Metadata } from "next";
import { site } from "@/content/site";

export const SITE_TITLE = `${site.name} · ${site.role}`;

export const SITE_DESCRIPTION =
  "Software engineer working across backend systems, web, and mobile.";

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
}: {
  title?: string;
  description: string;
  path: `/${string}`;
}): Metadata {
  return {
    ...(title ? { title } : {}),
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
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
