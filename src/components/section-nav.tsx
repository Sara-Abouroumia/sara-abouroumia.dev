"use client";

import { ArrowUpIcon, sectionId } from "@/components/section";
import { useActiveSection } from "@/components/use-active-section";

/**
 * "Jump to" rail, sitting in the right gutter beside the content.
 *
 * Right rather than left: the left edge is where the header, footer, rules and
 * every block of body text line up, and a rail there would be the one thing
 * breaking that column.
 *
 * The links are ordinary anchors, so jumping to a section works before
 * hydration and on a keyboard; the smooth motion comes from scroll-behavior in
 * globals.css, which yields to prefers-reduced-motion. Only the active
 * highlight needs JavaScript, and its absence costs nothing.
 *
 * Below xl there is no gutter to sit in — <SectionBar /> covers that case.
 */
export function SectionNav({ titles }: { titles: readonly string[] }) {
  const active = useActiveSection(titles);

  return (
    <nav
      // Named by the visible label rather than a separate aria-label, so the
      // landmark a screen reader announces is the wording actually on screen —
      // and there is one string to keep in step with <SectionBar />, not two.
      aria-labelledby="section-nav-label"
      // h-full so the sticky child has the whole page to travel down.
      className="-right-[184px] absolute top-0 hidden h-full w-[160px] xl:block"
    >
      <div className="sticky top-[104px]">
        <p
          id="section-nav-label"
          className="mb-2.5 pl-3 text-[11px] text-muted-light uppercase tracking-[0.08em]"
        >
          Jump to
        </p>
        <ul className="m-0 list-none border-border border-l p-0">
          {titles.map((title) => {
            const id = sectionId(title);
            const current = active === id;
            return (
              <li key={id}>
                <a
                  href={`#${id}`}
                  aria-current={current ? "true" : undefined}
                  // -ml-px so the 2px marker sits over the rail rather than
                  // beside it, and the row never shifts between states.
                  className={`-ml-px block border-l-2 py-1.5 pl-3 text-[12px] no-underline uppercase tracking-[0.06em] transition-colors ${
                    current
                      ? "border-accent font-semibold text-text"
                      : "border-transparent text-muted hover:text-text"
                  }`}
                >
                  {title}
                </a>
              </li>
            );
          })}
        </ul>

        {/* Deliberately outside the bordered list: it is not a section, and
            sitting on the same rail would claim it is. Hidden until a section
            has actually been reached — at the top of the page there is nowhere
            to go back to, and `active` already knows that.

            href="#top" rather than a scripted scroll: the HTML spec sends that
            fragment to the top of the document when nothing matches the id, so
            it works unhydrated and inherits the page's smooth scrolling. */}
        {active ? (
          <a
            href="#top"
            className="mt-3 inline-flex items-center gap-1.5 pl-3 text-[11px] text-muted-light no-underline uppercase tracking-[0.08em] transition-colors hover:text-text"
          >
            <ArrowUpIcon />
            Top
          </a>
        ) : null}
      </div>
    </nav>
  );
}
