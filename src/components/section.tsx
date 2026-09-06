import type { ReactNode } from "react";

/**
 * The repeating page section from the design: a rule across the top, a small
 * uppercase serif heading, then content.
 */
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
    <section className={`mt-8 border-t border-border pt-7 ${className}`}>
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
