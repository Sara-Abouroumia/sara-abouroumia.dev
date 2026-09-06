import type { ReactNode } from "react";

/**
 * The repeating page section from the design: a rule across the top, then a
 * small uppercase serif heading, then content.
 *
 * `first` drops the top border for the section that opens a page.
 */
export function Section({
  title,
  children,
  first = false,
}: {
  title: string;
  children: ReactNode;
  first?: boolean;
}) {
  return (
    <section
      className={
        first
          ? "mt-10"
          : "mt-8 border-t border-border pt-7 first:mt-0 first:border-0 first:pt-0"
      }
    >
      <h2 className="mb-3.5 font-serif text-base font-semibold uppercase tracking-[0.04em] text-muted">
        {title}
      </h2>
      {children}
    </section>
  );
}
