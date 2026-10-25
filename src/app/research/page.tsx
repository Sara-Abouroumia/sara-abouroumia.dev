import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { PageTitle, PROSE } from "@/components/section";
import { formatDay } from "@/lib/dates";
import { pageMetadata } from "@/lib/metadata";
import { getPosts, RESEARCH_DESCRIPTION } from "@/lib/research";

const base = pageMetadata({
  title: "Research & Development",
  description: RESEARCH_DESCRIPTION,
  path: "/research",
});

/**
 * The canonical comes from pageMetadata; the feed link is added on top.
 *
 * Spread and re-merge rather than assigned, for the same shallow-merge reason
 * pageMetadata exists at all: writing `alternates: { types: ... }` here would
 * replace the whole object and drop the canonical with it.
 */
export const metadata: Metadata = {
  ...base,
  alternates: {
    ...base.alternates,
    // Gives the browser and any feed reader an <link rel="alternate"> to find,
    // which is how a reader autodiscovers the feed from the page URL alone.
    types: {
      "application/rss+xml": [
        { url: "/research/rss.xml", title: "Sara Abouroumia: Research" },
      ],
    },
  },
};

/**
 * This page absorbed what used to be the separate Blog tab.
 *
 * Two tabs for "things I wrote" is one tab too many on a portfolio this size,
 * and the split forced a false distinction: a Kaggle writeup is both research
 * and a blog post. Posts land here as MDX in src/content/research, rendered in
 * the long-form layout the design specified for the blog.
 */
export default function ResearchPage() {
  const posts = getPosts();

  return (
    <div>
      <PageTitle>Research &amp; Development</PageTitle>

      <p className={`${PROSE} mb-6 text-[16px] text-text-soft leading-[1.7]`}>
        {RESEARCH_DESCRIPTION}
      </p>

      {posts.length === 0 ? (
        <EmptyState>
          Nothing published yet. The first writeups are coming.
        </EmptyState>
      ) : (
        <ol className="m-0 list-none p-0">
          {posts.map((post, i) => (
            <li
              key={post.slug}
              className={i > 0 ? "border-border border-t pt-7 mt-7" : undefined}
            >
              <article className="max-w-[700px]">
                <h2 className="mb-1.5 font-serif font-semibold text-[22px] leading-snug">
                  {/* The whole title is the link, rather than a "read more"
                      below it: a link's text is its accessible name, and
                      "read more" repeated down a list names nothing. */}
                  <Link
                    href={`/research/${post.slug}`}
                    className="text-text no-underline transition-colors hover:text-accent"
                  >
                    {post.title}
                  </Link>
                </h2>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] text-muted-light uppercase tracking-[0.06em]">
                  <time dateTime={post.date}>{formatDay(post.date)}</time>
                  <span aria-hidden="true">·</span>
                  <span>{post.readingMinutes} min read</span>
                  {post.draft ? (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="text-error-text">Draft</span>
                    </>
                  ) : null}
                </div>

                <p className="mt-2.5 text-[15px] text-text-soft leading-[1.7]">
                  {post.summary}
                </p>
              </article>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
