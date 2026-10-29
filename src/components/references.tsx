import Image from "next/image";
import { AnimatedDetails } from "@/components/animated-details";
import { PROSE } from "@/components/section";
import { REFERENCES_SOURCE, type Reference } from "@/content/references";
import { formatMonth } from "@/lib/dates";

/**
 * The References section: a card per reference, stacked, each the full
 * width of the column, the way reviews are listed: who is speaking, the one sentence that carries
 * their letter, and the whole letter folded underneath, one click away.
 *
 * All of them are visible at once, rather than rotating: a reference only
 * counts if it is seen, and with a few short cards there is room for all.
 */
export function References({
  references,
}: {
  references: readonly Reference[];
}) {
  return (
    <div>
      {/* The section's invitation, in the italic serif of the home page's
          "Welcome" line. A lede, not the heading: the h2 stays the one word
          the section bar and the rail link to, like every other section.
          Its colour sits between the body text and the faint headings: a
          mix of --text-soft and --muted, since --text-soft alone is almost
          the body colour in the light theme. -mt-1.5 tucks it up under the
          heading (whose own margin is 14px), so the two read as one unit;
          mb-8 then gives the references below it room to start fresh. */}
      {/* <p className="-mt-1.5 m-0 mb-8 flex items-center gap-2 font-serif text-[16px] text-[color-mix(in_srgb,var(--text-soft)_55%,var(--muted))] italic">
        <Sparkles />
        Hear what those who have worked with me have to say.
      </p> */}

      {/* Two references a row from md, one on a phone: a static grid, every
          reference in view at once. A list, because it is one: a screen
          reader announces how many references there are. Closed, the
          references in a row stretch to one height (the grid default), so
          their signatures line up; once a letter is open (:has, so CSS
          alone sees it) the row stops stretching, or the reference beside
          it would grow into a tall empty gap to match.

          The divider between them is a hairline in --border. On desktop it
          is the list's own ::before, centred in the 80px gap (left-1/2) and
          as tall as the whole list (inset-y-0), rather than a border on one
          item: an item's border is only as tall as the item, and an open
          letter makes the two different heights, so the line would stop
          short. On a phone the references stack, and every item but the
          first draws a line above itself (not-first), with the same space
          each side of it (gap-y-10 above, pt-10 below). */}
      <ul className="m-0 grid list-none gap-x-20 gap-y-10 p-0 md:relative md:grid-cols-2 md:before:absolute md:before:inset-y-0 md:before:left-1/2 md:before:w-px md:before:bg-border md:has-[details[open]]:items-start">
        {references.map((r) => (
          <li
            key={r.profile}
            className="flex not-first:border-border not-first:border-t not-first:pt-10 md:not-first:border-t-0 md:not-first:pt-0"
          >
            <ReferenceCard reference={r} />
          </li>
        ))}
      </ul>

      <SourceNote />
    </div>
  );
}

/**
 * The line under the references. mt-10 matches the gap between references:
 * with no card to hold the signatures, a smaller gap would read as part of
 * the last one. One link to the originals, said once for the section:
 * LinkedIn shows all the letters on one page. Each name still links to
 * that person's own profile. "Further references on request" is the line
 * every CV's references end with: it tells a recruiter these are
 * references, and that more people can vouch.
 */
export function SourceNote() {
  return (
    <p className="m-0 mt-10 text-[13px] text-muted">
      Recommendations from LinkedIn, where the originals can be read; further
      references on request.{" "}
      <a
        href={REFERENCES_SOURCE}
        target="_blank"
        rel="noopener"
        className="whitespace-nowrap text-accent underline decoration-field-border underline-offset-[3px] transition-colors hover:decoration-accent"
      >
        View on LinkedIn
        <span aria-hidden="true"> ↗</span>
      </a>
    </p>
  );
}

