import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { site } from "@/content/site";
import { formatDay } from "@/lib/dates";
import { pageMetadata } from "@/lib/metadata";
import { getPost, getPosts } from "@/lib/research";

/**
 * A research post.
 *
 * The body is loaded by dynamic import rather than read as text, which is the
 * pattern Next documents for MDX outside the app directory. The bundler turns
 * the template literal into a context module over src/content/research, so
 * each post compiles into its own chunk and only the one being rendered is
 * pulled in.
 */

/**
 * Prerender every post at build time.
 *
 * Without this the route still works, but each post would be rendered on first
 * request instead of sitting on the CDN as HTML.
 */
export function generateStaticParams() {
  return getPosts().map((post) => ({ slug: post.slug }));
}

/**
 * Anything not in generateStaticParams is a 404 rather than an attempt to
 * render it. It closes off a route that would otherwise try to import an
 * arbitrary attacker-supplied path.
 */
export const dynamicParams = false;

export async function generateMetadata({
  params,
}: PageProps<"/research/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};

  return {
    ...pageMetadata({
      title: post.title,
      description: post.summary,
      path: `/research/${slug}`,
      publishedTime: post.date,
    }),
    // A draft reachable on a preview deployment should still never be indexed
    // if that URL is shared.
    ...(post.draft ? { robots: { index: false, follow: false } } : {}),
  };
}

export default async function ResearchPost({
  params,
}: PageProps<"/research/[slug]">) {
  const { slug } = await params;
  const post = getPost(slug);

  // dynamicParams=false makes this unreachable through the router, but
  // generateStaticParams and getPost read the same directory twice, so this is
  // the guard that keeps the types honest.
  if (!post) notFound();

  const { default: Body } = await import(`@/content/research/${slug}.mdx`);

  return (
    <article>
      {/* Structured data for the post itself. The Person block on the home
          page describes the author; this describes the piece, and links the
          two by name. */}
      <script
        type="application/ld+json"
        // JSON-LD must be the raw text content of the tag; it is escaped on
        // the line below, exactly as on the Person block.
        // biome-ignore lint/security/noDangerouslySetInnerHtml: see above
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: post.title,
            description: post.summary,
            datePublished: post.date,
            author: { "@type": "Person", name: site.name, url: site.url },
            url: `${site.url}/research/${slug}`,
            keywords: post.tags.length ? post.tags.join(", ") : undefined,
          }).replace(/</g, "\\u003c"),
        }}
      />

      <Link
        href="/research"
        className="font-mono text-[11px] text-muted-light uppercase tracking-[0.06em] no-underline transition-colors hover:text-accent"
      >
        &larr; Research &amp; Development
      </Link>

      {/* The only h1 on the page, which is why mdx-components maps no h1. */}
      <h1 className="mt-5 mb-3 max-w-[680px] font-serif font-semibold text-[34px] text-text leading-[1.15]">
        {post.title}
      </h1>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] text-muted-light uppercase tracking-[0.06em]">
        <time dateTime={post.date}>{formatDay(post.date)}</time>
        <span aria-hidden="true">·</span>
        <span>{post.readingMinutes} min read</span>
        {post.draft ? (
          <>
            <span aria-hidden="true">·</span>
            {/* Visible on localhost and previews only, by definition: a draft
                never reaches production to render this. */}
            <span className="text-error-text">Draft</span>
          </>
        ) : null}
      </div>

      {/* 640px, narrower than the 880 column and the 700 used for page intros.
          At 17px that is roughly 70 characters a line, which is the range
          long-form prose is comfortable in. The title above stays wider so it
          still reads as a headline over the column. */}
      <div className="mt-8 max-w-[640px] border-border border-t pt-2">
        <Body />
      </div>

      {post.tags.length ? (
        <ul className="m-0 mt-10 flex max-w-[640px] list-none flex-wrap gap-2 p-0">
          {post.tags.map((tag) => (
            <li
              key={tag}
              className="rounded-[3px] border border-border px-2.5 py-1 font-mono text-[11px] text-muted-light uppercase tracking-[0.06em]"
            >
              {tag}
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}
