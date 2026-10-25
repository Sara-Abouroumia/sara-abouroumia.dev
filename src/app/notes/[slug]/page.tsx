import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { site } from "@/content/site";
import { formatDay } from "@/lib/dates";
import { pageMetadata } from "@/lib/metadata";
import {
  categoryLabel,
  getNote,
  getNotes,
  NOTES_PATH,
  noteHref,
} from "@/lib/notes";

/**
 * A single note.
 *
 * The body is loaded by dynamic import rather than read as text, which is the
 * pattern Next documents for MDX outside the app directory. The bundler turns
 * the template literal into a context module over src/content/notes, so each
 * note compiles into its own chunk and only the one being rendered is pulled
 * in.
 */

/**
 * Prerender every note at build time.
 *
 * Without this the route still works, but each note would be rendered on first
 * request instead of sitting on the CDN as HTML.
 */
export function generateStaticParams() {
  return getNotes().map((note) => ({ slug: note.slug }));
}

/**
 * Anything not in generateStaticParams is a 404 rather than an attempt to
 * render it. It closes off a route that would otherwise try to import an
 * arbitrary attacker-supplied path.
 */
export const dynamicParams = false;

export async function generateMetadata({
  params,
}: PageProps<"/notes/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const note = getNote(slug);
  if (!note) return {};

  return {
    ...pageMetadata({
      title: note.title,
      description: note.summary,
      path: noteHref(slug),
      publishedTime: note.date,
    }),
    // A draft reachable on a preview deployment should still never be indexed
    // if that URL is shared.
    ...(note.draft ? { robots: { index: false, follow: false } } : {}),
  };
}

export default async function NotePage({ params }: PageProps<"/notes/[slug]">) {
  const { slug } = await params;
  const note = getNote(slug);

  // dynamicParams=false makes this unreachable through the router, but
  // generateStaticParams and getNote read the same directory twice, so this is
  // the guard that keeps the types honest.
  if (!note) notFound();

  const { default: Body } = await import(`@/content/notes/${slug}.mdx`);

  return (
    <article>
      {/* Structured data for the note itself. The Person block on the home
          page describes the author; this describes the piece, and links the
          two by name. articleSection is schema.org's word for a category. */}
      <script
        type="application/ld+json"
        // JSON-LD must be the raw text content of the tag; it is escaped on
        // the line below, exactly as on the Person block.
        // biome-ignore lint/security/noDangerouslySetInnerHtml: see above
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: note.title,
            description: note.summary,
            datePublished: note.date,
            articleSection: categoryLabel(note.category),
            author: { "@type": "Person", name: site.name, url: site.url },
            url: `${site.url}${noteHref(slug)}`,
            keywords: note.tags.length ? note.tags.join(", ") : undefined,
          }).replace(/</g, "\\u003c"),
        }}
      />

      <Link
        href={NOTES_PATH}
        className="font-mono text-[11px] text-muted-light uppercase tracking-[0.06em] no-underline transition-colors hover:text-accent"
      >
        &larr; Notes
      </Link>

      {/* The category leads, as on the card the reader just clicked: it is
          the first thing that tells them what kind of read this is. */}
      <p className="mt-6 mb-0 font-semibold text-[12px] text-accent uppercase tracking-[0.12em]">
        {categoryLabel(note.category)}
      </p>

      {/* The only h1 on the page, which is why mdx-components maps no h1. */}
      <h1 className="mt-2 mb-3 max-w-[680px] font-serif font-semibold text-[34px] text-text leading-[1.15]">
        {note.title}
      </h1>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] text-muted-light uppercase tracking-[0.06em]">
        <time dateTime={note.date}>{formatDay(note.date)}</time>
        <span aria-hidden="true">·</span>
        <span>{note.readingMinutes} min read</span>
        {note.draft ? (
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

      {note.tags.length ? (
        <ul className="m-0 mt-10 flex max-w-[640px] list-none flex-wrap gap-2 p-0">
          {note.tags.map((tag) => (
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