/**
 * Three four-pointed stars, one large and two small, in the accent: a
 * touch of glitter before the section's invitation. One path, drawn once
 * in a 24-unit box and placed three times at different sizes, so the
 * three are the same shape at different scales, the way a sparkle cluster
 * is usually drawn. The big star leads on the left and the small ones sit
 * by the text, so the cluster tapers into the sentence. A soft glow in
 * the accent (.sparkle-glow in globals.css) makes them read as light
 * rather than ink. Decoration only, so hidden from screen readers.
 */
function Sparkles() {
  // A four-pointed star with concave sides, centred on (12, 12).
  const star =
    "M12 2C12.6 7.4 16.6 11.4 22 12C16.6 12.6 12.6 16.6 12 22C11.4 16.6 7.4 12.6 2 12C7.4 11.4 11.4 7.4 12 2Z";
  return (
    <svg
      viewBox="0 0 28 24"
      aria-hidden="true"
      className="sparkle-glow h-5 w-[23px] shrink-0 text-accent"
      fill="currentColor"
    >
      {/* translate(c - 12s) puts the star's centre at c after scale(s). */}
      {/* Centres: big (11, 14), small (22, 7) and (21, 20). */}
      <path d={star} transform="translate(2 5) scale(0.75)" />
      <path
        d={star}
        transform="translate(17.2 2.2) scale(0.4)"
        opacity="0.85"
      />
      <path
        d={star}
        transform="translate(17.6 16.6) scale(0.28)"
        opacity="0.7"
      />
    </svg>
  );
}

/**
 * One reference as a card: who, what they said, the full letter.
 *
 * One reference, set straight on the page with no card around it (the
 * card, a white one with a faint shadow, was tried and is easy to bring
 * back: a rounded-[16px] border, bg-bg, p-7 and a 5% black shadow on the
 * <figure>, with --panel and a hairline in dark mode, where a shadow
 * cannot be seen). Without padding the opening quotation mark's indent
 * (pl-5) is the only inset, so the text sits on the section heading's
 * left edge, and the grid's wider gap does the separating.
 */
function ReferenceCard({ reference: r }: { reference: Reference }) {
  assertVerbatim(r);

  return (
    // <figure> with <figcaption> and <blockquote> is HTML's own shape for "a
    // quotation and who said it", which is what a screen reader announces.
    // The quote leads, as on a testimonial card, and the caption closes
    // the card as its signature; HTML allows a figcaption as the last
    // child.
    <figure className="m-0 flex w-full min-w-0 flex-col">
      {/* The opening mark sits in the quote's own indent (pl-5), its left
          edge on the card's content edge, so it lines up with the toggle
          and the signature below, and every line of the quote starts on
          one edge just inside it. The blockquote is the positioning
          parent. */}
      <blockquote className="relative m-0 pl-5">
        {/* PROSE caps the line at 700px (about 75 characters), the same
            measure as the page's other prose: a card can be 1250px wide,
            and a sentence run across all of it is hard to follow from the
            end of one line to the start of the next. */}
        <p
          className={`${PROSE} m-0 font-reading text-[16px] text-text leading-[1.65]`}
        >
          <QuoteMark side="open" />
          {/* The last word and the closing mark are one unbreakable unit:
              a line may break before an inline-block, which left the mark
              alone on a line of its own on a phone. */}
          {r.quote.slice(0, r.quote.lastIndexOf(" ") + 1)}
          <span className="whitespace-nowrap">
            {r.quote.slice(r.quote.lastIndexOf(" ") + 1)}
            <QuoteMark side="close" />
          </span>
        </p>
      </blockquote>

      {/* The toggle (and the tags, if they return) right under the quote it
          expands. gap-4 spaces the tags and the toggle, so taking the tags
          out (or back in) never leaves a doubled gap. */}
      <div className="flex flex-col items-start gap-4 pt-4">
        {/* Tags, commented out for now. What it speaks to, as tags: a light wash of the accent behind an
            accent hairline, so each reads as one coloured label, the same
            on the tinted card in either theme. (A page-coloured box looked
            like an input field on the card.) The wash is see-through
            (color-mix with transparent), so it tints whatever it sits on.
            The text takes --accent-hover, the accent's deeper shade in light
            mode and brighter one in dark: any wash lowers the contrast of
            text on it, and plain --accent on this one measured 4.2:1, under
            the 4.5:1 small text needs. --accent-hover measures 5.7:1 (light)
            and 5.8:1 (dark). */}
        {/* <ul
          aria-label="Speaks to"
          className="m-0 flex list-none flex-wrap gap-1.5 p-0"
        >
          {r.focus.map((f) => (
            <li
              key={f}
              className="rounded-[3px] border border-[color-mix(in_srgb,var(--accent)_28%,transparent)] bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] px-2 py-1 font-semibold text-[10.5px] text-accent-hover uppercase leading-none tracking-[0.1em]"
            >
              {f}
            </li>
          ))}
        </ul> */}

        <Letter reference={r} />
      </div>

      <Person reference={r} />
    </figure>
  );
}

