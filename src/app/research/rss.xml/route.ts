import { site } from "@/content/site";
import { getPosts, RESEARCH_DESCRIPTION } from "@/lib/research";

/**
 * RSS 2.0 for /research.
 *
 * A route handler rather than a page, because the response is XML and has to
 * carry its own Content-Type. It takes no request input and reads only the
 * filesystem, so Next prerenders it at build time and it is served as a static
 * file, same as the sitemap.
 */

/**
 * Prerender this at build time instead of running it per request.
 *
 * GET route handlers stopped being statically cached by default after Next 14,
 * so without this line the build marks the feed "ƒ (Dynamic)" and every poll
 * from every feed reader wakes a server function to re-read the filesystem and
 * rebuild identical XML. The content only changes when a post is added, which
 * is a deploy.
 *
 * It also keeps true the claim the CSP in next.config.ts rests on, that every
 * route on this site is statically prerendered.
 */
export const dynamic = "force-static";

const FEED_PATH = "/research/rss.xml";
const TITLE = `${site.name}: Research & Development`;
const DESCRIPTION = RESEARCH_DESCRIPTION;

/**
 * XML has five reserved characters and no tolerance for any of them.
 *
 * An apostrophe in a title is enough to produce a feed that every reader
 * rejects as malformed, and unlike HTML there is no lenient parsing to fall
 * back on. React escapes JSX for us; this string is built by hand, so it does
 * not get that for free.
 */
function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function GET() {
  /**
   * Drafts are filtered here regardless of environment.
   *
   * getPosts() shows drafts outside production so they can be previewed, but a
   * feed is not a preview surface: a reader that polls a branch deployment
   * would copy the draft into someone's inbox, and RSS has no retraction. The
   * rule for the feed is simply "published or absent".
   */
  const posts = getPosts().filter((post) => !post.draft);

  const items = posts
    .map((post) => {
      const url = `${site.url}/research/${post.slug}`;
      return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${url}</link>
      <!-- isPermaLink=true says the guid IS the URL, so a reader that has
           seen the link will not show the item a second time. -->
      <guid isPermaLink="true">${url}</guid>
      <!-- RSS dates are RFC 822, which is what toUTCString produces. An ISO
           date here is silently ignored by most readers and the item shows up
           undated. -->
      <pubDate>${new Date(`${post.date}T00:00:00Z`).toUTCString()}</pubDate>
      <description>${escapeXml(post.summary)}</description>
    </item>`;
    })
    .join("\n");

  // lastBuildDate comes from the newest post, not from Date.now(). A build
  // timestamp changes on every deploy, which makes the feed look updated when
  // nothing was written, and makes the output non-deterministic between builds.
  const newest = posts[0];
  const lastBuild = newest
    ? new Date(`${newest.date}T00:00:00Z`).toUTCString()
    : undefined;

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(TITLE)}</title>
    <link>${site.url}/research</link>
    <description>${escapeXml(DESCRIPTION)}</description>
    <language>en-GB</language>
    <!-- Tells a reader where this feed canonically lives, so a copy served
         from anywhere else still points home. -->
    <atom:link href="${site.url}${FEED_PATH}" rel="self" type="application/rss+xml" />${
      lastBuild ? `\n    <lastBuildDate>${lastBuild}</lastBuildDate>` : ""
    }
${items}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: {
      // charset is not optional here: without it a reader may decode the
      // bytes as Latin-1 and turn every non-ASCII character into mojibake.
      "Content-Type": "application/rss+xml; charset=utf-8",
    },
  });
}
