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

  // Keep the current pill in view, but only when it is not, and only by as
  // much as it takes. Centring it unconditionally (what this used to do)
  // scrolled the first pill half off the edge even when everything fitted,
  // and a word cut in half reads as a rendering bug, not as "this scrolls".
  useEffect(() => {
    const track = trackRef.current;
    if (!track || !active) return;
    const item = track.querySelector<HTMLElement>(`[data-chip="${active}"]`);
    if (!item) return;
    const pad = 16;
    const left = item.offsetLeft - pad;
    const right = item.offsetLeft + item.offsetWidth + pad - track.clientWidth;
    let to: number | null = null;
    if (left < track.scrollLeft) to = left;
    else if (right > track.scrollLeft) to = right;
    if (to === null) return;
    track.scrollTo({
      left: Math.max(0, to),
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  }, [active]);

  // Whether there is more to scroll to on either side: drives the edge fades,
  // the cue that the row moves. No overflow, no fade, so a row that fits
  // never looks cut off.
  const [more, setMore] = useState({ left: false, right: false });
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const update = () =>
      setMore({
        left: track.scrollLeft > 2,
        right: track.scrollLeft + track.clientWidth < track.scrollWidth - 2,
      });
    update();
    track.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(track);
    return () => {
      track.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, []);
  const fade = [
    more.left ? "transparent, #000 24px" : "#000",
    more.right ? "#000 calc(100% - 24px), transparent" : "#000",
  ].join(", ");

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
        // Pinned, it gains an edge and a soft shadow: the cue that it is a
        // toolbar floating over the page, not a line of the page.
        className={`-mx-6 sticky top-[var(--header-h)] z-[5] flex items-stretch border-border border-b bg-bg transition-shadow xl:hidden ${
          pinned ? "shadow-[0_8px_16px_-14px_rgba(0,0,0,0.35)]" : ""
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
          className="flex shrink-0 items-center pr-3 pl-6 text-[12px] text-muted-light"
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
          className="m-0 flex min-w-0 flex-1 list-none overflow-x-auto pr-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{
            maskImage: `linear-gradient(to right, ${fade})`,
            WebkitMaskImage: `linear-gradient(to right, ${fade})`,
          }}
        >
          {titles.map((title) => {
            const id = sectionId(title);
            const current = active === id;
            return (
              // The line under these is the page's own section break (the
              // nav's border-bottom): one rule that both divides the intro
              // from the sections and carries the "you are here" light.
              <li key={id}>
                <a
                  href={`#${id}`}
                  data-chip={id}
                  aria-current={current ? "true" : undefined}
                  // Normal case: uppercase read as one more heading, where
                  // these are controls. min-h-11 is the 44px touch target.
                  className={`group relative flex min-h-11 items-center whitespace-nowrap px-2.5 text-[13px] no-underline transition-colors focus-visible:rounded-[3px] focus-visible:outline-2 focus-visible:outline-accent focus-visible:-outline-offset-2 ${
                    current
                      ? "font-medium text-text"
                      : "text-muted hover:text-text-soft"
                  }`}
                >
                  {title}
                  {/* This stop's stretch of the section-break rule, lit while
                      its section is on screen. -bottom-px lays it over the
                      nav's own bottom border, which IS that rule, so there is
                      one line, not a track above a divider. Hover hints at an
                      unlit one, so the stretches read as targets too. */}
                  <span
                    aria-hidden="true"
                    className={`absolute inset-x-0 -bottom-px h-[2px] transition-[opacity,box-shadow] duration-300 ${
                      current
                        ? "bg-accent opacity-100 shadow-[0_0_8px_0_var(--accent)]"
                        : "bg-muted-light opacity-0 group-hover:opacity-60"
                    }`}
                  />
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
            className="flex shrink-0 items-center self-stretch border-border border-l pr-6 pl-3.5 text-muted transition-colors hover:text-text"
          >
            <ArrowUpIcon />
          </a>
        ) : null}
      </nav>
    </>
  );
}
