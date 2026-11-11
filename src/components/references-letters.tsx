import Image from "next/image";
import { ProfileLink } from "@/components/profile-link";
import { ReadMore } from "@/components/read-more";
import {
  assertVerbatim,
  LetterBody,
  QuoteMark,
  SourceNote,
} from "@/components/references";
import { PROSE } from "@/components/section";
import type { Reference } from "@/content/references";
import { formatMonth } from "@/lib/dates";

/**
 * The References section, "reviews" style: one column, always, the way
 * Google lists reviews. Each reference is a block in a vertical feed,
 * all the same shape, one under the other:
 *
 *   who is speaking (photo beside their details),
 *   what they said (the one-line quote between accent marks),
 *   "Read more", which swaps the quote for the whole recommendation in
 *   place, and "Show less", which folds it back.
 *
 * One column means nothing is ever beside anything else, so there is
 * nothing to line up, no breakpoint where the layout changes, and a
 * letter that opens simply makes its own block taller, pushing the rest
 * down the way a list should. The data, the verbatim check, the letter's
 * text and the LinkedIn note are shared with the other designs.
 */
export function ReferencesLetters({
  references,
}: {
  references: readonly Reference[];
}) {
  return (
    <div>
      {/* A list, because it is one: a screen reader announces how many
          references there are. No rules between the items, only an even
          gap (gap-10): a line under each one says "a new section starts
          here", and these are entries in one list, the way LinkedIn sets
          its own recommendations. The gap matches the one above the
          LinkedIn note below, so the note reads as the end of the same
          run.

          The list itself is the container: one box (the site's own panel
          shape: 5px corners, as on the search field and the contact
          buttons) around both references, so they sit together the way
          LinkedIn frames its Recommendations card. The fill is a
          hint of the site's panel tint: --panel mixed 55% with
          transparent (color-mix), so it is about half as strong as the
          real panel colour. In dark mode it goes the other way: a light
          tint on a dark page reads as a raised card, and here the box
          should sit slightly in, so it is the page colour mixed 70% with
          black (dark:bg-[color-mix(in_srgb,var(--bg)_70%,black)]), a
          little darker than the page. In both themes the edge is the fill
          alone, so the hairline is transparent (border-transparent): a
          transparent border shows the box's own background beneath it,
          which makes the border exactly the fill's colour while keeping
          its 1px, so the box is the same size either way. One box rather than one per reference, or they would read
          as separate things again. p-5 on a phone keeps the text wide
          enough to read; md:p-8 gives it room on a desktop. The LinkedIn
          note stays outside, under the box. */}
      <ul className="m-0 flex list-none flex-col gap-10 rounded-[5px] border border-transparent bg-[color-mix(in_srgb,var(--panel)_55%,transparent)] p-5 md:p-8 dark:bg-[color-mix(in_srgb,var(--bg)_70%,black)]">
        {references.map((r) => (
          <li key={r.profile}>
            <ReferenceBlock reference={r} />
          </li>
        ))}
      </ul>

      <SourceNote />
    </div>
  );
}

/**
 * One reference. HTML's own shape for "a quotation and who said it" is a
 * <figure> holding a <blockquote> and a <figcaption>, and the caption may
 * come first, which is how it reads here (details, then the words), so a
 * screen reader gets the same order a sighted visitor does.
 */
function ReferenceBlock({ reference: r }: { reference: Reference }) {
  assertVerbatim(r);
  const date = formatMonth(r.date.slice(0, 7));
  const lastSpace = r.quote.lastIndexOf(" ") + 1;

  return (
    <figure className="m-0 min-w-0">
      <figcaption className="flex items-center gap-3.5">
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
          <ProfileLink reference={r} className="text-[16px]" />
          <p className="m-0 mt-0.5 text-[14px] text-text-soft leading-snug">
            {r.title}
          </p>
          <p className="m-0 mt-0.5 text-[13px] text-muted leading-snug">
            <span className="whitespace-nowrap">{r.relationship} ·</span>{" "}
            <time dateTime={r.date} className="whitespace-nowrap">
              {date}
            </time>
          </p>
        </div>
      </figcaption>

      {/* The words start in the same column as the name, as on LinkedIn:
          the photo stands alone on the left like a margin note, and the
          name, the title and the text form one column to its right, which
          is what makes the entries read as parts of one list. That column
          begins 70px in (the photo's 56px plus the 14px gap beside it).
          The wrapper is indented 50px (md:pl-[50px]) and the text's own
          20px indent (pl-5) makes up the rest, because the 20px is where
          the opening mark hangs: the mark must stay INSIDE its box, since
          the collapsible clips anything outside it, and a negative margin
          to push it out hid the mark. On a phone there is no room to give
          up 70px, so the text uses the full width. Both versions of the
          text share these edges, so the words keep their left edge when
          the review opens.

          Opened, the letter becomes a panel of its own inside the box: a
          slightly different fill, 6px corners, and an accent bar down its
          left edge that wraps round the two left corners. That is what a
          border-left does on a rounded box: the border follows the corner
          curve and tapers to nothing as it turns, so the bar reads as the
          panel's own edge enclosing it, not a stripe laid on top. (A
          separate pill-shaped bar cannot do this: it has its own ends and
          floats free of the corners.) The 3px border plus 17px of padding
          is the same 20px indent the quote's opening mark hangs in, and the
          bar sits where that mark did, so the mark gives way to the bar and
          the text stays on its column, under the name. The panel is the
          letter's own, so it fades in and grows with it instead of popping
          in. The fill is a touch lighter than the box in both themes: the
          page colour at 70% over the cream in light, a little panel tint
          over the dark box in dark. PROSE caps the line at about 75
          characters, the page's other prose measure. */}
      <div className="mt-4 md:pl-[50px]">
        <ReadMore
          short={
            <blockquote className="relative m-0 pl-5">
              <p
                className={`${PROSE} m-0 font-reading text-[16px] text-text leading-[1.65]`}
              >
                <QuoteMark side="open" />
                {/* The last word and the closing mark are one unbreakable
                    unit: a line may break before an inline-block, which
                    left the mark alone on a line of its own on a phone. */}
                {r.quote.slice(0, lastSpace)}
                <span className="whitespace-nowrap">
                  {r.quote.slice(lastSpace)}
                  <QuoteMark side="close" />
                </span>
              </p>
            </blockquote>
          }
          full={
            <LetterBody
              reference={r}
              className={`${PROSE} rounded-[6px] border-l-[3px] border-l-accent bg-[color-mix(in_srgb,var(--bg)_70%,transparent)] py-4 pr-5 pl-[17px] dark:bg-[color-mix(in_srgb,var(--panel)_45%,transparent)]`}
            />
          }
        />
      </div>
    </figure>
  );
}