/**
 * The card's signature, at the bottom, as on a testimonial: their photo if
 * they have agreed to one (see content/references.ts), otherwise just the
 * name, with no stand-in (an initials tile looked like a missing image).
 * Beside the photo, the name, their title (as LinkedIn shows it), then how
 * they worked with Sara and when they wrote it.
 *
 * mt-auto pushes it to the bottom of the card, so in a row of equal-height
 * cards both signatures sit on one line, however long each quote is; pt-6
 * is the least gap above it. Side by side rather than photo-above, so a
 * card without a photo is no shorter at the top: both quotes start level.
 *
 * The photo is a circle, as reviewers' photos are, and its alt is empty
 * because the name sits right by it: a screen reader would otherwise read
 * the name twice.
 */
function Person({ reference: r }: { reference: Reference }) {
  return (
    <figcaption className="mt-auto flex items-center gap-3.5 pt-6">
      {r.photo ? (
        // 56px shown; Next serves 1x and 2x from the 400px file.
        <Image
          src={r.photo}
          alt=""
          width={56}
          height={56}
          className="h-14 w-14 shrink-0 rounded-full border border-border object-cover"
        />
      ) : null}
      <div className="min-w-0">
        <a
          href={r.profile}
          target="_blank"
          rel="noopener"
          className="font-semibold text-[15px] text-text no-underline transition-colors hover:text-accent"
        >
          {r.name}
          <span className="sr-only"> on LinkedIn</span>
        </a>
        <p className="m-0 text-[14px] text-text-soft leading-snug">{r.title}</p>
        <p className="m-0 mt-0.5 text-[13px] text-muted leading-snug">
          {r.relationship} ·{" "}
          <time dateTime={r.date}>{formatMonth(r.date.slice(0, 7))}</time>
        </p>
      </div>
    </figcaption>
  );
}

/**
 * The whole recommendation, folded under the quote: the quote is the
 * headline, the letter is the evidence. A native <details>, so it opens
 * with no JavaScript, is announced as expandable by screen readers, and is
 * found by the browser's find-in-page even while closed.
 *
 * The toggle is a plain accent link with a chevron that turns down as it
 * opens, no divider or footer bar: it is the card's one action, so the
 * colour alone says it can be clicked. Inside, the quoted sentence is set
 * in the body colour among the softer rest, so a reader sees where it came
 * from and that it was not taken out of context.
 */
