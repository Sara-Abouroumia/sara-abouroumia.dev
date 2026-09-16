"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUpIcon, sectionId } from "@/components/section";
import { useActiveSection } from "@/components/use-active-section";

/**
 * The narrow-screen counterpart to <SectionNav />: a row of section labels
 * that pins under the site header.
 *
 * Same visual language as the gutter rail, turned on its side, a hairline
 * with a 2px marker riding on it, uppercase labels, accent for current. The
 * rail's placement cannot come along (there is no gutter at 390px, and
 * floating it over the column would cover the thing being read), but its
 * styling can, and that is what makes the two read as one feature.
 *
 * It earns its place by where it sits rather than by appearing and
 * disappearing. Rendered in the flow directly above the first section, it is
 * simply below the fold while the intro is being read, then sticks for the
 * rest of the page, no scroll threshold to tune, and it works unhydrated.
 *
 * Hidden at xl, where the gutter rail takes over.
 */
export function SectionBar({ titles }: { titles: readonly string[] }) {
  const active = useActiveSection(titles);
  const trackRef = useRef<HTMLUListElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [pinned, setPinned] = useState(false);

  /**
   * Is the bar currently stuck to the header?
   *
   * This drives the bar's own hairline, which exists only while pinned. Sitting
   * in the flow it has the first section's top rule 28px beneath it, and
   * carrying a border there put two parallel lines a hair apart. Once pinned
   * that rule has scrolled underneath and the bar needs an edge of its own.
   *
   * A 1px sentinel just above the bar reports this: once it passes under the
   * header, the bar has taken its place.
   */
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const headerHeight =
      Number.parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue(
          "--header-h",
        ),
      ) || 77;

    const observer = new IntersectionObserver(
      ([entry]) => setPinned(!entry.isIntersecting),
      { rootMargin: `-${headerHeight}px 0px 0px 0px` },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  // Keep the current label in view. With more sections than fit (the point at
  // which this row starts scrolling) the active one would otherwise sit off
  // the edge exactly when it matters.
  useEffect(() => {
    const track = trackRef.current;
    if (!track || !active) return;
    const item = track.querySelector<HTMLElement>(`[data-chip="${active}"]`);
    if (!item) return;

    const target = item.offsetLeft - (track.clientWidth - item.clientWidth) / 2;
    track.scrollTo({
      left: Math.max(0, target),
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  }, [active]);

  return (
    <>
      <div
        ref={sentinelRef}
        aria-hidden="true"
        className="mt-10 h-px xl:mt-0"
      />
      <nav
        aria-labelledby="section-bar-label"
        // Full-bleed so the row can scroll edge to edge, with the page's own
        // padding restored inside.
        className={`-mx-6 sticky top-[var(--header-h)] z-[5] flex items-stretch bg-bg xl:hidden ${
          pinned ? "border-border border-b" : ""
        }`}
      >
        {/* Outside the scrolling track, so it stays put once there are more
            sections than fit. Without it the bar is three bare words, and
            nothing says they are anything but a heading. Same wording as the
            gutter rail: the two are one feature in two orientations, and
            nobody sees both at once to notice a difference, which is exactly
            how two labels for one thing drift apart. */}
        <span
          id="section-bar-label"
          className="flex shrink-0 items-center pr-4 pl-6 text-[11px] text-muted-light uppercase tracking-[0.08em]"
        >
          Jump to
        </span>
        <ul
          ref={trackRef}
          // This row scrolls on a phone, three labels want ~275px and a 390px
          // screen leaves ~240 once the "Jump to" label and the top control
          // take their share. That is the designed state, not a failure: it has
          // to scroll the moment a fourth section exists, which is why the
          // active label centres itself. gap-5 over gap-6 just means less of
          // it. The two fixed ends stay put so neither scrolls out of reach.
          className="m-0 flex list-none gap-5 overflow-x-auto pr-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {titles.map((title) => {
            const id = sectionId(title);
            const current = active === id;
            return (
              <li key={id}>
                <a
                  href={`#${id}`}
                  data-chip={id}
                  aria-current={current ? "true" : undefined}
                  // -mb-px so the marker sits over the bar's hairline rather
                  // than beside it, matching how the rail overlays its own.
                  className={`-mb-px block whitespace-nowrap border-b-2 py-3 text-[12px] no-underline uppercase tracking-[0.06em] transition-colors ${
                    current
                      ? "border-accent font-semibold text-text"
                      : "border-transparent text-muted"
                  }`}
                >
                  {title}
                </a>
              </li>
            );
          })}
        </ul>

        {/* Pinned to the end, outside the scrolling track, so it stays
            reachable once the labels start scrolling. A rule separates it from
            the section list, it is a different kind of destination, not a
            fourth section.

            Gated on `active` exactly as the rail's is. It is tempting to think
            the bar's placement already guarantees this, it sits below the
            intro, so on a phone it is off-screen until you have scrolled. On a
            tall tablet it is not: at 768x1024 the bar is on screen at scroll
            zero, and an unconditional arrow there offers to take you to the
            top of a page you are already at the top of.

            Removing it does not shift the labels: they are left-aligned in the
            track, and only the track's right-hand width changes. */}
        {active ? (
          <a
            href="#top"
            aria-label="Back to top"
            className="flex shrink-0 items-center border-border border-l pr-6 pl-4 text-muted transition-colors hover:text-text"
          >
            <ArrowUpIcon />
          </a>
        ) : null}
      </nav>
    </>
  );
}
