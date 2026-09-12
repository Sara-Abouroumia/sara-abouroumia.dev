import type { ReactNode } from "react";

/**
 * Reading measure for body prose, ~75 characters at 15px.
 *
 * The main column is 880 so its left edge lines up with the header and footer.
 * Left uncapped, a paragraph would run the full 832px and read at ~90
 * characters a line, past the comfortable 45–75. Capping the text rather than
 * the column keeps the structural edges — headings, rules, the timeline's logo
 * rail — aligned with the chrome while the prose stays readable.
 *
 * Lives here rather than beside the components that use it: those include a
 * "use client" module, and a server component cannot import a plain value
 * across that boundary.
 */
export const PROSE = "max-w-[700px]";

/**
 * The mark on the back-to-top control, shared by the rail and the chip bar.
 *
 * Both of those are client components; this module is not, which is fine —
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

export function Section({
  title,
  children,
  className = "",
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      id={sectionId(title)}
      // An anchor jump has to clear the sticky chrome above it, which is
      // taller on narrow screens: header plus the chip bar, versus header
      // alone once the gutter rail takes over. See --anchor-offset.
      className={`mt-8 scroll-mt-[var(--anchor-offset)] border-t border-border pt-7 ${className}`}
    >
      <h2 className="mb-3.5 font-serif text-base font-semibold uppercase tracking-[0.04em] text-muted">
        {title}
      </h2>
      {children}
    </section>
  );
}

/** The h1 used at the top of every page except the home page. */
export function PageTitle({ children }: { children: ReactNode }) {
  return (
    <h1 className="mb-9 font-serif text-[30px] font-semibold">{children}</h1>
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