export function Letter({ reference: r }: { reference: Reference }) {
  return (
    // Grows open and shrinks closed rather than jumping: see
    // AnimatedDetails. list-none and the webkit rule hide the browser's own
    // triangle; our chevron turns instead.
    <AnimatedDetails
      className="group/letter w-full"
      summaryClassName="toggle-glow inline-flex cursor-pointer list-none items-center gap-2 rounded-[3px] text-[14px] text-accent hover:text-accent-hover focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 [&::-webkit-details-marker]:hidden"
      summary={
        <>
          <svg
            viewBox="0 0 16 16"
            aria-hidden="true"
            className="h-3.5 w-3.5 shrink-0 group-open/letter:rotate-90 motion-safe:transition-transform motion-safe:duration-200"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 3.5l4.5 4.5L6 12.5" />
          </svg>
          <span className="group-open/letter:hidden">
            Read the full recommendation
          </span>
          <span className="hidden group-open/letter:inline">
            Hide the full recommendation
          </span>
        </>
      }
    >
      {/* pt-3 rather than mt-3: the height being animated is this box's
          parent, and a margin would sit outside what it measures. */}
      <LetterBody reference={r} className={`${PROSE} pt-3 text-left`} />
    </AnimatedDetails>
  );
}

/**
 * The recommendation itself: its paragraphs, and the numbered list as the
 * author wrote one, with the pulled quote picked out in the body colour
 * among the softer rest. gap, not space-y: space-y works by giving each
 * child a margin, which the m-0 on every <p> cancels, so paragraphs ran
 * together. `className` places it (width, padding, alignment).
 */
export function LetterBody({
  reference: r,
  className = "",
}: {
  reference: Reference;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col gap-3 font-reading text-[15px] text-text-soft leading-[1.65] ${className}`}
    >
      {r.body.map((b) =>
        typeof b === "string" ? (
          <p key={b} className="m-0">
            <Highlight text={b} quote={r.quote} />
          </p>
        ) : (
          // "A numbered list as the author wrote one", so an <ol>.
          <ol key={b.list[0]} className="m-0 list-decimal space-y-1.5 pl-5">
            {b.list.map((item) => (
              <li key={item} className="pl-1">
                <Highlight text={item} quote={r.quote} />
              </li>
            ))}
          </ol>
        ),
      )}
    </div>
  );
}

/** `text`, with the pulled quote (if it is in there) in the body colour. */
function Highlight({ text, quote }: { text: string; quote: string }) {
  const at = text.indexOf(quote);
  if (at < 0) return text;
  return (
    <>
      {text.slice(0, at)}
      <span className="text-text">{quote}</span>
      {text.slice(at + quote.length)}
    </>
  );
}

/**
 * The quotation marks, set as typography rather than drawn as ornament: the
 * site's heading serif (Lora), in the accent, both the same size so they
 * read as one pair. Upright, as punctuation sits: a tilt toward the text
 * was tried and dropped.
 *
 * The opening mark hangs in the quote's indent, the way books hang
 * punctuation: every line of the quote starts on one clean edge just
 * inside it. The closing one sits on the last line with zero line height,
 * so its size never opens a gap between lines.
 *
 * aria-hidden, because the <blockquote> already tells a screen reader this
 * is a quotation, and "left double quotation mark" read aloud is noise.
 */
const MARK =
  "select-none font-semibold font-serif text-[32px] text-accent leading-[0] opacity-80";

function QuoteMark({ side }: { side: "open" | "close" }) {
  return side === "open" ? (
    <span aria-hidden="true" className={`absolute top-[20px] left-0 ${MARK}`}>
      “
    </span>
  ) : (
    <span aria-hidden="true" className={`relative top-[0.36em] ml-1 ${MARK}`}>
      ”
    </span>
  );
}

/**
 * The pull quote must be an exact sentence of the recommendation. Checked
 * here, at build time, rather than trusted to a comment: a quote edited into
 * a paraphrase fails the build and names whose it is.
 */
export function assertVerbatim(r: Reference) {
  const blocks = r.body.flatMap((b) => (typeof b === "string" ? [b] : b.list));
  if (!blocks.some((b) => b.includes(r.quote))) {
    throw new Error(
      `references: the quote for ${r.name} is not word for word in one paragraph of their recommendation.`,
    );
  }
}
