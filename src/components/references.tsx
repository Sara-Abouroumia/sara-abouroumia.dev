import {
  REFERENCES_SOURCE,
  type Reference,
  type ReferenceBlock,
} from "@/content/references";
import { formatMonth } from "@/lib/dates";

/**
 * The References section's body: each recommendation as a pull quote, its
 * author, and the full text one click away.
 *
 * Why a pull quote first. A recommendation is written as a letter, and a
 * letter is too long to take in at a glance; the one sentence that carries
 * it is not. So that sentence leads, set in the reading serif like the bio,
 * and the letter itself follows on request, complete and unedited.
 *
 * The full text sits in a native <details>: it opens without JavaScript, the
 * browser handles keyboard and screen-reader semantics, and the text is in
 * the HTML for search engines whether it is open or not.
 */
export function References({
  references,
}: {
  references: readonly Reference[];
}) {
  return (
    <div>
      <ul className="m-0 list-none p-0">
        {references.map((r, i) => (
          <li
            key={r.profile}
            className={i > 0 ? "mt-8 border-border border-t pt-8" : ""}
          >
            <ReferenceEntry reference={r} />
          </li>
        ))}
      </ul>

      {/* Where to check them. The attribution links go to each person, this
          one to the originals in one place. */}
      <p className="mt-8 text-[13px] text-muted">
        Recommendations from LinkedIn, where the originals can be read.{" "}
        <a
          href={REFERENCES_SOURCE}
          target="_blank"
          rel="noopener"
          className="text-accent underline decoration-field-border underline-offset-[3px] transition-colors hover:decoration-accent"
        >
          View on LinkedIn
          <span aria-hidden="true"> ↗</span>
        </a>
      </p>
    </div>
  );
}

function ReferenceEntry({ reference: r }: { reference: Reference }) {
  assertVerbatim(r);
  const initials = r.name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    // <figure> with <blockquote> and <figcaption> is HTML's own shape for "a
    // quotation and who said it", which is what a screen reader then
    // announces.
    <figure className="m-0 max-w-[700px]">
      <blockquote className="relative m-0 pl-7">
        {/* The opening mark hangs in the margin, so the quote's text starts
            flush with the attribution below it rather than indented by the
            mark. Decorative: the <blockquote> already says "quotation". */}
        <span
          aria-hidden="true"
          className="absolute top-[-6px] left-0 font-serif text-[40px] text-accent leading-none"
        >
          “
        </span>
        <p className="m-0 font-reading text-[18px] text-text leading-[1.6] md:text-[19px]">
          {r.quote}
        </p>
      </blockquote>

      <figcaption className="mt-4 flex items-center gap-3 pl-7">
        {/* Initials, not a photo: see content/references.ts. */}
        <span
          aria-hidden="true"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-panel font-semibold text-[13px] text-muted tracking-[0.04em]"
        >
          {initials}
        </span>
        <span className="min-w-0">
          <a
            href={r.profile}
            target="_blank"
            rel="noopener"
            className="font-semibold text-[15px] text-text no-underline transition-colors hover:text-accent"
          >
            {r.name}
            <span className="sr-only"> on LinkedIn</span>
          </a>
          <span className="block text-[14px] text-text-soft leading-snug">
            {r.title}
          </span>
          <span className="block text-[13px] text-muted">
            {r.relationship} ·{" "}
            <time dateTime={r.date}>{formatMonth(r.date.slice(0, 7))}</time>
          </span>
        </span>
      </figcaption>

      <details className="group mt-4 pl-7">
        <summary className="inline-flex min-h-8 cursor-pointer list-none items-center gap-1.5 rounded-[3px] text-[13px] text-accent transition-colors hover:text-accent-hover focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 [&::-webkit-details-marker]:hidden">
          <Chevron />
          <span className="group-open:hidden">
            Read the full recommendation
          </span>
          <span className="hidden group-open:inline">Hide</span>
        </summary>
        {/* The letter as written: a quiet rule on the left marks it as
            quoted text, set in the body face at reading size. */}
        <div className="mt-3 space-y-3 border-border border-l-2 pl-4 text-[15px] text-text-soft leading-[1.7]">
          {r.body.map((block) => (
            <Block key={typeof block === "string" ? block : block.list[0]}>
              {block}
            </Block>
          ))}
        </div>
      </details>
    </figure>
  );
}

function Block({ children: block }: { children: ReferenceBlock }) {
  if (typeof block === "string") return <p className="m-0">{block}</p>;
  // list-outside, so a wrapped line aligns with the text above it rather
  // than running back under the number.
  return (
    <ol className="m-0 list-decimal list-outside space-y-1.5 pl-5 marker:text-muted">
      {block.list.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ol>
  );
}

/**
 * The pull quote must be an exact sentence of the recommendation. Checked
 * here, at build time, rather than trusted to a comment: a quote edited into
 * a paraphrase fails the build and names whose it is.
 */
function assertVerbatim(r: Reference) {
  const text = r.body
    .map((b) => (typeof b === "string" ? b : b.list.join(" ")))
    .join(" ");
  if (!text.includes(r.quote)) {
    throw new Error(
      `references: the quote for ${r.name} is not word for word in their recommendation.`,
    );
  }
}

function Chevron() {
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden="true"
      className="h-3 w-3 transition-transform group-open:rotate-90"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 3.5l4.5 4.5L6 12.5" />
    </svg>
  );
}
