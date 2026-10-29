import Image from "next/image";
import { LinkedInIcon } from "@/components/brand-icons";
import { FlipCard, FocusedCarousel } from "@/components/focused-carousel";
import {
  assertVerbatim,
  LetterBody,
  SourceNote,
} from "@/components/references";
import type { Reference } from "@/content/references";
import { formatMonth } from "@/lib/dates";

/**
 * The References section, "focused" style: centred cards side by side, the
 * one in focus at full strength, the other faded back, with dots to move
 * between them. The card is the focused-testimonial pattern: photo above,
 * the quote between accent quotation marks, the name under it, and a button
 * that turns the card over to the whole recommendation. See
 * FocusedCarousel for the focus behaviour and FlipCard for the turn.
 *
 * The alternative is `References` in references.tsx (Design A: card-less
 * columns split by a hairline). Both read the same data and share the
 * letter, the verbatim check and the LinkedIn note; swap them with one
 * line in app/page.tsx.
 *
 * No star ratings, unlike the pattern this follows: LinkedIn
 * recommendations carry none, and a rating invented for someone else's
 * words would be a false claim about them.
 */
export function ReferencesFocused({
  references,
}: {
  references: readonly Reference[];
}) {
  return (
    <div>
      <FocusedCarousel
        items={references.map((r) => ({
          key: r.profile,
          name: r.name,
          node: <FocusedCard reference={r} />,
        }))}
      />
      <SourceNote />
    </div>
  );
}

/**
 * A name that is a link to the person's own LinkedIn profile, with the
 * LinkedIn mark beside it, in LinkedIn's blue (#0a66c2), so it can be seen
 * to be one: a name alone in plain text did not say it could be clicked.
 *
 * The mark is always shown on a phone or a touch screen, where there is no
 * hover to reveal it; from md, on a device that can hover, it appears when
 * the name is hovered or focused (the .profile-link and .profile-mark rule
 * in globals.css). On the dark card the blue is lightened to #4a9ce8: the
 * official blue measures 2.9:1 against it, under the 3:1 a graphic needs,
 * and the lighter one 5.6:1.
 *
 * The whole thing is one <a>, so one tab stop and one click target; the mark
 * is hidden from screen readers, who hear "on LinkedIn" instead. It opens
 * in a new tab, so the card is not left.
 */
function ProfileLink({
  reference: r,
  className = "",
}: {
  reference: Reference;
  className?: string;
}) {
  return (
    <a
      href={r.profile}
      target="_blank"
      rel="noopener"
      className={`profile-link inline-flex items-center gap-1.5 font-semibold text-text no-underline transition-colors hover:text-accent ${className}`}
    >
      {r.name}
      <LinkedInIcon className="profile-mark text-[#0a66c2] dark:text-[#4a9ce8]" />
      <span className="sr-only"> on LinkedIn</span>
    </a>
  );
}

/**
 * The quotation mark, set as typography: the heading serif (Lora) in the
 * accent, large enough to read as a mark rather than as punctuation, and
 * lowered (top-[0.36em]) so it sits within the height of the capitals
 * instead of floating above the line. leading-[0] means its size never
 * opens a gap between lines. It goes muted when the card is faded
 * (group-data-[faded], set by FocusedCarousel on the <li> around it).
 *
 * aria-hidden, because the <blockquote> already tells a screen reader this
 * is a quotation, and "left double quotation mark" read aloud is noise.
 */
function Mark({ children }: { children: string }) {
  return (
    <span
      aria-hidden="true"
      className="relative top-[0.36em] select-none font-semibold font-serif text-[30px] text-accent leading-[0] opacity-80 transition-colors duration-300 group-data-[faded]/ref:text-muted"
    >
      {children}
    </span>
  );
}

/**
 * One reference as a flipping card (see FlipCard). The front reads top to
 * bottom: who is speaking (photo beside their details), what they said,
 * then the button that turns the card over to the whole recommendation.
 * The back leads with their name and where they worked with Sara.
 *
 * The marks sit on the quote itself, inline: the opening one with the
 * first word and the closing one with the last, each pair kept on one
 * line (nowrap) so a mark is never left alone at the end of a line.
 */
function FocusedCard({ reference: r }: { reference: Reference }) {
  assertVerbatim(r);
  const words = r.quote.split(" ");
  const first = words[0];
  const last = words[words.length - 1];
  const middle = words.slice(1, -1).join(" ");
  const date = formatMonth(r.date.slice(0, 7));

  return (
    <FlipCard
      id={r.profile}
      name={r.name}
      // The header of the card. On a phone the photo sits above the name
      // and details, everything centred, since a row would squeeze the
      // details into a narrow column; from md the photo goes beside them.
      // HTML's own shape for "a quotation and who
      // said it" is a <figure> (FlipCard's front) holding a <blockquote>
      // and a <figcaption>; the caption may come first. The photo and the
      // details sit side by side, the pair centred in the card, and the
      // text inside is left-aligned (text-left), so it starts at the
      // photo's edge instead of centring under it (md and up). A reference without a
      // photo gets no stand-in (see content/references.ts): the details
      // are centred alone, set the same way.
      head={
        <figcaption className="flex w-full flex-col items-center justify-center gap-3 text-center md:flex-row md:gap-4 md:text-left">
          {r.photo ? (
            // 64px shown; Next serves 1x and 2x from the 400px file.
            <Image
              src={r.photo}
              alt=""
              width={64}
              height={64}
              className="h-16 w-16 shrink-0 rounded-full border border-border object-cover"
            />
          ) : null}
          {/* With no photo the details would stretch the full width of the
              card and read as left-aligned; a width of their own (17rem)
              makes them a block, which the centring above can then centre.
              With a photo they take the rest of the row. A date never
              breaks across lines (nowrap), and the dot trails the text before it rather than leading the next line. */}
          <div className={`min-w-0 ${r.photo ? "" : "md:max-w-[17rem]"}`}>
            <ProfileLink reference={r} className="text-[17px]" />
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
      }
      body={
        <blockquote className="m-0">
          <p className="m-0 font-reading text-[16px] text-text leading-[1.65]">
            <span className="whitespace-nowrap">
              <Mark>“</Mark>
              <span className="ml-1">{first}</span>
            </span>{" "}
            {middle}{" "}
            <span className="whitespace-nowrap">
              {last}
              <span className="ml-1">
                <Mark>”</Mark>
              </span>
            </span>
          </p>
        </blockquote>
      }
      // The back's heading: the name, then where they worked with Sara
      // (the title on the front is their role today, which is usually not
      // where they knew her) and when they wrote it. The place stays on one
      // line (nowrap) so a narrow card breaks before it, never inside it.
      backHead={
        <div className="min-w-0 text-left">
          <p className="m-0 leading-snug">
            <ProfileLink reference={r} className="text-[16px]" />
          </p>
          <p className="m-0 mt-0.5 text-[13px] text-muted leading-snug">
            Worked together at{" "}
            <span className="whitespace-nowrap">{r.at} ·</span>{" "}
            <time dateTime={r.date} className="whitespace-nowrap">
              {date}
            </time>
          </p>
        </div>
      }
      back={<LetterBody reference={r} />}
    />
  );
}
