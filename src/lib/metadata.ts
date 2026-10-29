import type { Metadata } from "next";
import { site } from "@/content/site";

// Not imported from og.tsx, which reads fonts with node:fs and would drag
// that into every page's metadata module for the sake of two numbers.
const OG_SIZE = { width: 1200, height: 630 };

export const SITE_TITLE = `${site.name} · ${site.role}`;

/**
 * At most 160 characters, which is where Bing flags a description as too
 * long and where search results cut it off mid-sentence. This one was 174
 * and Bing's URL Inspection reported it; it is written to fit rather than
 * trimmed, since a hand-made sentence reads better than a truncated one.
 */
export const SITE_DESCRIPTION =
  "Graduate researcher at Istanbul Technical University in AI for cybersecurity: intrusion detection and LLM agent security. Full-stack engineer by background.";

/** Search engines' limit for a meta description (Bing flags 25 to 160). */
const DESCRIPTION_MAX = 160;

/**
 * A description that fits the limit, cut at a word boundary with an ellipsis
 * when it does not. For text written for somewhere roomier, like a note's
 * summary, which the listing shows in full: the meta copy is trimmed so no
 * note can trip the length check, while the summary itself stays whole.
 */
function fitDescription(text: string) {
  if (text.length <= DESCRIPTION_MAX) return text;
  const cut = text.slice(0, DESCRIPTION_MAX - 1);
  return `${cut.slice(0, cut.lastIndexOf(" ")).replace(/[,;:.]$/, "")}…`;
}

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
  image,
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
  /** This page's own preview card; the site card when omitted. */
  image?: { url: `/${string}`; alt: string };
}): Metadata {
  const meta = fitDescription(description);
  return {
    ...(title ? { title } : {}),
    description: meta,
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
      description: meta,
      url: path,
      /**
       * The preview card, named outright on every page. The file at the root
       * (app/opengraph-image.tsx) is only inherited by a page that sets no
       * openGraph of its own, and every page sets one here, so without this
       * /notes and /contact shared as bare text. And once this names an
       * image, it also beats a segment's own opengraph-image file (measured,
       * despite the docs' "files outrank config"), which is why a note passes
       * its card in as `image` instead of relying on the file being found.
       */
      images: [
        {
          url: image?.url ?? "/opengraph-image",
          ...OG_SIZE,
          alt: image?.alt ?? SITE_TITLE,
        },
      ],
    },
  };
}
