import type { ReactNode } from "react";

/**
 * Reading measure for body prose, ~75 characters at 15px.
 *
 * The main column is 880 so its left edge lines up with the header and footer.
 * Left uncapped, a paragraph would run the full 832px and read at ~90
 * characters a line, past the comfortable 45–75. Capping the text rather than
 * the column keeps the structural edges (headings, rules, the timeline's logo
 * rail) aligned with the chrome while the prose stays readable.
 *
 * Lives here rather than beside the components that use it: those include a
 * "use client" module, and a server component cannot import a plain value
 * across that boundary.
 */
export const PROSE = "max-w-[700px]";

/**
 * The mark on the back-to-top control, shared by the rail and the chip bar.
 *
 * Both of those are client components; this module is not, which is fine,
 * a server component can be rendered inside a client one.
 */
export function ArrowUpIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="shrink-0"
    >
      <path
        d="M12 19V5M12 5l-6.5 6.5M12 5l6.5 6.5"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * The repeating page section from the design: a rule across the top, a small
 * uppercase serif heading, then content.
 */
/**
 * The anchor a section answers to, derived from its title.
 *
 * Derived rather than passed so a section and the nav entry pointing at it
 * cannot drift apart: both call this with the same string.
 */
export function sectionId(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * A section's own look, in one of two shapes.
 *
 * Plain: a rule across the top of the column, then the content.
 *
 * Band (`band`): the section is a stripe across the WHOLE page width, the
 * way the footer is, with the content still held in the column. The page
 * column is 880px wide and a child cannot be wider than its parent, so the
 * stripe is not the section's own background but a pseudo-element drawn
 * wider than it:
 *
 *   - before:left-[calc(50%-50vw)] and before:w-screen: start half a screen
 *     to the left of the section's centre and run one screen wide, which is
 *     edge to edge whatever the viewport.
 *   - before:-z-10 with NO stacking context on the section (so no
 *     `isolate`, no z-index): the stripe goes to the back of the whole page,
 *     behind the text and behind the "Jump to" rail, which is a sticky
 *     element earlier in the page and would otherwise be painted over.
 *   - 100vw includes the scrollbar's width, so the stripe is up to a
 *     scrollbar wider than the visible page; the layout wrapper in
 *     app/layout.tsx clips that overflow sideways (overflow-x-clip) so it
 *     cannot make the page scroll sideways.
 *   - mb-[-6rem] cancels the 6rem (pb-24) of space <main> leaves under its
 *     content, so the stripe meets the footer instead of floating above a
 *     white gap. That only suits a band that is the LAST thing in <main>;
 *     anything placed after it would be pulled up under it.
 *
 * The fill is the --band token (globals.css), which each theme sets: in
 * light a pale wash of the visitor globe's ocean blue, in dark a little
 * darker than the page. One token rather than a colour written here, so the
 * band's colour is decided beside the other theme colours and a `dark:`
 * variant is not needed.
 */
const BAND =
  "relative mt-12 mb-[-6rem] scroll-mt-[var(--anchor-offset)] pt-12 pb-12 before:absolute before:inset-y-0 before:left-[calc(50%-50vw)] before:-z-10 before:w-screen before:bg-[var(--band)]";

export function Section({
  title,
  children,
  className = "",
  band = false,
}: {
  title: string;
  children: ReactNode;
  className?: string;
  band?: boolean;
}) {
  return (
    <section
      id={sectionId(title)}
      // An anchor jump has to clear the sticky chrome above it, which is
      // taller on narrow screens: header plus the chip bar, versus header
      // alone once the gutter rail takes over. See --anchor-offset.
      className={`${band ? BAND : "mt-8 scroll-mt-[var(--anchor-offset)] border-t border-border pt-7"} ${className}`}
    >
      <h2 className="mb-3.5 font-serif text-base font-semibold uppercase tracking-[0.04em] text-muted">
        {title}
      </h2>
      {children}
    </section>
  );
}

/**
 * The h1 used at the top of every page except the home page.
 *
 * `tight` is for a title that introduces a paragraph directly beneath it
 * rather than a section of its own. The default 36px is the gap between two
 * blocks, and at 30px of type that is 1.2x the title: it reads as a hole when
 * the very next line belongs to the title.
 */
export function PageTitle({
  children,
  tight = false,
}: {
  children: ReactNode;
  tight?: boolean;
}) {
  const gap = tight ? "mb-5" : "mb-9";
  return (
    <h1 className={`${gap} font-serif text-[30px] font-semibold`}>
      {children}
    </h1>
  );
}

/**
 * Title-and-date row for a role or project.
 *
 * Deliberately stacked (column, not space-between). The design chat hit a bug
 * where a long title wrapping in a space-between row swallowed the gap beneath
 * it and overlapped the next block. Stacking removes that whole class of bug
 * rather than tuning margins around it.
 */
export function EntryHeading({
  title,
  meta,
  as: Tag = "h3",
  size = "text-lg",
}: {
  title: string;
  meta: string;
  as?: "h2" | "h3";
  size?: string;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <Tag className={`${size} font-semibold leading-tight`}>{title}</Tag>
      <span className="text-sm text-muted">{meta}</span>
    </div>
  );
}
